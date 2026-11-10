'use strict';
/**
 * Regras de negócio e rotas da API, independentes de servidor.
 * Usado pelo servidor Express (server.js) e pela versão de demonstração
 * que roda inteira no navegador (scripts/build-standalone.js).
 *
 * createApi({ store, hashPassword, checkPassword }) → { handle, db }
 *   store: { load(), save(), id(), token() }
 *   hashPassword(pw, salt?) → { salt, hash }   (pode ser assíncrona)
 *   checkPassword(pw, user) → boolean          (pode ser assíncrona)
 *
 * handle(req, ctx) → Promise<{ status, body }>
 *   req: { method, path, query, body }
 *   ctx: { userId, ip, login(userId), logout() }
 */
const { SERVICES, MATERIALS } = require('./content');
const { DIMENSIONS, allItems, publicQuestionnaire } = require('./questionnaire');
const { buildReport } = require('./report');

function createApi({ store, hashPassword, checkPassword }) {
  const db = store.load();
  const save = () => store.save();
  const routes = [];
  const route = (method, pattern, opts, fn) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, auth: opts.auth, fn });
  };
  const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
  const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj && obj[k] !== undefined).map(k => [k, obj[k]]));
  const find = (coll, id) => db[coll].find(i => i.id === id) || fail(404, 'Não encontrado');
  const allMaterials = () => [...MATERIALS, ...db.materials];
  const dateOnly = () => new Date().toISOString().slice(0, 10);
  const publicUser = u => u && ({ id: u.id, name: u.name, email: u.email, crp: u.crp, phone: u.phone, signature: u.signature });
  const svcName = id => SERVICES.find(s => s.id === id)?.name;

  /* ----------------------------- Autenticação ----------------------------- */
  route('GET', '/api/session', {}, ({ user }) => ({ needsSetup: db.users.length === 0, user: publicUser(user) }));

  route('POST', '/api/setup', {}, async ({ body }, ctx) => {
    if (db.users.length) fail(400, 'Configuração inicial já realizada');
    const { name, email, password, crp } = body || {};
    if (!name || !email || !password || String(password).length < 8) fail(400, 'Informe nome, e-mail e senha (mínimo 8 caracteres)');
    const { salt, hash } = await hashPassword(password);
    const user = { id: store.id(), name, email: String(email).toLowerCase().trim(), crp: crp || '', salt, hash };
    db.users.push(user); save();
    await ctx.login(user.id);
    return { user: publicUser(user) };
  });

  const loginAttempts = new Map();
  route('POST', '/api/login', {}, async ({ body }, ctx) => {
    const a = loginAttempts.get(ctx.ip) || { n: 0, t: Date.now() };
    if (Date.now() - a.t > 15 * 60e3) { a.n = 0; a.t = Date.now(); }
    if (a.n >= 10) fail(429, 'Muitas tentativas. Aguarde 15 minutos.');
    const user = db.users.find(u => u.email === String(body?.email || '').toLowerCase().trim());
    if (!user || !(await checkPassword(body?.password || '', user))) {
      a.n++; loginAttempts.set(ctx.ip, a);
      fail(401, 'E-mail ou senha incorretos');
    }
    loginAttempts.delete(ctx.ip);
    await ctx.login(user.id);
    return { user: publicUser(user) };
  });

  route('POST', '/api/logout', {}, async (req, ctx) => { await ctx.logout(); return { ok: true }; });

  route('PUT', '/api/me', { auth: true }, async ({ body, user }) => {
    const { name, email, crp, phone, signature, password } = body || {};
    Object.assign(user, {
      name: name ?? user.name, email: email ? String(email).toLowerCase().trim() : user.email,
      crp: crp ?? user.crp, phone: phone ?? user.phone, signature: signature ?? user.signature
    });
    if (password) {
      if (String(password).length < 8) fail(400, 'A senha deve ter pelo menos 8 caracteres');
      Object.assign(user, await hashPassword(password));
    }
    save();
    return { user: publicUser(user) };
  });

  /* ------------------------------ Catálogo ------------------------------- */
  route('GET', '/api/catalog', { auth: true }, () => ({
    services: SERVICES,
    dimensions: DIMENSIONS.map(d => ({ id: d.id, name: d.name, severity: d.severity, hazard: d.hazard, harms: d.harms, actions: d.actions, itemCount: d.items.length })),
    questionnaire: publicQuestionnaire()
  }));

  /* ------------------------------ Empresas ------------------------------- */
  const COMPANY_FIELDS = ['name', 'cnpj', 'segment', 'employees', 'contactName', 'contactRole', 'email', 'phone', 'address', 'notes', 'sectors', 'publishedMaterials', 'supportChannels', 'status', 'contractStart'];
  function normalizeCompany(c) {
    c.sectors = (Array.isArray(c.sectors) ? c.sectors : []).filter(s => s && s.name).map(s => ({ name: String(s.name).trim(), headcount: Number(s.headcount) || 0 }));
    c.publishedMaterials = Array.isArray(c.publishedMaterials) ? c.publishedMaterials : [];
    return c;
  }
  function companySummary(c) {
    return {
      ...c,
      stats: {
        deliveries: db.deliveries.filter(d => d.companyId === c.id).length,
        deliveriesDone: db.deliveries.filter(d => d.companyId === c.id && d.status === 'realizado').length,
        campaigns: db.campaigns.filter(x => x.companyId === c.id).length,
        responses: db.responses.filter(r => db.campaigns.some(x => x.id === r.campaignId && x.companyId === c.id)).length
      }
    };
  }
  route('GET', '/api/companies', { auth: true }, () => db.companies.map(companySummary));
  route('GET', '/api/companies/:id', { auth: true }, ({ params }) => companySummary(find('companies', params.id)));
  route('POST', '/api/companies', { auth: true }, ({ body }) => {
    if (!body?.name) fail(400, 'Informe o nome da empresa');
    const c = normalizeCompany({ id: store.id(), portalToken: store.token(), status: 'ativa', createdAt: new Date().toISOString(), publishedMaterials: ['mat-nr1', 'mat-estresse', 'mat-respiracao'], ...pick(body, COMPANY_FIELDS) });
    db.companies.push(c); save();
    return c;
  });
  route('PUT', '/api/companies/:id', { auth: true }, ({ params, body }) => {
    const c = find('companies', params.id);
    Object.assign(c, pick(body, COMPANY_FIELDS)); normalizeCompany(c); save();
    return c;
  });
  route('POST', '/api/companies/:id/regenerate-link', { auth: true }, ({ params }) => {
    const c = find('companies', params.id);
    c.portalToken = store.token(); save();
    return c;
  });
  route('DELETE', '/api/companies/:id', { auth: true }, ({ params }) => {
    const c = find('companies', params.id);
    const campIds = db.campaigns.filter(x => x.companyId === c.id).map(x => x.id);
    const delIds = db.deliveries.filter(x => x.companyId === c.id).map(x => x.id);
    db.responses = db.responses.filter(r => !campIds.includes(r.campaignId));
    db.feedback = db.feedback.filter(f => !delIds.includes(f.deliveryId));
    db.campaigns = db.campaigns.filter(x => x.companyId !== c.id);
    db.deliveries = db.deliveries.filter(x => x.companyId !== c.id);
    db.companies = db.companies.filter(x => x.id !== c.id);
    save();
    return { ok: true };
  });

  /* --------------------------- Serviços/Agenda --------------------------- */
  const DELIVERY_FIELDS = ['companyId', 'serviceId', 'title', 'date', 'time', 'duration', 'location', 'modality', 'status', 'participants', 'audience', 'notes', 'materialIds', 'feedbackOpen', 'price'];
  function deliverySummary(d) {
    const fb = db.feedback.filter(f => f.deliveryId === d.id);
    const avg = fb.length ? Math.round((fb.reduce((s, f) => s + f.rating, 0) / fb.length) * 10) / 10 : null;
    return { ...d, feedbackCount: fb.length, feedbackAvg: avg };
  }
  route('GET', '/api/deliveries', { auth: true }, ({ query }) => {
    let list = db.deliveries;
    if (query.companyId) list = list.filter(d => d.companyId === query.companyId);
    return list.map(deliverySummary).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  });
  route('POST', '/api/deliveries', { auth: true }, ({ body }) => {
    const b = body || {};
    if (!db.companies.some(c => c.id === b.companyId)) fail(400, 'Selecione a empresa');
    const d = { id: store.id(), feedbackToken: store.token(), status: 'planejado', feedbackOpen: true, materialIds: [], createdAt: new Date().toISOString(), ...pick(b, DELIVERY_FIELDS) };
    db.deliveries.push(d); save();
    return d;
  });
  route('PUT', '/api/deliveries/:id', { auth: true }, ({ params, body }) => {
    const d = find('deliveries', params.id);
    Object.assign(d, pick(body, DELIVERY_FIELDS)); save();
    return deliverySummary(d);
  });
  route('DELETE', '/api/deliveries/:id', { auth: true }, ({ params }) => {
    db.deliveries = db.deliveries.filter(x => x.id !== params.id);
    db.feedback = db.feedback.filter(f => f.deliveryId !== params.id);
    save();
    return { ok: true };
  });
  route('GET', '/api/deliveries/:id/feedback', { auth: true }, ({ params }) =>
    db.feedback.filter(f => f.deliveryId === params.id).map(f => ({ rating: f.rating, useful: f.useful, comment: f.comment, date: f.date })));

  /* ------------------------------ Materiais ------------------------------ */
  const MATERIAL_FIELDS = ['title', 'category', 'audience', 'summary', 'body', 'videoUrl'];
  route('GET', '/api/materials', { auth: true }, () => allMaterials());
  route('POST', '/api/materials', { auth: true }, ({ body }) => {
    if (!body?.title) fail(400, 'Informe o título');
    const m = { id: store.id(), builtin: false, createdAt: new Date().toISOString(), ...pick(body, MATERIAL_FIELDS) };
    db.materials.push(m); save();
    return m;
  });
  route('PUT', '/api/materials/:id', { auth: true }, ({ params, body }) => {
    const m = db.materials.find(x => x.id === params.id);
    if (!m) fail(400, 'Materiais padrão não podem ser editados. Use "Duplicar" para criar uma versão própria.');
    Object.assign(m, pick(body, MATERIAL_FIELDS)); save();
    return m;
  });
  route('DELETE', '/api/materials/:id', { auth: true }, ({ params }) => {
    db.materials = db.materials.filter(x => x.id !== params.id);
    db.companies.forEach(c => { c.publishedMaterials = (c.publishedMaterials || []).filter(id => id !== params.id); });
    save();
    return { ok: true };
  });

  /* ------------------------------ Avaliações ----------------------------- */
  const CAMPAIGN_FIELDS = ['title', 'startDate', 'endDate', 'status', 'sectors', 'minGroup', 'severity', 'conclusions', 'actionPlan', 'methodNotes', 'otherSources'];
  function campaignSummary(c) {
    const company = db.companies.find(x => x.id === c.companyId);
    return { ...c, responses: db.responses.filter(r => r.campaignId === c.id).length, companyName: company?.name };
  }
  route('GET', '/api/campaigns', { auth: true }, ({ query }) => {
    let list = db.campaigns;
    if (query.companyId) list = list.filter(c => c.companyId === query.companyId);
    return list.map(campaignSummary);
  });
  route('GET', '/api/campaigns/:id', { auth: true }, ({ params }) => campaignSummary(find('campaigns', params.id)));
  route('POST', '/api/campaigns', { auth: true }, ({ body }) => {
    const b = body || {};
    const company = db.companies.find(c => c.id === b.companyId);
    if (!company) fail(400, 'Selecione a empresa');
    const c = {
      id: store.id(), companyId: company.id, token: store.token(), status: 'aberta', minGroup: 5,
      sectors: company.sectors.map(s => s.name), severity: {}, actionPlan: [], conclusions: '',
      createdAt: new Date().toISOString(), title: `Avaliação de riscos psicossociais ${new Date().getFullYear()}`,
      ...pick(b, CAMPAIGN_FIELDS)
    };
    db.campaigns.push(c); save();
    return campaignSummary(c);
  });
  route('PUT', '/api/campaigns/:id', { auth: true }, ({ params, body }) => {
    const c = find('campaigns', params.id);
    Object.assign(c, pick(body, CAMPAIGN_FIELDS)); save();
    return campaignSummary(c);
  });
  route('DELETE', '/api/campaigns/:id', { auth: true }, ({ params }) => {
    db.campaigns = db.campaigns.filter(x => x.id !== params.id);
    db.responses = db.responses.filter(r => r.campaignId !== params.id);
    save();
    return { ok: true };
  });
  route('GET', '/api/campaigns/:id/report', { auth: true }, ({ params, user }) => {
    const c = find('campaigns', params.id);
    const company = db.companies.find(x => x.id === c.companyId);
    const report = buildReport(c, company, db.responses.filter(r => r.campaignId === c.id));
    const deliveries = db.deliveries.filter(d => d.companyId === c.companyId).map(deliverySummary);
    return { ...report, campaignData: campaignSummary(c), companyData: company, deliveries, consultant: publicUser(user) };
  });

  /* ------------------------------ Portfólio ------------------------------ */
  const PORTFOLIO_DEFAULTS = {
    headline: 'Saúde mental estratégica para organizações mais inteligentes',
    subheadline: 'Mentes saudáveis. Organizações fortes. Resultados sustentáveis.',
    about: 'A MindCorp é uma consultoria de saúde mental organizacional. Apoiamos empresas a cumprir a NR-1 no gerenciamento dos fatores de risco psicossociais e a construir ambientes de trabalho mais saudáveis, com métodos baseados em evidências, escuta qualificada e ações que geram resultado mensurável.',
    bio: '',
    whatsapp: '', email: '', phone: '', instagram: '', website: '', city: '',
    services: SERVICES.map(s => s.id),
    showTalks: true,
    extraTopics: '',
    photo: ''
  };
  const PORTFOLIO_FIELDS = Object.keys(PORTFOLIO_DEFAULTS);
  const portfolio = () => ({ ...PORTFOLIO_DEFAULTS, ...(db.settings.portfolio || {}) });

  route('GET', '/api/portfolio', { auth: true }, () => portfolio());
  route('PUT', '/api/portfolio', { auth: true }, ({ body }) => {
    const next = { ...portfolio(), ...pick(body, PORTFOLIO_FIELDS) };
    if (next.photo && (!/^data:image\/(png|jpe?g|webp);base64,/.test(next.photo) || next.photo.length > 700000)) fail(400, 'Foto inválida ou muito grande. Use uma imagem JPG ou PNG.');
    next.services = (Array.isArray(next.services) ? next.services : []).filter(id => SERVICES.some(s => s.id === id));
    db.settings.portfolio = next; save();
    return next;
  });

  route('GET', '/api/public/portfolio', {}, () => {
    const p = portfolio();
    const u = db.users[0];
    return {
      ...p,
      consultant: u ? { name: u.name, crp: u.crp } : null,
      services: SERVICES.filter(s => p.services.includes(s.id)),
      talks: p.showTalks ? allMaterials().filter(m => m.category === 'Palestra').map(m => pick(m, ['title', 'audience', 'summary'])) : [],
      extraTopics: String(p.extraTopics || '').split('\n').map(t => t.trim()).filter(Boolean)
    };
  });

  /* ------------------------------ Dashboard ------------------------------ */
  route('GET', '/api/dashboard', { auth: true }, () => {
    const today = dateOnly();
    return {
      companies: db.companies.length,
      activeCampaigns: db.campaigns.filter(c => c.status === 'aberta').map(campaignSummary),
      upcoming: db.deliveries.filter(d => d.status === 'planejado' && (d.date || '') >= today).sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 8)
        .map(d => ({ ...d, companyName: db.companies.find(c => c.id === d.companyId)?.name })),
      deliveriesDone: db.deliveries.filter(d => d.status === 'realizado').length,
      responses: db.responses.length,
      feedback: db.feedback.length,
      feedbackAvg: db.feedback.length ? Math.round(db.feedback.reduce((s, f) => s + f.rating, 0) / db.feedback.length * 10) / 10 : null
    };
  });

  /* ======================= Rotas públicas (colaborador) =================== */
  const recent = new Map(); // limitação simples de envios por IP (não armazenado)
  function throttle(ip, max = 30) {
    const now = Date.now();
    const arr = (recent.get(ip) || []).filter(t => now - t < 3600e3);
    if (arr.length >= max) fail(429, 'Muitos envios. Tente mais tarde.');
    arr.push(now); recent.set(ip, arr);
  }
  const activeCompany = token => db.companies.find(x => x.portalToken === token && x.status !== 'inativa');

  route('GET', '/api/public/portal/:token', {}, ({ params }) => {
    const c = activeCompany(params.token) || fail(404, 'Portal não encontrado');
    const mats = allMaterials();
    return {
      company: { name: c.name, supportChannels: c.supportChannels || '' },
      materials: (c.publishedMaterials || []).map(id => mats.find(m => m.id === id)).filter(Boolean).map(m => pick(m, ['id', 'title', 'category', 'audience', 'summary'])),
      campaigns: db.campaigns.filter(x => x.companyId === c.id && x.status === 'aberta').map(x => ({ token: x.token, title: x.title, endDate: x.endDate })),
      events: db.deliveries.filter(d => d.companyId === c.id && d.status !== 'cancelado' && (d.status === 'planejado' ? (d.date || '') >= dateOnly() : d.feedbackOpen))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .map(d => ({ title: d.title || svcName(d.serviceId), date: d.date, time: d.time, location: d.location, modality: d.modality, status: d.status, feedbackToken: d.status === 'realizado' && d.feedbackOpen ? d.feedbackToken : null }))
    };
  });

  route('GET', '/api/public/portal/:token/materials/:id', {}, ({ params }) => {
    const c = activeCompany(params.token);
    if (!c || !(c.publishedMaterials || []).includes(params.id)) fail(404, 'Material não encontrado');
    const m = allMaterials().find(x => x.id === params.id) || fail(404, 'Material não encontrado');
    return { ...pick(m, ['id', 'title', 'category', 'audience', 'summary', 'body', 'videoUrl']), companyName: c.name };
  });

  route('GET', '/api/public/survey/:token', {}, ({ params }) => {
    const c = db.campaigns.find(x => x.token === params.token) || fail(404, 'Pesquisa não encontrada');
    const company = db.companies.find(x => x.id === c.companyId);
    return { title: c.title, open: c.status === 'aberta', companyName: company?.name, sectors: c.sectors || [], supportChannels: company?.supportChannels || '', questionnaire: publicQuestionnaire() };
  });

  route('POST', '/api/public/survey/:token', {}, ({ params, body }, ctx) => {
    const c = db.campaigns.find(x => x.token === params.token) || fail(404, 'Pesquisa não encontrada');
    if (c.status !== 'aberta') fail(400, 'Esta pesquisa está encerrada');
    throttle(ctx.ip);
    const b = body || {};
    if (!b.consent) fail(400, 'É necessário concordar com o termo para participar');
    const answers = {};
    for (const item of allItems()) {
      const v = parseInt(b.answers?.[item.id], 10);
      if (v >= 1 && v <= 5) answers[item.id] = v;
    }
    if (Object.keys(answers).length < allItems().length * 0.8) fail(400, 'Responda a todas as perguntas, por favor');
    const sector = (c.sectors || []).includes(b.sector) ? b.sector : 'Não informado';
    // Nenhum dado identificável é armazenado (sem IP, sem horário exato).
    db.responses.push({ id: store.id(), campaignId: c.id, sector, answers, comment: String(b.comment || '').slice(0, 1500), date: dateOnly() });
    save();
    return { ok: true };
  });

  route('GET', '/api/public/feedback/:token', {}, ({ params }) => {
    const d = db.deliveries.find(x => x.feedbackToken === params.token) || fail(404, 'Avaliação não encontrada');
    const company = db.companies.find(x => x.id === d.companyId);
    return { title: d.title || svcName(d.serviceId), date: d.date, companyName: company?.name, open: !!d.feedbackOpen };
  });

  route('POST', '/api/public/feedback/:token', {}, ({ params, body }, ctx) => {
    const d = db.deliveries.find(x => x.feedbackToken === params.token) || fail(404, 'Avaliação não encontrada');
    if (!d.feedbackOpen) fail(400, 'Avaliação encerrada');
    throttle(ctx.ip);
    const rating = parseInt(body?.rating, 10);
    if (!(rating >= 1 && rating <= 5)) fail(400, 'Escolha uma nota de 1 a 5');
    const useful = parseInt(body?.useful, 10);
    db.feedback.push({ id: store.id(), deliveryId: d.id, rating, useful: useful >= 1 && useful <= 5 ? useful : null, comment: String(body?.comment || '').slice(0, 1000), date: dateOnly() });
    save();
    return { ok: true };
  });

  /* ------------------------------- Despacho ------------------------------ */
  async function handle(req, ctx = {}) {
    const method = (req.method || 'GET').toUpperCase();
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(req.path);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const user = ctx.userId ? db.users.find(u => u.id === ctx.userId) : null;
      if (r.auth && !user) return { status: 401, body: { error: 'Não autenticado' } };
      try {
        const body = await r.fn({ params, query: req.query || {}, body: req.body, user }, ctx);
        return { status: 200, body };
      } catch (e) {
        if (!e.status) console.error(e);
        return { status: e.status || 500, body: { error: e.status ? e.message : 'Erro interno' } };
      }
    }
    return { status: 404, body: { error: 'Não encontrado' } };
  }

  return { handle, db };
}

module.exports = { createApi };
