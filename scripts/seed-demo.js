'use strict';
/**
 * Cria dados de demonstração (empresa fictícia, serviços e 48 respostas simuladas).
 * Uso: npm run demo   (não apaga dados existentes)
 */
const store = require('../lib/store');
const { allItems } = require('../lib/questionnaire');
function seedDemo() {
const db = store.load();

const sectors = [{ name: 'Produção', headcount: 30 }, { name: 'Administrativo', headcount: 15 }, { name: 'Comercial', headcount: 12 }, { name: 'Logística', headcount: 4 }];
const company = {
  id: store.id(), portalToken: store.token(), status: 'ativa', createdAt: new Date().toISOString(),
  name: 'Empresa Demonstração Ltda.', cnpj: '00.000.000/0001-00', segment: 'Indústria', employees: 61,
  contactName: 'Responsável RH', contactRole: 'RH', sectors,
  supportChannels: 'Canal de denúncia: etica@empresa-demo.com.br\nPlantão psicológico MindCorp: quintas-feiras, 14h às 17h',
  publishedMaterials: ['mat-nr1', 'mat-estresse', 'mat-burnout', 'mat-assedio', 'mat-respiracao', 'pal-estresse']
};
db.companies.push(company);

const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const dl = (serviceId, title, date, status, participants) => ({ id: store.id(), companyId: company.id, feedbackToken: store.token(), serviceId, title, date, time: '09:00', modality: 'Presencial', status, participants, feedbackOpen: true, materialIds: [], createdAt: new Date().toISOString() });
const talk = dl('palestra', 'Palestra – Saúde mental e a NR-1', day(-20), 'realizado', 52);
db.deliveries.push(talk, dl('roda', 'Roda de conversa – Produção', day(-6), 'realizado', 14), dl('lideranca', 'Treinamento – Liderança que cuida', day(9), 'planejado'), dl('nr1-devolutiva', 'Devolutiva dos resultados à diretoria', day(21), 'planejado'));
[5, 5, 4, 5, 4, 5, 3, 5].forEach((rating, i) => db.feedback.push({ id: store.id(), deliveryId: talk.id, rating, useful: rating, comment: i === 0 ? 'Gostei muito, linguagem acessível.' : '', date: day(-20) }));

const campaign = { id: store.id(), companyId: company.id, token: store.token(), status: 'aberta', minGroup: 5, sectors: sectors.map(s => s.name), severity: {}, actionPlan: [], conclusions: '', createdAt: new Date().toISOString(), title: 'Avaliação de riscos psicossociais – Demonstração', startDate: day(-15), endDate: day(10) };
db.campaigns.push(campaign);

// Perfis simulados: Produção com sobrecarga/jornada; Comercial com pressão por metas.
const bias = { Produção: { demandas: 1.4, jornada: 1.2, lideranca: 0.8, saude: 1 }, Comercial: { demandas: 1, reconhecimento: 1, assedio: 0.4 }, Administrativo: { papel: 0.6 }, Logística: { demandas: 1 } };
const rnd = () => Math.random();
const counts = { Produção: 22, Administrativo: 12, Comercial: 10, Logística: 3 };
for (const [sector, n] of Object.entries(counts)) {
  for (let k = 0; k < n; k++) {
    const answers = {};
    for (const it of allItems()) {
      const b = bias[sector]?.[it.dimension] || 0;
      let risk = 1 + rnd() * 2.2 + b * rnd() * 1.6; // 1..~5 em "unidades de risco"
      if (it.dimension === 'assedio' && it.exposure) risk = rnd() < 0.08 + b * 0.15 ? 2 + Math.round(rnd()) : 1;
      risk = Math.max(1, Math.min(5, Math.round(risk)));
      answers[it.id] = it.dir === 'neg' ? risk : 6 - risk;
    }
    db.responses.push({ id: store.id(), campaignId: campaign.id, sector, answers, comment: rnd() < 0.15 ? 'Precisamos de mais pausas e de reuniões para alinhar prioridades.' : '', date: day(-Math.floor(rnd() * 14)) });
  }
}
store.save();
console.log(`Dados de demonstração criados: "${company.name}" com ${Object.values(counts).reduce((a, b) => a + b)} respostas.`);
}

module.exports = seedDemo;
if (require.main === module) seedDemo();
