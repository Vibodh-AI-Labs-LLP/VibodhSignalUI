# Vibodh UI feedback forms on Cloudflare Workers

The Key Features feedback form and **Submit Your Thoughts** form are handled by `worker.mjs`. Each submission is stored in Cloudflare D1 and a notification is delivered to `reachus@vibodhai.com` through Microsoft Graph.

## Microsoft Entra requirements

The Entra application used by the Worker must have:

- Microsoft Graph **Application** permission `Mail.Send`.
- Admin consent granted for that permission.
- A valid Exchange Online mailbox at `reachus@vibodhai.com`.

## Production configuration

In **Cloudflare → Workers & Pages → vibodhsignalui → Settings**, add these under **Runtime variables and secrets** as encrypted secrets:

```text
MS_GRAPH_CLIENT_ID
MS_GRAPH_TENANT_ID
MS_GRAPH_CLIENT_SECRET
```

The Worker authenticates through the tenant token endpoint and sends notifications from and to `reachus@vibodhai.com`. No Resend or Cloudflare Email Service binding is required.

## Cloudflare D1 setup

```bash
npx wrangler d1 execute vibodh-ui-feedback --remote --file=migrations/0001_feedback.sql
```

## Local development

Copy `.dev.vars.example` to `.dev.vars`, provide non-production Entra credentials, then run:

```bash
npx wrangler dev
```

Never commit `.dev.vars` or a client-secret value.
