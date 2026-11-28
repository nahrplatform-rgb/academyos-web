import contextlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import runtime_keys as adapter


class RuntimeKeysTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.register = Path(self.tmp.name) / 'register.json'
        self.workspace = Path(self.tmp.name) / 'workspace.json'
        self.digest_a, self.digest_b = 'a' * 64, 'b' * 64
        self.root_a, self.root_b = '1' * 64, '2' * 64
        self.receipt(self.register, self.digest_a)
        self.receipt(self.workspace, self.digest_b, 'owner-workspace-v1')
        self.patches = [patch.object(adapter, 'REGISTER_RECEIPT', self.register),
                        patch.object(adapter, 'WORKSPACE_RECEIPT', self.workspace)]
        for p in self.patches:
            p.start()
            self.addCleanup(p.stop)
        self.request = {'identity': '/fictional/identity', 'registerDirectory': '/fictional/register',
                        'workspaceDirectory': '/fictional/workspace'}

    def receipt(self, path, digest, purpose=None, **changes):
        data = {'project': adapter.PROJECT, 'environment': 'staging', 'version': 1, 'ciphertext_sha256': digest}
        if purpose is not None:
            data['capability'] = purpose
        data.update(changes)
        path.write_text(json.dumps(data))

    def run_handler(self, raw, recover=None):
        read_fd, write_fd = os.pipe()
        try:
            with patch.object(adapter.custody, 'recover_root', side_effect=recover or [self.root_a, self.root_b]) as mock:
                adapter.handle(io.BytesIO(raw), write_fd)
            os.close(write_fd)
            write_fd = -1
            return json.loads(os.read(read_fd, 4096)), mock
        finally:
            os.close(read_fd)
            if write_fd >= 0:
                os.close(write_fd)

    def test_scoped_digests_and_private_output(self):
        output, recover = self.run_handler(json.dumps(self.request).encode())
        self.assertEqual(output, {'LOCAL_REGISTER_WRAP_KEY_V1': self.root_a, 'LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1': self.root_b})
        self.assertEqual(recover.call_args_list[0].args, ('/fictional/register', '/fictional/identity', self.digest_a, 'owner-register-v1'))
        self.assertEqual(recover.call_args_list[1].args, ('/fictional/workspace', '/fictional/identity', self.digest_b, 'owner-workspace-v1'))

    def test_invalid_and_oversize_input(self):
        for raw in (b'{}', b'not json', b' ' * (adapter.LIMIT + 1),
                    json.dumps({**self.request, 'identity': 'relative'}).encode(),
                    b'{"identity":"/a","identity":"/b","registerDirectory":"/c","workspaceDirectory":"/d"}'):
            with self.subTest(raw=raw[:30]), self.assertRaises((ValueError, json.JSONDecodeError)):
                self.run_handler(raw)

    def test_identical_roots_refused(self):
        with self.assertRaises(ValueError):
            self.run_handler(json.dumps(self.request).encode(), [self.root_a, self.root_a])

    def test_wrong_receipt_scope_and_purpose_refused_before_recovery(self):
        for changes in ({'project':'wrong'}, {'environment':'production'}, {'version':True}, {'capability':'owner-register-v1'}):
            self.receipt(self.workspace, self.digest_b, 'owner-workspace-v1', **changes)
            with patch.object(adapter.custody, 'recover_root') as recover, self.assertRaises(ValueError):
                r, w = os.pipe()
                try:
                    adapter.handle(io.BytesIO(json.dumps(self.request).encode()), w)
                finally:
                    os.close(r); os.close(w)
            recover.assert_not_called()

    def test_regular_file_output_refused_before_recovery(self):
        with tempfile.TemporaryFile() as output, patch.object(adapter.custody, 'recover_root') as recover:
            with self.assertRaises(ValueError):
                adapter.handle(io.BytesIO(json.dumps(self.request).encode()), output.fileno())
            recover.assert_not_called()

    def test_main_sanitizes_errors_and_never_prints_stdout(self):
        out, err = io.StringIO(), io.StringIO()
        with patch.object(adapter, 'handle', side_effect=ValueError('sensitive fictional value')), contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            self.assertEqual(adapter.main(), 1)
        self.assertEqual(out.getvalue(), '')
        self.assertEqual(err.getvalue(), 'Runtime key recovery failed.\n')


if __name__ == '__main__':
    unittest.main()
