# Upstash Redis and rate-limit configuration

Selected initial service for distributed rate limiting. Redis is not the authority for memberships, financial state or durable job completion. Status: setup not executed.

## Resource setup

Use a NAHR-owned Upstash account/team with MFA and named administrators. Create distinct production and nonproduction databases; proposed names are `academyos-prod-ratelimit` and `academyos-staging-ratelimit`. Select the primary region near the application writes, record any read-region choice and choose a plan matching expected command volume and availability. The official setup provides region selection and connection details in the database console. [Upstash getting started](https://upstash.com/docs/redis/overall/getstarted)

Record database ID, region, plan, max-size/usage controls, billing alerts, credential owner and rotation procedure. Use TLS/HTTPS supported by the chosen SDK. Store `UPSTASH_REDIS_REST_URL` as server configuration and `UPSTASH_REDIS_REST_TOKEN` as a server secret. Never use a read-only token for counter writes or expose the write token to a browser.

## Rate-limit policy

Apply independent budgets by operation, authenticated user, academy and a privacy-conscious network identifier where appropriate. Namespace keys with environment and policy version. Do not use raw emails, child names or full request bodies in keys. Limit registration/invitation attempts, receipt/payment initiation, uploads, exports, support messages and expensive search separately.

Proposed starting values for synthetic load testing, to tune before pilot: invitation 10/hour per actor plus academy cap; export 5/hour per actor and 2 concurrent per academy; ordinary attendance capture 120/minute per assigned trainer with bounded batch size; public signup/recovery 5/minute per network plus identity safeguards. These are candidate product limits, not provider quotas or final business policy. Ensure a shared school/mobile network is not unfairly blocked solely by IP.

Return a clear 429 with retry timing. Avoid auto-retrying writes with new operation IDs. Separate abuse protection from idempotency and authorization.

## Failure behavior

Define failure per route. Sensitive public/admin/payment-initiation paths should fail safely or use an explicitly approved fallback. Read-only low-risk paths may degrade with a local bounded fallback and an alert. Do not accidentally lock every existing user out because Redis is unavailable, and do not silently remove all protection from high-risk endpoints.

Inspect the installed rate-limit SDK's timeout behavior: some timeout settings can return an allowed result. Handle timeout/error reasons explicitly rather than treating `success` alone as a complete security decision. [Upstash rate-limit features](https://upstash.com/docs/redis/sdks/ratelimit-ts/features)

## Verification and recovery

Test accepted requests, exact boundary, reset/retry timing, multiple application instances, large shared-IP groups, Redis timeout, invalid token and revoked actor. Verify staging increments never touch production keys. Observe command usage and memory during a realistic attendance burst; one scan can cause several Redis commands depending on algorithm.

Rotate the token through the vault and deployment, verify new instances and retire the old credential. Flush only a verified disposable test namespace; never clear production limits to repair an unrelated login issue. Alert on sustained Redis errors, abnormal denial rates and unexpected cost growth.
