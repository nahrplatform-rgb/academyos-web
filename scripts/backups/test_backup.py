import copy
import io
import json
import os
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

import backup


class BackupSafetyTests(unittest.TestCase):
    def test_connection_rejects_other_project_and_transaction_pooler(self):
        urls = [
            "postgresql://postgres:private@db.other.supabase.co:5432/postgres",
            f"postgresql://postgres.other:private@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
            f"postgresql://postgres.{backup.PROJECT}:private@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
            f"postgresql://postgres:private@db.{backup.PROJECT}.supabase.co:5432/postgres?sslmode=disable",
            f"postgresql://postgres:private@db.{backup.PROJECT}.supabase.co.evil.test:5432/postgres",
        ]
        for url in urls:
            with self.subTest(url=url), self.assertRaises(backup.BackupError):
                backup.database_env(url)

    def test_connection_forces_tls_and_read_only_without_inherited_settings(self):
        with patch.dict(os.environ, {"PGSERVICE": "unexpected", "PGSSLMODE": "disable"}):
            env = backup.database_env(f"postgresql://postgres.{backup.PROJECT}:p%40ss@aws-1-eu-west-1.pooler.supabase.com:5432/postgres")
        self.assertEqual(env["PGPASSWORD"], "p@ss")
        self.assertEqual(env["PGSSLMODE"], "verify-full")
        self.assertIn("default_transaction_read_only=on", env["PGOPTIONS"])
        self.assertNotIn("PGSERVICE", env)

    def test_failed_command_does_not_disclose_stderr(self):
        import subprocess
        with patch.object(backup.subprocess, "run", return_value=subprocess.CompletedProcess([], 1, b"", b"password=private row=data")):
            with self.assertRaisesRegex(backup.BackupError, "pg_dump: operation failed") as error:
                backup.command(["pg_dump"])
        self.assertNotIn("password=private", str(error.exception))
        self.assertNotIn("row=data", str(error.exception))

    def test_archive_rejects_traversal_and_links(self):
        with tempfile.TemporaryDirectory() as tmp:
            for index, (name, kind) in enumerate([("../leak", tarfile.REGTYPE), ("database.dump", tarfile.SYMTYPE)]):
                archive = Path(tmp) / f"unsafe{index}.tar"
                with tarfile.open(archive, "w") as tar:
                    info = tarfile.TarInfo(name)
                    info.type = kind
                    info.linkname = "/etc/passwd"
                    tar.addfile(info, io.BytesIO(b""))
                with self.assertRaises(backup.BackupError):
                    backup.verify_archive(archive, Path(tmp) / f"restore{index}")
            self.assertFalse((Path(tmp) / "leak").exists())

    def test_manifest_covers_every_file_and_detects_changed_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "payload"
            root.mkdir()
            (root / "database.dump").write_bytes(b"synthetic database")
            (root / "storage-schema.dump").write_bytes(b"synthetic storage security")
            (root / "storage-inventory.json").write_text('{"objects": []}')
            manifest = {"format": 1, "project": backup.PROJECT, "schemas": backup.SCHEMAS,
                        "recipient": backup.RECIPIENT, "objects": 0,
                        "files": [backup.file_record(p, root) for p in root.iterdir()]}
            for index, corruption in enumerate([None, "changed", "missing"]):
                data = copy.deepcopy(manifest)
                if corruption == "changed":
                    data["files"][0]["sha256"] = "0" * 64
                if corruption == "missing":
                    data["files"].pop()
                (root / "manifest.json").write_text(json.dumps(data))
                archive = Path(tmp) / f"test{index}.tar"
                with tarfile.open(archive, "w") as tar:
                    for p in root.iterdir():
                        tar.add(p, arcname=p.name)
                with patch.object(backup, "command", return_value=b""):
                    if corruption:
                        with self.assertRaises(backup.BackupError):
                            backup.verify_archive(archive, Path(tmp) / f"recovery{index}")
                    else:
                        result = backup.verify_archive(archive, Path(tmp) / f"recovery{index}")
                        self.assertEqual(result["objects"], 0)

    def test_changed_storage_inventory_prevents_archive_publication(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "payload"
            root.mkdir()
            def fake_command(args, env=None):
                if args[0] == "pg_dump":
                    Path(args[args.index("--file") + 1]).write_bytes(b"synthetic database")
                return b""
            before = {"buckets": [], "objects": []}
            after = {"buckets": [{"id": "changed"}], "objects": []}
            with patch.object(backup, "inventory", side_effect=[before, after]), patch.object(backup, "command", side_effect=fake_command):
                with self.assertRaisesRegex(backup.BackupError, "Storage changed"):
                    backup.make_archive(root, {}, "synthetic", "synthetic")
            self.assertFalse((Path(tmp) / "backup.tar").exists())


if __name__ == "__main__":
    unittest.main()
