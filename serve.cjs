const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_DIR = __dirname;

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

  // The PMF experience uses the existing local feedback service for validation,
  // persistence, and notification delivery while keeping this UI same-origin.
  if (req.method === 'POST' && ['/api/pmf-feedback', '/api/visitor-thoughts'].includes(reqPath)) {
    const upstream = http.request({
      hostname: '127.0.0.1',
      port: 4173,
      path: reqPath,
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Content-Length': req.headers['content-length'] || 0
      }
    }, (upstreamResponse) => {
      res.writeHead(upstreamResponse.statusCode || 502, {
        'Content-Type': upstreamResponse.headers['content-type'] || 'application/json',
        'Cache-Control': 'no-cache'
      });
      upstreamResponse.pipe(res);
    });

    upstream.on('error', () => {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'The feedback service is temporarily unavailable. Please try again shortly.' }));
    });

    req.pipe(upstream);
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
