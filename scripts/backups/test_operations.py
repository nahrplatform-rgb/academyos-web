import base64
import unittest
from backup import BackupError, PROJECT
import monitor
import storage_rehearsal as rehearsal


class OperationSafetyTests(unittest.TestCase):
    def test_success_checkin_requires_verified_copy_from_correct_project(self):
        good = {'project': PROJECT, 'status': 'encrypted_upload_download_verified', 'storage_api_credential_verified': True}
        for invalid in [None, {}, dict(good, project='other'), dict(good, status='started'), dict(good, storage_api_credential_verified=False)]:
            with self.subTest(receipt=invalid), self.assertRaises(BackupError):
                monitor.payload('ok', '1/1', invalid)
        data = monitor.payload('ok', '1/1', good)
        self.assertEqual(data['environment'], 'staging')
        self.assertNotIn('monitor_config', data)
        self.assertNotIn('receipt', data)

    def test_monitor_pairs_same_run_and_never_sends_backup_metadata(self):
        started = monitor.payload('in_progress', '2/1')
        failed = monitor.payload('error', '2/1')
        retry = monitor.payload('in_progress', '2/2')
        self.assertEqual(started['check_in_id'], failed['check_in_id'])
        self.assertNotEqual(started['check_in_id'], retry['check_in_id'])
        self.assertEqual(started['monitor_config']['timezone'], 'UTC')
        self.assertEqual(started['monitor_config']['checkin_margin'], 90)

    def test_fixture_refuses_any_arbitrary_payload_or_path(self):
        for identifier in ['../anything', 'abc', '00000000-0000-0000-0000-000000000000']:
            with self.assertRaises((ValueError, BackupError)):
                rehearsal.paths(identifier)
        with self.assertRaises(BackupError):
            rehearsal.restored_bytes(base64.b64encode(b'private personal data').decode())
        self.assertEqual(rehearsal.restored_bytes(base64.b64encode(rehearsal.FIXTURE).decode()), rehearsal.FIXTURE)
        paths = rehearsal.paths('6626b016-e19d-4d89-8edf-3e8aa4561ddb')
        self.assertEqual(set(paths), {'source', 'restored'})
        self.assertTrue(all(p.startswith('__setup_recovery__/6626b016-e19d-4d89-8edf-3e8aa4561ddb/') for p in paths.values()))


if __name__ == '__main__':
    unittest.main()
