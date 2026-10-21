#!/usr/bin/env python3
"""Staging-only application database + Storage export. Never restores to a service.

All plaintext is temporary; only age ciphertext and a non-sensitive receipt leave
the runner. A verified upload is not a successful restore rehearsal.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime, timezone
from urllib.parse import quote, unquote, urlparse
from urllib.request import Request, HTTPRedirectHandler, build_opener
import uuid

PROJECT = "snpphkenmvmhpjstbeul"
SUPABASE_URL = f"https://{PROJECT}.supabase.co"
R2_ENDPOINT = "https://3fda84919501e78157a07d5225d61299.eu.r2.cloudflarestorage.com"
BUCKET = "academyos-staging-backups"
RECIPIENT = "age15ca2qpffygqeey86dlhquz23fglv9y4h5mdxx8psaqxdvlqs65ysfu5q42"
SCHEMAS = ["academy", "public", "supabase_migrations"]
STORAGE_BUCKETS = {"academy-media", "payment-proofs", "support-attachments", "exports"}
MAX_BYTES = 2 * 1024**3  # Explicit staging ceiling; fail rather than omit content.
CHUNK = 1024 * 1024
INVENTORY_SQL = """
select json_build_object(
 'buckets', coalesce((select json_agg(to_jsonb(b) order by b.id) from storage.buckets b),'[]'),
 'objects', coalesce((select json_agg(to_jsonb(o) order by o.bucket_id,o.name) from storage.objects o),'[]')
);
"""


class BackupError(Exception):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise BackupError("Unexpected redirect from Storage endpoint")


def required(name):
    value = os.environ.get(name, "")
    if not value.strip():
        raise BackupError(f"Missing credential: {name}")
    return value


def sha256(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(CHUNK), b""):
            h.update(chunk)
    return h.hexdigest()


def database_env(url):
    p = urlparse(url)
    host = p.hostname or ""
    user = unquote(p.username or "")
    direct = host == f"db.{PROJECT}.supabase.co" and user == "postgres"
    pooler = bool(re.fullmatch(r"aws-[0-9]+-eu-west-1\.pooler\.supabase\.com", host)) and user == f"postgres.{PROJECT}"
    if p.scheme not in {"postgres", "postgresql"} or not (direct or pooler) or p.port not in {None, 5432} or p.path != "/postgres" or p.query or p.fragment or not p.password:
        raise BackupError("Use the named staging project's PostgreSQL session connection on port 5432, without URL query options")
    # Do not allow unrelated inherited libpq settings or print connection strings.
    env = {k: v for k, v in os.environ.items() if not k.startswith("PG") and not k.startswith("BACKUP_DATABASE_")}
    env.update(PGHOST=host, PGPORT="5432", PGUSER=user, PGPASSWORD=unquote(p.password),
               PGDATABASE="postgres", PGSSLMODE="verify-full", PGCONNECT_TIMEOUT="15",
               PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=600000")
    certificate = Path(__file__).with_name("supabase-prod-ca-2021.crt")
    if sha256(certificate) != "700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7":
        raise BackupError("Supabase trust certificate differs from the reviewed copy")
    env["PGSSLROOTCERT"] = str(certificate.resolve())
    return env


def command(args, env=None, timeout=900):
    # Tool stderr can contain source data/connection details. Report a safe stage
    # failure, never raw subprocess output. Exit status still fails the workflow.
    result = subprocess.run(args, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if result.returncode:
        stderr = result.stderr.decode(errors="replace").lower()
        categories = {
            "password authentication failed": "database credential rejected",
            "tenant or user not found": "database tenant/user rejected",
            "certificate verify failed": "TLS certificate verification failed",
            "server certificate": "TLS server certificate rejected",
            "unsupported startup parameter": "pooler rejected a startup parameter",
            "permission denied": "database permission denied",
            "could not translate host": "database DNS resolution failed",
            "connection refused": "database connection refused",
            "timeout": "database connection or statement timed out",
        }
        category = next((safe for phrase, safe in categories.items() if phrase in stderr), "operation failed")
        raise BackupError(f"{Path(args[0]).name}: {category} (exit {result.returncode})")
    return result.stdout


def inventory(env):
    result = json.loads(command(["psql", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", INVENTORY_SQL], env))
    if {b["id"] for b in result["buckets"]} != STORAGE_BUCKETS or any(b["public"] for b in result["buckets"]):
        raise BackupError("Storage bucket inventory differs from the reviewed private staging buckets")
    ids = set()
    for obj in result["objects"]:
        if obj["bucket_id"] not in STORAGE_BUCKETS or not re.fullmatch(r"[0-9a-f-]{36}", obj["id"]) or obj["id"] in ids:
            raise BackupError("Invalid or duplicate Storage inventory entry")
        ids.add(obj["id"])
    return result


def file_record(path, root):
    return {"path": path.relative_to(root).as_posix(), "bytes": path.stat().st_size, "sha256": sha256(path)}


def make_archive(root, env, storage_key, run_id):
    before = inventory(env)
    started = datetime.now(timezone.utc).isoformat()
    dump = root / "database.dump"
    command(["pg_dump", "--format=custom", "--no-owner", "--lock-wait-timeout=30s", "--file", str(dump),
             *[f"--schema={s}" for s in SCHEMAS]], env)
    command(["pg_restore", "--list", str(dump)])
    storage_schema = root / "storage-schema.dump"
    command(["pg_dump", "--format=custom", "--schema-only", "--no-owner", "--schema=storage", "--file", str(storage_schema)], env)
    command(["pg_restore", "--list", str(storage_schema)])
    (root / "objects").mkdir()
    files = [file_record(dump, root), file_record(storage_schema, root)]
    total = dump.stat().st_size + storage_schema.stat().st_size
    if total > MAX_BYTES:
        raise BackupError("Staging backup byte ceiling exceeded")
    for obj in before["objects"]:
        target = root / "objects" / obj["id"]
        url = f"{SUPABASE_URL}/storage/v1/object/authenticated/{quote(obj['bucket_id'], safe='')}/{quote(obj['name'], safe='/')}"
        # New Supabase secret keys belong on apikey, never Bearer (not JWTs).
        request = Request(url, headers={"apikey": storage_key})
        with build_opener(NoRedirect()).open(request, timeout=120) as response, target.open("xb") as output:
            if response.status != 200:
                raise BackupError("Storage download failed")
            for chunk in iter(lambda: response.read(CHUNK), b""):
                total += len(chunk)
                if total > MAX_BYTES:
                    raise BackupError("Staging backup byte ceiling exceeded")
                output.write(chunk)
        expected_size = (obj.get("metadata") or {}).get("size")
        if expected_size is not None and int(expected_size) != target.stat().st_size:
            raise BackupError("Storage object size changed during export")
        files.append(file_record(target, root))
    after = inventory(env)
    if before != after:
        raise BackupError("Storage changed during export; retry during a quiet period")
    inv = root / "storage-inventory.json"
    inv.write_text(json.dumps(before, sort_keys=True))
    files.append(file_record(inv, root))
    manifest = {"format": 1, "project": PROJECT, "run_id": run_id, "started": started,
                "completed": datetime.now(timezone.utc).isoformat(), "schemas": SCHEMAS,
                "recipient": RECIPIENT, "objects": len(before["objects"]), "files": files,
                "consistency": "pg_dump transaction snapshot; unchanged Storage inventory before/after copy"}
    (root / "manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2))
    archive = root.parent / "backup.tar"
    with tarfile.open(archive, "w") as tar:
        for path in sorted(root.rglob("*")):
            if path.is_file():
                tar.add(path, arcname=path.relative_to(root).as_posix(), recursive=False)
    return archive, manifest


def r2_client():
    import boto3
    from botocore.config import Config
    return boto3.client("s3", endpoint_url=R2_ENDPOINT, region_name="auto",
        aws_access_key_id=required("R2_ACCESS_KEY_ID"), aws_secret_access_key=required("R2_SECRET_ACCESS_KEY"),
        config=Config(connect_timeout=15, read_timeout=120, retries={"max_attempts": 3, "mode": "standard"}))


def publish(ciphertext, manifest):
    client = r2_client()
    digest = sha256(ciphertext)
    key = f"staging/{manifest['started'][:10]}/{manifest['run_id']}/backup.tar.age"
    client.upload_file(str(ciphertext), BUCKET, key, ExtraArgs={"ContentType": "application/octet-stream", "Metadata": {"sha256": digest}})
    response = client.get_object(Bucket=BUCKET, Key=key)
    stream = response["Body"]
    h = hashlib.sha256()
    size = 0
    try:
        for chunk in iter(lambda: stream.read(CHUNK), b""):
            h.update(chunk)
            size += len(chunk)
            if size > MAX_BYTES + 10 * CHUNK:
                raise BackupError("R2 verification byte ceiling exceeded")
    finally:
        stream.close()
    if h.hexdigest() != digest or size != ciphertext.stat().st_size:
        raise BackupError("R2 download verification failed; no success receipt written")
    receipt = {"format": 1, "project": PROJECT, "key": key, "sha256": digest, "bytes": size,
               "object_count": manifest["objects"], "verified_at": datetime.now(timezone.utc).isoformat(),
               "status": "encrypted_upload_download_verified", "restore_tested": False}
    receipt_bytes = json.dumps(receipt, sort_keys=True).encode()
    client.put_object(Bucket=BUCKET, Key=key.removesuffix("backup.tar.age") + "receipt.json", Body=receipt_bytes, ContentType="application/json")
    return receipt


def verify_archive(archive, destination):
    # No tar.extractall: reject links, duplicates, traversal and unbounded writes.
    destination = Path(destination)
    destination.mkdir(mode=0o700, parents=True, exist_ok=False)
    seen = set()
    total = 0
    with tarfile.open(archive, "r:") as tar:
        for member in tar:
            name = member.name
            allowed = name in {"manifest.json", "database.dump", "storage-schema.dump", "storage-inventory.json"} or bool(re.fullmatch(r"objects/[0-9a-f-]{36}", name))
            total += member.size
            if not allowed or not member.isfile() or name in seen or member.size < 0 or total > MAX_BYTES + 10 * CHUNK:
                raise BackupError("Unsafe backup archive")
            seen.add(name)
            path = destination / name
            path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            with tar.extractfile(member) as stream, path.open("xb") as output:
                for chunk in iter(lambda: stream.read(CHUNK), b""):
                    output.write(chunk)
    manifest = json.loads((destination / "manifest.json").read_text())
    if manifest.get("format") != 1 or manifest.get("project") != PROJECT or manifest.get("schemas") != SCHEMAS or manifest.get("recipient") != RECIPIENT:
        raise BackupError("Wrong backup format or project")
    records = manifest["files"]
    if len({r["path"] for r in records}) != len(records) or {r["path"] for r in records} | {"manifest.json"} != seen:
        raise BackupError("Manifest coverage mismatch")
    for record in records:
        if file_record(destination / record["path"], destination) != record:
            raise BackupError("Backup checksum mismatch")
    inv = json.loads((destination / "storage-inventory.json").read_text())
    if manifest["objects"] != len(inv["objects"]) or {f"objects/{o['id']}" for o in inv["objects"]} != {p for p in seen if p.startswith("objects/")}:
        raise BackupError("Storage manifest coverage mismatch")
    command(["pg_restore", "--list", str(destination / "database.dump")])
    command(["pg_restore", "--list", str(destination / "storage-schema.dump")])
    return manifest


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="action", required=True)
    create = sub.add_parser("create")
    create.add_argument("--receipt", type=Path, required=True)
    create.add_argument("--recovery-package", type=Path)
    restore = sub.add_parser("recover")
    restore.add_argument("--receipt", type=Path, required=True)
    restore.add_argument("--identity", type=Path, required=True)
    restore.add_argument("--destination", type=Path, required=True)
    restore.add_argument("--ciphertext", type=Path, help="Use an encrypted rehearsal artifact instead of R2 credentials")
    args = parser.parse_args()
    os.umask(0o077)
    with tempfile.TemporaryDirectory(prefix="academyos-backup-") as tmp:
        tmp = Path(tmp)
        cipher = tmp / "backup.tar.age"
        if args.action == "create":
            password = quote(required("BACKUP_DATABASE_PASSWORD"), safe="")
            host = required("BACKUP_DATABASE_HOST")
            env = database_env(f"postgresql://postgres.{PROJECT}:{password}@{host}:5432/postgres")
            storage_key = required("BACKUP_SUPABASE_SECRET_KEY")
            if not storage_key.startswith("sb_secret_"):
                raise BackupError("Use a dedicated Supabase secret API key for backups")
            root = tmp / "payload"
            root.mkdir()
            archive, manifest = make_archive(root, env, storage_key, str(uuid.uuid4()))
            command(["age", "--recipient", RECIPIENT, "--output", str(cipher), str(archive)])
            receipt = publish(cipher, manifest)
            args.receipt.parent.mkdir(parents=True, exist_ok=True)
            args.receipt.write_text(json.dumps(receipt, indent=2))
            if args.recovery_package:
                args.recovery_package.mkdir(mode=0o700, parents=True, exist_ok=False)
                shutil.copyfile(cipher, args.recovery_package / "backup.tar.age")
                shutil.copyfile(args.receipt, args.recovery_package / "receipt.json")
            print(json.dumps(receipt))
        else:
            receipt = json.loads(args.receipt.read_text())
            if receipt.get("project") != PROJECT or not re.fullmatch(r"staging/\d{4}-\d{2}-\d{2}/[0-9a-f-]{36}/backup\.tar\.age", receipt.get("key", "")) or receipt.get("bytes", MAX_BYTES + 1) > MAX_BYTES + 10 * CHUNK:
                raise BackupError("Invalid staging receipt")
            if args.ciphertext:
                if args.ciphertext.stat().st_size != receipt["bytes"]:
                    raise BackupError("Encrypted rehearsal artifact has wrong size")
                shutil.copyfile(args.ciphertext, cipher)
            else:
                response = r2_client().get_object(Bucket=BUCKET, Key=receipt["key"])
                stream = response["Body"]
                size = 0
                try:
                    with cipher.open("xb") as output:
                        for chunk in iter(lambda: stream.read(CHUNK), b""):
                            size += len(chunk)
                            if size > receipt["bytes"]:
                                raise BackupError("Downloaded backup exceeds receipt size")
                            output.write(chunk)
                finally:
                    stream.close()
            if sha256(cipher) != receipt["sha256"] or cipher.stat().st_size != receipt["bytes"]:
                raise BackupError("Downloaded encrypted backup differs from receipt")
            archive = tmp / "backup.tar"
            command(["age", "--decrypt", "--identity", str(args.identity), "--output", str(archive), str(cipher)])
            manifest = verify_archive(archive, args.destination)
            if manifest["run_id"] != receipt["key"].split("/")[2] or manifest["objects"] != receipt["object_count"]:
                raise BackupError("Backup identity differs from receipt")
            print(json.dumps({"project": PROJECT, "run_id": manifest["run_id"], "checksums_valid": True,
                              "objects": manifest["objects"], "database_restore_tested": False}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # No provider exceptions: these can include credentials, URLs or data.
        print(f"Backup failed: {error if isinstance(error, BackupError) else type(error).__name__}", file=sys.stderr)
        sys.exit(1)
