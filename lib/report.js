'use strict';
const { DIMENSIONS } = require('./questionnaire');

const FAV_MAX = 37.5;   // pontuação de risco ≤ 37,5 → favorável
const DESF_MIN = 62.5;  // pontuação de risco ≥ 62,5 → desfavorável

const LEVELS = [
  { min: 1, max: 4, key: 'baixo', label: 'Baixo', priority: 'Manter controles e monitorar', deadline: 'Reavaliar em 12 meses' },
  { min: 5, max: 9, key: 'moderado', label: 'Moderado', priority: 'Ações de melhoria planejadas', deadline: 'Até 6 meses' },
  { min: 10, max: 14, key: 'alto', label: 'Alto', priority: 'Ações prioritárias', deadline: 'Até 90 dias' },
  { min: 15, max: 25, key: 'critico', label: 'Crítico', priority: 'Intervenção imediata', deadline: 'Imediato / até 30 dias' }
];

const PROB_LABELS = { 1: 'Rara', 2: 'Improvável', 3: 'Possível', 4: 'Provável', 5: 'Muito provável' };
const SEV_LABELS = { 1: 'Insignificante', 2: 'Leve', 3: 'Moderada', 4: 'Grave', 5: 'Gravíssima' };

function itemRisk(item, value) {
  const v = Number(value);
  if (!(v >= 1 && v <= 5)) return null;
  return item.dir === 'neg' ? ((v - 1) / 4) * 100 : ((5 - v) / 4) * 100;
}

function mean(arr) {
  const a = arr.filter(x => x !== null && x !== undefined && !Number.isNaN(x));
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
}

/** Probabilidade (1–5) a partir do % de respondentes em situação desfavorável. */
function probabilityFromExposure(pctDesf) {
  if (pctDesf < 10) return 1;
  if (pctDesf < 20) return 2;
  if (pctDesf < 35) return 3;
  if (pctDesf < 50) return 4;
  return 5;
}

/** Para assédio/violência: qualquer ocorrência relatada já é relevante. */
function probabilityFromPrevalence(pct) {
  if (pct === 0) return 1;
  if (pct < 5) return 2;
  if (pct < 10) return 3;
  if (pct < 20) return 4;
  return 5;
}

function levelFor(r) {
  return LEVELS.find(l => r >= l.min && r <= l.max) || LEVELS[0];
}

/** Pontuações por dimensão para um único respondente. */
function scoreResponse(resp) {
  const out = {};
  for (const d of DIMENSIONS) {
    const risks = d.items.map(i => itemRisk(i, resp.answers?.[i.id]));
    const m = mean(risks);
    let exposed = false;
    if (d.prevalence) {
      exposed = d.items.some(i => i.exposure && Number(resp.answers?.[i.id]) >= 2);
    }
    out[d.id] = { score: m, exposed };
  }
  return out;
}

function analyzeGroup(responses, severityOverrides = {}) {
  const scored = responses.map(scoreResponse);
  const dims = DIMENSIONS.map(d => {
    const scores = scored.map(s => s[d.id].score).filter(x => x !== null);
    const n = scores.length;
    const m = mean(scores);
    const fav = n ? (scores.filter(x => x <= FAV_MAX).length / n) * 100 : 0;
    const desf = n ? (scores.filter(x => x >= DESF_MIN).length / n) * 100 : 0;
    const inter = n ? 100 - fav - desf : 0;
    let prevalencePct = null;
    let probability = probabilityFromExposure(desf);
    if (d.prevalence) {
      prevalencePct = n ? (scored.filter(s => s[d.id].exposed).length / n) * 100 : 0;
      probability = Math.max(probability, probabilityFromPrevalence(prevalencePct));
    }
    const severity = clampInt(severityOverrides[d.id], 1, 5) || d.severity;
    const risk = probability * severity;
    const level = levelFor(risk);
    const items = d.items.map(i => {
      const vals = responses.map(r => itemRisk(i, r.answers?.[i.id])).filter(x => x !== null);
      const dist = [1, 2, 3, 4, 5].map(v => responses.filter(r => Number(r.answers?.[i.id]) === v).length);
      return {
        id: i.id, text: i.text, dir: i.dir,
        score: round(mean(vals)),
        desfavoravel: vals.length ? round((vals.filter(x => x >= 75).length / vals.length) * 100) : 0,
        dist
      };
    });
    return {
      id: d.id, name: d.name, hazard: d.hazard, harms: d.harms, actions: d.actions,
      n, score: round(m), favoravel: round(fav), intermediario: round(inter), desfavoravel: round(desf),
      prevalence: prevalencePct === null ? null : round(prevalencePct),
      probability, probabilityLabel: PROB_LABELS[probability],
      severity, severityLabel: SEV_LABELS[severity], defaultSeverity: d.severity,
      risk, level: level.key, levelLabel: level.label, priority: level.priority, deadline: level.deadline,
      items
    };
  });
  const overall = round(mean(dims.filter(d => d.id !== 'saude').map(d => d.score)));
  return { n: responses.length, overall, dimensions: dims };
}

/**
 * Relatório completo de uma campanha.
 * Respeita o tamanho mínimo de grupo para preservar o anonimato.
 */
function buildReport(campaign, company, responses) {
  const minGroup = Math.max(3, Number(campaign.minGroup) || 5);
  const severity = campaign.severity || {};
  const total = responses.length;
  const enough = total >= minGroup;

  const headcount = (company?.sectors || []).reduce((s, x) => s + (Number(x.headcount) || 0), 0) || Number(company?.employees) || 0;

  const general = enough ? analyzeGroup(responses, severity) : null;

  // Participação por setor
  const sectorNames = [...new Set([...(campaign.sectors || []), ...responses.map(r => r.sector || 'Não informado')])];
  const participation = sectorNames.map(name => {
    const sec = (company?.sectors || []).find(s => s.name === name);
    const count = responses.filter(r => (r.sector || 'Não informado') === name).length;
    const hc = Number(sec?.headcount) || 0;
    return { sector: name, responses: count, headcount: hc, rate: hc ? round((count / hc) * 100) : null };
  });

  // Análise por setor (somente grupos ≥ minGroup; os demais são agrupados)
  const sectors = [];
  const small = [];
  for (const p of participation) {
    const group = responses.filter(r => (r.sector || 'Não informado') === p.sector);
    if (group.length >= minGroup) {
      const a = analyzeGroup(group, severity);
      sectors.push({ sector: p.sector, n: group.length, overall: a.overall, dimensions: a.dimensions.map(d => ({ id: d.id, score: d.score, desfavoravel: d.desfavoravel, risk: d.risk, level: d.level, levelLabel: d.levelLabel })) });
    } else if (group.length > 0) {
      small.push(...group);
    }
  }
  let groupedOthers = null;
  if (small.length >= minGroup && sectors.length > 0) {
    const a = analyzeGroup(small, severity);
    groupedOthers = { sector: 'Demais setores (agrupados)', n: small.length, overall: a.overall, dimensions: a.dimensions.map(d => ({ id: d.id, score: d.score, desfavoravel: d.desfavoravel, risk: d.risk, level: d.level, levelLabel: d.levelLabel })) };
    sectors.push(groupedOthers);
  }

  // Comentários livres: só exibidos se houver anonimato suficiente; ordem embaralhada
  const comments = enough
    ? shuffle(responses.map(r => (r.comment || '').trim()).filter(Boolean))
    : [];

  const counts = { baixo: 0, moderado: 0, alto: 0, critico: 0 };
  if (general) general.dimensions.forEach(d => { if (d.id !== 'saude') counts[d.level]++; });

  return {
    generatedAt: new Date().toISOString(),
    campaign: { id: campaign.id, title: campaign.title, startDate: campaign.startDate, endDate: campaign.endDate, status: campaign.status },
    company: company ? { id: company.id, name: company.name, cnpj: company.cnpj, segment: company.segment } : null,
    minGroup,
    totalResponses: total,
    headcount,
    adhesion: headcount ? round((total / headcount) * 100) : null,
    enough,
    general,
    levelCounts: counts,
    participation,
    sectors,
    hiddenSectors: participation.filter(p => p.responses > 0 && p.responses < minGroup).map(p => p.sector),
    comments,
    levels: LEVELS,
    methodology: {
      favMax: FAV_MAX, desfMin: DESF_MIN,
      probability: 'Probabilidade (1–5) estimada pelo percentual de trabalhadores em situação desfavorável na dimensão: <10% = 1; 10–19% = 2; 20–34% = 3; 35–49% = 4; ≥50% = 5. Para assédio/violência/discriminação considera-se também a prevalência de qualquer ocorrência relatada: 0% = 1; <5% = 2; 5–9% = 3; 10–19% = 4; ≥20% = 5.',
      severity: 'Severidade (1–5) definida pela(o) profissional responsável, considerando a gravidade dos possíveis agravos à saúde associados ao fator.',
      matrix: 'Nível de risco = Probabilidade × Severidade (matriz 5×5): 1–4 Baixo; 5–9 Moderado; 10–14 Alto; 15–25 Crítico.'
    }
  };
}

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}
function round(x) { return x === null || x === undefined ? null : Math.round(x * 10) / 10; }
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

module.exports = { buildReport, analyzeGroup, scoreResponse, itemRisk, levelFor, probabilityFromExposure, probabilityFromPrevalence, LEVELS };
