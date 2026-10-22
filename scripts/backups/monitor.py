#!/usr/bin/env python3
"""Non-sensitive, fixed-project Sentry check-ins; never carries backup payloads."""
import argparse
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener
import uuid

from backup import NoRedirect, PROJECT, BackupError

ENDPOINT = ('https://o4512294688260096.ingest.de.sentry.io/api/4512294699728976/'
            'cron/academyos-staging-backup/e417cb373ff53c8f98931c86bde5f67a/')
CONFIG = {'schedule': {'type': 'crontab', 'value': '17 2 * * *'},
          'timezone': 'UTC', 'checkin_margin': 90, 'max_runtime': 30,
          'failure_issue_threshold': 1, 'recovery_threshold': 1}


def payload(status, run, receipt=None):
    if status not in {'in_progress', 'ok', 'error'} or not run or len(run) > 100:
        raise BackupError('Invalid monitor invocation')
    if status == 'ok':
        if not receipt or receipt.get('project') != PROJECT or receipt.get('status') != 'encrypted_upload_download_verified' or receipt.get('storage_api_credential_verified') is not True:
            raise BackupError('A verified encrypted-copy receipt is required for a successful backup check-in')
    result = {'status': status, 'environment': 'staging',
              'check_in_id': uuid.uuid5(uuid.NAMESPACE_URL, 'academyos-staging-backup/' + run).hex}
    if status == 'in_progress':
        result['monitor_config'] = CONFIG
    return result


def main():
    p = argparse.ArgumentParser()
    p.add_argument('status', choices=['in_progress', 'ok', 'error'])
    p.add_argument('--receipt', type=Path)
    p.add_argument('--controlled-probe', action='store_true', help='Separate synthetic failure check-in within the actual workflow run')
    a = p.parse_args()
    run = os.environ.get('GITHUB_RUN_ID', '') + '/' + os.environ.get('GITHUB_RUN_ATTEMPT', '')
    if not all(part.isdigit() for part in run.split('/')):
        raise BackupError('Monitor requires a GitHub run identity')
    if a.controlled_probe:
        run += '/controlled-probe'
    receipt = json.loads(a.receipt.read_text()) if a.receipt else None
    request = Request(ENDPOINT, data=json.dumps(payload(a.status, run, receipt)).encode(),
                      headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with build_opener(NoRedirect()).open(request, timeout=20) as response:
            if not 200 <= response.status < 300:
                raise BackupError('Backup monitor did not accept check-in')
            response.read(1024)
    except HTTPError as error:
        raise BackupError(f'Backup monitor rejected check-in (HTTP {error.code})') from None
    except URLError:
        raise BackupError('Backup monitor transport failed') from None
    print('Backup monitor accepted: ' + a.status)


if __name__ == '__main__':
    try:
        main()
    except (BackupError, ValueError, OSError):
        print('Backup monitor check-in failed; inspect the provider and workflow status.', file=sys.stderr)
        sys.exit(1)
