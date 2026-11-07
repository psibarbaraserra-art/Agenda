/* MindCorp – Painel da consultoria (SPA sem dependências) */
(function () {
  const { esc, md, slides, api, toast, fmtDate, dateChip } = window.MC;
  const root = document.getElementById('root');
  const S = { user: null, catalog: null };
  const ORIGIN = location.origin;

  /* ------------------------------ Ícones ------------------------------ */
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>'
  };
  const icon = n => `<svg viewBox="0 0 24 24">${ICONS[n]}</svg>`;

  const LEVEL_COLORS = { baixo: '#2E9E6A', moderado: '#D9A520', alto: '#E07B24', critico: '#C8382E' };
  const STATUS = { planejado: ['Planejado', 'warn'], realizado: ['Realizado', 'ok'], cancelado: ['Cancelado', 'off'] };
  const CATEGORIES = ['Cartilha', 'Guia', 'Exercício prático', 'Palestra', 'Vídeo', 'Comunicado'];
  const heatColor = s => s === null || s === undefined ? '#ccc' : s < 37.5 ? '#2E9E6A' : s < 50 ? '#9BB83A' : s < 62.5 ? '#E0A420' : s < 75 ? '#E07B24' : '#C8382E';

  /* ------------------------------ Modal ------------------------------- */
  function modal(title, body, { wide } = {}) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="modal-head"><h2>${esc(title)}</h2><button class="x" aria-label="Fechar">×</button></div><div class="modal-body">${body}</div></div>`;
    const close = () => bg.remove();
    bg.querySelector('.x').onclick = close;
    bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
    document.body.appendChild(bg);
    return { el: bg.querySelector('.modal-body'), close };
  }
  const formData = form => Object.fromEntries(new FormData(form).entries());
  const confirmBox = msg => window.confirm(msg);
  const copy = async text => { try { await navigator.clipboard.writeText(text); toast('Link copiado!'); } catch { prompt('Copie o link:', text); } };
  const qrImg = text => `<div class="qr"><img alt="QR Code" src="/api/qr?text=${encodeURIComponent(text)}"></div>`;
  const linkBox = url => `<div class="linkbox"><code>${esc(url)}</code><button class="btn sm ghost" data-copy="${esc(url)}">Copiar</button><a class="btn sm ghost" href="${esc(url)}" target="_blank" rel="noopener">Abrir</a></div>`;
  document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy); });

  /* ------------------------------ Shell ------------------------------- */
  function shell(active, content) {
    const nav = [
      ['#/', 'home', 'Início'], ['#/empresas', 'building', 'Empresas'], ['#/agenda', 'calendar', 'Agenda de serviços'],
      ['#/materiais', 'book', 'Materiais e palestras'], ['#/avaliacoes', 'chart', 'Avaliações NR-1'], ['#/metodologia', 'shield', 'Metodologia'], ['#/perfil', 'user', 'Meu perfil']
    ];
    root.innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sb">
          <div class="brand"><img src="/img/logo.png" alt="MindCorp – Saúde Mental Organizacional"></div>
          <nav class="nav">${nav.map(([h, i, l]) => `<a href="${h}" class="${active === h ? 'active' : ''}">${icon(i)}${l}</a>`).join('')}</nav>
          <div class="foot"><div><b>${esc(S.user.name)}</b></div><div class="muted">${S.user.crp ? 'CRP ' + esc(S.user.crp) : esc(S.user.email)}</div><a href="#" id="logout" class="small">Sair</a></div>
        </aside>
        <div class="main">
          <div class="topbar"><button class="menu-btn" id="mb" aria-label="Menu"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" stroke-width="2">${ICONS.menu}</svg></button>
            <div class="tag">Ciência. Estratégia. <span>Cuidado.</span></div><div class="who">Saúde mental estratégica para organizações mais inteligentes</div></div>
          <div class="content" id="content">${content}</div>
        </div>
      </div>`;
    document.getElementById('logout').onclick = async e => { e.preventDefault(); await api('/api/logout', { method: 'POST' }); S.user = null; location.hash = '#/'; boot(); };
    document.getElementById('mb').onclick = () => document.getElementById('sb').classList.toggle('open');
    return document.getElementById('content');
  }

  /* ------------------------- Autenticação ----------------------------- */
  function authScreen(setup) {
    root.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-side">
          <h1>Mentes saudáveis.<br>Organizações fortes.<br>Resultados <span>sustentáveis.</span></h1>
          <p style="color:var(--mist);max-width:460px">Plataforma MindCorp para entrega de serviços de saúde mental organizacional, aplicação digital de materiais e avaliação de riscos psicossociais conforme a NR-1.</p>
          <div class="pillars">
            <div><b>Ciência que orienta</b><small>Decisões baseadas em evidências.</small></div>
            <div><b>Estratégia que transforma</b><small>Soluções personalizadas para cada organização.</small></div>
            <div><b>Cuidado que acolhe</b><small>Acolhimento, empatia e escuta qualificada.</small></div>
            <div><b>Resultados que geram impacto</b><small>Ambientes saudáveis, produtivos e sustentáveis.</small></div>
          </div>
        </div>
        <div class="auth-form">
          <form id="f">
            <img src="/img/logo.png" alt="MindCorp">
            <h2>${setup ? 'Primeiro acesso' : 'Entrar'}</h2>
            <p class="muted small">${setup ? 'Crie a conta da consultora responsável.' : 'Acesso restrito à equipe MindCorp.'}</p>
            ${setup ? `<div class="field"><label>Nome completo</label><input name="name" required></div>
            <div class="field"><label>CRP</label><input name="crp" placeholder="00/00000"></div>` : ''}
            <div class="field"><label>E-mail</label><input name="email" type="email" required autocomplete="username"></div>
            <div class="field"><label>Senha</label><input name="password" type="password" required minlength="${setup ? 8 : 1}" autocomplete="${setup ? 'new-password' : 'current-password'}"></div>
            <button class="btn" style="width:100%;justify-content:center">${setup ? 'Criar conta' : 'Entrar'}</button>
          </form>
        </div>
      </div>`;
    document.getElementById('f').onsubmit = async e => {
      e.preventDefault();
      try {
        const r = await api(setup ? '/api/setup' : '/api/login', { method: 'POST', body: formData(e.target) });
        S.user = r.user; route();
      } catch (err) { toast(err.message, true); }
    };
  }

  /* ----------------------------- Início ------------------------------- */
  async function pageHome() {
    const c = shell('#/', '<p class="muted">Carregando…</p>');
    const d = await api('/api/dashboard');
    c.innerHTML = `
      <div class="page-head"><div><h1>Olá, ${esc(S.user.name.split(' ')[0])}</h1><p class="muted">Visão geral dos seus atendimentos e avaliações.</p></div>
        <div class="btns"><a class="btn ghost" href="#/empresas?nova=1">+ Empresa</a><a class="btn ghost" href="#/agenda?novo=1">+ Serviço</a><a class="btn teal" href="#/avaliacoes?nova=1">+ Avaliação NR-1</a></div></div>
      <div class="grid g4">
        <div class="stat hl"><div class="v">${d.companies}</div><div class="l">Empresas atendidas</div></div>
        <div class="stat"><div class="v">${d.deliveriesDone}</div><div class="l">Serviços realizados</div></div>
        <div class="stat"><div class="v">${d.responses}</div><div class="l">Respostas de colaboradores</div></div>
        <div class="stat"><div class="v">${d.feedbackAvg ?? '—'}</div><div class="l">Satisfação média (${d.feedback} avaliações)</div></div>
      </div>
      <div class="grid g2" style="margin-top:18px">
        <div class="card"><div class="card-head"><h2>Próximos serviços</h2><a href="#/agenda" class="small">Ver agenda</a></div>
          ${d.upcoming.length ? d.upcoming.map(u => `<div class="list-item"><div style="display:flex;gap:12px;align-items:center">${dateChip(u.date)}<div><b>${esc(u.title || svcName(u.serviceId))}</b><div class="muted small">${esc(u.companyName || '')} · ${esc(u.time || '')} ${esc(u.modality || '')}</div></div></div></div>`).join('') : empty('calendar', 'Nenhum serviço agendado.')}
        </div>
        <div class="card"><div class="card-head"><h2>Avaliações em andamento</h2><a href="#/avaliacoes" class="small">Ver todas</a></div>
          ${d.activeCampaigns.length ? d.activeCampaigns.map(a => `<div class="list-item"><div><b>${esc(a.companyName)}</b><div class="muted small">${esc(a.title)}</div></div><div class="btns"><span class="badge">${a.responses} respostas</span><a class="btn sm ghost" href="#/avaliacoes/${a.id}">Abrir</a></div></div>`).join('') : empty('chart', 'Nenhuma avaliação aberta.')}
        </div>
      </div>`;
  }
  const empty = (i, t) => `<div class="empty">${icon(i)}<div>${esc(t)}</div></div>`;
  const svcName = id => S.catalog?.services.find(s => s.id === id)?.name || 'Serviço';

  /* ----------------------------- Empresas ----------------------------- */
  async function pageCompanies(q) {
    const c = shell('#/empresas', '');
    const list = await api('/api/companies');
    c.innerHTML = `
      <div class="page-head"><div><h1>Empresas</h1><p class="muted">Clientes atendidos pela MindCorp.</p></div><button class="btn" id="new">+ Nova empresa</button></div>
      <div class="card">${list.length ? `<div class="table-wrap"><table><thead><tr><th>Empresa</th><th>Segmento</th><th>Colaboradores</th><th>Serviços</th><th>Avaliações</th><th>Status</th></tr></thead><tbody>
        ${list.map(x => `<tr class="click" data-id="${x.id}"><td><b>${esc(x.name)}</b><div class="muted small">${esc(x.cnpj || '')}</div></td><td>${esc(x.segment || '—')}</td><td>${esc(x.employees || '—')}</td><td>${x.stats.deliveriesDone}/${x.stats.deliveries}</td><td>${x.stats.campaigns} <span class="muted small">(${x.stats.responses} resp.)</span></td><td><span class="badge ${x.status === 'ativa' ? 'ok' : 'off'}">${esc(x.status)}</span></td></tr>`).join('')}
      </tbody></table></div>` : empty('building', 'Cadastre a primeira empresa para começar.')}</div>`;
    c.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => location.hash = `#/empresas/${tr.dataset.id}`);
    c.querySelector('#new').onclick = () => companyForm();
    if (q.get('nova')) companyForm();
  }

  function companyForm(co = {}) {
    const sectors = co.sectors?.length ? co.sectors : [{ name: '', headcount: '' }];
    const m = modal(co.id ? 'Editar empresa' : 'Nova empresa', `
      <form id="cf">
        <div class="row"><div class="field"><label>Razão social / nome *</label><input name="name" required value="${esc(co.name)}"></div><div class="field"><label>CNPJ</label><input name="cnpj" value="${esc(co.cnpj)}"></div></div>
        <div class="row"><div class="field"><label>Segmento</label><input name="segment" value="${esc(co.segment)}" placeholder="Ex.: Indústria, Varejo, Saúde"></div><div class="field"><label>Nº de colaboradores</label><input name="employees" type="number" min="0" value="${esc(co.employees)}"></div><div class="field"><label>Início do contrato</label><input name="contractStart" type="date" value="${esc(co.contractStart)}"></div></div>
        <div class="row"><div class="field"><label>Contato (nome)</label><input name="contactName" value="${esc(co.contactName)}"></div><div class="field"><label>Cargo</label><input name="contactRole" value="${esc(co.contactRole)}" placeholder="RH, SESMT…"></div></div>
        <div class="row"><div class="field"><label>E-mail</label><input name="email" type="email" value="${esc(co.email)}"></div><div class="field"><label>Telefone</label><input name="phone" value="${esc(co.phone)}"></div></div>
        <div class="field"><label>Endereço</label><input name="address" value="${esc(co.address)}"></div>
        <div class="field"><label>Setores / áreas (usados na pesquisa)</label><div id="secs"></div><button type="button" class="btn sm ghost" id="addsec">+ Setor</button><div class="hint">Informe o nº de pessoas por setor para calcular a taxa de adesão.</div></div>
        <div class="field"><label>Canais de apoio da empresa (exibidos aos colaboradores)</label><textarea name="supportChannels" placeholder="Ex.: Canal de denúncia: etica@empresa.com · Plantão psicológico MindCorp: quintas 14h–17h">${esc(co.supportChannels)}</textarea></div>
        <div class="field"><label>Observações internas</label><textarea name="notes">${esc(co.notes)}</textarea></div>
        ${co.id ? `<div class="field"><label>Status</label><select name="status"><option value="ativa" ${co.status === 'ativa' ? 'selected' : ''}>Ativa</option><option value="inativa" ${co.status === 'inativa' ? 'selected' : ''}>Inativa (portal desativado)</option></select></div>` : ''}
        <div class="btns"><button class="btn">Salvar</button></div>
      </form>`);
    const secs = m.el.querySelector('#secs');
    const addRow = (s = {}) => {
      const d = document.createElement('div');
      d.className = 'row'; d.style.marginBottom = '6px'; d.style.gridTemplateColumns = '1fr 130px 40px';
      d.innerHTML = `<input placeholder="Nome do setor" class="sn" value="${esc(s.name)}"><input placeholder="Nº pessoas" type="number" min="0" class="sh" value="${esc(s.headcount)}"><button type="button" class="btn sm danger">×</button>`;
      d.querySelector('button').onclick = () => d.remove();
      secs.appendChild(d);
    };
    sectors.forEach(addRow);
    m.el.querySelector('#addsec').onclick = () => addRow();
    m.el.querySelector('#cf').onsubmit = async e => {
      e.preventDefault();
      const body = formData(e.target);
      body.sectors = [...secs.children].map(r => ({ name: r.querySelector('.sn').value.trim(), headcount: r.querySelector('.sh').value })).filter(s => s.name);
      try {
        const r = await api(co.id ? `/api/companies/${co.id}` : '/api/companies', { method: co.id ? 'PUT' : 'POST', body });
        m.close(); toast('Empresa salva');
        location.hash = `#/empresas/${r.id}`; route();
      } catch (err) { toast(err.message, true); }
    };
  }

  async function pageCompany(id, tab = 'resumo') {
    const c = shell('#/empresas', '<p class="muted">Carregando…</p>');
    const [co, deliveries, campaigns, materials] = await Promise.all([api(`/api/companies/${id}`), api(`/api/deliveries?companyId=${id}`), api(`/api/campaigns?companyId=${id}`), api('/api/materials')]);
    const portalUrl = `${ORIGIN}/p/${co.portalToken}`;
    const tabs = [['resumo', 'Resumo'], ['servicos', 'Serviços'], ['avaliacoes', 'Avaliações NR-1'], ['materiais', 'Materiais publicados'], ['portal', 'Portal do colaborador']];
    let body = '';
    if (tab === 'resumo') {
      body = `<div class="grid g2"><div class="card"><h3>Dados da empresa</h3>
          <table><tbody>
          ${[['CNPJ', co.cnpj], ['Segmento', co.segment], ['Colaboradores', co.employees], ['Contato', [co.contactName, co.contactRole].filter(Boolean).join(' · ')], ['E-mail', co.email], ['Telefone', co.phone], ['Endereço', co.address], ['Início do contrato', fmtDate(co.contractStart)]].map(([k, v]) => `<tr><td class="muted" style="width:40%">${k}</td><td>${esc(v || '—')}</td></tr>`).join('')}
          </tbody></table>${co.notes ? `<p class="small muted" style="margin-top:10px">${esc(co.notes)}</p>` : ''}</div>
        <div class="card"><h3>Setores</h3>${co.sectors.length ? `<table><thead><tr><th>Setor</th><th>Pessoas</th></tr></thead><tbody>${co.sectors.map(s => `<tr><td>${esc(s.name)}</td><td>${s.headcount || '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nenhum setor cadastrado.</p>'}
          <div class="grid g2" style="margin-top:16px"><div class="stat"><div class="v">${co.stats.deliveriesDone}</div><div class="l">Serviços realizados</div></div><div class="stat"><div class="v">${co.stats.responses}</div><div class="l">Respostas na pesquisa</div></div></div></div></div>`;
    } else if (tab === 'servicos') {
      body = `<div class="card"><div class="card-head"><h2>Serviços</h2><button class="btn" id="nd">+ Agendar serviço</button></div>${deliveryList(deliveries, false)}</div>`;
    } else if (tab === 'avaliacoes') {
      body = `<div class="card"><div class="card-head"><h2>Avaliações de riscos psicossociais</h2><button class="btn teal" id="nc">+ Nova avaliação</button></div>
        ${campaigns.length ? `<table><thead><tr><th>Avaliação</th><th>Período</th><th>Respostas</th><th>Status</th><th></th></tr></thead><tbody>${campaigns.map(a => `<tr><td><b>${esc(a.title)}</b></td><td>${fmtDate(a.startDate)} – ${fmtDate(a.endDate)}</td><td>${a.responses}</td><td><span class="badge ${a.status === 'aberta' ? 'ok' : 'off'}">${esc(a.status)}</span></td><td class="btns"><a class="btn sm ghost" href="#/avaliacoes/${a.id}">Gerenciar</a><a class="btn sm" href="#/relatorio/${a.id}">Relatório</a></td></tr>`).join('')}</tbody></table>` : empty('chart', 'Nenhuma avaliação criada para esta empresa.')}</div>`;
    } else if (tab === 'materiais') {
      const pub = new Set(co.publishedMaterials);
      body = `<div class="card"><div class="card-head"><div><h2>Materiais no portal do colaborador</h2><p class="muted small">Marque os materiais que os colaboradores desta empresa poderão acessar.</p></div><button class="btn" id="savepub">Salvar seleção</button></div>
        ${CATEGORIES.map(cat => { const ms = materials.filter(m => m.category === cat); return ms.length ? `<h3 style="margin-top:14px">${esc(cat)}</h3>${ms.map(m => `<label class="check"><input type="checkbox" value="${m.id}" ${pub.has(m.id) ? 'checked' : ''}> <span>${esc(m.title)} <span class="muted small">· ${esc(m.audience || '')}</span></span></label>`).join('')}` : ''; }).join('')}</div>`;
    } else if (tab === 'portal') {
      body = `<div class="grid g2"><div class="card"><h2>Portal do Colaborador</h2><p class="muted">Compartilhe este link (ou o QR Code) com os colaboradores. Eles acessam os materiais publicados, respondem à pesquisa NR-1 aberta e avaliam palestras – sem login e de forma anônima.</p>
          ${linkBox(portalUrl)}<div class="btns" style="margin-top:14px"><a class="btn" href="#/cartaz/${co.id}">Imprimir cartaz com QR Code</a><button class="btn ghost" id="regen">Gerar novo link</button></div>
          <p class="hint">Gerar um novo link desativa o anterior.</p></div>
        <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">${qrImg(portalUrl)}<span class="muted small">QR Code do portal</span></div></div>`;
    }
    c.innerHTML = `
      <div class="page-head"><div><a href="#/empresas" class="small">← Empresas</a><h1>${esc(co.name)}</h1><p class="muted">${esc(co.segment || '')}</p></div>
        <div class="btns"><button class="btn ghost" id="edit">Editar</button><button class="btn danger" id="del">Excluir</button></div></div>
      <div class="tabs">${tabs.map(([k, l]) => `<a href="#/empresas/${id}/${k}" class="${tab === k ? 'active' : ''}">${l}</a>`).join('')}</div>${body}`;
    c.querySelector('#edit').onclick = () => companyForm(co);
    c.querySelector('#del').onclick = async () => {
      if (!confirmBox(`Excluir "${co.name}" e TODOS os seus serviços, avaliações e respostas? Esta ação não pode ser desfeita.`)) return;
      await api(`/api/companies/${id}`, { method: 'DELETE' }); toast('Empresa excluída'); location.hash = '#/empresas';
    };
    const nd = c.querySelector('#nd'); if (nd) nd.onclick = () => deliveryForm({ companyId: id });
    const nc = c.querySelector('#nc'); if (nc) nc.onclick = () => campaignForm({ companyId: id });
    bindDeliveryList(c);
    const sp = c.querySelector('#savepub');
    if (sp) sp.onclick = async () => {
      const ids = [...c.querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
      await api(`/api/companies/${id}`, { method: 'PUT', body: { publishedMaterials: ids } }); toast('Materiais publicados no portal');
    };
    const rg = c.querySelector('#regen');
    if (rg) rg.onclick = async () => { if (confirmBox('Gerar novo link? O link atual deixará de funcionar.')) { await api(`/api/companies/${id}/regenerate-link`, { method: 'POST' }); route(); } };
  }

  /* -------------------------- Cartaz (QR) ----------------------------- */
  async function pagePoster(id) {
    const co = await api(`/api/companies/${id}`);
    const url = `${ORIGIN}/p/${co.portalToken}`;
    const c = shell('#/empresas', '');
    c.innerHTML = `<div class="report-toolbar btns no-print"><a class="btn ghost" href="#/empresas/${id}/portal">← Voltar</a><button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button></div>
      <div class="report"><section class="cover" style="text-align:center;padding:56px 36px">
        <div class="logo"><img src="/img/logo.png" alt="MindCorp"></div>
        <h1 style="font-size:2.2rem;text-transform:uppercase">Cuidar da mente<br>também é <span style="color:var(--teal)">trabalho em equipe</span></h1>
        <p class="meta" style="font-size:1.1rem">${esc(co.name)} e MindCorp convidam você a acessar o<br><b style="color:#fff">Portal do Colaborador</b></p>
        <div style="background:#fff;display:inline-block;padding:16px;border-radius:16px;margin:16px 0"><img src="/api/qr?text=${encodeURIComponent(url)}" style="width:260px;height:260px;display:block" alt="QR Code"></div>
        <p class="meta">Aponte a câmera do celular para o QR Code<br><small>${esc(url)}</small></p>
        <div class="grid g3" style="margin-top:28px;text-align:left;color:#fff">
          <div><b class="accent">Materiais</b><br><small class="meta">Cartilhas e exercícios sobre saúde mental</small></div>
          <div><b class="accent">Pesquisa anônima</b><br><small class="meta">Ajude a melhorar o ambiente de trabalho (NR-1)</small></div>
          <div><b class="accent">Palestras</b><br><small class="meta">Agenda e avaliação das ações</small></div>
        </div>
        <p class="tagline">Ciência. Estratégia. <span>Cuidado.</span></p>
      </section></div>`;
  }

  /* ----------------------------- Agenda ------------------------------- */
  function deliveryList(list, showCompany, companies = []) {
    if (!list.length) return empty('calendar', 'Nenhum serviço registrado.');
    const cname = id => companies.find(c => c.id === id)?.name || '';
    return list.map(d => `<div class="list-item"><div style="display:flex;gap:12px;align-items:center;min-width:0">${dateChip(d.date)}<div style="min-width:0"><b>${esc(d.title || svcName(d.serviceId))}</b>
      <div class="muted small">${showCompany ? esc(cname(d.companyId)) + ' · ' : ''}${esc(svcName(d.serviceId))}${d.time ? ' · ' + esc(d.time) : ''}${d.modality ? ' · ' + esc(d.modality) : ''}${d.participants ? ' · ' + esc(d.participants) + ' participantes' : ''}</div></div></div>
      <div class="btns"><span class="badge ${STATUS[d.status]?.[1] || ''}">${STATUS[d.status]?.[0] || esc(d.status)}</span>${d.feedbackCount ? `<span class="badge navy">★ ${d.feedbackAvg} (${d.feedbackCount})</span>` : ''}
      <button class="btn sm ghost" data-fb="${d.id}" data-token="${d.feedbackToken}">Avaliação</button><button class="btn sm ghost" data-ed="${d.id}">Editar</button></div></div>`).join('');
  }
  function bindDeliveryList(c) {
    c.querySelectorAll('[data-ed]').forEach(b => b.onclick = async () => {
      const d = (await api('/api/deliveries')).find(x => x.id === b.dataset.ed); deliveryForm(d);
    });
    c.querySelectorAll('[data-fb]').forEach(b => b.onclick = () => feedbackModal(b.dataset.fb, b.dataset.token));
  }
  async function feedbackModal(id, token) {
    const url = `${ORIGIN}/feedback/${token}`;
    const fb = await api(`/api/deliveries/${id}/feedback`);
    const avg = fb.length ? (fb.reduce((s, f) => s + f.rating, 0) / fb.length).toFixed(1) : '—';
    modal('Avaliação de satisfação', `<p class="muted">Ao final do serviço, mostre o QR Code ou envie o link para os participantes avaliarem (anônimo). O serviço precisa estar marcado como <b>Realizado</b>.</p>
      <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">${qrImg(url)}<div style="flex:1;min-width:220px">${linkBox(url)}<div class="grid g2" style="margin-top:12px"><div class="stat"><div class="v">${avg}</div><div class="l">Nota média</div></div><div class="stat"><div class="v">${fb.length}</div><div class="l">Respostas</div></div></div></div></div>
      ${fb.filter(f => f.comment).length ? `<h3 style="margin-top:18px">Comentários</h3>${fb.filter(f => f.comment).map(f => `<p class="small">“${esc(f.comment)}” <span class="muted">★${f.rating}</span></p>`).join('')}` : ''}`, { wide: true });
  }

  async function deliveryForm(d = {}) {
    const [companies, materials] = await Promise.all([api('/api/companies'), api('/api/materials')]);
    const groups = [...new Set(S.catalog.services.map(s => s.group))];
    const mats = new Set(d.materialIds || []);
    const m = modal(d.id ? 'Editar serviço' : 'Agendar serviço', `<form id="df">
      <div class="row"><div class="field"><label>Empresa *</label><select name="companyId" required><option value="">Selecione…</option>${companies.map(c => `<option value="${c.id}" ${c.id === d.companyId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Tipo de serviço *</label><select name="serviceId" required>${groups.map(g => `<optgroup label="${esc(g)}">${S.catalog.services.filter(s => s.group === g).map(s => `<option value="${s.id}" ${s.id === d.serviceId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</optgroup>`).join('')}</select></div></div>
      <div class="field"><label>Título / tema</label><input name="title" value="${esc(d.title)}" placeholder="Ex.: Palestra – Estresse e autocuidado"></div>
      <div class="row"><div class="field"><label>Data</label><input type="date" name="date" value="${esc(d.date)}"></div><div class="field"><label>Horário</label><input type="time" name="time" value="${esc(d.time)}"></div><div class="field"><label>Duração</label><input name="duration" value="${esc(d.duration)}" placeholder="1h30"></div></div>
      <div class="row"><div class="field"><label>Modalidade</label><select name="modality">${['Presencial', 'On-line', 'Híbrido'].map(x => `<option ${x === d.modality ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Local / link</label><input name="location" value="${esc(d.location)}"></div></div>
      <div class="row"><div class="field"><label>Público</label><input name="audience" value="${esc(d.audience)}" placeholder="Todos, lideranças, setor X…"></div><div class="field"><label>Nº de participantes</label><input type="number" min="0" name="participants" value="${esc(d.participants)}"></div><div class="field"><label>Status</label><select name="status">${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${k === (d.status || 'planejado') ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="field"><label>Materiais utilizados</label><div style="max-height:150px;overflow:auto;border:1px solid var(--line);border-radius:9px;padding:8px">${materials.map(x => `<label class="check"><input type="checkbox" class="mat" value="${x.id}" ${mats.has(x.id) ? 'checked' : ''}> <span>${esc(x.title)}</span></label>`).join('')}</div></div>
      <div class="field"><label>Registro / observações</label><textarea name="notes" placeholder="Conteúdo trabalhado, percepções, encaminhamentos…">${esc(d.notes)}</textarea></div>
      <label class="check"><input type="checkbox" name="feedbackOpen" ${d.feedbackOpen !== false ? 'checked' : ''}> Avaliação de satisfação aberta aos participantes</label>
      <div class="btns" style="margin-top:14px"><button class="btn">Salvar</button>${d.id ? '<button type="button" class="btn danger" id="dd">Excluir</button>' : ''}</div></form>`);
    m.el.querySelector('#df').onsubmit = async e => {
      e.preventDefault();
      const body = formData(e.target);
      body.feedbackOpen = !!e.target.feedbackOpen.checked;
      body.materialIds = [...m.el.querySelectorAll('.mat:checked')].map(i => i.value);
      try { await api(d.id ? `/api/deliveries/${d.id}` : '/api/deliveries', { method: d.id ? 'PUT' : 'POST', body }); m.close(); toast('Serviço salvo'); route(); }
      catch (err) { toast(err.message, true); }
    };
    const dd = m.el.querySelector('#dd');
    if (dd) dd.onclick = async () => { if (confirmBox('Excluir este serviço?')) { await api(`/api/deliveries/${d.id}`, { method: 'DELETE' }); m.close(); route(); } };
  }

  async function pageAgenda(q) {
    const c = shell('#/agenda', '');
    const [list, companies] = await Promise.all([api('/api/deliveries'), api('/api/companies')]);
    const fCo = q.get('empresa') || '', fSt = q.get('status') || '';
    const filtered = list.filter(d => (!fCo || d.companyId === fCo) && (!fSt || d.status === fSt));
    const byMonth = {};
    filtered.forEach(d => { const k = (d.date || 'Sem data').slice(0, 7); (byMonth[k] = byMonth[k] || []).push(d); });
    const monthLabel = k => k === 'Sem data' ? k : `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][+k.slice(5, 7) - 1]} de ${k.slice(0, 4)}`;
    c.innerHTML = `<div class="page-head"><div><h1>Agenda de serviços</h1><p class="muted">Palestras, workshops, rodas de conversa, plantões e etapas da NR-1.</p></div><button class="btn" id="nd">+ Agendar serviço</button></div>
      <div class="card" style="margin-bottom:18px"><div class="row"><div><label>Empresa</label><select id="fco"><option value="">Todas</option>${companies.map(x => `<option value="${x.id}" ${x.id === fCo ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div><label>Status</label><select id="fst"><option value="">Todos</option>${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${k === fSt ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div></div>
      ${Object.keys(byMonth).length ? Object.keys(byMonth).sort().map(k => `<div class="card"><h3>${monthLabel(k)}</h3>${deliveryList(byMonth[k], true, companies)}</div>`).join('') : `<div class="card">${empty('calendar', 'Nenhum serviço encontrado.')}</div>`}`;
    const upd = () => { const p = new URLSearchParams(); if (c.querySelector('#fco').value) p.set('empresa', c.querySelector('#fco').value); if (c.querySelector('#fst').value) p.set('status', c.querySelector('#fst').value); location.hash = '#/agenda' + (p.toString() ? '?' + p : ''); };
    c.querySelector('#fco').onchange = upd; c.querySelector('#fst').onchange = upd;
    c.querySelector('#nd').onclick = () => deliveryForm({ companyId: fCo });
    bindDeliveryList(c);
    if (q.get('novo')) deliveryForm();
  }

  /* ---------------------------- Materiais ----------------------------- */
  async function pageMaterials(q) {
    const c = shell('#/materiais', '');
    const list = await api('/api/materials');
    const cat = q.get('cat') || '';
    const shown = list.filter(m => !cat || m.category === cat);
    c.innerHTML = `<div class="page-head"><div><h1>Materiais e palestras</h1><p class="muted">Conteúdos digitais para aplicar com os colaboradores. Publique-os no portal de cada empresa.</p></div><button class="btn" id="nm">+ Novo material</button></div>
      <div class="tabs"><a href="#/materiais" class="${!cat ? 'active' : ''}">Todos (${list.length})</a>${CATEGORIES.map(x => { const n = list.filter(m => m.category === x).length; return n ? `<a href="#/materiais?cat=${encodeURIComponent(x)}" class="${cat === x ? 'active' : ''}">${x} (${n})</a>` : ''; }).join('')}</div>
      <div class="grid g3">${shown.map(m => `<div class="card mat-card" data-id="${m.id}"><span class="upper cat">${esc(m.category)} · ${esc(m.audience || '')}</span><h3>${esc(m.title)}</h3><p>${esc(m.summary || '')}</p><div>${m.builtin ? '<span class="badge">Padrão MindCorp</span>' : '<span class="badge ok">Personalizado</span>'}</div></div>`).join('')}</div>`;
    c.querySelectorAll('.mat-card').forEach(el => el.onclick = () => location.hash = `#/materiais/${el.dataset.id}`);
    c.querySelector('#nm').onclick = () => materialForm();
  }

  function materialForm(m = {}) {
    const mm = modal(m.id ? 'Editar material' : 'Novo material', `<form id="mf">
      <div class="field"><label>Título *</label><input name="title" required value="${esc(m.title)}"></div>
      <div class="row"><div class="field"><label>Categoria</label><select name="category">${CATEGORIES.map(x => `<option ${x === m.category ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Público</label><select name="audience">${['Colaboradores', 'Lideranças', 'RH / SESMT', 'Todos'].map(x => `<option ${x === m.audience ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
      <div class="field"><label>Resumo</label><input name="summary" value="${esc(m.summary)}"></div>
      <div class="field"><label>Link de vídeo (opcional)</label><input name="videoUrl" type="url" value="${esc(m.videoUrl)}" placeholder="https://www.youtube.com/…"></div>
      <div class="field"><label>Conteúdo</label><textarea name="body" class="code">${esc(m.body)}</textarea>
      <div class="hint">Formatação: <code># Título</code>, <code>## Subtítulo</code>, <code>- item de lista</code>, <code>**negrito**</code>. Em <b>palestras</b>, separe os slides com uma linha <code>---</code> e escreva notas do apresentador começando com <code>&gt;</code>.</div></div>
      <div class="btns"><button class="btn">Salvar</button></div></form>`, { wide: true });
    mm.el.querySelector('#mf').onsubmit = async e => {
      e.preventDefault();
      try { const r = await api(m.id ? `/api/materials/${m.id}` : '/api/materials', { method: m.id ? 'PUT' : 'POST', body: formData(e.target) }); mm.close(); toast('Material salvo'); location.hash = `#/materiais/${r.id}`; route(); }
      catch (err) { toast(err.message, true); }
    };
  }

  async function pageMaterial(id) {
    const c = shell('#/materiais', '');
    const list = await api('/api/materials');
    const m = list.find(x => x.id === id);
    if (!m) { c.innerHTML = empty('book', 'Material não encontrado.'); return; }
    const isTalk = m.category === 'Palestra';
    c.innerHTML = `<div class="page-head"><div><a href="#/materiais" class="small">← Materiais</a><h1>${esc(m.title)}</h1><p class="muted">${esc(m.category)} · ${esc(m.audience || '')}</p></div>
      <div class="btns">${isTalk ? '<button class="btn teal" id="present">▶ Apresentar</button>' : ''}<button class="btn" id="pub">Publicar para empresas</button><button class="btn ghost" id="dup">Duplicar</button>${m.builtin ? '' : '<button class="btn ghost" id="ed">Editar</button><button class="btn danger" id="del">Excluir</button>'}</div></div>
      <div class="card md" style="max-width:820px">${m.summary ? `<p class="muted"><i>${esc(m.summary)}</i></p>` : ''}${m.videoUrl ? `<p><a href="${esc(m.videoUrl)}" target="_blank" rel="noopener">▶ Assistir ao vídeo</a></p>` : ''}
        ${isTalk ? slides(m.body).map((s, i) => `<div style="border:1px solid var(--line);border-radius:10px;padding:14px 18px;margin-bottom:12px"><span class="upper muted">Slide ${i + 1}</span>${s.html}${s.notes ? `<blockquote>Nota: ${esc(s.notes)}</blockquote>` : ''}</div>`).join('') : md(m.body)}</div>`;
    if (isTalk) c.querySelector('#present').onclick = () => present(m);
    c.querySelector('#dup').onclick = async () => { const r = await api('/api/materials', { method: 'POST', body: { ...m, title: m.title + ' (cópia)' } }); toast('Cópia criada'); location.hash = `#/materiais/${r.id}`; };
    const ed = c.querySelector('#ed'); if (ed) ed.onclick = () => materialForm(m);
    const del = c.querySelector('#del'); if (del) del.onclick = async () => { if (confirmBox('Excluir este material?')) { await api(`/api/materials/${id}`, { method: 'DELETE' }); location.hash = '#/materiais'; } };
    c.querySelector('#pub').onclick = async () => {
      const companies = await api('/api/companies');
      const mm = modal('Publicar no portal do colaborador', companies.length ? `${companies.map(co => `<label class="check"><input type="checkbox" value="${co.id}" ${co.publishedMaterials.includes(id) ? 'checked' : ''}> ${esc(co.name)}</label>`).join('')}<div class="btns" style="margin-top:14px"><button class="btn" id="sv">Salvar</button></div>` : '<p class="muted">Cadastre uma empresa primeiro.</p>');
      const sv = mm.el.querySelector('#sv');
      if (sv) sv.onclick = async () => {
        for (const co of companies) {
          const on = mm.el.querySelector(`input[value="${co.id}"]`).checked;
          const has = co.publishedMaterials.includes(id);
          if (on !== has) await api(`/api/companies/${co.id}`, { method: 'PUT', body: { publishedMaterials: on ? [...co.publishedMaterials, id] : co.publishedMaterials.filter(x => x !== id) } });
        }
        mm.close(); toast('Publicação atualizada');
      };
    };
  }

  function present(m) {
    const ss = slides(m.body);
    let i = 0;
    const el = document.createElement('div');
    el.className = 'present';
    const draw = () => {
      el.innerHTML = `<div class="slide md">${ss[i].html}</div>${ss[i].notes ? `<div class="notes">Nota: ${esc(ss[i].notes)}</div>` : ''}
        <div class="bar-b"><img src="/img/logo.png" alt="MindCorp"><span>${i + 1} / ${ss.length}</span><div class="btns"><button class="btn sm" data-a="-1">←</button><button class="btn sm" data-a="1">→</button><button class="btn sm" data-a="x">Sair (Esc)</button></div></div>`;
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a));
    };
    const act = a => { if (a === 'x') { el.remove(); document.removeEventListener('keydown', key); if (document.fullscreenElement) document.exitFullscreen(); return; } i = Math.max(0, Math.min(ss.length - 1, i + Number(a))); draw(); };
    const key = e => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') act(1); else if (e.key === 'ArrowLeft' || e.key === 'PageUp') act(-1); else if (e.key === 'Escape') act('x'); };
    document.addEventListener('keydown', key);
    document.body.appendChild(el); draw();
    el.requestFullscreen?.().catch(() => {});
  }

  /* --------------------------- Avaliações ----------------------------- */
  async function campaignForm(a = {}) {
    const companies = await api('/api/companies');
    const m = modal('Nova avaliação de riscos psicossociais', `<form id="af">
      <div class="field"><label>Empresa *</label><select name="companyId" required><option value="">Selecione…</option>${companies.map(c => `<option value="${c.id}" ${c.id === a.companyId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><div class="hint">Os setores cadastrados na empresa serão usados na pesquisa.</div></div>
      <div class="field"><label>Título</label><input name="title" value="Avaliação de riscos psicossociais ${new Date().getFullYear()}"></div>
      <div class="row"><div class="field"><label>Início</label><input type="date" name="startDate" value="${new Date().toISOString().slice(0, 10)}"></div><div class="field"><label>Término previsto</label><input type="date" name="endDate"></div></div>
      <div class="btns"><button class="btn teal">Criar e gerar link</button></div></form>`);
    m.el.querySelector('#af').onsubmit = async e => {
      e.preventDefault();
      try { const r = await api('/api/campaigns', { method: 'POST', body: formData(e.target) }); m.close(); location.hash = `#/avaliacoes/${r.id}`; }
      catch (err) { toast(err.message, true); }
    };
  }

  async function pageCampaigns(q) {
    const c = shell('#/avaliacoes', '');
    const list = await api('/api/campaigns');
    c.innerHTML = `<div class="page-head"><div><h1>Avaliações de riscos psicossociais</h1><p class="muted">Pesquisas digitais anônimas (NR-1 / GRO) e relatórios para as empresas.</p></div><button class="btn teal" id="nc">+ Nova avaliação</button></div>
      <div class="card">${list.length ? `<div class="table-wrap"><table><thead><tr><th>Empresa</th><th>Avaliação</th><th>Período</th><th>Respostas</th><th>Status</th><th></th></tr></thead><tbody>${list.map(a => `<tr><td><b>${esc(a.companyName)}</b></td><td>${esc(a.title)}</td><td>${fmtDate(a.startDate)} – ${fmtDate(a.endDate)}</td><td>${a.responses}</td><td><span class="badge ${a.status === 'aberta' ? 'ok' : 'off'}">${esc(a.status)}</span></td><td class="btns"><a class="btn sm ghost" href="#/avaliacoes/${a.id}">Gerenciar</a><a class="btn sm" href="#/relatorio/${a.id}">Relatório</a></td></tr>`).join('')}</tbody></table></div>` : empty('chart', 'Crie a primeira avaliação NR-1.')}</div>`;
    c.querySelector('#nc').onclick = () => campaignForm();
    if (q.get('nova')) campaignForm();
  }

  async function pageCampaign(id, tab = 'coleta') {
    const c = shell('#/avaliacoes', '<p class="muted">Carregando…</p>');
    const r = await api(`/api/campaigns/${id}/report`);
    const a = r.campaignData, co = r.companyData;
    const url = `${ORIGIN}/pesquisa/${a.token}`;
    const tabs = [['coleta', 'Coleta de respostas'], ['analise', 'Análise e matriz de risco'], ['plano', 'Plano de ação e conclusões']];
    let body = '';
    if (tab === 'coleta') {
      body = `<div class="grid g2"><div class="card"><h2>Link da pesquisa</h2><p class="muted">Envie por WhatsApp, e-mail, intranet ou exiba o QR Code em reuniões. A pesquisa também aparece no Portal do Colaborador.</p>${linkBox(url)}
          <div class="btns" style="margin-top:12px"><button class="btn ${a.status === 'aberta' ? 'danger' : 'teal'}" id="toggle">${a.status === 'aberta' ? 'Encerrar coleta' : 'Reabrir coleta'}</button><a class="btn ghost" href="${esc(url)}" target="_blank">Pré-visualizar</a></div>
          <hr><form id="sf"><div class="row"><div class="field"><label>Título</label><input name="title" value="${esc(a.title)}"></div></div>
          <div class="row"><div class="field"><label>Início</label><input type="date" name="startDate" value="${esc(a.startDate)}"></div><div class="field"><label>Término</label><input type="date" name="endDate" value="${esc(a.endDate)}"></div><div class="field"><label>Grupo mínimo</label><input type="number" name="minGroup" min="3" value="${esc(a.minGroup)}"></div></div>
          <div class="field"><label>Setores exibidos na pesquisa</label>${co.sectors.length ? co.sectors.map(s => `<label class="check"><input type="checkbox" class="sec" value="${esc(s.name)}" ${a.sectors.includes(s.name) ? 'checked' : ''}> ${esc(s.name)}</label>`).join('') : '<p class="muted small">Cadastre setores na empresa para análise por área.</p>'}</div>
          <button class="btn sm">Salvar configurações</button></form></div>
        <div class="card"><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">${qrImg(url)}<div><div class="stat hl" style="min-width:180px"><div class="v">${r.totalResponses}</div><div class="l">respostas${r.adhesion !== null ? ` · adesão ${r.adhesion}%` : ''}</div></div></div></div>
          <h3 style="margin-top:18px">Participação por setor</h3>
          <table><thead><tr><th>Setor</th><th>Respostas</th><th>Adesão</th></tr></thead><tbody>${r.participation.map(p => `<tr><td>${esc(p.sector)}</td><td>${p.responses}${p.responses > 0 && p.responses < r.minGroup ? ' <span class="badge warn">abaixo do mínimo</span>' : ''}</td><td>${p.rate !== null ? `<div class="bar" style="width:120px;display:inline-flex"><i style="width:${Math.min(100, p.rate)}%;background:var(--teal)"></i></div> ${p.rate}%` : '—'}</td></tr>`).join('')}</tbody></table>
          <p class="hint">Para preservar o anonimato, setores com menos de ${r.minGroup} respostas não são exibidos separadamente no relatório.</p></div></div>`;
    } else if (tab === 'analise') {
      if (!r.enough) body = `<div class="card">${empty('chart', `São necessárias pelo menos ${r.minGroup} respostas para gerar a análise (atual: ${r.totalResponses}).`)}</div>`;
      else body = `<div class="card"><div class="card-head"><div><h2>Matriz de risco por fator</h2><p class="muted small">A probabilidade é calculada pelas respostas. Ajuste a <b>severidade</b> conforme seu julgamento técnico e o contexto da empresa.</p></div><button class="btn" id="savesev">Salvar severidades</button></div>
        <div class="table-wrap"><table><thead><tr><th>Fator psicossocial</th><th>Pontuação</th><th>Desfavorável</th><th>Probabilidade</th><th>Severidade</th><th>Risco (P×S)</th></tr></thead><tbody>
        ${r.general.dimensions.map(d => `<tr><td><b>${esc(d.name)}</b>${d.prevalence !== null ? `<div class="small muted">${d.prevalence}% relataram ao menos uma ocorrência</div>` : ''}</td><td>${d.score}</td><td>${d.desfavoravel}%</td><td>${d.probability} – ${d.probabilityLabel}</td>
          <td><select class="sev" data-dim="${d.id}" style="width:auto">${[1, 2, 3, 4, 5].map(v => `<option value="${v}" ${v === d.severity ? 'selected' : ''}>${v}</option>`).join('')}</select></td><td><span class="lvl ${d.level}">${d.risk} · ${d.levelLabel}</span></td></tr>`).join('')}
        </tbody></table></div></div>
        <div class="card"><h2>Itens com maior percentual desfavorável</h2>${topItems(r.general, 10)}</div>`;
    } else {
      const dims = r.general?.dimensions || S.catalog.dimensions;
      body = `<div class="card"><div class="card-head"><div><h2>Plano de ação</h2><p class="muted small">Medidas de prevenção para inclusão no PGR, com responsáveis e prazos.</p></div><div class="btns"><button class="btn ghost" id="suggest" ${r.enough ? '' : 'disabled'}>Sugerir ações para riscos moderados ou maiores</button><button class="btn ghost" id="addrow">+ Ação</button></div></div>
        <div class="table-wrap"><table><thead><tr><th style="width:22%">Fator</th><th>Medida / ação</th><th style="width:15%">Responsável</th><th style="width:12%">Prazo</th><th style="width:12%">Status</th><th></th></tr></thead><tbody id="ap"></tbody></table></div></div>
        <div class="card"><h2>Outras fontes consideradas</h2><textarea id="other" placeholder="Ex.: entrevistas com lideranças, grupo focal com operadores, indicadores de absenteísmo e afastamentos (CID F), turnover, registros do canal de denúncia…">${esc(a.otherSources || '')}</textarea>
        <h2 style="margin-top:18px">Considerações finais da psicóloga responsável</h2><textarea id="concl" style="min-height:160px" placeholder="Síntese dos resultados, interpretação técnica, prioridades e recomendações…">${esc(a.conclusions || '')}</textarea>
        <div class="btns" style="margin-top:12px"><button class="btn" id="saveplan">Salvar plano e conclusões</button><a class="btn teal" href="#/relatorio/${id}">Ver relatório</a></div></div>`;
      setTimeout(() => {
        const tb = c.querySelector('#ap');
        const addRow = (x = {}) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td><select class="f">${dims.map(d => `<option value="${d.id}" ${d.id === x.factor ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}<option value="geral" ${x.factor === 'geral' ? 'selected' : ''}>Geral / programa</option></select></td>
            <td><textarea class="ac" style="min-height:50px">${esc(x.action)}</textarea></td><td><input class="rs" value="${esc(x.responsible)}"></td><td><input class="dl" type="date" value="${esc(x.deadline)}"></td>
            <td><select class="st">${['Pendente', 'Em andamento', 'Concluída'].map(s => `<option ${s === x.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><button class="btn sm danger">×</button></td>`;
          tr.querySelector('button').onclick = () => tr.remove();
          tb.appendChild(tr);
        };
        (a.actionPlan || []).forEach(addRow);
        c.querySelector('#addrow').onclick = () => addRow();
        c.querySelector('#suggest').onclick = () => {
          const existing = new Set([...tb.querySelectorAll('tr')].map(tr => tr.querySelector('.ac').value.trim()));
          const days = { critico: 30, alto: 90, moderado: 180 };
          let n = 0;
          r.general.dimensions.filter(d => d.level !== 'baixo').sort((x, y) => y.risk - x.risk).forEach(d => d.actions.forEach(act => {
            if (existing.has(act)) return;
            addRow({ factor: d.id, action: act, deadline: new Date(Date.now() + days[d.level] * 864e5).toISOString().slice(0, 10), status: 'Pendente' }); n++;
          }));
          toast(n ? `${n} ações sugeridas – revise e ajuste` : 'Nenhuma nova sugestão');
        };
        c.querySelector('#saveplan').onclick = async () => {
          const actionPlan = [...tb.querySelectorAll('tr')].map(tr => ({ factor: tr.querySelector('.f').value, action: tr.querySelector('.ac').value.trim(), responsible: tr.querySelector('.rs').value, deadline: tr.querySelector('.dl').value, status: tr.querySelector('.st').value })).filter(x => x.action);
          await api(`/api/campaigns/${id}`, { method: 'PUT', body: { actionPlan, conclusions: c.querySelector('#concl').value, otherSources: c.querySelector('#other').value } });
          toast('Plano de ação salvo');
        };
      });
    }
    c.innerHTML = `<div class="page-head"><div><a href="#/empresas/${co.id}/avaliacoes" class="small">← ${esc(co.name)}</a><h1>${esc(a.title)}</h1><p class="muted"><span class="badge ${a.status === 'aberta' ? 'ok' : 'off'}">${esc(a.status)}</span> ${r.totalResponses} respostas</p></div>
      <div class="btns"><a class="btn teal" href="#/relatorio/${id}">Relatório para a empresa</a><button class="btn danger" id="del">Excluir</button></div></div>
      <div class="tabs">${tabs.map(([k, l]) => `<a href="#/avaliacoes/${id}/${k}" class="${tab === k ? 'active' : ''}">${l}</a>`).join('')}</div>${body}`;
    c.querySelector('#del').onclick = async () => { if (confirmBox('Excluir esta avaliação e todas as respostas?')) { await api(`/api/campaigns/${id}`, { method: 'DELETE' }); location.hash = '#/avaliacoes'; } };
    const tg = c.querySelector('#toggle');
    if (tg) tg.onclick = async () => { await api(`/api/campaigns/${id}`, { method: 'PUT', body: { status: a.status === 'aberta' ? 'encerrada' : 'aberta' } }); route(); };
    const sf = c.querySelector('#sf');
    if (sf) sf.onsubmit = async e => { e.preventDefault(); const b = formData(sf); b.sectors = [...sf.querySelectorAll('.sec:checked')].map(i => i.value); await api(`/api/campaigns/${id}`, { method: 'PUT', body: b }); toast('Configurações salvas'); route(); };
    const ss = c.querySelector('#savesev');
    if (ss) ss.onclick = async () => { const severity = {}; c.querySelectorAll('.sev').forEach(s => severity[s.dataset.dim] = Number(s.value)); await api(`/api/campaigns/${id}`, { method: 'PUT', body: { severity } }); toast('Severidades salvas'); route(); };
  }

  function topItems(general, n) {
    const items = general.dimensions.flatMap(d => d.items.map(i => ({ ...i, dim: d.name }))).sort((a, b) => b.desfavoravel - a.desfavoravel).slice(0, n);
    return `<table><thead><tr><th>Afirmação</th><th>Fator</th><th>% desfavorável</th></tr></thead><tbody>${items.map(i => `<tr><td>${esc(i.text)}</td><td class="small muted">${esc(i.dim)}</td><td><div style="display:flex;gap:8px;align-items:center"><div class="bar" style="width:90px"><i style="width:${i.desfavoravel}%;background:${heatColor(i.desfavoravel)}"></i></div>${i.desfavoravel}%</div></td></tr>`).join('')}</tbody></table>`;
  }

  /* ---------------------------- Relatório ----------------------------- */
  async function pageReport(id) {
    const c = shell('#/avaliacoes', '<p class="muted">Gerando relatório…</p>');
    const r = await api(`/api/campaigns/${id}/report`);
    const a = r.campaignData, co = r.companyData, g = r.general, u = r.consultant;
    const dimName = Object.fromEntries((g?.dimensions || S.catalog.dimensions).map(d => [d.id, d.name]));
    dimName.geral = 'Geral / programa';
    const done = r.deliveries.filter(d => d.status === 'realizado');
    const abbr = ['D', 'A', 'CP', 'L', 'R', 'Rc', 'J', 'Jo', 'M', 'As', 'S'];
    const dims = g ? g.dimensions.filter(d => d.id !== 'saude') : [];
    const saude = g?.dimensions.find(d => d.id === 'saude');
    let sec = 0;
    const H = t => `<h2>${++sec}. ${t}</h2>`;

    const matrix = () => {
      let h = '<div class="matrix"><div class="ax"></div>' + [1, 2, 3, 4, 5].map(s => `<div class="ax">S${s}</div>`).join('');
      for (let p = 5; p >= 1; p--) {
        h += `<div class="ax">P${p}</div>`;
        for (let s = 1; s <= 5; s++) {
          const lvl = p * s >= 15 ? 'critico' : p * s >= 10 ? 'alto' : p * s >= 5 ? 'moderado' : 'baixo';
          const inCell = g.dimensions.map((d, i) => ({ d, i })).filter(({ d }) => d.probability === p && d.severity === s);
          h += `<div class="cell" style="background:${LEVEL_COLORS[lvl]};${inCell.length ? '' : 'opacity:.45'}">${inCell.map(({ i }) => `<em>${abbr[i]}</em>`).join('')}</div>`;
        }
      }
      return h + '</div>';
    };

    c.innerHTML = `
      <div class="report-toolbar btns no-print"><a class="btn ghost" href="#/avaliacoes/${id}">← Voltar</a><button class="btn" onclick="window.print()">Imprimir / Salvar em PDF</button><span class="muted small">Dica: no diálogo de impressão escolha "Salvar como PDF" e ative "Gráficos de plano de fundo".</span></div>
      <div class="report">
        <section class="cover">
          <div class="logo"><img src="/img/logo.png" alt="MindCorp"></div>
          <h1>Relatório de Avaliação de Fatores de Riscos Psicossociais Relacionados ao Trabalho</h1>
          <p class="meta">NR-1 – Gerenciamento de Riscos Ocupacionais (GRO) · Subsídio ao Inventário de Riscos e Plano de Ação do PGR</p>
          <table style="color:#fff;margin-top:18px;max-width:620px"><tbody>
            ${[['Empresa', co.name], ['CNPJ', co.cnpj], ['Segmento', co.segment], ['Período de coleta', `${fmtDate(a.startDate)} a ${fmtDate(a.endDate)}`], ['Responsável técnica', `${u.name}${u.crp ? ' – CRP ' + u.crp : ''}`], ['Emissão', fmtDate(r.generatedAt)]].map(([k, v]) => `<tr><td style="border-color:rgba(255,255,255,.15);color:var(--mist);width:40%">${k}</td><td style="border-color:rgba(255,255,255,.15)">${esc(v || '—')}</td></tr>`).join('')}
          </tbody></table>
          <p class="tagline">Ciência. Estratégia. <span>Cuidado.</span></p>
        </section>

        <section>${H('Apresentação e fundamentação')}
          <p>A Norma Regulamentadora nº 1 (NR-1), com a redação dada pela Portaria MTE nº 1.419/2024, determina que o Gerenciamento de Riscos Ocupacionais (GRO) contemple os <b>fatores de risco psicossociais relacionados ao trabalho</b>, que devem ser identificados, avaliados e controlados, integrando o Inventário de Riscos e o Plano de Ação do Programa de Gerenciamento de Riscos (PGR).</p>
          <p>Este relatório apresenta os resultados da avaliação realizada pela MindCorp – Saúde Mental Organizacional junto a <b>${esc(co.name)}</b>, com o objetivo de identificar condições da organização do trabalho que representem risco à saúde mental dos trabalhadores e de propor medidas de prevenção, priorizadas segundo o nível de risco.</p>
          <p>Foram observados os princípios éticos do Código de Ética Profissional do Psicólogo, a Lei Geral de Proteção de Dados (Lei 13.709/2018) e as diretrizes de prevenção ao assédio da Lei 14.457/2022. <b>Nenhum resultado individual é apresentado</b>; o foco é a organização do trabalho, e não a avaliação de pessoas.</p>
        </section>

        <section>${H('Metodologia')}
          <p><b>Instrumento:</b> questionário digital, anônimo e voluntário (Instrumento MindCorp de Rastreamento de Fatores Psicossociais), com 34 afirmações distribuídas em 11 dimensões: 10 fatores de risco (demandas, autonomia, clareza de papel, liderança, relações interpessoais, reconhecimento, justiça e comunicação, jornada, mudanças/segurança no emprego e assédio/violência) e 1 dimensão de indicadores de saúde (efeitos). As respostas utilizam escala de frequência de 5 pontos (Nunca a Sempre), considerando os últimos 3 meses.</p>
          <p><b>Pontuação:</b> cada resposta é convertida em pontuação de risco de 0 a 100 (itens positivos têm escala invertida). Por respondente e dimensão, considera-se <b>favorável</b> a média ≤ ${r.methodology.favMax}, <b>intermediária</b> entre ${r.methodology.favMax} e ${r.methodology.desfMin}, e <b>desfavorável</b> ≥ ${r.methodology.desfMin}.</p>
          <p><b>Probabilidade:</b> ${esc(r.methodology.probability)}</p>
          <p><b>Severidade:</b> ${esc(r.methodology.severity)}</p>
          <p><b>Nível de risco:</b> ${esc(r.methodology.matrix)}</p>
          <p><b>Anonimato:</b> resultados por setor somente para grupos com ${r.minGroup} ou mais respostas. Não são coletados nome, e-mail, matrícula ou IP.</p>
          ${a.otherSources ? `<p><b>Outras fontes consideradas:</b> ${esc(a.otherSources)}</p>` : ''}
          <p class="small muted"><b>Limitações:</b> trata-se de instrumento de rastreamento organizacional, não de diagnóstico clínico. Os resultados refletem a percepção dos participantes no período e devem ser interpretados em conjunto com outras fontes de informação.</p>
        </section>

        <section>${H('Participação')}
          <div class="grid g3"><div class="stat hl"><div class="v">${r.totalResponses}</div><div class="l">respostas válidas</div></div><div class="stat"><div class="v">${r.headcount || '—'}</div><div class="l">trabalhadores elegíveis</div></div><div class="stat"><div class="v">${r.adhesion !== null ? r.adhesion + '%' : '—'}</div><div class="l">taxa de adesão</div></div></div>
          <table style="margin-top:14px"><thead><tr><th>Setor</th><th>Respostas</th><th>Trabalhadores</th><th>Adesão</th></tr></thead><tbody>${r.participation.map(p => `<tr><td>${esc(p.sector)}</td><td>${p.responses}</td><td>${p.headcount || '—'}</td><td>${p.rate !== null ? p.rate + '%' : '—'}</td></tr>`).join('')}</tbody></table>
        </section>

        ${!r.enough ? `<section><p><b>Número de respostas insuficiente</b> para análise preservando o anonimato (mínimo ${r.minGroup}).</p></section>` : `
        <section>${H('Resultados gerais')}
          <div class="grid g4" style="margin-bottom:16px">${['critico', 'alto', 'moderado', 'baixo'].map(l => `<div class="stat" style="border-top:4px solid ${LEVEL_COLORS[l]}"><div class="v">${r.levelCounts[l]}</div><div class="l">fatores com risco ${r.levels.find(x => x.key === l).label.toLowerCase()}</div></div>`).join('')}</div>
          <div class="legend" style="margin-bottom:10px"><span style="--c:#2E9E6A">Favorável</span><span style="--c:#D9A520">Intermediário</span><span style="--c:#C8382E">Desfavorável</span></div>
          <table><thead><tr><th style="width:34%">Fator</th><th>Distribuição dos respondentes</th><th style="width:16%">Nível de risco</th></tr></thead><tbody>
          ${g.dimensions.map(d => `<tr><td><b>${esc(d.name)}</b><div class="small muted">Pontuação média ${d.score}${d.prevalence !== null ? ` · ${d.prevalence}% relataram ocorrência` : ''}</div></td>
            <td><div class="stack"><i style="width:${d.favoravel}%;background:#2E9E6A">${d.favoravel >= 8 ? Math.round(d.favoravel) + '%' : ''}</i><i style="width:${d.intermediario}%;background:#D9A520">${d.intermediario >= 8 ? Math.round(d.intermediario) + '%' : ''}</i><i style="width:${d.desfavoravel}%;background:#C8382E">${d.desfavoravel >= 8 ? Math.round(d.desfavoravel) + '%' : ''}</i></div></td>
            <td><span class="lvl ${d.level}">${d.levelLabel} (${d.risk})</span></td></tr>`).join('')}
          </tbody></table>
          ${saude ? `<p style="margin-top:14px" class="small"><b>Indicadores de saúde:</b> ${saude.desfavoravel}% dos participantes apresentam respostas desfavoráveis em sinais de esgotamento, tensão e alterações do sono relacionados ao trabalho. ${saude.desfavoravel >= 20 ? 'Recomenda-se oferta de acolhimento psicológico e monitoramento de afastamentos.' : ''}</p>` : ''}
        </section>

        <section>${H('Matriz de risco (Probabilidade × Severidade)')}
          <div class="grid g2" style="align-items:start">${matrix()}
          <div class="small">${g.dimensions.map((d, i) => `<div><b>${abbr[i]}</b> – ${esc(d.name)} (P${d.probability} × S${d.severity})</div>`).join('')}</div></div>
        </section>

        ${r.sectors.length ? `<section class="page-break">${H('Mapa de calor por setor')}
          <p class="small muted">Pontuação média de risco (0–100) por setor. Quanto mais quente a cor, mais desfavorável. ${r.hiddenSectors.length ? `Setores com menos de ${r.minGroup} respostas foram agrupados ou omitidos para preservar o anonimato.` : ''}</p>
          <div class="table-wrap"><table class="heat"><thead><tr><th>Setor (n)</th>${g.dimensions.map((d, i) => `<th title="${esc(d.name)}" style="text-align:center">${abbr[i]}</th>`).join('')}</tr></thead><tbody>
          ${r.sectors.map(s => `<tr><td>${esc(s.sector)} <span class="muted">(${s.n})</span></td>${s.dimensions.map(d => `<td class="h" style="background:${heatColor(d.score)}">${Math.round(d.score)}</td>`).join('')}</tr>`).join('')}
          </tbody></table></div>
          <div class="legend" style="margin-top:8px"><span style="--c:#2E9E6A">&lt;37,5</span><span style="--c:#9BB83A">37,5–50</span><span style="--c:#E0A420">50–62,5</span><span style="--c:#E07B24">62,5–75</span><span style="--c:#C8382E">≥75</span></div>
        </section>` : ''}

        <section class="page-break">${H('Inventário de riscos psicossociais (subsídio ao PGR)')}
          <div class="table-wrap"><table style="font-size:.82rem"><thead><tr><th>Fator de risco</th><th>Perigo / circunstância</th><th>Possíveis agravos à saúde</th><th>P</th><th>S</th><th>Nível</th><th>Prioridade</th></tr></thead><tbody>
          ${dims.slice().sort((x, y) => y.risk - x.risk).map(d => `<tr><td><b>${esc(d.name)}</b></td><td>${esc(d.hazard)}</td><td>${esc(d.harms)}</td><td>${d.probability}</td><td>${d.severity}</td><td><span class="lvl ${d.level}">${d.levelLabel}</span></td><td class="small">${esc(d.priority)} – ${esc(d.deadline)}</td></tr>`).join('')}
          </tbody></table></div>
        </section>

        <section>${H('Pontos de atenção (itens mais desfavoráveis)')}${topItems(g, 8)}</section>`}

        <section>${H('Plano de ação')}
          ${a.actionPlan?.length ? `<div class="table-wrap"><table style="font-size:.85rem"><thead><tr><th>Fator</th><th>Medida</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead><tbody>${a.actionPlan.map(x => `<tr><td>${esc(dimName[x.factor] || x.factor)}</td><td>${esc(x.action)}</td><td>${esc(x.responsible || '—')}</td><td>${fmtDate(x.deadline)}</td><td>${esc(x.status)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Plano de ação ainda não definido.</p>'}
        </section>

        <section>${H('Ações de cuidado realizadas pela MindCorp')}
          ${done.length ? `<table style="font-size:.85rem"><thead><tr><th>Data</th><th>Serviço</th><th>Participantes</th><th>Satisfação</th></tr></thead><tbody>${done.map(d => `<tr><td>${fmtDate(d.date)}</td><td>${esc(d.title || svcName(d.serviceId))}<div class="small muted">${esc(svcName(d.serviceId))}</div></td><td>${esc(d.participants || '—')}</td><td>${d.feedbackAvg ? `★ ${d.feedbackAvg} (${d.feedbackCount})` : '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nenhum serviço registrado como realizado.</p>'}
        </section>

        ${r.comments.length ? `<section>${H('Comentários dos participantes')}<p class="small muted">Transcritos em ordem aleatória, sem identificação.</p>${r.comments.slice(0, 40).map(t => `<p class="small" style="border-left:3px solid var(--mist);padding-left:10px">“${esc(t)}”</p>`).join('')}</section>` : ''}

        <section>${H('Considerações finais')}
          ${a.conclusions ? a.conclusions.split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('') : '<p class="muted">—</p>'}
          <p>Recomenda-se o monitoramento contínuo da eficácia das medidas e a <b>reavaliação dos fatores de risco psicossociais</b> em até 12 meses, ou sempre que ocorrerem mudanças significativas na organização do trabalho, conforme o ciclo do GRO.</p>
          <div class="sig"><div class="line"></div><b>${esc(u.name)}</b><div>Psicóloga${u.crp ? ' – CRP ' + esc(u.crp) : ''}</div><div class="muted">MindCorp – Saúde Mental Organizacional</div></div>
        </section>
      </div>`;
  }

  /* --------------------------- Metodologia ---------------------------- */
  function pageMethod() {
    const c = shell('#/metodologia', '');
    const q = S.catalog.questionnaire;
    c.innerHTML = `<div class="page-head"><div><h1>Metodologia e questionário</h1><p class="muted">Instrumento aplicado aos colaboradores e severidades padrão por fator.</p></div></div>
      <div class="card"><h2>Termo apresentado ao colaborador</h2>${q.intro.text.map(t => `<p>${esc(t)}</p>`).join('')}<p class="small"><b>Consentimento:</b> ${esc(q.intro.consent)}</p></div>
      ${S.catalog.dimensions.map(d => `<div class="card"><div class="card-head"><h3>${esc(d.name)}</h3><span class="badge">Severidade padrão ${d.severity}</span></div>
        <p class="small"><b>Perigo:</b> ${esc(d.hazard)}<br><b>Possíveis agravos:</b> ${esc(d.harms)}</p>
        <ol class="small">${q.dimensions.find(x => x.id === d.id).items.map(i => `<li>${esc(i.text)}</li>`).join('')}</ol>
        <p class="small"><b>Medidas sugeridas:</b></p><ul class="small">${d.actions.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>`).join('')}
      <div class="card"><h2>Catálogo de serviços</h2><table><tbody>${S.catalog.services.map(s => `<tr><td><b>${esc(s.name)}</b><div class="small muted">${esc(s.group)}</div></td><td class="small">${esc(s.description)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  /* ------------------------------ Perfil ------------------------------ */
  function pageProfile() {
    const c = shell('#/perfil', '');
    const u = S.user;
    c.innerHTML = `<div class="page-head"><div><h1>Meu perfil</h1><p class="muted">Estes dados aparecem na assinatura dos relatórios.</p></div></div>
      <div class="card" style="max-width:620px"><form id="pf">
        <div class="field"><label>Nome completo</label><input name="name" value="${esc(u.name)}" required></div>
        <div class="row"><div class="field"><label>CRP</label><input name="crp" value="${esc(u.crp)}"></div><div class="field"><label>Telefone</label><input name="phone" value="${esc(u.phone)}"></div></div>
        <div class="field"><label>E-mail (login)</label><input name="email" type="email" value="${esc(u.email)}" required></div>
        <div class="field"><label>Nova senha</label><input name="password" type="password" minlength="8" placeholder="Deixe em branco para manter" autocomplete="new-password"></div>
        <button class="btn">Salvar</button></form></div>`;
    c.querySelector('#pf').onsubmit = async e => {
      e.preventDefault();
      const b = formData(e.target); if (!b.password) delete b.password;
      try { const r = await api('/api/me', { method: 'PUT', body: b }); S.user = r.user; toast('Perfil atualizado'); pageProfile(); } catch (err) { toast(err.message, true); }
    };
  }

  /* ------------------------------ Router ------------------------------ */
  async function route() {
    if (!S.user) return boot();
    if (!S.catalog) S.catalog = await api('/api/catalog');
    const [path, qs] = location.hash.replace(/^#/, '').split('?');
    const q = new URLSearchParams(qs || '');
    const p = (path || '/').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    try {
      if (!p.length) return await pageHome();
      if (p[0] === 'empresas') return p[1] ? await pageCompany(p[1], p[2]) : await pageCompanies(q);
      if (p[0] === 'cartaz') return await pagePoster(p[1]);
      if (p[0] === 'agenda') return await pageAgenda(q);
      if (p[0] === 'materiais') return p[1] ? await pageMaterial(p[1]) : await pageMaterials(q);
      if (p[0] === 'avaliacoes') return p[1] ? await pageCampaign(p[1], p[2]) : await pageCampaigns(q);
      if (p[0] === 'relatorio') return await pageReport(p[1]);
      if (p[0] === 'metodologia') return pageMethod();
      if (p[0] === 'perfil') return pageProfile();
      await pageHome();
    } catch (err) {
      if (err.status === 401) { S.user = null; return boot(); }
      toast(err.message, true);
    }
  }

  async function boot() {
    const s = await api('/api/session');
    if (s.user) { S.user = s.user; return route(); }
    authScreen(s.needsSetup);
  }

  window.addEventListener('hashchange', () => { document.querySelector('.modal-bg')?.remove(); route(); });
  boot();
})();
