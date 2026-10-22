#!/usr/bin/env python3
"""Narrow operator test for a fixed, non-personal CSV in private staging Storage.

No arbitrary uploads/targets, upserts, bucket changes, SQL or client grants.
Cleanup only touches the two exact test paths after verifying their contents.
"""
import argparse
import base64
import hashlib
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener
import uuid
from backup import BackupError, NoRedirect, SUPABASE_URL, required

FIXTURE = b'academyos,backup-recovery-test\npersonal-data,none\n'
DIGEST = hashlib.sha256(FIXTURE).hexdigest()
BUCKET = 'exports'


def paths(run_id):
    parsed = uuid.UUID(run_id)
    if str(parsed) != run_id or parsed.version != 4:
        raise BackupError('A canonical UUID4 rehearsal identifier is required')
    prefix = '__setup_recovery__/' + run_id
    return {kind: prefix + '/' + kind + '.csv' for kind in ('source', 'restored')}


def restored_bytes(value):
    if len(value) > 512:
        raise BackupError('Rehearsal payload is too large')
    data = base64.b64decode(value, validate=True)
    if data != FIXTURE:
        raise BackupError('Only the fixed non-personal recovery fixture is accepted')
    return data


def request(method, path, key=None, data=None, content_type=None, allow_missing=False):
    headers = {'apikey': key} if key else {}
    if content_type:
        headers['Content-Type'] = content_type
    req = Request(SUPABASE_URL + '/storage/v1/' + path, data=data, headers=headers, method=method)
    try:
        with build_opener(NoRedirect()).open(req, timeout=30) as response:
            body = response.read(1024 * 1024 + 1)
            if len(body) > 1024 * 1024:
                raise BackupError('Unexpectedly large Storage rehearsal response')
            return response.status, body
    except HTTPError as error:
        # API may encode a missing private object as HTTP 400; allow only this
        # exact provider not-found code, never hide auth/network errors.
        body = error.read(8192)
        if allow_missing and error.code in {400, 404}:
            try:
                result = json.loads(body)
                if str(result.get('statusCode')) == '404' or result.get('error') == 'not_found':
                    return 404, b''
            except ValueError:
                pass
        raise BackupError(f'Storage rehearsal failed (HTTP {error.code})') from None
    except URLError:
        raise BackupError('Storage rehearsal transport failed') from None


def verified_download(path, key, allow_missing=False):
    status, data = request('GET', 'object/authenticated/' + BUCKET + '/' + path, key, allow_missing=allow_missing)
    if status == 404:
        return False
    if data != FIXTURE:
        raise BackupError('Rehearsal object differs; refuse to overwrite or delete')
    return True


def main():
    p = argparse.ArgumentParser()
    p.add_argument('operation', choices=['create', 'restore', 'cleanup'])
    p.add_argument('--run-id', required=True)
    a = p.parse_args()
    target = paths(a.run_id)
    key = required('BACKUP_SUPABASE_SECRET_KEY')
    _, raw = request('GET', 'bucket/' + BUCKET, key)
    bucket = json.loads(raw)
    if bucket.get('id') != BUCKET or bucket.get('public') is not False:
        raise BackupError('Rehearsal bucket must remain private')
    if a.operation == 'cleanup':
        remove = [path for path in target.values() if verified_download(path, key, allow_missing=True)]
        if remove:
            request('DELETE', 'object/' + BUCKET, key, json.dumps({'prefixes': remove}).encode(), 'application/json')
        if any(verified_download(path, key, allow_missing=True) for path in target.values()):
            raise BackupError('Rehearsal cleanup did not remove the exact test objects')
        print(json.dumps({'operation': 'cleanup', 'rehearsal': a.run_id, 'removed': len(remove), 'verified': True}))
        return
    kind = 'source' if a.operation == 'create' else 'restored'
    data = FIXTURE if kind == 'source' else restored_bytes(required('RECOVERED_FIXTURE_BASE64'))
    path = target[kind]
    request('POST', 'object/' + BUCKET + '/' + path, key, data, 'text/csv')
    verified_download(path, key)
    # No API key/session must be able to read this operator-only private object.
    try:
        request('GET', 'object/public/' + BUCKET + '/' + path)
    except BackupError as error:
        if str(error) not in {'Storage rehearsal failed (HTTP 400)', 'Storage rehearsal failed (HTTP 401)', 'Storage rehearsal failed (HTTP 403)', 'Storage rehearsal failed (HTTP 404)'}:
            raise
    else:
        raise BackupError('Private rehearsal object was publicly readable')
    print(json.dumps({'operation': a.operation, 'rehearsal': a.run_id, 'bucket': BUCKET,
                      'path': path, 'bytes': len(data), 'sha256': DIGEST,
                      'authenticated_download_verified': True, 'public_download_denied': True}))


if __name__ == '__main__':
    try:
        main()
    except (BackupError, ValueError, OSError):
        print('Storage rehearsal failed. No automatic overwrite or broad cleanup was attempted.', file=sys.stderr)
        sys.exit(1)
