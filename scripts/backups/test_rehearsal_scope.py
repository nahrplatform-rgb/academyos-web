"""Reject unsafe migration inputs before starting a disposable restore."""
from pathlib import Path
import unittest
from unittest.mock import patch

from backup import BackupError
from rehearse_local import existing_rows, reviewed_migrations


class RehearsalScope(unittest.TestCase):
    repo = Path(__file__).resolve().parents[2]

    def test_complete_release_and_existing_single_file_call(self):
        files = sorted((self.repo / 'supabase/migrations').glob('*owner_register*.sql'))
        self.assertEqual([path.name for path in files], [
            '20261103165604_owner_register_download_contract.sql',
            '20261104002448_owner_register_original_dispatch.sql',
            '20261104012057_owner_register_key_custody.sql',
            '20261104013632_owner_register_bound_transport.sql',
            '20261106174606_owner_register_binding_conflict.sql',
            '20261114130000_owner_register_additive_scopes.sql',
        ])
        self.assertEqual(reviewed_migrations(self.repo, files), files)
        self.assertEqual(reviewed_migrations(self.repo, files[0]), [files[0]])
        self.assertEqual(reviewed_migrations(self.repo, None), [])

    def test_refuses_operator_sql_missing_duplicate_and_wrong_order(self):
        files = sorted((self.repo / 'supabase/migrations').glob('*owner_register*.sql'))
        for bad in [[self.repo/'scripts/staging/separate_synthetic_owner.sql'],
                    [self.repo/'supabase/migrations/missing.sql'],
                    files + [files[0]], files[::-1]]:
            with self.subTest(paths=bad), self.assertRaises(BackupError):
                reviewed_migrations(self.repo, bad)

    def test_current_snapshot_fingerprint_includes_existing_alternate_names(self):
        with patch("rehearse_local.command", return_value=b"{}") as command:
            existing_rows({}, ["academy_member_number"])
            sql = command.call_args.args[0][-1]
            self.assertIn("to_jsonb(t)-''academy_member_number''", sql)
            self.assertNotIn("-''alternate_name''", sql)
            existing_rows({}, ["academy_member_number", "alternate_name"])
            self.assertIn("-''alternate_name''", command.call_args.args[0][-1])


if __name__ == '__main__':
    unittest.main()
