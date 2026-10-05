# Lumen runbook

## Services and what breaks if each is down

| Service         | Used for                          | If it is down                                                           |
| --------------- | --------------------------------- | ----------------------------------------------------------------------- |
| Vercel          | Hosting, cron                     | Site down. Use Instant Rollback if a deploy caused it.                  |
| Neon (Postgres) | All data                          | App errors. Nothing works without it.                                   |
| Upstash Redis   | Summarize and billing rate limits | Fails open: requests allowed, monthly quota still enforced.             |
| Google Gemini   | Summaries                         | Summaries fail with a clear error and the credit is refunded.           |
| Stripe          | Payments                          | Checkout and portal fail. Existing plans keep working.                  |
| Resend          | Email                             | No verification, reset, or deletion emails. Google sign-in still works. |

## Environment variables (names only; values live in Vercel)

NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPPORT_EMAIL, DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY,
EMAIL_FROM, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GEMINI_API_KEY, GEMINI_MODEL_LITE,
GEMINI_MODEL_STANDARD, GEMINI_MODEL_FALLBACK, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CRON_SECRET.
Local only: DATABASE_URL_UNPOOLED (direct Neon string, used by Prisma migrations).

## Deploying

1. Merge to main after CI is green. Vercel deploys automatically.
2. Schema changes: run `prisma migrate deploy` with the DIRECT production string BEFORE pushing code that needs it.
3. Make changes backward compatible (add, then switch, then remove) so a rollback never meets a schema it cannot read.

## Rolling back

Vercel dashboard, Deployments, pick the last good one, Instant Rollback. Migrations are forward-only; fix forward with a new migration.

## Incidents

- **Summaries failing**: check Google AI Studio quota and status. To change models, edit GEMINI_MODEL_* in Vercel and redeploy. Credits for failed runs are refunded automatically.
- **Plans not updating after payment**: Stripe dashboard, Developers, Webhooks, look for failed deliveries and use "Resend". Handling is idempotent, so resending is safe.
- **A user says a credit was lost**: stuck runs are refunded by the daily cleanup. To run it now: `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-DOMAIN/api/cron/cleanup`.
- **Secret leaked**: rotate in the provider first, then update Vercel and redeploy. BETTER_AUTH_SECRET rotation signs everyone out. Rotate Neon passwords, Stripe keys and webhook secret, Resend, Gemini, Upstash, Google OAuth secret, CRON_SECRET.
- **Suspected account compromise**: delete the user's sessions in the database, force a password reset, check recent summaries.

## Data

- Backups and restore depend on your Neon plan. Check the history retention window, then do a restore drill by creating a branch from a past timestamp and confirming the data.
- Deleting a user cascades to summaries, usage, preferences, sessions, and billing rows. The in-app deletion flow also deletes the Stripe customer.
- Privacy requests go to the support email. Fulfil access and deletion requests promptly and keep a note of each.

## Monitoring (set these up before launch)

Google Cloud budget alert, Stripe failed-webhook email alerts, Neon and Upstash usage alerts, Vercel error and spend alerts.
