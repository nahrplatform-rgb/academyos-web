#!/usr/bin/env python3
"""Restore a trusted recovered dump into a new disposable, socket-only PG17.

Never accepts a host, port, connection URL or existing database. The recovery
receipt must first be compared to a trusted successful GitHub run's digest.
"""
import argparse
import json
import os
from pathlib import Path
import re
import tempfile

from backup import command, BackupError, PROJECT


def rehearse(payload, migration=None):
    manifest = json.loads((payload / "manifest.json").read_text())
    if manifest["project"] != PROJECT:
        raise BackupError("Wrong recovery project")
    repo = Path(__file__).resolve().parents[2]
    if migration is not None:
        migration = migration.resolve()
        if migration.parent != (repo / "supabase/migrations").resolve() or migration.suffix != ".sql" or not migration.is_file():
            raise BackupError("Migration must be a reviewed repository migration")
    os.umask(0o077)
    with tempfile.TemporaryDirectory(prefix="academyos-restore-") as tmp:
        root = Path(tmp)
        data = root / "data"
        sockets = root / "sockets"
        sockets.mkdir(mode=0o700)
        env = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
        env.update(PGHOST=str(sockets), PGPORT="55440", PGUSER="postgres", PGDATABASE="postgres")
        command(["initdb", "-D", str(data), "-U", "postgres", "-A", "trust", "--no-locale", "--encoding=UTF8"])
        command(["pg_ctl", "-D", str(data), "-l", str(root / "postgres.log"), "-o",
                 f"-p 55440 -k {sockets} -c listen_addresses='' -c unix_socket_permissions=0700", "-w", "start"])
        try:
            baseline = """
            create role anon; create role authenticated; create role service_role;
            create role supabase_admin; create role supabase_auth_admin;
            create role supabase_storage_admin; create role authenticator;
            create role dashboard_user; create role pgbouncer;
            create role supabase_read_only_user; create role supabase_realtime_admin;
            -- pg_dump is deliberately scoped to business schemas. Recreate this
            -- pinned baseline dependency used by the restored signing functions.
            create schema if not exists extensions;
            create extension if not exists pgcrypto with schema extensions;
            create schema auth;
            create function auth.jwt() returns jsonb language sql stable as $$
              select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
            $$;
            """
            command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-c", baseline], env)
            # Keep initdb's standard public schema baseline. pg_dump omits its
            # initial default ACL; recreating it would lose PUBLIC USAGE. Keep
            # explicit archived ACL/default-ACL entries, skipping only CREATE.
            toc = command(["pg_restore", "--list", str(payload / "database.dump")]).decode()
            restore_list = root / "restore.list"
            restore_list.write_text("\n".join(line for line in toc.splitlines() if not re.match(r"^\d+; \d+ \d+ SCHEMA - public ", line)) + "\n")
            command(["pg_restore", "--exit-on-error", "--no-owner", "--use-list", str(restore_list), "--dbname=postgres", str(payload / "database.dump")], env)
            if migration is not None:
                command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-f", str(migration)], env)
            # Fixed synthetic transaction rolls back. Restored identity values
            # and the SQL dump are never printed to the console.
            command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-f", str(repo / "supabase/tests/membership_boundary.sql")], env)
            result = json.loads(command(["psql", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", """
            select json_build_object(
              'identities', (select count(*) from academy.identities),
              'academies', (select count(*) from academy.academies),
              'memberships', (select count(*) from academy.memberships),
              'private_tables_with_rls', (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='academy' and c.relkind='r' and c.relrowsecurity));
            """], env))
            return {"project": PROJECT, "run_id": manifest["run_id"], "database_restore_passed": True,
                    "membership_boundary_passed": True, "migration_rehearsed": migration.name if migration else None, "counts": result,
                    "hosted_storage_restore_tested": False}
        finally:
            command(["pg_ctl", "-D", str(data), "-m", "fast", "-w", "stop"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("payload", type=Path)
    parser.add_argument("--migration", type=Path, help="Replay one reviewed repository migration inside the disposable restore only")
    args = parser.parse_args()
    try:
        print(json.dumps(rehearse(args.payload,args.migration)))
    except Exception as error:
        print(f"Restore rehearsal failed: {error if isinstance(error, BackupError) else type(error).__name__}")
        raise SystemExit(1)
