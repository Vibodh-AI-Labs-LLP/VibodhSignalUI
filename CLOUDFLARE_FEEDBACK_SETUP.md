# Vibodh UI feedback forms on Cloudflare Workers

The Key Features feedback form and the **Submit Your Thoughts** form are handled by `worker.mjs`. They store submissions in Cloudflare D1 and deliver notifications to `reachus@vibodhai.com` using Cloudflare Email Service.

## One-time Cloudflare setup

1. Finish moving the `vibodhai.com` DNS zone to Cloudflare.
2. In Cloudflare, open **Compute → Email Service → Email Sending**, onboard `vibodhai.com`, and let Cloudflare add its required `cf-bounce`, SPF, DKIM, and DMARC DNS records.
3. Create the database:

   ```bash
   npx wrangler d1 create vibodh-ui-feedback
   ```

4. Copy the resulting `[[d1_databases]]` block into `wrangler.toml`. Its binding must be `FEEDBACK_DB`.
5. Apply the schema:

   ```bash
   npx wrangler d1 execute vibodh-ui-feedback --remote --file=migrations/0001_feedback.sql
   ```

6. Deploy:

   ```bash
   npx wrangler deploy
   ```

The worker defaults to `reachus@vibodhai.com` and sends from `forms@vibodhai.com`. Both can be changed as Cloudflare Worker environment variables: `FEEDBACK_RECIPIENT` and `FEEDBACK_FROM`.

## Local development

Use the Cloudflare Worker runtime, not `node serve.cjs`, to test form submissions:

```bash
npx wrangler dev
```

Cloudflare Email Service is a remote binding, so local email testing uses the configured Cloudflare account. D1 can run locally after the database binding is added to `wrangler.toml`.
