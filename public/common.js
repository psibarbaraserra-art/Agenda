/* Utilitários compartilhados entre o painel e o portal do colaborador */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Markdown simplificado: # ## ###, listas "- ", > citações, **negrito**, *itálico*, links. */
  function md(src) {
    const inline = t => esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
      .replace(/\b(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const lines = String(src || '').split(/\r?\n/);
    let html = '', list = false;
    const close = () => { if (list) { html += '</ul>'; list = false; } };
    for (const raw of lines) {
      const l = raw.trimEnd();
      let m;
      if ((m = l.match(/^(#{1,3})\s+(.*)/))) { close(); const n = m[1].length; html += `<h${n}>${inline(m[2])}</h${n}>`; }
      else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { if (!list) { html += '<ul>'; list = true; } html += `<li>${inline(m[1])}</li>`; }
      else if ((m = l.match(/^>\s?(.*)/))) { close(); html += `<blockquote>${inline(m[1])}</blockquote>`; }
      else if (!l.trim()) { close(); }
      else { close(); html += `<p>${inline(l)}</p>`; }
    }
    close();
    return html;
  }

  /** Divide o texto de uma palestra em slides (separador: linha "---"). Linhas "> " viram notas do apresentador. */
  function slides(src) {
    return String(src || '').split(/\n-{3,}\s*\n/).map(block => {
      const notes = block.split('\n').filter(l => /^>\s?/.test(l)).map(l => l.replace(/^>\s?/, '')).join(' ');
      const body = block.split('\n').filter(l => !/^>\s?/.test(l)).join('\n');
      return { html: md(body), notes };
    });
  }

  async function api(url, opts = {}) {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin'
    });
    let data = null;
    try { data = await res.json(); } catch { /* sem corpo */ }
    if (!res.ok) { const e = new Error(data?.error || 'Erro de comunicação'); e.status = res.status; throw e; }
    return data;
  }

  function toast(msg, err) {
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function fmtDate(d) {
    if (!d) return '—';
    const [y, m, day] = String(d).slice(0, 10).split('-');
    return `${day}/${m}/${y}`;
  }
  function dateChip(d) {
    if (!d) return '<div class="date-chip"><b>—</b><span>s/ data</span></div>';
    const [, m, day] = d.split('-');
    return `<div class="date-chip"><b>${day}</b><span>${MONTHS[+m - 1]}</span></div>`;
  }

  window.MC = { esc, md, slides, api, toast, fmtDate, dateChip, MONTHS };
})();
