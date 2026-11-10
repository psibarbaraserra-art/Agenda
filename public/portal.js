/* MindCorp – Portal do Colaborador (público, anônimo) */
(function () {
  const { esc, md, api, toast, fmtDate } = window.MC;
function runPortal(fullPath, root) {
  const [path, qs] = String(fullPath).split('?');
  const query = new URLSearchParams(qs || '');
  const parts = path.split('/').filter(Boolean);
  root.classList.toggle('pf-root', parts[0] === 'portfolio');
  document.body.classList.toggle('pf', parts[0] === 'portfolio');
  const L = MC.link;
  const setCompany = n => { document.getElementById('co').textContent = n || ''; };
  const storage = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };
  const fail = msg => { root.innerHTML = `<div class="card empty">${esc(msg)}</div>`; };

  /* ------------------------------ Portal ------------------------------ */
  async function portal(token) {
    const d = await api(`/api/public/portal/${token}`);
    setCompany(d.company.name);
    document.title = `Portal do Colaborador · ${d.company.name}`;
    root.innerHTML = `
      <div class="p-hero"><h1>Olá! Este espaço é para você.</h1><p>A ${esc(d.company.name)}, em parceria com a MindCorp, preparou conteúdos e ações para cuidar da sua saúde mental no trabalho.</p></div>
      ${d.campaigns.map(c => `<a class="p-cta" href="${L('/pesquisa/' + c.token)}">📝 ${esc(c.title)}<small>Pesquisa anônima · cerca de 7 minutos${c.endDate ? ' · até ' + fmtDate(c.endDate) : ''}</small></a>`).join('')}
      ${d.events.filter(e => e.feedbackToken).map(e => `<a class="p-cta" style="background:var(--petrol)" href="${L('/feedback/' + e.feedbackToken)}">⭐ Avalie: ${esc(e.title)}<small>${fmtDate(e.date)} · leva 1 minuto</small></a>`).join('')}
      ${d.materials.length ? `<h2 style="margin-top:20px">Materiais para você</h2><div class="grid g2">${d.materials.map(m => `<a class="card mat-card" style="text-decoration:none;color:inherit" href="${L('/p/' + token + '/m/' + m.id)}"><span class="upper cat">${esc(m.category)}</span><h3>${esc(m.title)}</h3><p>${esc(m.summary || '')}</p></a>`).join('')}</div>` : ''}
      ${d.events.filter(e => e.status === 'planejado').length ? `<h2 style="margin-top:24px">Próximas ações</h2><div class="card">${d.events.filter(e => e.status === 'planejado').map(e => `<div class="list-item"><div style="display:flex;gap:12px;align-items:center">${MC.dateChip(e.date)}<div><b>${esc(e.title)}</b><div class="muted small">${esc([e.time, e.modality, e.location].filter(Boolean).join(' · '))}</div></div></div></div>`).join('')}</div>` : ''}
      <h2 style="margin-top:24px">Onde buscar apoio</h2>
      <div class="card">${d.company.supportChannels ? `<p>${esc(d.company.supportChannels).replace(/\n/g, '<br>')}</p>` : ''}<p class="small"><b>CVV – Centro de Valorização da Vida:</b> 188 (24h, gratuito) · cvv.org.br<br><b>SAMU:</b> 192 · <b>Central de Atendimento à Mulher:</b> 180</p></div>`;
  }

  async function material(token, id) {
    const m = await api(`/api/public/portal/${token}/materials/${id}`);
    setCompany(m.companyName);
    document.title = `${m.title} · MindCorp`;
    const isTalk = m.category === 'Palestra';
    const body = isTalk ? MC.slides(m.body).map(s => `<div style="border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:10px">${s.html}</div>`).join('') : md(m.body);
    root.innerHTML = `<a href="${L('/p/' + token)}" class="small">← Voltar ao portal</a>
      <div class="card md" style="margin-top:10px"><span class="upper accent">${esc(m.category)}</span><h1>${esc(m.title)}</h1>${m.summary ? `<p class="muted">${esc(m.summary)}</p>` : ''}${m.videoUrl ? `<p><a class="btn" href="${esc(m.videoUrl)}" target="_blank" rel="noopener">▶ Assistir ao vídeo</a></p>` : ''}${body}</div>`;
  }

  /* ------------------------------ Pesquisa ---------------------------- */
  async function survey(token) {
    const d = await api(`/api/public/survey/${token}`);
    setCompany(d.companyName);
    const q = d.questionnaire;
    if (!d.open) return fail('Esta pesquisa está encerrada. Obrigado pelo interesse!');
    const doneKey = 'mc_done_' + token;
    const answers = {};
    let sector = '', comment = '';
    let step = -1; // -1 = termo, 0..n-1 = dimensões, n = final
    const n = q.dimensions.length;

    const draw = () => {
      window.scrollTo(0, 0);
      if (step === -1) {
        root.innerHTML = `<div class="card"><h1>${esc(q.intro.title)}</h1>${q.intro.text.map(t => `<p>${esc(t)}</p>`).join('')}
          ${storage.get(doneKey) ? '<p class="support">Este dispositivo já enviou uma resposta. Se outra pessoa está usando o mesmo aparelho, pode continuar normalmente.</p>' : ''}
          ${d.sectors.length ? `<div class="field" style="margin-top:14px"><label>Em qual setor/área você trabalha?</label><select id="sec"><option value="">Prefiro não informar</option>${d.sectors.map(s => `<option ${s === sector ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><div class="hint">Usado apenas para análise agrupada (mínimo de 5 pessoas por grupo).</div></div>` : ''}
          <label class="check" style="margin:16px 0"><input type="checkbox" id="ok"> <span>${esc(q.intro.consent)}</span></label>
          <button class="btn" id="go" style="width:100%;justify-content:center">Começar</button></div>`;
        root.querySelector('#go').onclick = () => {
          if (!root.querySelector('#ok').checked) return toast('Marque a concordância para participar', true);
          sector = root.querySelector('#sec')?.value || ''; step = 0; draw();
        };
        return;
      }
      if (step < n) {
        const dim = q.dimensions[step];
        root.innerHTML = `<div class="progress"><i style="width:${(step / (n + 1)) * 100}%"></i></div>
          <div class="card"><span class="upper muted">Parte ${step + 1} de ${n}</span><p class="small muted" style="margin-top:6px">Com que frequência, nos últimos 3 meses…</p>
          ${dim.items.map(it => `<div class="q" data-id="${it.id}"><p>${esc(it.text)}</p><div class="opts" role="radiogroup">${q.scale.map(s => `<label><input type="radio" name="${it.id}" value="${s.value}" ${answers[it.id] === s.value ? 'checked' : ''}><span>${esc(s.label)}</span></label>`).join('')}</div></div>`).join('')}
          <div class="btns" style="margin-top:18px;justify-content:space-between"><button class="btn ghost" id="back">← Voltar</button><button class="btn" id="next">Avançar →</button></div></div>`;
        root.querySelectorAll('input[type=radio]').forEach(r => r.onchange = () => { answers[r.name] = Number(r.value); r.closest('.q').classList.remove('missing'); });
        root.querySelector('#back').onclick = () => { step--; draw(); };
        root.querySelector('#next').onclick = () => {
          const miss = dim.items.filter(it => !answers[it.id]);
          if (miss.length) { miss.forEach(it => root.querySelector(`.q[data-id="${it.id}"]`).classList.add('missing')); return toast('Responda todas as afirmações desta parte', true); }
          step++; draw();
        };
        return;
      }
      root.innerHTML = `<div class="progress"><i style="width:${(n / (n + 1)) * 100}%"></i></div>
        <div class="card"><h2>Quase lá!</h2><div class="field"><label>Quer deixar alguma sugestão ou comentário? (opcional)</label><textarea id="cm" maxlength="1500" placeholder="O que poderia melhorar no seu dia a dia de trabalho?">${esc(comment)}</textarea>
        <div class="hint">Para manter seu anonimato, não escreva nomes ou informações que possam identificar você ou outras pessoas.</div></div>
        <div class="btns" style="justify-content:space-between"><button class="btn ghost" id="back">← Voltar</button><button class="btn teal" id="send">Enviar respostas</button></div></div>`;
      root.querySelector('#back').onclick = () => { comment = root.querySelector('#cm').value; step--; draw(); };
      root.querySelector('#send').onclick = async e => {
        e.target.disabled = true;
        try {
          await api(`/api/public/survey/${token}`, { method: 'POST', body: { consent: true, sector, answers, comment: root.querySelector('#cm').value } });
          storage.set(doneKey, '1');
          root.innerHTML = `<div class="card" style="text-align:center"><h1>Obrigado pela sua participação! 💙</h1><p>Suas respostas foram registradas de forma anônima e vão ajudar a construir um ambiente de trabalho mais saudável.</p>
            <div class="support" style="text-align:left;margin-top:16px">${esc(q.support)}${d.supportChannels ? `<br><br><b>Canais da empresa:</b><br>${esc(d.supportChannels).replace(/\n/g, '<br>')}` : ''}</div></div>`;
        } catch (err) { e.target.disabled = false; toast(err.message, true); }
      };
    };
    draw();
  }

  /* ----------------------------- Portfólio ---------------------------- */
  async function portfolioPage() {
    const d = await api('/api/public/portfolio');
    const para = (query.get('para') || '').trim().slice(0, 80);
    setCompany(para ? 'Para ' + para : '');
    document.title = para ? `MindCorp · Proposta para ${para}` : 'MindCorp · Portfólio';
    const help = document.querySelector('.p-foot small'); if (help) help.remove();
    const digits = String(d.whatsapp || '').replace(/\D/g, '');
    const wa = digits ? 'https://wa.me/' + (digits.length <= 11 ? '55' + digits : digits) + '?text=' + encodeURIComponent(`Olá! Vi o portfólio da MindCorp${para ? ' (' + para + ')' : ''} e gostaria de agendar uma conversa.`) : '';
    const insta = String(d.instagram || '').replace(/^@/, '').trim();
    const site = String(d.website || '').trim();
    const siteUrl = site && !/^https?:\/\//.test(site) ? 'https://' + site : site;
    const groups = [...new Set(d.services.map(s => s.group))];
    const steps = [
      ['Conversa inicial', 'Entendemos a realidade da empresa, setores, indicadores (afastamentos, rotatividade) e objetivos.'],
      ['Pesquisa digital anônima', 'Os colaboradores respondem pelo celular, por link ou QR Code, em cerca de 7 minutos, com sigilo garantido.'],
      ['Análise e matriz de risco', 'Cada fator psicossocial é classificado por probabilidade e severidade, geral e por setor.'],
      ['Devolutiva e plano de ação', 'Apresentamos os resultados à liderança e definimos medidas, responsáveis e prazos para o PGR.'],
      ['Ações de cuidado', 'Palestras, treinamentos de lideranças, rodas de conversa e acolhimento psicológico.'],
      ['Monitoramento', 'Acompanhamos a eficácia das medidas e reavaliamos periodicamente, conforme o ciclo do GRO.']
    ];
    const deliverables = [
      ['Relatório técnico assinado', 'Avaliação dos fatores de risco psicossociais com metodologia, resultados e conclusões da psicóloga responsável.'],
      ['Inventário de riscos para o PGR', 'Fatores, perigos, possíveis agravos, nível de risco e prioridade, prontos para o SESMT incluir no programa.'],
      ['Plano de ação', 'Medidas de prevenção com responsáveis e prazos, priorizadas pelo nível de risco.'],
      ['Portal do Colaborador', 'Link exclusivo da empresa com cartilhas, exercícios, agenda das ações e canais de apoio.'],
      ['Indicadores de participação', 'Adesão por setor e avaliação de satisfação de cada palestra e ação realizada.']
    ];
    const pillars = [
      ['Ciência que orienta', 'Decisões baseadas em evidências.'],
      ['Estratégia que transforma', 'Soluções personalizadas para cada organização.'],
      ['Cuidado que acolhe', 'Acolhimento, empatia e escuta qualificada.'],
      ['Resultados que geram impacto', 'Ambientes saudáveis, produtivos e sustentáveis.']
    ];
    const talks = [...d.talks.map(t => ({ title: t.title.replace(/^Palestra:\s*/i, ''), sub: t.summary, aud: t.audience })), ...d.extraTopics.map(t => ({ title: t }))];
    const c = d.consultant;
    root.innerHTML = `
      <section class="pf-hero">
        ${para ? `<span class="pf-for">Apresentação preparada para <b>${esc(para)}</b></span>` : ''}
        <h1>${esc(d.headline)}</h1>
        <p class="pf-sub">${esc(d.subheadline)}</p>
        <p class="pf-tag">Ciência. Estratégia. <span>Cuidado.</span></p>
        ${wa ? `<a class="btn teal pf-btn" href="${esc(wa)}" target="_blank" rel="noopener">Agendar uma conversa pelo WhatsApp</a>` : ''}
      </section>

      <section class="pf-sec pf-about">
        <div><span class="upper accent">Quem somos</span><h2>Saúde mental organizacional</h2><p>${esc(d.about)}</p></div>
        <div class="pf-pillars">${pillars.map(([t, x]) => `<div><b>${t}</b><small>${x}</small></div>`).join('')}</div>
      </section>

      <section class="pf-sec pf-nr1">
        <span class="upper accent">Por que agora</span>
        <h2>A NR-1 inclui a saúde mental na gestão de riscos</h2>
        <p>Com a atualização da Norma Regulamentadora nº 1 (Portaria MTE nº 1.419/2024), as empresas passaram a ter de identificar, avaliar e controlar os <b>fatores de risco psicossociais relacionados ao trabalho</b> dentro do Gerenciamento de Riscos Ocupacionais (GRO) e do PGR.</p>
        <div class="pf-facts">
          <div><b>Obrigação legal</b><small>Os riscos psicossociais devem constar do inventário de riscos e do plano de ação do PGR.</small></div>
          <div><b>Saúde e afastamentos</b><small>Transtornos mentais estão entre as principais causas de afastamento do trabalho no Brasil.</small></div>
          <div><b>Clima e produtividade</b><small>Sobrecarga, falta de apoio e assédio afetam engajamento, retenção e segurança.</small></div>
        </div>
      </section>

      ${d.services.length ? `<section class="pf-sec">
        <span class="upper accent">Serviços</span><h2>O que oferecemos</h2>
        <div class="pf-groups">${groups.map(g => `<div class="pf-group"><h3>${esc(g)}</h3>${d.services.filter(s => s.group === g).map(s => `<div class="pf-svc"><b>${esc(s.name)}</b><small>${esc(s.description)}</small></div>`).join('')}</div>`).join('')}</div>
      </section>` : ''}

      <section class="pf-sec">
        <span class="upper accent">Metodologia</span><h2>Como funciona a avaliação psicossocial</h2>
        <ol class="pf-steps">${steps.map(([t, x]) => `<li><b>${t}</b><small>${x}</small></li>`).join('')}</ol>
      </section>

      <section class="pf-sec">
        <span class="upper accent">Entregas</span><h2>O que a empresa recebe</h2>
        <div class="pf-deliv">${deliverables.map(([t, x]) => `<div><b>${t}</b><small>${x}</small></div>`).join('')}</div>
      </section>

      ${talks.length ? `<section class="pf-sec">
        <span class="upper accent">Palestras e treinamentos</span><h2>Temas disponíveis</h2>
        <div class="pf-talks">${talks.map(t => `<div><b>${esc(t.title)}</b>${t.sub ? `<small>${esc(t.sub)}</small>` : ''}${t.aud ? `<span class="badge">${esc(t.aud)}</span>` : ''}</div>`).join('')}</div>
      </section>` : ''}

      <section class="pf-sec pf-ethics">
        <span class="upper accent">Sigilo e ética</span><h2>Cuidado com as pessoas e com os dados</h2>
        <ul>
          <li>Pesquisa <b>anônima</b>: não coletamos nome, e-mail, matrícula ou IP.</li>
          <li>Resultados apresentados apenas em grupo, nunca individualmente.</li>
          <li>Conformidade com a LGPD (Lei 13.709/2018) e com o Código de Ética Profissional do Psicólogo.</li>
          <li>Foco na organização do trabalho, não na avaliação de pessoas.</li>
        </ul>
      </section>

      ${c ? `<section class="pf-sec pf-who">
        ${d.photo ? `<img src="${esc(d.photo)}" alt="${esc(c.name)}">` : ''}
        <div><span class="upper accent">Responsável técnica</span><h2>${esc(c.name)}</h2>${c.crp ? `<p class="muted">Psicóloga · CRP ${esc(c.crp)}</p>` : ''}${d.bio ? d.bio.split(/\n+/).map(x => `<p>${esc(x)}</p>`).join('') : ''}</div>
      </section>` : ''}

      <section class="pf-contact">
        <h2>Vamos conversar sobre a saúde mental da sua equipe?</h2>
        <div class="pf-cgrid">
          ${wa ? `<a class="btn teal" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp ${esc(d.whatsapp)}</a>` : ''}
          ${d.phone ? `<div><small>Telefone</small><b>${esc(d.phone)}</b></div>` : ''}
          ${d.email ? `<div><small>E-mail</small><b class="sel">${esc(d.email)}</b></div>` : ''}
          ${insta ? `<div><small>Instagram</small><a href="https://instagram.com/${encodeURIComponent(insta)}" target="_blank" rel="noopener">@${esc(insta)}</a></div>` : ''}
          ${siteUrl ? `<div><small>Site</small><a href="${esc(siteUrl)}" target="_blank" rel="noopener">${esc(site)}</a></div>` : ''}
          ${d.city ? `<div><small>Atendimento</small><b>${esc(d.city)}</b></div>` : ''}
        </div>
      </section>`;
  }

  /* ------------------------------ Feedback ---------------------------- */
  async function feedback(token) {
    const d = await api(`/api/public/feedback/${token}`);
    setCompany(d.companyName);
    if (!d.open) return fail('A avaliação deste evento está encerrada. Obrigado!');
    const key = 'mc_fb_' + token;
    if (storage.get(key)) return fail('Você já avaliou este evento. Obrigado!');
    const stars = name => `<div class="stars" data-name="${name}">${[1, 2, 3, 4, 5].map(v => `<label><input type="radio" name="${name}" value="${v}"><span data-v="${v}">★</span></label>`).join('')}</div>`;
    root.innerHTML = `<div class="card"><span class="upper accent">Avaliação</span><h1>${esc(d.title)}</h1><p class="muted">${fmtDate(d.date)} · Sua opinião é anônima.</p>
      <div class="field"><label>Qual a sua nota geral para esta ação?</label>${stars('rating')}</div>
      <div class="field"><label>O conteúdo será útil no seu dia a dia?</label>${stars('useful')}</div>
      <div class="field"><label>Comentário (opcional)</label><textarea id="cm" maxlength="1000"></textarea></div>
      <button class="btn teal" id="send" style="width:100%;justify-content:center">Enviar avaliação</button></div>`;
    root.querySelectorAll('.stars').forEach(g => g.querySelectorAll('input').forEach(inp => inp.onchange = () => {
      g.querySelectorAll('span').forEach(s => s.classList.toggle('on', Number(s.dataset.v) <= Number(inp.value)));
    }));
    root.querySelector('#send').onclick = async e => {
      const rating = root.querySelector('input[name=rating]:checked')?.value;
      const useful = root.querySelector('input[name=useful]:checked')?.value;
      if (!rating) return toast('Escolha uma nota', true);
      e.target.disabled = true;
      try {
        await api(`/api/public/feedback/${token}`, { method: 'POST', body: { rating, useful, comment: root.querySelector('#cm').value } });
        storage.set(key, '1');
        root.innerHTML = '<div class="card" style="text-align:center"><h1>Obrigado! 💙</h1><p>Sua avaliação nos ajuda a cuidar melhor de todos.</p></div>';
      } catch (err) { e.target.disabled = false; toast(err.message, true); }
    };
  }

  (async () => {
    try {
      if (parts[0] === 'portfolio') return await portfolioPage();
      if (parts[0] === 'p' && parts[2] === 'm') return await material(parts[1], parts[3]);
      if (parts[0] === 'p') return await portal(parts[1]);
      if (parts[0] === 'pesquisa') return await survey(parts[1]);
      if (parts[0] === 'feedback') return await feedback(parts[1]);
      fail('Página não encontrada.');
    } catch (err) { fail(err.message); }
  })();
}
  window.MC.runPortal = runPortal;
  if (!MC.standalone) runPortal(location.pathname + location.search, document.getElementById('root'));
})();
