'use strict';
/** Catálogo de serviços e materiais padrão da MindCorp. */

const SERVICES = [
  { id: 'nr1-diagnostico', name: 'Diagnóstico de Riscos Psicossociais (NR-1)', group: 'NR-1 / GRO', description: 'Aplicação digital do questionário anônimo, análise por setor e matriz de risco para o inventário do PGR.' },
  { id: 'nr1-plano', name: 'Plano de Ação e integração ao PGR', group: 'NR-1 / GRO', description: 'Definição de medidas de prevenção, responsáveis e prazos; apoio ao SESMT/RH na inclusão no PGR.' },
  { id: 'nr1-devolutiva', name: 'Devolutiva de resultados à empresa', group: 'NR-1 / GRO', description: 'Apresentação do relatório à diretoria, RH, SESMT e CIPA.' },
  { id: 'monitoramento', name: 'Monitoramento e reavaliação', group: 'NR-1 / GRO', description: 'Acompanhamento da eficácia das medidas e nova avaliação periódica.' },
  { id: 'palestra', name: 'Palestra', group: 'Educação e prevenção', description: 'Palestras de psicoeducação para colaboradores (presencial ou on-line).' },
  { id: 'workshop', name: 'Workshop / Oficina', group: 'Educação e prevenção', description: 'Encontros práticos e vivenciais em pequenos grupos.' },
  { id: 'lideranca', name: 'Treinamento de lideranças', group: 'Educação e prevenção', description: 'Capacitação de gestores em saúde mental, gestão humanizada e prevenção do assédio.' },
  { id: 'campanha', name: 'SIPAT / Campanhas (Janeiro Branco, Setembro Amarelo)', group: 'Educação e prevenção', description: 'Ações de conscientização em datas e campanhas temáticas.' },
  { id: 'roda', name: 'Roda de conversa', group: 'Cuidado e acolhimento', description: 'Espaço coletivo de escuta e troca mediado por psicóloga(o).' },
  { id: 'plantao', name: 'Plantão de escuta / acolhimento psicológico', group: 'Cuidado e acolhimento', description: 'Atendimentos breves e sigilosos de acolhimento e encaminhamento.' },
  { id: 'crise', name: 'Apoio pós-incidente / crise', group: 'Cuidado e acolhimento', description: 'Intervenção após eventos críticos (acidentes, perdas, violência).' },
  { id: 'consultoria', name: 'Consultoria para RH e políticas', group: 'Consultoria', description: 'Políticas de prevenção ao assédio, canal de denúncia, retorno ao trabalho, direito à desconexão.' }
];

const M = (id, title, category, audience, summary, body, extra = {}) => ({ id, title, category, audience, summary, body, builtin: true, ...extra });

const MATERIALS = [
  M('mat-nr1', 'NR-1 e riscos psicossociais: o que muda para você', 'Cartilha', 'Colaboradores',
    'Entenda por que a empresa está avaliando os fatores psicossociais e como você pode participar.',
`## O que é a NR-1?
A Norma Regulamentadora nº 1 trata do **Gerenciamento de Riscos Ocupacionais (GRO)**. Desde a sua atualização, as empresas devem identificar e controlar também os **fatores de risco psicossociais** – condições de organização do trabalho que podem afetar a saúde mental.

## Exemplos de fatores psicossociais
- Sobrecarga de trabalho e prazos irrealistas
- Falta de clareza sobre funções e responsabilidades
- Falta de apoio da liderança e dos colegas
- Assédio moral, sexual e discriminação
- Jornadas extensas e dificuldade de desconectar
- Falta de reconhecimento e de comunicação

## Como você participa?
- Respondendo à **pesquisa anônima** com sinceridade
- Participando das palestras, rodas de conversa e treinamentos
- Sugerindo melhorias e utilizando os canais de escuta da empresa

## Seu anonimato é garantido
A pesquisa não pede nome, e-mail ou matrícula. Os resultados são analisados pela consultoria de psicologia e apresentados apenas em grupo. **O objetivo é melhorar o trabalho, não avaliar pessoas.**`),

  M('mat-estresse', 'Estresse no trabalho: reconhecer e manejar', 'Cartilha', 'Colaboradores',
    'Sinais de estresse, diferenças entre estresse pontual e crônico e estratégias práticas.',
`## O que é o estresse?
O estresse é uma reação natural do corpo diante de desafios. Em doses pontuais, ele nos mobiliza. O problema é quando se torna **constante**, sem tempo de recuperação.

## Sinais de alerta
- **Corpo:** dores de cabeça, tensão muscular, alterações no sono e no apetite
- **Emoções:** irritabilidade, impaciência, choro fácil, sensação de estar sempre "no limite"
- **Pensamento:** dificuldade de concentração, esquecimentos, preocupação excessiva
- **Comportamento:** isolamento, aumento do consumo de álcool, cigarro ou cafeína

## Estratégias que ajudam
- Faça **pausas curtas** a cada 90 minutos: levante, alongue, beba água
- Organize as tarefas por prioridade e converse sobre prazos irreais
- Pratique a **respiração 4-4-6** (inspire 4s, segure 4s, solte 6s) por 2 minutos
- Proteja seu sono: horários regulares e telas desligadas 1h antes de dormir
- Movimente-se: 30 minutos de atividade física já fazem diferença
- Fale sobre o que está sentindo com alguém de confiança

## Quando buscar ajuda profissional
Se os sinais durarem mais de duas semanas, prejudicarem sua rotina ou se você sentir que não dá mais conta, procure um(a) psicólogo(a) ou médico(a). **Pedir ajuda é um ato de cuidado.**`),

  M('mat-burnout', 'Burnout: sinais de esgotamento profissional', 'Cartilha', 'Colaboradores',
    'O que é a síndrome de burnout, como ela se desenvolve e como prevenir.',
`## O que é burnout?
A síndrome de burnout (CID-11 QD85) é um fenômeno ligado ao trabalho, resultado de **estresse crônico que não foi gerenciado com sucesso**.

## As três dimensões
- **Exaustão:** sensação de energia esgotada, cansaço que não passa com descanso
- **Distanciamento:** cinismo, negativismo ou indiferença em relação ao trabalho
- **Redução da eficácia:** sensação de incompetência e baixa realização

## Sinais de alerta
- Acordar cansado(a) e com angústia ao pensar no trabalho
- Perder o interesse por coisas que antes davam prazer
- Adoecer com frequência
- Sentir que nada do que faz é suficiente

## Prevenção é coletiva
O burnout não é fraqueza individual: ele está relacionado à **organização do trabalho**. Por isso a empresa avalia carga, jornada, apoio e reconhecimento. Do seu lado:
- Estabeleça limites e respeite seus horários de descanso
- Comunique à liderança quando a demanda estiver acima da capacidade
- Mantenha atividades fora do trabalho que lhe façam bem
- Busque apoio profissional ao perceber os sinais`),

  M('mat-ansiedade', 'Ansiedade: entender para cuidar', 'Cartilha', 'Colaboradores',
    'Diferença entre ansiedade normal e transtorno, e técnicas de autorregulação.',
`## Ansiedade é normal?
Sim. A ansiedade nos prepara para situações importantes. Ela passa a ser um problema quando é **intensa, frequente e desproporcional**, atrapalhando a vida.

## Como ela aparece
- Coração acelerado, falta de ar, aperto no peito, tremores
- Pensamentos acelerados, sensação de que algo ruim vai acontecer
- Evitar situações por medo

## Técnica de aterramento 5-4-3-2-1
Quando a ansiedade apertar, identifique:
- **5** coisas que você vê
- **4** coisas que você pode tocar
- **3** sons que você ouve
- **2** cheiros que você sente
- **1** sabor ou algo bom sobre você

## Outras estratégias
- Respiração diafragmática: mão na barriga, inspire pelo nariz enchendo a barriga
- Reduza cafeína e energéticos
- Escreva suas preocupações e separe o que está e o que não está sob seu controle
- Procure apoio psicológico se os sintomas forem frequentes`),

  M('mat-sono', 'Sono e saúde mental', 'Cartilha', 'Colaboradores',
    'Dicas de higiene do sono para recuperar energia e equilíbrio emocional.',
`## Por que o sono importa?
Durante o sono o cérebro consolida a memória e regula as emoções. Dormir mal aumenta irritabilidade, ansiedade e risco de acidentes.

## Higiene do sono
- Durma e acorde em **horários regulares**, inclusive nos fins de semana
- Evite telas e mensagens de trabalho **1 hora antes** de dormir
- Evite cafeína após as 16h e refeições pesadas à noite
- Deixe o quarto escuro, silencioso e com temperatura agradável
- Se não dormir em 20 minutos, levante e faça algo calmo com pouca luz

## Trabalho em turnos
- Use óculos escuros ao voltar do turno noturno
- Proteja seu período de sono com cortinas blackout e combinados com a família
- Mantenha cochilos curtos (20–30 min) antes do turno`),

  M('mat-assedio', 'Assédio moral e sexual: identificar e agir', 'Cartilha', 'Colaboradores',
    'O que caracteriza assédio, exemplos e como denunciar com segurança.',
`## Assédio moral
Exposição repetitiva a situações **humilhantes e constrangedoras** no trabalho.
- Gritos, xingamentos, ironias e humilhações em público
- Isolamento proposital, retirar funções sem motivo
- Metas impossíveis como forma de punição
- Ameaças constantes de demissão

## Assédio sexual
Qualquer conduta de **natureza sexual indesejada**: comentários, convites insistentes, toques, mensagens, chantagem. Um único episódio já pode configurar assédio.

## Discriminação
Tratamento desigual por gênero, raça, idade, orientação sexual, deficiência, religião ou qualquer outra característica pessoal.

## O que fazer
- Anote datas, horários, locais, testemunhas e guarde mensagens
- Procure o **canal de denúncia** da empresa (é obrigatório pela Lei 14.457/2022)
- Converse com RH, CIPA ou alguém de confiança
- Busque apoio psicológico
- Em situações graves: Disque 180 (Central da Mulher), 100 (Direitos Humanos) ou Ministério Público do Trabalho

## Testemunhou?
Não se omita. Acolha a pessoa, ofereça-se como testemunha e incentive a denúncia.`),

  M('mat-comunicacao', 'Comunicação não violenta no dia a dia', 'Cartilha', 'Colaboradores',
    'Os 4 passos da CNV para conversas mais claras e respeitosas.',
`## Os 4 componentes da CNV
- **Observação:** descreva o fato sem julgamento. "Na reunião de hoje, fui interrompido três vezes."
- **Sentimento:** expresse o que sentiu. "Fiquei frustrado."
- **Necessidade:** diga o que é importante para você. "Preciso concluir meu raciocínio."
- **Pedido:** faça um pedido claro e possível. "Você poderia esperar eu terminar antes de comentar?"

## Escuta empática
- Ouça para compreender, não para responder
- Evite aconselhar ou minimizar ("isso não é nada")
- Reflita o que ouviu: "Pelo que entendi, você está sobrecarregado com os prazos..."

## Feedback que ajuda
Seja específico, fale do comportamento (não da pessoa), escolha o momento e o local adequados.`),

  M('mat-respiracao', 'Pausa de 3 minutos: exercícios de respiração e alongamento', 'Exercício prático', 'Colaboradores',
    'Roteiro guiado para fazer no posto de trabalho.',
`## Minuto 1 – Chegar
Sente-se com os pés apoiados no chão. Feche os olhos ou fixe o olhar em um ponto. Perceba como você está agora, sem julgar.

## Minuto 2 – Respirar
- Inspire pelo nariz contando até **4**
- Segure contando até **4**
- Solte pela boca contando até **6**
- Repita 5 vezes, sentindo a barriga subir e descer

## Minuto 3 – Alongar
- Gire os ombros para trás 5 vezes
- Incline a cabeça para cada lado, 15 segundos
- Entrelace os dedos e estique os braços à frente
- Abra e feche as mãos

**Dica:** programe um lembrete no celular para fazer essa pausa duas vezes ao dia.`),

  M('mat-equilibrio', 'Equilíbrio entre trabalho e vida pessoal', 'Cartilha', 'Colaboradores',
    'Como criar limites saudáveis e desconectar do trabalho.',
`## Por que desconectar?
Sem recuperação, o estresse se acumula. Descansar é parte do bom desempenho.

## Práticas que ajudam
- Crie um **ritual de encerramento**: revise o dia, anote pendências do dia seguinte e "feche" o trabalho
- Desative notificações de trabalho fora do horário
- Em home office, separe espaço e horários de trabalho
- Reserve tempo na agenda para família, lazer, atividade física e descanso
- Tire suas férias de verdade

## Converse com a liderança
Se mensagens e demandas fora do horário forem frequentes, isso é um **fator organizacional** que deve ser discutido e ajustado.`),

  M('mat-lider', 'Guia da liderança: saúde mental da equipe', 'Guia', 'Lideranças',
    'Papel do gestor na prevenção dos riscos psicossociais e como acolher um colaborador.',
`## O papel da liderança
A liderança é um dos principais fatores de proteção – ou de risco – para a saúde mental das equipes. Gestores influenciam carga de trabalho, clareza de papéis, reconhecimento e clima.

## Práticas de proteção
- Reuniões individuais (1:1) regulares
- Metas claras, pactuadas e possíveis
- Reconhecimento frequente e específico
- Respeito aos horários de descanso (evite mensagens fora do expediente)
- Tolerância zero com assédio e discriminação

## Como acolher alguém em sofrimento
- Escolha um local reservado e tenha tempo disponível
- **Escute sem julgar** e sem tentar resolver tudo
- Pergunte: "Como posso te ajudar?"
- Não exponha o caso a outras pessoas
- Oriente sobre os recursos: plantão psicológico, convênio, CAPS, CVV (188)
- Em risco imediato, não deixe a pessoa sozinha e acione ajuda (192)

## Sinais que merecem atenção
Mudança brusca de comportamento, isolamento, queda de desempenho, faltas frequentes, irritabilidade, falas de desesperança.`),

  M('mat-setembro', 'Setembro Amarelo: valorização da vida', 'Cartilha', 'Colaboradores',
    'Informações sobre prevenção do suicídio e onde buscar ajuda.',
`## Falar é a melhor forma de prevenir
Falar sobre sofrimento e suicídio de forma responsável **não incentiva** – abre espaço para pedir ajuda.

## Sinais de alerta
- Falas como "não aguento mais", "seria melhor sumir"
- Isolamento, despedidas, doação de objetos pessoais
- Mudanças bruscas de humor ou comportamento

## Como ajudar
- Pergunte diretamente como a pessoa está e escute com atenção
- Não julgue nem minimize
- Incentive e ajude a buscar ajuda profissional
- Em risco imediato, não deixe a pessoa sozinha

## Onde buscar ajuda
- **CVV – 188** (24h, gratuito) ou cvv.org.br
- **SAMU – 192**
- CAPS e Unidades Básicas de Saúde do seu município`),

  // Palestras: os slides são separados por uma linha contendo apenas ---
  M('pal-nr1', 'Palestra: Saúde mental e a NR-1', 'Palestra', 'Colaboradores',
    'Roteiro de 40 minutos para apresentar o programa e engajar na pesquisa.',
`# Saúde mental no trabalho
## Mentes saudáveis. Organizações fortes.
> Apresente-se e explique o papel da MindCorp na empresa.
---
# Por que falar disso?
- Transtornos mentais estão entre as principais causas de afastamento no Brasil
- Saúde mental impacta segurança, relações e qualidade de vida
- Cuidar é responsabilidade compartilhada
> Pergunte ao grupo: o que vem à cabeça quando ouvem "saúde mental"?
---
# O que diz a NR-1
- Gerenciamento de Riscos Ocupacionais (GRO)
- Inclusão dos **fatores de risco psicossociais** no PGR
- Identificar → avaliar → controlar → monitorar
---
# Fatores psicossociais
- Carga e ritmo de trabalho
- Autonomia, clareza de papel e apoio
- Reconhecimento e justiça
- Jornada e desconexão
- Assédio e violência
---
# Como vamos fazer
- Pesquisa digital **anônima** (cerca de 7 minutos)
- Análise por grupos, nunca individual
- Devolutiva e plano de ação
- Ações de cuidado: palestras, rodas de conversa, acolhimento
---
# Sua participação faz diferença
- Responda com sinceridade
- Use os canais de escuta
- Cuide de você e dos colegas
> Mostre o QR Code do Portal do Colaborador e reserve 5 minutos para responderem ali mesmo.
---
# Obrigada!
## Ciência. Estratégia. Cuidado.
- Dúvidas e perguntas
- CVV 188 · SAMU 192`),

  M('pal-estresse', 'Palestra: Estresse, ansiedade e autocuidado', 'Palestra', 'Colaboradores',
    'Roteiro psicoeducativo com exercício prático ao final.',
`# Estresse, ansiedade e autocuidado
## Ciência que orienta. Cuidado que acolhe.
---
# O estresse não é o vilão
- É uma resposta natural de adaptação
- Problema: quando é intenso e contínuo
- Sem recuperação, vira adoecimento
---
# Sinais do corpo e da mente
- Tensão, dores, alterações de sono
- Irritabilidade, preocupação constante
- Dificuldade de concentração
> Peça exemplos ao grupo (sem expor casos pessoais).
---
# Ansiedade
- Útil quando nos prepara
- Prejudicial quando paralisa
- Técnica 5-4-3-2-1 de aterramento
---
# Os pilares do autocuidado
- Sono · Movimento · Alimentação
- Relações · Pausas · Limites
- Buscar ajuda quando necessário
---
# Vamos praticar
- Respiração 4-4-6 por 2 minutos
- Alongamento de ombros e pescoço
> Conduza o exercício com calma, em voz baixa.
---
# Onde buscar ajuda
- Plantão psicológico MindCorp
- Convênio / UBS / CAPS
- CVV 188 (24h)`),

  M('pal-lideranca', 'Palestra: Liderança que cuida', 'Palestra', 'Lideranças',
    'Treinamento de 60 minutos para gestores sobre prevenção de riscos psicossociais.',
`# Liderança que cuida
## Estratégia que transforma
---
# O gestor como fator de proteção
- A forma de liderar impacta diretamente a saúde da equipe
- Apoio da liderança reduz estresse e afastamentos
- Liderar também é organizar o trabalho
---
# Riscos que a liderança influencia
- Metas e prazos
- Clareza de papéis
- Reconhecimento
- Comunicação e mudanças
- Clima e conflitos
---
# Assédio: tolerância zero
- Moral, sexual e discriminação
- Responsabilidade legal da empresa e do gestor
- Como agir diante de uma denúncia
---
# Como acolher
- Escutar sem julgar
- Perguntar: como posso ajudar?
- Sigilo e encaminhamento
- Não assumir papel de terapeuta
> Faça um role-play em duplas (5 minutos).
---
# Práticas semanais
- 1:1 com cada liderado
- Reconhecimento específico
- Respeito à desconexão
- Revisão de carga com a equipe
---
# Compromisso
- Uma ação que vou começar amanhã: ______
> Peça que cada gestor escreva e compartilhe.`),

  M('pal-assedio', 'Palestra: Respeito no trabalho – prevenção do assédio', 'Palestra', 'Colaboradores',
    'Atende à Lei 14.457/2022 (capacitação anual sobre assédio).',
`# Respeito no trabalho
## Prevenção do assédio e da discriminação
---
# Por que este tema?
- Assédio adoece pessoas e equipes
- A Lei 14.457/2022 exige ações de prevenção e canal de denúncia
- Ambiente respeitoso é responsabilidade de todos
---
# Assédio moral
- Humilhações e exposição repetidas
- Isolamento, sobrecarga punitiva, ameaças
- Pode vir de chefes, colegas ou subordinados
---
# Assédio sexual
- Conduta sexual indesejada
- Comentários, toques, mensagens, chantagem
- Um único ato pode configurar
---
# Discriminação
- Gênero, raça, idade, orientação, deficiência, religião
- Piadas "inofensivas" também ferem
---
# O que fazer
- Registrar fatos e provas
- Usar o canal de denúncia
- Buscar apoio
- Testemunhas: acolher e não se omitir
---
# Juntos por um ambiente seguro
- Canal de denúncia: ______
- Apoio psicológico: ______`)
];

module.exports = { SERVICES, MATERIALS };
