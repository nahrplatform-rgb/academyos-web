#!/usr/bin/env python3
"""Local synthetic DB/file -> dump -> age -> decrypt -> restore boundary test.

Only the Storage HTTP transport is replaced with a fixed in-memory fixture.
No hosted read/write or R2 operation occurs. Not a hosted backup receipt.
"""
import argparse
import io
import json
import os
from pathlib import Path
import tempfile
from unittest.mock import patch
import uuid

import backup
from rehearse_local import rehearse


def run(identity):
    repo = Path(__file__).resolve().parents[2]
    os.umask(0o077)
    with tempfile.TemporaryDirectory(prefix="academyos-synthetic-") as tmp:
        tmp = Path(tmp)
        data = tmp / "data"
        socket = tmp / "socket"
        socket.mkdir(mode=0o700)
        env = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
        env.update(PGHOST=str(socket), PGPORT="55441", PGUSER="postgres", PGDATABASE="postgres")
        backup.command(["initdb", "-D", str(data), "-U", "postgres", "-A", "trust", "--no-locale"])
        backup.command(["pg_ctl", "-D", str(data), "-l", str(tmp / "postgres.log"), "-o",
                        f"-p 55441 -k {socket} -c listen_addresses='' -c unix_socket_permissions=0700", "-w", "start"])
        try:
            backup.command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-f", str(repo / "supabase/tests/harness.sql")], env)
            backup.command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-c", """
              create schema storage;
              create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
              create table storage.objects(id uuid primary key,bucket_id text references storage.buckets(id),name text,metadata jsonb);
              create schema supabase_migrations;
              create table supabase_migrations.schema_migrations(version text primary key);
            """], env)
            for migration in sorted((repo / "supabase/migrations").glob("*.sql")):
                backup.command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-f", str(migration)], env)
            fixture = b"AcademyOS synthetic recovery fixture. No personal data.\n"
            object_id = "00000000-0000-4000-8000-000000000001"
            backup.command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-c",
                f"insert into storage.objects values('{object_id}','academy-media','synthetic/recovery.txt','{{\"size\":{len(fixture)}}}');"], env)

            class Response(io.BytesIO):
                status = 200
            class FixtureTransport:
                def open(self, request, timeout):
                    if request.full_url != backup.SUPABASE_URL + "/storage/v1/object/authenticated/academy-media/synthetic/recovery.txt":
                        raise AssertionError("Unexpected fixture endpoint")
                    return Response(fixture)

            root = tmp / "payload"
            root.mkdir()
            with patch.object(backup, "build_opener", return_value=FixtureTransport()):
                archive, manifest = backup.make_archive(root, env, "sb_secret_synthetic", str(uuid.uuid4()))
            cipher = tmp / "backup.tar.age"
            backup.command(["age", "--recipient", backup.RECIPIENT, "--output", str(cipher), str(archive)])
            clear = tmp / "recovered.tar"
            backup.command(["age", "--decrypt", "--identity", str(identity), "--output", str(clear), str(cipher)])
            recovered = tmp / "recovered"
            backup.verify_archive(clear, recovered)
            if (recovered / "objects" / object_id).read_bytes() != fixture:
                raise backup.BackupError("Synthetic file recovery differs")
            result = rehearse(recovered)
            result.update(synthetic=True, hosted_backup_tested=False, synthetic_object_recovered=True)
            return result
        finally:
            backup.command(["pg_ctl", "-D", str(data), "-m", "fast", "-w", "stop"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--identity", type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(run(args.identity)))
    except Exception as error:
        print(f"Synthetic recovery failed: {error if isinstance(error, backup.BackupError) else type(error).__name__}")
        raise SystemExit(1)
