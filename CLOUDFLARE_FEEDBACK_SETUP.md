# Vibodh UI feedback forms on Cloudflare Workers

The Key Features feedback form and **Submit Your Thoughts** form are handled by `worker.mjs`. Each submission is stored in Cloudflare D1 and a notification is sent to `reachus@vibodhai.com` through Resend.

## One-time Resend setup

1. Create a Resend account and add `vibodhai.com` under **Domains**.
2. Add the SPF and DKIM DNS records Resend provides. The domain must show **Verified** before form notifications can be sent from `forms@vibodhai.com`.
3. Create an API key in **API Keys** with sending permission. Store it only as a secret; do not put it in source control.
4. Add the secret to the deployed Worker:

   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```

   Paste the Resend API key when Wrangler prompts for it.
5. Deploy the Worker:

   ```bash
   npx wrangler deploy
   ```

The Worker defaults to the recipient `reachus@vibodhai.com` and sender `Vibodh Signal <forms@vibodhai.com>`. Change either through Worker variables `FEEDBACK_RECIPIENT` and `FEEDBACK_FROM` if needed.

## Cloudflare D1 setup

```bash
npx wrangler d1 execute vibodh-ui-feedback --remote --file=migrations/0001_feedback.sql
```

## Local development

Copy `.dev.vars.example` to `.dev.vars`, fill in the Resend API key, then run:

```bash
npx wrangler dev
```

Use the Cloudflare Worker runtime, not `node serve.cjs`, for feedback-form testing.
