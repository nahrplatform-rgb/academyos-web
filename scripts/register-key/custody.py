"""Staging wrapping-root backup preparation; never provisions a provider or prints keys.

Uses the existing Owner age recovery identity; no new app password/passkey.
Production/private activation authority is outside this utility.
"""
import argparse
import datetime
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import secrets
import stat
import subprocess

PROJECT = 'snpphkenmvmhpjstbeul'
# Pinned existing public recovery recipient from scripts/backups/backup.py.
RECIPIENT = 'age15ca2qpffygqeey86dlhquz23fglv9y4h5mdxx8psaqxdvlqs65ysfu5q42'
CAPABILITIES = ('owner-register-v1', 'owner-workspace-v1')


def scoped_fields(capability):
    if capability not in CAPABILITIES:
        raise ValueError('Unsupported recovery capability')
    # Keep the already-provisioned register archive format unchanged. New
    # workspace archives bind their distinct capability inside the ciphertext.
    return {} if capability == 'owner-register-v1' else {'capability': capability}


def run(args, data=None):
    result = subprocess.run(args, input=data, capture_output=True)
    if result.returncode:
        raise ValueError('Recovery tool refused the operation; no key was published')
    return result.stdout


def private_file(path):
    p = Path(path)
    if p.is_symlink() or not p.is_file() or stat.S_IMODE(p.stat().st_mode) & 0o077:
        raise ValueError('Expected an existing private regular file, mode0600 or stricter')
    return p


def verify_identity(identity):
    p = private_file(identity)
    if run(['age-keygen', '-y', str(p)]).decode().strip() != RECIPIENT:
        raise ValueError('Recovery identity does not match the existing staging recipient')
    return p


def exclusive_file(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())


def recover_root(directory, identity, expected_sha256, capability='owner-register-v1'):
    """In-process return for an authorized provider adapter; never expose in CLI/logs."""
    extra = scoped_fields(capability)
    keyfile = verify_identity(identity)
    cipher = private_file(Path(directory)/'wrap-v1.age')
    if cipher.stat().st_size > 16384:
        raise ValueError('Recovery archive exceeds the fixed root-envelope bound')
    ciphertext = cipher.read_bytes()
    if (not isinstance(expected_sha256, str) or re.fullmatch('[0-9a-f]{64}', expected_sha256) is None
            or len(ciphertext) > 16384
            or not hmac.compare_digest(hashlib.sha256(ciphertext).hexdigest(), expected_sha256)):
        raise ValueError('Recovery archive does not match the independently trusted digest')
    try:
        # Decrypt those exact verified bytes, not a path that can change after
        # the digest check. Neither plaintext nor the root reaches stdout.
        payload = json.loads(run(['age', '--decrypt', '--identity', str(keyfile)], ciphertext))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError('Recovery envelope is invalid') from None
    if (not isinstance(payload, dict) or set(payload) != {'project','environment','version','created_at','root'} | set(extra)
            or payload['project'] != PROJECT or payload['environment'] != 'staging'
            or any(payload.get(key) != value for key, value in extra.items())
            or payload['version'] != 1 or not isinstance(payload['root'], str)
            or re.fullmatch('[0-9a-f]{64}', payload['root']) is None):
        raise ValueError('Recovery envelope scope/version/key format is invalid')
    return payload['root']


def prepare(directory, identity, capability='owner-register-v1'):
    extra = scoped_fields(capability)
    verify_identity(identity)
    d = Path(directory)
    if d.is_symlink():
        raise ValueError('Custody directory must not be a symlink')
    d.mkdir(mode=0o700, parents=True, exist_ok=True)
    if not d.is_dir() or stat.S_IMODE(d.stat().st_mode) & 0o077:
        raise ValueError('Custody directory must be private, mode0700')
    if any(d.iterdir()):
        raise ValueError('Custody directory is not empty; never replace recovery material')
    root = secrets.token_hex(32)
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload = json.dumps(dict(project=PROJECT, environment='staging', version=1,
                              created_at=stamp, root=root, **extra)).encode()
    cipher = run(['age', '--encrypt', '--recipient', RECIPIENT], payload)
    exclusive_file(d/'wrap-v1.age', cipher)
    digest = hashlib.sha256(cipher).hexdigest()
    if not hmac.compare_digest(root, recover_root(d, identity, digest, capability)):
        raise ValueError('Encrypted backup restore comparison failed')
    receipt = dict(project=PROJECT, environment='staging', version=1, created_at=stamp,
                   recipient=RECIPIENT, ciphertext_sha256=digest,
                   encrypted_backup_restored=True, provider_provisioned=False,
                   note='One V1 root; no automatic rotation or replacement. Preserve for pending ciphertext recovery.',
                   **extra)
    exclusive_file(d/'custody.json', (json.dumps(receipt, indent=2)+'\n').encode())
    return receipt


def check(directory, identity, expected_sha256, capability='owner-register-v1'):
    extra = scoped_fields(capability)
    # Expected digest comes from a separately retained/trusted receipt, never
    # from the adjacent custody.json that could be replaced with the archive.
    root = recover_root(directory, identity, expected_sha256, capability)
    receipt = json.loads(private_file(Path(directory)/'custody.json').read_text())
    actual = hashlib.sha256(private_file(Path(directory)/'wrap-v1.age').read_bytes()).hexdigest()
    if (receipt.get('project') != PROJECT or receipt.get('version') != 1
            or receipt.get('environment') != 'staging' or receipt.get('recipient') != RECIPIENT
            or receipt.get('capability') != extra.get('capability')
            or receipt.get('ciphertext_sha256') != actual):
        raise ValueError('Custody receipt does not match the encrypted backup')
    return dict(project=PROJECT, environment='staging', version=1,
                encrypted_backup_restored=bool(root), ciphertext_sha256=actual,
                provider_provisioned=False, **extra)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare','check'])
    parser.add_argument('--directory', required=True)
    parser.add_argument('--identity', required=True, help='Existing Owner age recovery identity file; never a password')
    parser.add_argument('--expected-sha256', help='Required for check; use the separately trusted receipt, not the adjacent archive receipt')
    parser.add_argument('--capability', choices=CAPABILITIES, default='owner-register-v1',
                        help='Workspace archives are purpose-bound and cannot replace the existing register root')
    args = parser.parse_args()
    try:
        receipt = (prepare(args.directory, args.identity, args.capability) if args.action == 'prepare'
                   else check(args.directory, args.identity, args.expected_sha256, args.capability))
    except (ValueError, OSError) as error:
        raise SystemExit(str(error)) from None
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
