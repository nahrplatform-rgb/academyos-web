"""Reject unsafe migration inputs before starting a disposable restore."""
from pathlib import Path
import unittest

from backup import BackupError
from rehearse_local import reviewed_migrations


class RehearsalScope(unittest.TestCase):
    repo = Path(__file__).resolve().parents[2]

    def test_complete_release_and_existing_single_file_call(self):
        files = sorted((self.repo / 'supabase/migrations').glob('*owner_register*.sql'))
        self.assertEqual(len(files), 4)
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


if __name__ == '__main__':
    unittest.main()
