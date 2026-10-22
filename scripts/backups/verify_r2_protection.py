#!/usr/bin/env python3
"""Probe only a new, fixed-content synthetic R2 object; never delete backups."""
import hashlib
import json
import sys
import uuid
from backup import BUCKET, r2_client, BackupError


def verify():
    from botocore.exceptions import ClientError
    client = r2_client()
    key = 'staging/protection-checks/' + str(uuid.uuid4()) + '/probe.txt'
    body = b'AcademyOS non-personal backup lock verification.\n'
    client.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType='text/plain')
    results = {}
    for operation in ['overwrite', 'delete']:
        try:
            if operation == 'overwrite':
                client.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType='text/plain')
            else:
                client.delete_object(Bucket=BUCKET, Key=key)
        except ClientError as error:
            code = error.response.get('Error', {}).get('Code')
            if code != 'ObjectLockedByBucketPolicy' or error.response.get('ResponseMetadata', {}).get('HTTPStatusCode') not in {403, 409}:
                status = error.response.get('ResponseMetadata', {}).get('HTTPStatusCode')
                safe_code = code if isinstance(code, str) and code.isalnum() and len(code) < 64 else 'unknown'
                raise BackupError(f'Unexpected R2 protection response: {operation}, HTTP {status}, code {safe_code}') from None
            results[operation + '_denied'] = True
            results[operation + '_http_status'] = error.response['ResponseMetadata']['HTTPStatusCode']
            results[operation + '_code'] = code
        else:
            raise BackupError('R2 protection probe was not blocked; investigate the scoped lock')
    response = client.get_object(Bucket=BUCKET, Key=key)
    stream = response['Body']
    try:
        downloaded = stream.read(len(body) + 1)
    finally:
        stream.close()
    if downloaded != body:
        raise BackupError('R2 probe changed after rejected overwrite/delete')
    return {'bucket': BUCKET, 'probe_key': key, 'bytes': len(body),
            'sha256': hashlib.sha256(body).hexdigest(), **results,
            'readback_verified': True, 'probe_cleanup': 'approved 30-day lifecycle; seven-day lock applies'}


if __name__ == '__main__':
    try:
        print(json.dumps(verify()))
    except Exception as error:
        print(str(error) if isinstance(error, BackupError) else 'R2 protection probe failed; inspect provider settings.', file=sys.stderr)
        sys.exit(1)
