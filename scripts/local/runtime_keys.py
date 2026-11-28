"""Recover existing scoped roots to an inherited private pipe; never print them."""
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import sys

ROOT = Path(__file__).resolve().parents[2]
REGISTER_RECEIPT = ROOT / 'docs/07-handoff/evidence/role-first-offline-2026-11-04/root-custody.json'
WORKSPACE_RECEIPT = ROOT / 'docs/07-handoff/evidence/ex13b-workspace-transfer/root-custody.json'
PROJECT = 'snpphkenmvmhpjstbeul'
LIMIT = 16384

spec = importlib.util.spec_from_file_location('academyos_custody', ROOT / 'scripts/register-key/custody.py')
custody = importlib.util.module_from_spec(spec)
spec.loader.exec_module(custody)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate')
        result[key] = value
    return result


def trusted_digest(path, capability):
    receipt = json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique_object)
    if (not isinstance(receipt, dict) or receipt.get('project') != PROJECT
            or receipt.get('environment') != 'staging' or type(receipt.get('version')) is not int
            or receipt['version'] != 1
            or receipt.get('capability') != (None if capability == 'owner-register-v1' else capability)):
        raise ValueError('scope')
    digest = receipt.get('ciphertext_sha256')
    if not isinstance(digest, str) or re.fullmatch(r'[0-9a-f]{64}', digest) is None:
        raise ValueError('digest')
    return digest


def handle(stream, output_fd=3):
    mode = os.fstat(output_fd).st_mode
    if not (stat.S_ISFIFO(mode) or stat.S_ISSOCK(mode)):
        raise ValueError('channel')
    raw = stream.read(LIMIT + 1)
    if len(raw) > LIMIT:
        raise ValueError('input limit')
    request = json.loads(raw, object_pairs_hook=unique_object)
    if not isinstance(request, dict) or set(request) != {'identity', 'registerDirectory', 'workspaceDirectory'}:
        raise ValueError('request')
    if any(not isinstance(value, str) or not value or not os.path.isabs(value) or '\x00' in value
           for value in request.values()):
        raise ValueError('path')
    register_digest = trusted_digest(REGISTER_RECEIPT, 'owner-register-v1')
    workspace_digest = trusted_digest(WORKSPACE_RECEIPT, 'owner-workspace-v1')
    register = custody.recover_root(request['registerDirectory'], request['identity'], register_digest, 'owner-register-v1')
    workspace = custody.recover_root(request['workspaceDirectory'], request['identity'], workspace_digest, 'owner-workspace-v1')
    if any(not isinstance(value, str) or re.fullmatch(r'[0-9a-f]{64}', value) is None for value in (register, workspace)) or register == workspace:
        raise ValueError('root')
    payload = json.dumps({'LOCAL_REGISTER_WRAP_KEY_V1': register, 'LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1': workspace}, separators=(',', ':')).encode() + b'\n'
    if len(payload) > LIMIT:
        raise ValueError('output limit')
    view = memoryview(payload)
    while view:
        written = os.write(output_fd, view)
        if written <= 0:
            raise OSError('write')
        view = view[written:]


def main():
    try:
        handle(sys.stdin.buffer)
    except Exception:
        print('Runtime key recovery failed.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
