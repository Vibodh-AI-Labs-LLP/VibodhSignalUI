const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_DIR = __dirname;
const LOCAL_FEEDBACK_FILE = path.join(BASE_DIR, 'data', 'feedback.local.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);

  // Production feedback is handled by worker.mjs on Cloudflare Workers.
  // The preview server stores local development submissions so form review does
  // not require a second service or a Python process.
  if (req.method === 'POST' && ['/api/pmf-feedback', '/api/visitor-thoughts'].includes(reqPath)) {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= 4096) chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        if (!size || size > 4096) throw new Error('Feedback payload is invalid.');
        const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const isPmf = reqPath === '/api/pmf-feedback';
        const capabilities = Array.isArray(payload.selected_capabilities) ? payload.selected_capabilities.filter(Boolean) : [];
        if (isPmf && !capabilities.length) throw new Error('Choose at least one capability.');
        if (!isPmf && (!String(payload.email || '').includes('@') || !String(payload.thoughts || '').trim())) {
          throw new Error('Enter your email and thoughts before submitting.');
        }
        const record = {
          id: crypto.randomUUID(),
          type: isPmf ? 'pmf_feedback' : 'visitor_thought',
          submitted_at: new Date().toISOString(),
          ...payload
        };
        fs.mkdirSync(path.dirname(LOCAL_FEEDBACK_FILE), { recursive: true });
        let stored = [];
        if (fs.existsSync(LOCAL_FEEDBACK_FILE)) stored = JSON.parse(fs.readFileSync(LOCAL_FEEDBACK_FILE, 'utf8'));
        stored.push(record);
        fs.writeFileSync(LOCAL_FEEDBACK_FILE, JSON.stringify(stored, null, 2));
        res.writeHead(201, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({
          message: 'Thank you. Your submission was saved in the local preview.',
          id: record.id,
          submitted_at: record.submitted_at,
          email_notification_status: 'pending_cloudflare_deployment'
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Feedback payload is invalid.' }));
      }
    });
    return;
  }

  const lower = reqPath.toLowerCase();
  if (lower === '/landing.html' || lower === '/landing') {
    res.writeHead(302, { 'Location': '/' });
    res.end();
    return;
  }
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (lower === '/billing.html') reqPath = '/dashboard.html';


  // Control Plane Admin App Routes
  if (lower === '/control-plane' || lower === '/controlplane' || lower === '/admin' || lower === '/saas-control-plane') {
    reqPath = '/control-plane.html';
  }

  // Usage & Analytics App Routes
  if (lower === '/usage-analytics' || lower === '/analytics-usage' || lower === '/usage-db') {
    reqPath = '/usage-analytics.html';
  }

  // Customer Workspace Side Panel Routes
  const SIDE_PANEL_ROUTES = [
    '/dashboard', '/campaign', '/campaigns', '/contentstudio', '/content-studio',
    '/branddna', '/brand-dna', '/calendar', '/analytics', '/medialibrary',
    '/media-library', '/socialchannels', '/social-channels', '/agency',
    '/agency-hub', '/brandknowledge', '/brand-knowledge', '/activity',
    '/settings', '/billing', '/usage'
  ];

  if (SIDE_PANEL_ROUTES.includes(lower)) {
    reqPath = '/dashboard.html';
  }

  const filePath = path.join(BASE_DIR, reqPath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error: ' + err.code);
      }
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Vibodh Signal preview server running at: http://localhost:${PORT}/`);
});
