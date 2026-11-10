'use strict';
/**
 * Gera dist/mindcorp-demo.html: o app inteiro em um único arquivo que roda no
 * navegador, sem servidor (dados guardados no próprio navegador). Serve para
 * demonstração e para abrir no chat do Claude como página.
 *
 * Uso: npm run build:demo
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const safe = js => js.replace(/<\/script/gi, '<\\/script');

const modules = ['lib/content.js', 'lib/questionnaire.js', 'lib/report.js', 'lib/api.js', 'scripts/seed-demo.js']
  .map(f => `__def(${JSON.stringify(path.basename(f, '.js'))}, function (module, exports, require) {\n${read(f)}\n});`)
  .join('\n');

const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'public/img/logo.png')).toString('base64');

const bootstrap = `
(function () {
  /* Armazenamento no navegador (com reserva em memória se o navegador bloquear) */
  const KEY = 'mindcorp-demo-v1';
  const EMPTY = () => ({ users: [], sessions: [], settings: {}, companies: [], deliveries: [], materials: [], campaigns: [], responses: [], feedback: [] });
  let db = null;
  const rnd = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
  const store = {
    load() {
      if (db) return db;
      try { const raw = localStorage.getItem(KEY); db = raw ? Object.assign(EMPTY(), JSON.parse(raw)) : EMPTY(); } catch (e) { db = EMPTY(); }
      return db;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* segue só em memória */ } },
    id: () => (crypto.randomUUID ? crypto.randomUUID() : Array.from(rnd(16), b => b.toString(16).padStart(2, '0')).join('')),
    token: () => btoa(String.fromCharCode(...rnd(9))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
  };
  async function sha(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  }
  const hashPassword = async (pw, salt = store.token()) => ({ salt, hash: await sha(salt + pw) });
  const checkPassword = async (pw, user) => (await sha(user.salt + pw)) === user.hash;

  /* Dados de exemplo e acesso automático da consultora */
  store.load();
  if (!db.companies.length) __req('seed-demo')(store);
  if (!db.users.length) { db.users.push({ id: store.id(), name: 'Consultora MindCorp', email: 'demo@mindcorp.app', crp: '', salt: '', hash: '' }); store.save(); }
  let userId = db.users[0].id;

  const api = __req('api').createApi({ store, hashPassword, checkPassword });
  const realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
    const out = await api.handle({
      method: init.method || 'GET',
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body: init.body ? JSON.parse(init.body) : undefined
    }, { userId, ip: 'local', login: id => { userId = id; }, logout: () => {} });
    return new Response(JSON.stringify(out.body), { status: out.status, headers: { 'Content-Type': 'application/json' } });
  };

  MC.resetDemo = () => {
    try { localStorage.removeItem(KEY); Object.keys(localStorage).filter(k => k.startsWith('mc_')).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignora */ }
    location.reload();
  };

  /* Visão do colaborador (portal) dentro da mesma página */
  MC.openPortal = p => {
    const open = document.querySelector('.modal-bg'); if (open) open.remove();
    const root = document.getElementById('root');
    root.innerHTML = '<div class="portal-back"><div class="p-wrap"><span>' + (p.indexOf('/portfolio') === 0 ? 'Você está vendo o portfólio como a empresa vê ao abrir o link.' : 'Você está vendo o que o colaborador vê no celular.') + '</span><button id="pb" type="button">← Voltar ao painel</button></div></div>'
      + '<header class="p-head"><div class="p-wrap"><img src="' + MC.logo + '" alt="MindCorp – Saúde Mental Organizacional" class="p-logo"><span id="co" class="p-co"></span></div></header>'
      + '<div class="p-band"><div class="p-wrap">Ciência. Estratégia. <span>Cuidado.</span></div></div>'
      + '<main class="p-wrap" id="proot"><p class="muted">Carregando…</p></main>'
      + '<footer class="p-foot"><div class="p-wrap">MindCorp · Saúde Mental Organizacional<br><small>Precisa de ajuda agora? CVV 188 (24h) · SAMU 192</small></div></footer>';
    window.scrollTo(0, 0);
    document.getElementById('pb').onclick = () => MC.route();
    MC.runPortal(p, document.getElementById('proot'));
  };
})();
`;

const html = `<title>Plataforma MindCorp</title>
<meta name="description" content="Demonstração da plataforma MindCorp de saúde mental organizacional e NR-1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap">
<style>
${read('public/styles.css')}
${read('public/portal.css')}
</style>
<div id="root"><p style="padding:24px">Carregando a demonstração…</p></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script>
window.MC_STANDALONE = true;
window.MC_LOGO = ${JSON.stringify(logo)};
(function () {
  const defs = {}, cache = {};
  const req = name => {
    const key = name.split('/').pop().replace(/\\.js$/, '');
    if (cache[key]) return cache[key].exports;
    if (!defs[key]) throw new Error('Módulo indisponível: ' + name);
    const module = { exports: {} };
    cache[key] = module;
    defs[key](module, module.exports, req);
    return module.exports;
  };
  window.__def = (n, f) => { defs[n] = f; };
  window.__req = req;
})();
${safe(modules)}
</script>
<script>
${safe(read('public/common.js'))}
</script>
<script>
${safe(bootstrap)}
</script>
<script>
${safe(read('public/portal.js'))}
</script>
<script>
${safe(read('public/app.js'))}
</script>
`;

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', 'mindcorp-demo.html');
fs.writeFileSync(out, html);
console.log(`Gerado ${path.relative(ROOT, out)} (${Math.round(html.length / 1024)} KB)`);
