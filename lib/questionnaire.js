'use strict';
/**
 * Instrumento MindCorp de Rastreamento de Fatores de Risco Psicossociais (IMRP).
 *
 * Itens elaborados com base nos fatores de risco psicossociais descritos pela NR-1
 * (GRO/PGR – Portaria MTE nº 1.419/2024) e no "Guia de Informações sobre os Fatores
 * de Riscos Psicossociais Relacionados ao Trabalho" do MTE, e nas dimensões
 * clássicas de modelos demanda-controle-apoio, esforço-recompensa e Management
 * Standards. É um instrumento de RASTREAMENTO organizacional (não diagnóstico clínico
 * individual) – a interpretação deve ser feita pela(o) profissional responsável,
 * em conjunto com outras fontes (entrevistas, grupos focais, indicadores de RH).
 *
 * Escala de frequência (1–5): Nunca, Raramente, Às vezes, Frequentemente, Sempre.
 * Itens "neg" pontuam risco quando a frequência é alta; itens "pos" quando é baixa.
 */

const SCALE = [
  { value: 1, label: 'Nunca' },
  { value: 2, label: 'Raramente' },
  { value: 3, label: 'Às vezes' },
  { value: 4, label: 'Frequentemente' },
  { value: 5, label: 'Sempre' }
];

const DIMENSIONS = [
  {
    id: 'demandas',
    name: 'Demandas e carga de trabalho',
    severity: 4,
    hazard: 'Sobrecarga de trabalho, ritmo intenso, prazos irrealistas e exigências emocionais',
    harms: 'Estresse ocupacional, fadiga, síndrome de burnout, ansiedade, distúrbios do sono, DORT',
    items: [
      { id: 'd1', text: 'Tenho mais trabalho do que consigo realizar no horário normal.', dir: 'neg' },
      { id: 'd2', text: 'Preciso trabalhar em ritmo acelerado, sem pausas adequadas.', dir: 'neg' },
      { id: 'd3', text: 'Os prazos que recebo são realistas.', dir: 'pos' },
      { id: 'd4', text: 'Meu trabalho me expõe a situações emocionalmente desgastantes (clientes difíceis, sofrimento de outras pessoas, cobranças agressivas).', dir: 'neg' }
    ],
    actions: [
      'Revisar dimensionamento de equipes e distribuição de tarefas',
      'Estabelecer metas e prazos pactuados com a equipe, considerando capacidade real',
      'Implantar pausas programadas e respeitar intervalos legais',
      'Oferecer suporte (supervisão, rodízio, debriefing) para atividades com alta exigência emocional',
      'Monitorar horas extras e banco de horas por setor'
    ]
  },
  {
    id: 'autonomia',
    name: 'Autonomia e controle sobre o trabalho',
    severity: 3,
    hazard: 'Baixo controle sobre a forma, o ritmo e as pausas do trabalho; baixa participação nas decisões',
    harms: 'Estresse, desmotivação, sentimento de impotência, adoecimento cardiovascular associado ao estresse',
    items: [
      { id: 'a1', text: 'Tenho liberdade para decidir como realizar o meu trabalho.', dir: 'pos' },
      { id: 'a2', text: 'Posso opinar sobre mudanças que afetam o meu trabalho.', dir: 'pos' },
      { id: 'a3', text: 'Consigo fazer pausas quando preciso.', dir: 'pos' }
    ],
    actions: [
      'Ampliar a participação dos trabalhadores no planejamento das atividades',
      'Criar canais de sugestão com devolutiva (ex.: reuniões de equipe, comitês)',
      'Flexibilizar, quando possível, a organização de pausas e da sequência das tarefas'
    ]
  },
  {
    id: 'papel',
    name: 'Clareza de papel e funções',
    severity: 3,
    hazard: 'Falta de clareza sobre funções, responsabilidades e expectativas; orientações conflitantes',
    harms: 'Estresse, ansiedade, conflitos interpessoais, retrabalho e erros',
    items: [
      { id: 'p1', text: 'Sei exatamente o que é esperado de mim no trabalho.', dir: 'pos' },
      { id: 'p2', text: 'Recebo orientações contraditórias de pessoas diferentes.', dir: 'neg' },
      { id: 'p3', text: 'Minhas responsabilidades e limites de atuação são bem definidos.', dir: 'pos' }
    ],
    actions: [
      'Revisar e divulgar descrições de cargo e fluxos de trabalho',
      'Definir claramente a cadeia de comando e quem prioriza as demandas',
      'Realizar reuniões de alinhamento periódicas entre liderança e equipe'
    ]
  },
  {
    id: 'lideranca',
    name: 'Apoio e relação com a liderança',
    severity: 4,
    hazard: 'Falta de suporte da liderança, feedback inadequado, gestão autoritária ou desrespeitosa',
    harms: 'Estresse, ansiedade, depressão, desengajamento, rotatividade e absenteísmo',
    items: [
      { id: 'l1', text: 'Posso contar com a minha liderança quando tenho problemas no trabalho.', dir: 'pos' },
      { id: 'l2', text: 'Recebo feedback útil e respeitoso sobre o meu desempenho.', dir: 'pos' },
      { id: 'l3', text: 'Minha liderança me trata com respeito.', dir: 'pos' }
    ],
    actions: [
      'Programa de desenvolvimento de lideranças em gestão humanizada e saúde mental',
      'Implantar rotina de conversas individuais (1:1) e feedback estruturado',
      'Incluir indicadores de clima e bem-estar na avaliação das lideranças'
    ]
  },
  {
    id: 'colegas',
    name: 'Relações interpessoais e apoio dos colegas',
    severity: 3,
    hazard: 'Conflitos interpessoais, clima tenso, isolamento e falta de cooperação',
    harms: 'Estresse, sofrimento psíquico, isolamento social, adoecimento mental',
    items: [
      { id: 'c1', text: 'Recebo ajuda dos colegas quando preciso.', dir: 'pos' },
      { id: 'c2', text: 'Há conflitos frequentes ou clima tenso na minha equipe.', dir: 'neg' },
      { id: 'c3', text: 'Sinto que faço parte da equipe.', dir: 'pos' }
    ],
    actions: [
      'Rodas de conversa e workshops de comunicação não violenta',
      'Mediação de conflitos com apoio profissional',
      'Ações de integração e fortalecimento do trabalho em equipe'
    ]
  },
  {
    id: 'reconhecimento',
    name: 'Reconhecimento, recompensas e desenvolvimento',
    severity: 3,
    hazard: 'Desequilíbrio entre esforço e recompensa, falta de reconhecimento e de perspectivas de crescimento',
    harms: 'Desmotivação, estresse crônico, depressão, burnout, rotatividade',
    items: [
      { id: 'r1', text: 'Meu trabalho é reconhecido e valorizado.', dir: 'pos' },
      { id: 'r2', text: 'Considero justa a forma como promoções, bonificações e benefícios são distribuídos.', dir: 'pos' },
      { id: 'r3', text: 'Tenho oportunidades de aprendizado e crescimento profissional.', dir: 'pos' }
    ],
    actions: [
      'Estruturar práticas de reconhecimento (formais e informais)',
      'Dar transparência aos critérios de promoção, bonificação e mérito',
      'Criar trilhas de desenvolvimento e plano de carreira'
    ]
  },
  {
    id: 'justica',
    name: 'Justiça e comunicação organizacional',
    severity: 3,
    hazard: 'Comunicação deficiente, decisões percebidas como injustas, falta de transparência',
    harms: 'Estresse, insegurança, conflitos, perda de confiança e adoecimento mental',
    items: [
      { id: 'j1', text: 'As decisões da empresa são comunicadas de forma clara.', dir: 'pos' },
      { id: 'j2', text: 'Sou informado(a) com antecedência sobre mudanças que me afetam.', dir: 'pos' },
      { id: 'j3', text: 'Os problemas e conflitos são resolvidos de forma justa.', dir: 'pos' }
    ],
    actions: [
      'Definir plano de comunicação interna com periodicidade e canais claros',
      'Comunicar previamente mudanças e seus motivos, abrindo espaço para dúvidas',
      'Padronizar procedimentos para tratamento de conflitos e reclamações'
    ]
  },
  {
    id: 'jornada',
    name: 'Jornada e equilíbrio trabalho–vida pessoal',
    severity: 4,
    hazard: 'Jornadas extensas, trabalho fora do horário, dificuldade de desconexão',
    harms: 'Fadiga crônica, distúrbios do sono, burnout, conflitos familiares',
    items: [
      { id: 'w1', text: 'O trabalho invade meu tempo de descanso (mensagens, ligações, horas extras).', dir: 'neg' },
      { id: 'w2', text: 'Consigo conciliar trabalho e vida pessoal/familiar.', dir: 'pos' },
      { id: 'w3', text: 'Consigo me desconectar do trabalho no fim do expediente.', dir: 'pos' }
    ],
    actions: [
      'Instituir política de direito à desconexão (mensagens fora do horário)',
      'Controlar jornada, horas extras e garantir descanso semanal e férias',
      'Avaliar possibilidades de flexibilidade de horário'
    ]
  },
  {
    id: 'mudancas',
    name: 'Segurança no emprego e gestão de mudanças',
    severity: 3,
    hazard: 'Insegurança quanto à manutenção do emprego; mudanças organizacionais mal conduzidas',
    harms: 'Ansiedade, estresse, insônia, queda de desempenho',
    items: [
      { id: 'm1', text: 'Preocupo-me com a possibilidade de perder o emprego.', dir: 'neg' },
      { id: 'm2', text: 'Mudanças na organização acontecem sem preparo ou apoio às pessoas.', dir: 'neg' }
    ],
    actions: [
      'Planejar a gestão de mudanças com comunicação transparente e apoio às equipes',
      'Oferecer espaços de escuta em períodos de reestruturação',
      'Capacitar lideranças para conduzir mudanças'
    ]
  },
  {
    id: 'assedio',
    name: 'Assédio, violência e discriminação',
    severity: 5,
    prevalence: true,
    hazard: 'Assédio moral, assédio sexual, violência, discriminação e ausência de canais seguros de denúncia',
    harms: 'Transtornos de ansiedade, depressão, TEPT, ideação suicida, adoecimento grave',
    items: [
      { id: 'h1', text: 'Fui alvo de humilhações, gritos, ameaças ou ofensas no trabalho.', dir: 'neg', exposure: true },
      { id: 'h2', text: 'Sofri comentários, contatos ou propostas de cunho sexual indesejados no trabalho.', dir: 'neg', exposure: true },
      { id: 'h3', text: 'Sofri tratamento discriminatório (gênero, raça, idade, orientação sexual, deficiência, religião ou outro).', dir: 'neg', exposure: true },
      { id: 'h4', text: 'Sinto-me seguro(a) para relatar situações de assédio sem medo de retaliação.', dir: 'pos' }
    ],
    actions: [
      'Implantar/revisar política de prevenção e combate ao assédio e à violência (Lei 14.457/2022)',
      'Garantir canal de denúncia sigiloso, com apuração e proteção contra retaliação',
      'Treinamento obrigatório sobre assédio para todos, com reforço para lideranças',
      'Acolhimento psicológico às pessoas afetadas'
    ]
  },
  {
    id: 'saude',
    name: 'Indicadores de saúde e bem-estar (efeitos)',
    severity: 4,
    hazard: 'Sinais de sofrimento psíquico relacionados ao trabalho (indicador de efeito dos demais fatores)',
    harms: 'Esgotamento profissional (burnout), ansiedade, depressão, afastamentos',
    items: [
      { id: 's1', text: 'Sinto-me esgotado(a) emocionalmente por causa do trabalho.', dir: 'neg' },
      { id: 's2', text: 'Tenho dificuldade para dormir por preocupações com o trabalho.', dir: 'neg' },
      { id: 's3', text: 'Sinto-me tenso(a), irritado(a) ou ansioso(a) por causa do trabalho.', dir: 'neg' }
    ],
    actions: [
      'Disponibilizar acolhimento/plantão psicológico e encaminhamento à rede (CAPS, UBS, convênio)',
      'Ações de psicoeducação: manejo do estresse, sono, sinais de burnout',
      'Monitorar absenteísmo, afastamentos (CID F) e reavaliar em 6 meses'
    ]
  }
];

const INTRO = {
  title: 'Avaliação de Fatores Psicossociais no Trabalho',
  text: [
    'Esta pesquisa faz parte do Gerenciamento de Riscos Ocupacionais da empresa, conforme a NR-1, e tem como objetivo identificar condições de trabalho que possam afetar a saúde mental e o bem-estar das pessoas.',
    'A participação é voluntária e ANÔNIMA: não pedimos nome, e-mail, matrícula ou qualquer dado que identifique você. Os resultados são analisados pela consultoria de psicologia e apresentados à empresa apenas de forma agrupada, nunca individual (grupos com menos de 5 respostas não são exibidos separadamente).',
    'Responda pensando nos últimos 3 meses de trabalho. Não existem respostas certas ou erradas. O tempo médio é de 7 minutos.'
  ],
  consent: 'Li as informações acima e concordo em participar de forma voluntária e anônima (LGPD – Lei 13.709/2018).'
};

const SUPPORT_MESSAGE = 'Se você estiver passando por um momento difícil, procure ajuda. O CVV atende gratuitamente 24h pelo telefone 188 ou em cvv.org.br. Em emergências, ligue 192 (SAMU).';

function allItems() {
  return DIMENSIONS.flatMap(d => d.items.map(i => ({ ...i, dimension: d.id })));
}

/** Versão do questionário enviada ao colaborador (sem severidade/ações). */
function publicQuestionnaire() {
  return {
    intro: INTRO,
    scale: SCALE,
    support: SUPPORT_MESSAGE,
    dimensions: DIMENSIONS.map(d => ({ id: d.id, name: d.name, items: d.items.map(i => ({ id: i.id, text: i.text })) }))
  };
}

module.exports = { SCALE, DIMENSIONS, INTRO, SUPPORT_MESSAGE, allItems, publicQuestionnaire };
