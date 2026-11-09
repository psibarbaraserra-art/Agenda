'use strict';
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const QRCode = require('qrcode');

const store = require('./lib/store');
const { createApi } = require('./lib/api');

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  next();
});

/* ----------------------------- Senhas e sessões ----------------------------- */
function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return { salt, hash };
}
function checkPassword(pw, user) {
  const { hash } = hashPassword(pw, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'));
}

const api = createApi({ store, hashPassword, checkPassword });
const db = api.db;

// Modo demonstração: carrega uma empresa de exemplo quando o banco está vazio
if (process.env.DEMO && db.companies.length === 0) require('./scripts/seed-demo')(store);

const SESSION_DAYS = 14;
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}
function sessionUserId(req) {
  const sid = parseCookies(req).mc_sid;
  const s = sid && db.sessions.find(x => x.id === sid && new Date(x.expires) > new Date());
  return s ? s.userId : null;
}

/* --------------------------------- QR Code --------------------------------- */
app.get('/api/qr', async (req, res) => {
  if (!sessionUserId(req)) return res.status(401).end();
  const text = String(req.query.text || '').slice(0, 500);
  if (!text) return res.status(400).end();
  const svg = await QRCode.toString(text, { type: 'svg', margin: 1, color: { dark: '#0D2B45', light: '#FFFFFF' } });
  res.type('image/svg+xml').send(svg);
});

/* ----------------------------------- API ----------------------------------- */
app.all('/api/*', async (req, res) => {
  const ctx = {
    userId: sessionUserId(req),
    ip: req.ip,
    login(userId) {
      const sid = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
      db.sessions = db.sessions.filter(s => new Date(s.expires) > new Date());
      db.sessions.push({ id: sid, userId, expires: expires.toISOString() });
      store.save();
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.set('Set-Cookie', `mc_sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}${secure}`);
    },
    logout() {
      const sid = parseCookies(req).mc_sid;
      db.sessions = db.sessions.filter(s => s.id !== sid);
      store.save();
      res.set('Set-Cookie', 'mc_sid=; Path=/; Max-Age=0');
    }
  };
  const out = await api.handle({ method: req.method, path: req.path, query: req.query, body: req.body }, ctx);
  res.status(out.status).json(out.body);
});

/* -------------------------------- Estáticos -------------------------------- */
const PUB = path.join(__dirname, 'public');
app.use(express.static(PUB, { index: false }));
['/p/:token', '/p/:token/*', '/pesquisa/:token', '/feedback/:token'].forEach(r => app.get(r, (req, res) => res.sendFile(path.join(PUB, 'portal.html'))));
app.get('*', (req, res) => res.sendFile(path.join(PUB, 'index.html')));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`MindCorp rodando em http://localhost:${PORT}`));
}

module.exports = app;
