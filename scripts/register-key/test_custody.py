"""Local fake-key custody tests; no hosted configuration or account changes."""
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('custody', Path(__file__).with_name('custody.py'))
custody = importlib.util.module_from_spec(spec)
spec.loader.exec_module(custody)
CANONICAL_RECIPIENT = custody.RECIPIENT


class Custody(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='academyos-custody-fixture-')
        self.base = Path(self.tmp.name)
        self.identity = self.base/'fixture.agekey'
        subprocess.run(['age-keygen','-o',str(self.identity)], check=True, capture_output=True)
        self.identity.chmod(0o600)
        self.recipient = subprocess.check_output(['age-keygen','-y',str(self.identity)], text=True).strip()
        custody.RECIPIENT = self.recipient
        self.directory = self.base/'custody'

    def tearDown(self):
        custody.RECIPIENT = CANONICAL_RECIPIENT
        self.tmp.cleanup()

    def test_roundtrip_keeps_only_ciphertext_and_nonsecret_receipt(self):
        result = custody.prepare(self.directory,self.identity)
        self.assertTrue(result['encrypted_backup_restored'])
        self.assertFalse(result['provider_provisioned'])
        self.assertEqual({p.name for p in self.directory.iterdir()}, {'wrap-v1.age','custody.json'})
        root = custody.recover_root(self.directory,self.identity,result['ciphertext_sha256'])
        self.assertEqual(len(root),64)
        self.assertNotIn(root.encode(),(self.directory/'wrap-v1.age').read_bytes())
        self.assertNotIn(root,(self.directory/'custody.json').read_text())
        self.assertTrue(custody.check(self.directory,self.identity,result['ciphertext_sha256'])['encrypted_backup_restored'])

    def test_double_prepare_refuses_to_replace_original_material(self):
        custody.prepare(self.directory,self.identity)
        before = (self.directory/'wrap-v1.age').read_bytes()
        with self.assertRaisesRegex(ValueError,'never replace'):
            custody.prepare(self.directory,self.identity)
        self.assertEqual(before,(self.directory/'wrap-v1.age').read_bytes())

    def test_wrong_existing_identity_and_public_file_refused(self):
        custody.RECIPIENT = CANONICAL_RECIPIENT
        with self.assertRaisesRegex(ValueError,'does not match'):
            custody.prepare(self.directory,self.identity)
        self.identity.chmod(0o644)
        with self.assertRaisesRegex(ValueError,'private regular'):
            custody.prepare(self.directory,self.identity)

    def test_tampered_ciphertext_and_receipt_refused(self):
        result = custody.prepare(self.directory,self.identity)
        cipher = self.directory/'wrap-v1.age'
        original = cipher.read_bytes()
        cipher.write_bytes(original[:-20]+b'invalid ciphertext')
        with self.assertRaises(ValueError):custody.check(self.directory,self.identity,result['ciphertext_sha256'])
        cipher.write_bytes(original)
        receipt = self.directory/'custody.json'
        data = json.loads(receipt.read_text());data['project']='wrong-project';receipt.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError,'does not match'):custody.check(self.directory,self.identity,result['ciphertext_sha256'])

    def test_valid_replacement_archive_and_adjacent_receipt_cannot_replace_root(self):
        trusted = custody.prepare(self.directory,self.identity)['ciphertext_sha256']
        other = self.base/'other'
        replacement = custody.prepare(other,self.identity)
        for name in ['wrap-v1.age','custody.json']:
            (self.directory/name).write_bytes((other/name).read_bytes())
        self.assertNotEqual(trusted,replacement['ciphertext_sha256'])
        with self.assertRaisesRegex(ValueError,'independently trusted'):
            custody.recover_root(self.directory,self.identity,trusted)
        with self.assertRaisesRegex(ValueError,'independently trusted'):
            custody.check(self.directory,self.identity,trusted)

    def test_recovery_refuses_missing_trusted_digest(self):
        custody.prepare(self.directory,self.identity)
        with self.assertRaisesRegex(ValueError,'independently trusted'):
            custody.recover_root(self.directory,self.identity,None)

    def test_archive_replacement_during_decryption_cannot_change_verified_bytes(self):
        trusted=custody.prepare(self.directory,self.identity)['ciphertext_sha256']
        original=custody.recover_root(self.directory,self.identity,trusted)
        other=self.base/'other';custody.prepare(other,self.identity)
        runner=custody.run
        def replace_then_decrypt(args,data=None):
            if '--decrypt' in args:
                (self.directory/'wrap-v1.age').write_bytes((other/'wrap-v1.age').read_bytes())
            return runner(args,data)
        with patch.object(custody,'run',side_effect=replace_then_decrypt):
            self.assertEqual(custody.recover_root(self.directory,self.identity,trusted),original)

    def test_scoped_backup_cannot_recover_foreign_payload(self):
        self.directory.mkdir(mode=0o700)
        payload=json.dumps(dict(project='foreign-project',environment='staging',version=1,created_at='fixture',root='a'*64)).encode()
        custody.exclusive_file(self.directory/'wrap-v1.age',custody.run(['age','--encrypt','--recipient',self.recipient],payload))
        digest=hashlib.sha256((self.directory/'wrap-v1.age').read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError,'scope/version'):custody.recover_root(self.directory,self.identity,digest)

    def test_workspace_archive_is_distinct_and_restores_only_for_its_capability(self):
        register = custody.prepare(self.directory,self.identity)
        workspace_dir = self.base/'workspace'
        workspace = custody.prepare(workspace_dir,self.identity,'owner-workspace-v1')
        self.assertEqual(workspace['capability'],'owner-workspace-v1')
        self.assertTrue(custody.check(workspace_dir,self.identity,workspace['ciphertext_sha256'],
                                     'owner-workspace-v1')['encrypted_backup_restored'])
        self.assertNotEqual(custody.recover_root(self.directory,self.identity,register['ciphertext_sha256']),
                            custody.recover_root(workspace_dir,self.identity,workspace['ciphertext_sha256'],
                                                 'owner-workspace-v1'))
        with self.assertRaisesRegex(ValueError,'scope/version'):
            custody.recover_root(self.directory,self.identity,register['ciphertext_sha256'],'owner-workspace-v1')
        with self.assertRaisesRegex(ValueError,'scope/version'):
            custody.recover_root(workspace_dir,self.identity,workspace['ciphertext_sha256'])

    def test_workspace_receipt_cannot_rename_the_encrypted_capability(self):
        result = custody.prepare(self.directory,self.identity,'owner-workspace-v1')
        receipt = self.directory/'custody.json'
        data = json.loads(receipt.read_text());data.pop('capability');receipt.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError,'does not match'):
            custody.check(self.directory,self.identity,result['ciphertext_sha256'],'owner-workspace-v1')

    def test_unknown_capability_is_refused_before_any_archive_is_created(self):
        with self.assertRaisesRegex(ValueError,'Unsupported recovery capability'):
            custody.prepare(self.directory,self.identity,'foreign')
        self.assertFalse(self.directory.exists())

    def test_canonical_public_recipient_matches_existing_backup(self):
        tree = ast.parse((ROOT/'scripts/backups/backup.py').read_text())
        recipient = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign)
                         and any(isinstance(t,ast.Name) and t.id=='RECIPIENT' for t in n.targets))
        self.assertEqual(recipient,CANONICAL_RECIPIENT)


if __name__ == '__main__':
    unittest.main(verbosity=2)
