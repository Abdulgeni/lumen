# Launch checklist

Run `npm run launch:check` against production settings; it checks what a script can.

## Money and providers

- [ ] Gemini key is from a billed Google Cloud project; budget alert set
- [ ] Privacy Policy AI-provider sentence written from the terms that apply to that plan
- [ ] Stripe account activated (business verification complete)
- [ ] Live keys in Vercel; `npm run stripe:setup -- --live` run once with the live key
- [ ] Live webhook endpoint created (same six events) and its secret stored
- [ ] Customer Portal configured in LIVE mode (cancel at period end, switch plans, payment methods)
- [ ] Tax and invoice settings decided (Stripe Tax if required where you sell)
- [ ] A real small payment made, then refunded, end to end
- [ ] PLAN_PRICE_USD matches the live Stripe prices

## Domain and email

- [ ] Domain bought and attached to Vercel
- [ ] NEXT_PUBLIC_APP_URL updated everywhere, redeployed
- [ ] Google OAuth origins and redirect URIs use the new domain
- [ ] Stripe webhook endpoint URL uses the new domain
- [ ] Resend domain verified (SPF, DKIM, DMARC); EMAIL_FROM uses it
- [ ] Support email address is monitored

## Legal

- [ ] LEGAL values in src/lib/legal.ts filled in; no [BRACKETS] remain on /privacy or /terms
- [ ] Lawyer has reviewed Privacy Policy and Terms
- [ ] Privacy and Terms URLs added to the Google OAuth consent screen and Stripe settings
- [ ] Refund policy decided

## Platform

- [ ] Vercel plan allows commercial use (the Hobby plan does not)
- [ ] Neon plan chosen for production (compute that stays on, restore window)
- [ ] Upstash and Resend limits are enough for expected traffic
- [ ] Restore drill done once

## Quality

- [ ] `npm run e2e` passes against the production build
- [ ] Lighthouse: accessibility, best practices, SEO at 95+; performance acceptable on mobile
- [ ] Test accounts and demo data removed from production
- [ ] Monitoring and alerts set (see RUNBOOK)
