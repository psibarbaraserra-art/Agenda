/* MindCorp – Portal do Colaborador (público, anônimo) */
(function () {
  const { esc, md, api, toast, fmtDate } = window.MC;
function runPortal(path, root) {
  const parts = path.split('/').filter(Boolean);
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
      if (parts[0] === 'p' && parts[2] === 'm') return await material(parts[1], parts[3]);
      if (parts[0] === 'p') return await portal(parts[1]);
      if (parts[0] === 'pesquisa') return await survey(parts[1]);
      if (parts[0] === 'feedback') return await feedback(parts[1]);
      fail('Página não encontrada.');
    } catch (err) { fail(err.message); }
  })();
}
  window.MC.runPortal = runPortal;
  if (!MC.standalone) runPortal(location.pathname, document.getElementById('root'));
})();
