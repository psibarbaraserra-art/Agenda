# MindCorp · Saúde Mental Organizacional

Plataforma da **MindCorp** para entregar serviços de saúde mental às empresas clientes:
aplicar a **NR-1 (riscos psicossociais)**, organizar palestras e ações, disponibilizar materiais
digitais aos colaboradores e devolver à empresa o **relatório de avaliação de riscos psicossociais**.

> *Ciência. Estratégia. Cuidado.*

## O que o app faz

| Área | Funções |
|---|---|
| **Empresas** | Cadastro de clientes, setores e nº de pessoas por setor, contatos e canais de apoio. |
| **Agenda de serviços** | Palestras, workshops, treinamento de lideranças, rodas de conversa, plantão psicológico, SIPAT/campanhas, apoio pós-crise e etapas da NR-1. Registro de participantes e materiais usados. |
| **Avaliação de satisfação** | Cada serviço tem um link/QR Code para os participantes avaliarem (nota, utilidade e comentário, anônimo). |
| **Materiais e palestras** | 11 cartilhas/guias prontos (NR-1, estresse, burnout, ansiedade, sono, assédio, CNV, equilíbrio, guia para líderes, Setembro Amarelo, pausa de 3 minutos) e 4 roteiros de palestra com **modo apresentação** em tela cheia. Você pode criar, duplicar e editar os seus. |
| **Portal do Colaborador** | Um link + QR Code por empresa (sem login). O colaborador acessa os materiais publicados, responde à pesquisa NR-1 e avalia as palestras pelo celular. Inclui cartaz pronto para imprimir. |
| **Avaliação NR-1** | Questionário digital **anônimo** (34 afirmações, 11 dimensões), termo de consentimento (LGPD), resposta por setor, acompanhamento de adesão em tempo real. |
| **Análise e matriz de risco** | Probabilidade calculada pelas respostas × severidade ajustável pela psicóloga = nível de risco (Baixo, Moderado, Alto, Crítico). |
| **Plano de ação** | Sugestão automática de medidas para riscos moderados ou maiores; responsável, prazo e status. |
| **Relatório para a empresa** | Capa com a marca, fundamentação legal, metodologia, participação, resultados por fator, matriz 5×5, mapa de calor por setor, **inventário de riscos para o PGR**, itens críticos, plano de ação, ações realizadas, comentários e assinatura com CRP. Exporta para PDF pelo botão *Imprimir / Salvar em PDF*. |

### Sigilo e ética
- Nenhum dado identificável é coletado (sem nome, e-mail, matrícula, IP ou horário exato).
- Setores com menos de 5 respostas (valor configurável, mínimo 3) não aparecem separados no relatório; quando possível, são agrupados.
- Comentários só aparecem quando há anonimato suficiente e em ordem aleatória.
- Ao final da pesquisa o colaborador vê os canais de apoio da empresa e o CVV (188).

> O questionário é um instrumento de **rastreamento organizacional**, criado a partir dos fatores
> psicossociais descritos no guia do MTE e em modelos consagrados (demanda-controle-apoio,
> esforço-recompensa). Não é diagnóstico clínico. A interpretação final, a severidade e as
> conclusões são da psicóloga responsável. As perguntas estão em `lib/questionnaire.js` e podem ser ajustadas.

## Como rodar

Requisito: [Node.js](https://nodejs.org) 18 ou mais recente.

```bash
npm install
npm start            # abre em http://localhost:3000
```

No primeiro acesso, crie a conta da consultora (nome, CRP, e-mail e senha).

Para ver o app com dados fictícios (empresa, serviços e 47 respostas simuladas):

```bash
npm run demo         # depois: npm start
```

Testes do cálculo de risco: `npm test`.

## Como publicar na internet

Os colaboradores precisam acessar o portal pela internet, então o app deve ficar hospedado em um servidor. Opções simples:

- **Render / Railway / Fly.io**: crie um serviço web a partir deste repositório com o comando `npm start`.
  Configure um **disco persistente** e aponte a variável `DATA_DIR` para ele (ex.: `/data`), senão os dados se perdem a cada nova publicação.
- **VPS própria** (ex.: Hostinger, DigitalOcean): `npm install && npm start` com `pm2`, atrás de HTTPS (Nginx/Caddy).

Variáveis de ambiente:

| Variável | Uso |
|---|---|
| `PORT` | Porta do servidor (padrão 3000). |
| `DATA_DIR` | Pasta onde fica o banco `db.json` (padrão `./data`). **Faça backup dessa pasta.** |
| `NODE_ENV=production` | Ativa cookie seguro (exige HTTPS). |
| `TRUST_PROXY=1` | Use quando o app estiver atrás de proxy/balanceador. |

## Estrutura

```
server.js              API e rotas (Express)
lib/questionnaire.js   Questionário NR-1: dimensões, itens, severidade, perigos, agravos e medidas
lib/report.js          Cálculo de pontuação, probabilidade, matriz de risco e anonimato
lib/content.js         Catálogo de serviços, cartilhas e roteiros de palestra
lib/store.js           Banco de dados em arquivo JSON
public/                Painel da consultora (index.html, app.js) e portal do colaborador (portal.html, portal.js)
public/img/            Logo e ícone MindCorp
scripts/seed-demo.js   Dados de demonstração
test/                  Testes automatizados
```

Identidade visual: `#0D2B45` marinho · `#155E7A` petróleo · `#2DA6B0` turquesa · `#A7C7D6` azul névoa · `#F2F5F7` gelo — fonte Montserrat.
