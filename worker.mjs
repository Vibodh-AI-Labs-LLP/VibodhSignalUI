const CAPABILITIES = new Set(['ai_content_generation', 'brand_dna', 'campaign_planning', 'social_scheduling', 'trend_discovery', 'knowledge_vault_rag', 'marketing_insights', 'other']);
const CAPABILITY_LABELS = {
  ai_content_generation: 'AI-powered content generation', brand_dna: 'Brand DNA and consistency',
  campaign_planning: 'Intelligent campaign planning', social_scheduling: 'Social media scheduling',
  trend_discovery: 'Trend discovery and trend-jacking', knowledge_vault_rag: 'Multimodal Knowledge Vault and RAG',
  marketing_insights: 'AI-powered marketing insights', other: 'Other'
};
const DEFAULT_RECIPIENT = 'reachus@vibodhai.com';
const DEFAULT_SENDER = 'forms@vibodhai.com';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' } });
const clean = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

async function readJson(request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 4096) throw new Error('Feedback payload is invalid.');
  const text = await request.text();
  if (!text || new TextEncoder().encode(text).byteLength > 4096) throw new Error('Feedback payload is invalid.');
  const payload = JSON.parse(text);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Feedback payload is invalid.');
  return payload;
}

function requireBindings(env) {
  if (!env.FEEDBACK_DB) return 'Feedback storage is not configured.';
  if (!env.EMAIL) return 'Email delivery is not configured.';
  return null;
}

async function markNotification(env, table, id, status, error = null) {
  await env.FEEDBACK_DB.prepare(`UPDATE ${table} SET email_notification_status = ?, email_notification_error = ? WHERE id = ?`).bind(status, error, id).run();
}

async function sendEmail(env, message) {
  return env.EMAIL.send({
    to: env.FEEDBACK_RECIPIENT || DEFAULT_RECIPIENT,
    from: env.FEEDBACK_FROM || DEFAULT_SENDER,
    ...message
  });
}

async function handlePmfFeedback(request, env) {
  const configurationError = requireBindings(env);
  if (configurationError) return json({ error: configurationError }, 503);
  let payload;
  try { payload = await readJson(request); } catch (error) { return json({ error: error.message || 'Feedback payload is invalid.' }, 400); }
  const selected = Array.isArray(payload.selected_capabilities) ? [...new Set(payload.selected_capabilities.map((item) => clean(item, 64)).filter(Boolean))] : [];
  if (!selected.length) return json({ error: 'Choose at least one capability.' }, 400);
  if (selected.some((capability) => !CAPABILITIES.has(capability))) return json({ error: 'Choose capabilities from the listed options.' }, 400);
  const otherDetail = clean(payload.other_detail, 500);
  if (selected.includes('other') && !otherDetail) return json({ error: 'Please describe the other capability.' }, 400);

  const feedback = { id: crypto.randomUUID(), selected, otherDetail, name: clean(payload.name, 120), email: clean(payload.email, 254), companyName: clean(payload.company_name, 160), mobile: clean(payload.mobile, 40), submittedAt: new Date().toISOString() };
  await env.FEEDBACK_DB.prepare(`INSERT INTO pmf_feedback (id, selected_capabilities, other_detail, name, email, company_name, mobile, submitted_at, email_notification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`).bind(feedback.id, JSON.stringify(selected), otherDetail || null, feedback.name || null, feedback.email || null, feedback.companyName || null, feedback.mobile || null, feedback.submittedAt).run();
  const labels = selected.map((capability) => CAPABILITY_LABELS[capability]).join(', ');
  const text = ['New Vibodh Signal PMF feedback', '', `Capabilities: ${labels}`, otherDetail && `Other detail: ${otherDetail}`, feedback.name && `Name: ${feedback.name}`, feedback.email && `Email: ${feedback.email}`, feedback.companyName && `Company: ${feedback.companyName}`, feedback.mobile && `Mobile: ${feedback.mobile}`, `Submitted: ${feedback.submittedAt}`].filter(Boolean).join('\n');
  try {
    await sendEmail(env, { subject: 'New Vibodh Signal PMF feedback', text, html: `<h2>New Vibodh Signal PMF feedback</h2><p><strong>Capabilities:</strong> ${escapeHtml(labels)}</p>${otherDetail ? `<p><strong>Other detail:</strong> ${escapeHtml(otherDetail)}</p>` : ''}<p><strong>Name:</strong> ${escapeHtml(feedback.name || 'Not provided')}<br><strong>Email:</strong> ${escapeHtml(feedback.email || 'Not provided')}<br><strong>Company:</strong> ${escapeHtml(feedback.companyName || 'Not provided')}<br><strong>Mobile:</strong> ${escapeHtml(feedback.mobile || 'Not provided')}</p><p><strong>Submitted:</strong> ${escapeHtml(feedback.submittedAt)}</p>` });
    await markNotification(env, 'pmf_feedback', feedback.id, 'sent');
    return json({ message: 'Thank you. Your feedback was saved and emailed to the Vibodh Signal team.', id: feedback.id, submitted_at: feedback.submittedAt, email_notification_status: 'sent' }, 201);
  } catch (error) {
    await markNotification(env, 'pmf_feedback', feedback.id, 'failed', String(error?.message || 'Email delivery failed.').slice(0, 500));
    return json({ message: 'Thank you. Your feedback was saved; email delivery will retry when the mail service is available.', id: feedback.id, submitted_at: feedback.submittedAt, email_notification_status: 'failed' }, 202);
  }
}

async function handleVisitorThought(request, env) {
  const configurationError = requireBindings(env);
  if (configurationError) return json({ error: configurationError }, 503);
  let payload;
  try { payload = await readJson(request); } catch (error) { return json({ error: error.message || 'Feedback payload is invalid.' }, 400); }
  const email = clean(payload.email, 254);
  const thoughts = clean(payload.thoughts, 2000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
  if (!thoughts) return json({ error: 'Share your thoughts before submitting.' }, 400);
  const thought = { id: crypto.randomUUID(), email, thoughts, submittedAt: new Date().toISOString() };
  await env.FEEDBACK_DB.prepare(`INSERT INTO visitor_thoughts (id, email, thoughts, submitted_at, email_notification_status) VALUES (?, ?, ?, ?, 'pending')`).bind(thought.id, email, thoughts, thought.submittedAt).run();
  try {
    await sendEmail(env, { subject: 'New Vibodh Signal visitor thought', text: `New Vibodh Signal visitor thought\n\nEmail: ${email}\n\nThoughts:\n${thoughts}\n\nSubmitted: ${thought.submittedAt}`, html: `<h2>New Vibodh Signal visitor thought</h2><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Thoughts:</strong><br>${escapeHtml(thoughts).replace(/\n/g, '<br>')}</p><p><strong>Submitted:</strong> ${escapeHtml(thought.submittedAt)}</p>` });
    await markNotification(env, 'visitor_thoughts', thought.id, 'sent');
    return json({ message: 'Thank you. Your thought was saved and emailed to the Vibodh Signal team.', id: thought.id, submitted_at: thought.submittedAt, email_notification_status: 'sent' }, 201);
  } catch (error) {
    await markNotification(env, 'visitor_thoughts', thought.id, 'failed', String(error?.message || 'Email delivery failed.').slice(0, 500));
    return json({ message: 'Thank you. Your thought was saved; email delivery will retry when the mail service is available.', id: thought.id, submitted_at: thought.submittedAt, email_notification_status: 'failed' }, 202);
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'POST' && pathname === '/api/pmf-feedback') return handlePmfFeedback(request, env);
    if (request.method === 'POST' && pathname === '/api/visitor-thoughts') return handleVisitorThought(request, env);
    return env.ASSETS.fetch(request);
  }
};
