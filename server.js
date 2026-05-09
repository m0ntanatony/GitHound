const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'githound-dev-secret-' + Math.random(),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
  })
);

// ── Connect ──────────────────────────────────────────────────────────────────
app.post('/api/connect', async (req, res) => {
  const { url, token } = req.body;
  if (!url || !token) return res.status(400).json({ error: 'Missing url or token' });

  const baseUrl = url.replace(/\/$/, '');

  try {
    const userResp = await fetch(`${baseUrl}/api/v4/user`, {
      headers: { 'PRIVATE-TOKEN': token, 'User-Agent': 'GitHound/1.0' },
    });

    if (!userResp.ok) {
      const body = await userResp.text().catch(() => '');
      return res.status(401).json({ error: 'Invalid token', status: userResp.status, body });
    }

    const user = await userResp.json();

    let version = 'unknown';
    try {
      const vr = await fetch(`${baseUrl}/api/v4/version`, {
        headers: { 'PRIVATE-TOKEN': token },
      });
      if (vr.ok) {
        const vd = await vr.json();
        version = vd.version || 'unknown';
      }
    } catch (_) {}

    // Store in memory session — never written to disk
    req.session.gitlabUrl = baseUrl;
    req.session.gitlabToken = token;
    req.session.connectedAt = new Date().toISOString();

    res.json({ user, version, gitlabUrl: baseUrl });
  } catch (err) {
    res.status(500).json({ error: 'Connection failed', message: err.message });
  }
});

// ── Disconnect ────────────────────────────────────────────────────────────────
app.post('/api/disconnect', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── Session status ────────────────────────────────────────────────────────────
app.get('/api/session', (req, res) => {
  if (req.session.gitlabUrl && req.session.gitlabToken) {
    res.json({
      connected: true,
      gitlabUrl: req.session.gitlabUrl,
      connectedAt: req.session.connectedAt,
    });
  } else {
    res.json({ connected: false });
  }
});

// ── GitLab API proxy ──────────────────────────────────────────────────────────
// /api/gitlab/**  →  <gitlabUrl>/api/v4/**
app.all('/api/gitlab/*', async (req, res) => {
  if (!req.session.gitlabUrl || !req.session.gitlabToken) {
    return res.status(401).json({ error: 'Not connected. Please connect first.' });
  }

  const suffix = req.path.replace(/^\/api\/gitlab/, '');
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = `${req.session.gitlabUrl}/api/v4${suffix}${qs}`;

  try {
    const fetchOpts = {
      method: req.method,
      headers: {
        'PRIVATE-TOKEN': req.session.gitlabToken,
        'User-Agent': 'GitHound/1.0',
        'Content-Type': 'application/json',
      },
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, fetchOpts);

    // Forward pagination headers
    ['x-total', 'x-total-pages', 'x-page', 'x-per-page', 'x-next-page', 'x-prev-page'].forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    const ct = upstream.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } else {
      const text = await upstream.text();
      res.status(upstream.status).type(ct || 'text/plain').send(text);
    }
  } catch (err) {
    res.status(502).json({ error: 'Upstream error', message: err.message });
  }
});

// ── Serve frontend in production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`GitHound running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Frontend dev server: http://localhost:5173');
  }
});
