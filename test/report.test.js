'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { itemRisk, buildReport, probabilityFromExposure, levelFor } = require('../lib/report');
const { allItems } = require('../lib/questionnaire');

const all = v => Object.fromEntries(allItems().map(i => [i.id, typeof v === 'function' ? v(i) : v]));
const worst = all(i => (i.dir === 'neg' ? 5 : 1));
const best = all(i => (i.dir === 'neg' ? 1 : 5));

test('pontuação de risco por item respeita a direção', () => {
  assert.strictEqual(itemRisk({ dir: 'neg' }, 5), 100);
  assert.strictEqual(itemRisk({ dir: 'neg' }, 1), 0);
  assert.strictEqual(itemRisk({ dir: 'pos' }, 1), 100);
  assert.strictEqual(itemRisk({ dir: 'pos' }, 5), 0);
  assert.strictEqual(itemRisk({ dir: 'pos' }, 9), null);
});

test('probabilidade e nível de risco', () => {
  assert.strictEqual(probabilityFromExposure(0), 1);
  assert.strictEqual(probabilityFromExposure(55), 5);
  assert.strictEqual(levelFor(4).key, 'baixo');
  assert.strictEqual(levelFor(12).key, 'alto');
  assert.strictEqual(levelFor(25).key, 'critico');
});

test('relatório não exibe resultados abaixo do grupo mínimo', () => {
  const r = buildReport({ id: 'c', minGroup: 5, sectors: ['A'] }, { sectors: [{ name: 'A', headcount: 10 }] },
    [1, 2, 3].map(() => ({ sector: 'A', answers: best, comment: 'oi' })));
  assert.strictEqual(r.enough, false);
  assert.strictEqual(r.general, null);
  assert.deepStrictEqual(r.comments, []);
});

test('cenário favorável gera risco baixo; desfavorável gera crítico', () => {
  const good = buildReport({ id: 'c', sectors: ['A'] }, { sectors: [{ name: 'A', headcount: 10 }] }, Array.from({ length: 6 }, () => ({ sector: 'A', answers: best })));
  assert.ok(good.general.dimensions.every(d => d.probability === 1 && d.risk === d.severity));
  assert.strictEqual(good.adhesion, 60);
  const bad = buildReport({ id: 'c', sectors: ['A'] }, null, Array.from({ length: 6 }, () => ({ sector: 'A', answers: worst })));
  const as = bad.general.dimensions.find(d => d.id === 'assedio');
  assert.strictEqual(as.prevalence, 100);
  assert.strictEqual(as.level, 'critico');
});

test('setores pequenos são agrupados para preservar anonimato', () => {
  const resp = [
    ...Array.from({ length: 6 }, () => ({ sector: 'A', answers: best })),
    ...Array.from({ length: 3 }, () => ({ sector: 'B', answers: worst })),
    ...Array.from({ length: 2 }, () => ({ sector: 'C', answers: worst }))
  ];
  const r = buildReport({ id: 'c', minGroup: 5, sectors: ['A', 'B', 'C'] }, null, resp);
  assert.deepStrictEqual(r.sectors.map(s => s.sector), ['A', 'Demais setores (agrupados)']);
  assert.deepStrictEqual(r.hiddenSectors, ['B', 'C']);
});

test('severidade ajustada pela consultora altera o risco', () => {
  const resp = Array.from({ length: 6 }, () => ({ sector: 'A', answers: worst }));
  const r = buildReport({ id: 'c', severity: { demandas: 1 } }, null, resp);
  const d = r.general.dimensions.find(x => x.id === 'demandas');
  assert.strictEqual(d.severity, 1);
  assert.strictEqual(d.risk, 5);
});
