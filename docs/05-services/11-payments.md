# Payment-provider configuration and verification

No provider is finalized or activated. D-001, D-007, D-009 and D-010 determine legal entity, country, currency, commercial policy, merchant ownership and gateway. This runbook prepares integration choices; it does not authorize live charges or establish regulatory eligibility.

## Decide the money flow first

Model separately: (1) academy pays NAHR for AcademyOS; (2) family pays an academy; (3) academy records trainer disbursement. A provider account suitable for NAHR subscriptions does not automatically support collecting and distributing money for academies. Confirm who is merchant, who receives settlement, who issues the invoice, who handles refunds/disputes and which provider contracts support that flow.

Record entity and bank eligibility, supported currencies/payment methods, settlement timing, fees, tax/invoice responsibilities, chargebacks, refunds, recurring-payment support, webhook/reconciliation APIs, sandbox access and data-processing terms. Obtain actual provider approval where needed. Do not assume Stripe is available to the chosen entity because it is available in Vercel Marketplace; check the current country/product list. [Stripe availability](https://stripe.com/global)

## Common configuration

| Field | Required decision/value |
|---|---|
| `PAYMENTS_PROVIDER` | `disabled` until the chosen adapter is ready |
| `PAYMENTS_MODE` | Explicit sandbox/test or live; never inferred from hostname alone |
| Merchant reference | Actual account/entity/environment reference |
| Supported currency | Approved catalog and provider capability |
| Secret/API key | Server-only, environment-specific, scoped to needed operations |
| Public checkout key | Browser-visible only if the chosen SDK requires it |
| Webhook secret/verifier key | Exact endpoint/mode; not assumed identical across providers |
| Callback URL | Stable HTTPS `/api/webhooks/payments/{provider}` |
| Return URL | Approved application origin; informational until reconciliation |
| Refund/void controls | Separate capability, threshold and evidence |
| Reconciliation | Provider query/report source and scheduled exception queue |

Use provider-hosted checkout or the supported tokenized UI. Do not store card PAN/CVV or implement a custom card-capture form. Keep payment proofs private. Billing/customer identifiers may be personal data and need retention/access controls.

## Stripe candidate

Create a NAHR-owned account only after eligibility is established. Configure business/settlement details, named access and MFA. Use sandbox/test keys for development and separate live keys/endpoints later. Record restricted secret key, publishable key if needed, endpoint signing secret, selected API version, catalog price IDs and enabled event types.

Use the official SDK for signature verification with the unmodified request body. Handle duplicate and unordered events, record event IDs and process asynchronously after durable receipt. The endpoint must be reachable over HTTPS; hosting protection needs an intentional machine-access configuration. [Stripe webhooks](https://docs.stripe.com/webhooks)

Validate merchant/mode/order/amount/currency and the required settled state. A checkout completion event may require further payment-status interpretation for the selected payment method. Do not grant entitlements solely from a redirect or optimistic client response.

## Paymob candidate

Confirm the correct country product and API generation with Paymob; do not combine legacy Accept examples and newer Intention credentials without a compatibility review. Record merchant/profile, integration IDs per payment method, API/secret/public keys as applicable, HMAC key, checkout configuration and callback/return URLs from the actual account.

Paymob transaction callbacks contain order, amount, currency, integration and transaction state. Implement the provider's documented canonical-field HMAC procedure for the chosen callback version and verify expected merchant/integration and final payment state. Preserve raw input for verification requirements, but do not replace its canonical-field algorithm with a generic raw-body HMAC. [Paymob callbacks](https://developers.paymob.com/paymob-docs/developers/transaction-callbacks), [Paymob HMAC reference](https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac)

## Kashier candidate

Record merchant ID, test/live Payment API Keys, server secret key, approved checkout configuration and mode-specific webhook. Payment-signing keys and server API secrets have different purposes. Use the current documented signature construction and header validation for payment events; do not reuse payout verification rules for payment webhooks. [Kashier API keys](https://developers.kashier.io/docs/get-started/api-keys), [Kashier webhooks](https://developers.kashier.io/docs/webhooks)

## Sandbox acceptance and go-live gate

Test successful, declined, cancelled, pending and delayed settlement; invalid signature; wrong currency/amount/merchant; duplicate/out-of-order delivery; database failure after provider success; refund pending/failure; partial refund; and lost browser return. Reconcile provider transaction ID to exactly one internal financial effect and appropriate subscription/family allocation.

The go-live record contains approved provider/entity/money flow, live endpoint, tested API version, secret references, amount limits, refund/dispute owner, reconciliation schedule and a rollback plan. A tiny controlled live test, if later authorized, is separate evidence from sandbox success. Until that gate, live mode remains disabled and no real card/payment is requested by this documentation task.
