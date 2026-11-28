"""Wait for the AcademyOS Foundation checks and print one exact-commit receipt."""

import argparse
import json
import re
import subprocess
import time


REPOSITORY = 'nahrplatform-rgb/academyos-web'
WORKFLOW = '.github/workflows/verify.yml'
POLL_SECONDS = 30


def github(path):
    try:
        result = subprocess.run(
            ['gh', 'api', '--hostname', 'github.com', f'repos/{REPOSITORY}/{path}'],
            stdin=subprocess.DEVNULL, capture_output=True, text=True, check=True, timeout=20,
        )
        data = json.loads(result.stdout)
    except FileNotFoundError:
        raise RuntimeError('GitHub CLI (gh) is required.') from None
    except subprocess.TimeoutExpired:
        raise RuntimeError('GitHub did not answer the read within 20 seconds.') from None
    except (subprocess.CalledProcessError, ValueError):
        raise RuntimeError('GitHub metadata could not be read. Check CLI access and connectivity.') from None
    if not isinstance(data, dict):
        raise RuntimeError('GitHub returned unexpected metadata.')
    return data


def wait_for_run(run_id, commit, timeout_seconds):
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        run = github(f'actions/runs/{run_id}')
        source = run.get('head_repository') or {}
        if (run.get('id') != run_id or run.get('head_sha') != commit
                or run.get('path', '').partition('@')[0] != WORKFLOW
                or source.get('full_name') != REPOSITORY):
            raise RuntimeError('Run does not match the requested commit and AcademyOS Foundation checks.')
        if run.get('status') == 'completed':
            return run
        time.sleep(max(0, min(POLL_SECONDS, deadline - time.monotonic())))
    raise RuntimeError('CI did not complete within the wait window.')


def summarize_ci(report, timeout_seconds):
    run_id = report['run_id']
    run = wait_for_run(run_id, report['commit'], timeout_seconds)
    attempt = run.get('run_attempt')
    if not isinstance(attempt, int) or attempt < 1:
        raise RuntimeError('GitHub did not report a valid run attempt.')
    report.update(run_attempt=attempt, run_conclusion=run.get('conclusion'))
    jobs = github(f'actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100').get('jobs')
    if not isinstance(jobs, list):
        raise RuntimeError('GitHub did not return the jobs for this run attempt.')
    verify_jobs = [job for job in jobs if job.get('name') == 'verify']
    if len(verify_jobs) > 1:
        raise RuntimeError('The Foundation checks reported multiple verify jobs.')
    if verify_jobs:
        job = verify_jobs[0]
        if (job.get('head_sha') != report['commit'] or job.get('run_id') != run_id
                or job.get('run_attempt') != attempt or job.get('status') != 'completed'):
            raise RuntimeError('The verify job does not match the completed commit and run attempt.')
        steps = job.get('steps', [])
        report.update(
            job_url=job.get('html_url'),
            job_conclusion=job.get('conclusion'),
            steps_passed=sum(step.get('conclusion') == 'success' for step in steps),
            step_count=len(steps),
        )
        failed_step = next((step['name'] for step in steps if step.get('conclusion') == 'failure'), None)
        if failed_step:
            report['first_failed_step'] = failed_step

    if run.get('conclusion') != 'success':
        report['verdict'] = 'ci_failed'
        return 1
    if report.get('job_conclusion') != 'success':
        raise RuntimeError('GitHub reported success without the expected successful verify job.')
    report['verdict'] = 'passed'
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--commit', required=True, help='Full 40-character candidate commit SHA')
    parser.add_argument('--run-id', required=True, type=int, help='Foundation checks run ID')
    parser.add_argument('--timeout-seconds', type=int, default=3600, help='Maximum CI wait (default 3600)')
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-fA-F]{40}', args.commit):
        parser.error('--commit must be a full 40-character Git SHA')
    if args.run_id < 1 or args.timeout_seconds < 1:
        parser.error('--run-id and --timeout-seconds must be positive')

    report = dict(
        commit=args.commit.lower(), run_id=args.run_id,
        run_url=f'https://github.com/{REPOSITORY}/actions/runs/{args.run_id}',
    )
    try:
        exit_code = summarize_ci(report, args.timeout_seconds)
    except RuntimeError as error:
        report.update(verdict='unverified', reason=str(error))
        exit_code = 2
    print(json.dumps(report))
    return exit_code


if __name__ == '__main__':
    raise SystemExit(main())
