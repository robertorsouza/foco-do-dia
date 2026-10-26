# Foco do Dia

[![CI](https://github.com/robertorsouza/foco-do-dia/actions/workflows/ci.yml/badge.svg)](https://github.com/robertorsouza/foco-do-dia/actions/workflows/ci.yml)
![Versão](https://img.shields.io/badge/vers%C3%A3o-v1.0.0-141414)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-141414)

Planner diário para pessoas com TDAH: o dia dividido em manhã, tarde e noite, um alerta antes de cada turno acabar e um fechamento do dia sem culpa.

**Acesse:** https://foco-do-dia.vercel.app · o código de acesso é enviado junto com a entrega.

> Mini projeto da especialização **Engenharia de Software com IA Generativa** (AKCIT/UFG). Feito com práticas de engenharia (requisitos, arquitetura, ADRs, TDD, CI e revisão de código) e IA generativa como copiloto em todas as etapas.

**Design:** [protótipo clicável no Figma](https://www.figma.com/design/gHPzXZSxynPrBNYvhBu8Gp) · [jornadas do usuário](docs/jornadas.md) · **Vídeo de demonstração:** _(link a incluir)_

---

## O problema

Pessoas com TDAH costumam planejar mais do que conseguem fazer e, no fim do dia, ficam com uma lista de pendências e a sensação de fracasso. Listas de tarefas comuns cobram tudo de uma vez e não ajudam a decidir o que fazer com o que sobrou.

O Foco do Dia reduz o dia a **um turno de cada vez**, avisa quando o turno está acabando e, no fim do dia, **pergunta** para onde vai cada pendência, com uma sugestão pronta. Ele nunca bloqueia nem pune. Detalhes em [Requisitos](docs/requisitos.md).

## Funcionalidades

- **Turnos:** atividades em manhã (até 12h), tarde (12h–18h) e noite (18h–23h), com as urgentes no topo.
- **Alerta de fim de turno:** 15 minutos antes do fim, e só se houver pendências. Dá para marcar o que já fez ou levar para o próximo turno.
- **Mover com "Desfazer":** levar para o próximo turno ou para amanhã, com 6 segundos para voltar atrás.
- **Fechar o dia:** cada pendência já vem com o destino sugerido. O app pergunta antes de fechar; se a pessoa não fechar, o dia fecha sozinho na primeira abertura do dia seguinte.
- **Atividades pendentes:** o que ficou sem destino espera numa seção separada dos turnos, para trazer para hoje ou deixar de lado.
- **Relatórios:** do dia (por turno, o que foi movido, sugestão de virar atividade fixa) e da semana (os últimos 7 dias).
- **Dias anteriores:** só para consulta, sem edição.
- **Confirmação só no que não dá para desfazer:** excluir, deixar de lado, fechar o dia e tornar fixa.

## Capturas

Tiradas do teste ponta a ponta: app no navegador, backend e PostgreSQL reais, com uma semana de dados.

![Entrar, Hoje, menu da atividade, aviso e alerta de fim de turno](docs/design/capturas/01-entrar-hoje-menu-alerta.png)
![Pendências, fechar o dia, confirmação, dia fechado e relatório](docs/design/capturas/02-pendentes-fechar-dia-relatorio.png)
![Tornar fixa, semana, dia anterior, aviso de histórico, Fixas e excluir](docs/design/capturas/03-fixa-semana-historico-excluir.png)

## Arquitetura

```mermaid
flowchart LR
    U["Pessoa usuária<br/>(celular ou computador)"] --> FE["Frontend<br/>React + Tailwind<br/>Vercel"]
    FE -- "HTTPS + código de acesso" --> API["Backend<br/>Node 22 + Express<br/>Render · Ohio"]
    API --> DB[("PostgreSQL<br/>Neon · Ohio")]
    API -. "só o texto do relatório<br/>(opcional)" .-> IA["API de IA<br/>Claude"]
```

- O **frontend** só mostra e captura ações; **todas as regras ficam no backend**, onde são testadas.
- A **IA nunca decide**: quem decide alertas e destinos é a regra de negócio (ADR-003). A IA só escreve o texto do relatório; sem ela, o app usa uma mensagem padrão.
- Backend e banco ficam na mesma região (Ohio), para a conversa entre eles ser rápida.

Diagramas C4, modelo de dados, contrato da API, fluxos e segurança: [Arquitetura](docs/arquitetura.md). Decisões: [ADRs](docs/adr/).

| Camada    | Tecnologia                                                                  |
| --------- | --------------------------------------------------------------------------- |
| Frontend  | React 19, Tailwind CSS 4, Vite 8                                            |
| Backend   | Node.js 22, Express 5, Zod (validação), Helmet, limite de requisições       |
| Banco     | PostgreSQL (Neon)                                                           |
| Testes    | Vitest, Testing Library, Supertest, pg-mem + PostgreSQL 16 real, Playwright |
| Qualidade | ESLint (com regras de segurança), Prettier, GitHub Actions                  |

## Como a IA acelerou este projeto

O autor é product designer, não desenvolvedor. A IA foi copiloto do requisito ao deploy, com **papéis separados** para que nenhuma IA revisasse o próprio trabalho ([ADR-004](docs/adr/ADR-004-ferramentas-de-ia.md)):

| Papel             | Quem                | O que fez                                                                                                                          |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Construir         | Claude              | Requisitos em Gherkin, arquitetura, telas no Figma, código com TDD, testes e documentação, explicando cada passo                   |
| Revisar           | GitHub Copilot      | Revisão de segurança e de QA dos Pull Requests, com prompts próprios ([P-05, P-08](docs/prompts.md))                               |
| Revisar sem viés  | Agente independente | Revisão de quem não escreveu o código ([P-09](docs/prompts.md)): achou 4 bugs de concorrência que as revisões anteriores não viram |
| Auditar e decidir | Autor               | Aceitou, ajustou ou rejeitou cada sugestão, e registrou o motivo                                                                   |

**O que deu certo:** velocidade com rastreabilidade. Cada decisão está num commit, num PR e no [registro de uso de IA](docs/uso-de-ia.md).

**O que exigiu cuidado:** a IA sugeriu SQLite sem pensar no deploy, declarou o backend pronto antes da hora e, como revisora, chegou a analisar uma versão antiga do código. Por isso, **nada entrou na `main` sem PR, CI verde e decisão do autor**.

Tudo está documentado: [biblioteca de prompts](docs/prompts.md) (P-01 a P-09, com versões), [uso de IA](docs/uso-de-ia.md) (decisões, 6 rodadas de revisão, diário de integração e lições aprendidas).

## Qualidade

| O quê              | Como                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Testes do backend  | 120, rodados no banco em memória **e** num PostgreSQL 16 real (concorrência incluída); cobertura acima de 90%     |
| Testes do frontend | 49, um conjunto por jornada (J1–J9): o que o app envia para a API e o que mostra, incluindo XSS e a API recusando |
| Ponta a ponta      | Playwright no navegador, com backend e banco reais                                                                |
| CI                 | 2 jobs a cada PR: lint com regras de segurança, formatação, testes com cobertura mínima e build                   |
| Revisões           | 6 rodadas: segurança, auditoria, lógica, independente e duas de QA do frontend                                    |
| Ambiente publicado | [Portão de QA](docs/relatorio-qa.md) executado no sistema no ar                                                   |

## Como rodar localmente

Pré-requisitos: **Node.js 22** e, para a API, um **PostgreSQL**. Da raiz, `make help` lista os atalhos.

**Backend**

```bash
cd backend
npm install
npm test                 # 120 testes, com banco em memória (não precisa de PostgreSQL)
cp .env.example .env     # preencha as variáveis (tabela abaixo)
npm run migrate          # cria as tabelas
npm run dev              # API em http://localhost:3000
```

Para rodar os testes também num PostgreSQL real: `TEST_DATABASE_URL=postgresql://... npm test`.

**Frontend**

```bash
cd frontend
npm install
npm test                 # 49 testes das jornadas, sem precisar do backend
cp .env.example .env     # VITE_API_URL aponta para a API
npm run dev              # app em http://localhost:5173
```

### Variáveis de ambiente

**Backend** (`backend/.env`; no Render, em Environment)

| Variável           | Obrigatória | Exemplo                                                 | Para que serve                                                                                   |
| ------------------ | ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`         | sim         | `production`                                            | Fora de `development` ou `test`, as proteções abaixo são exigidas (o servidor não sobe sem elas) |
| `DATABASE_URL`     | sim         | `postgresql://usuario:senha@host/banco?sslmode=require` | Endereço do PostgreSQL                                                                           |
| `APP_ACCESS_TOKEN` | em produção | 12 caracteres ou mais                                   | Código que a pessoa digita no app                                                                |
| `FRONTEND_URL`     | em produção | `https://foco-do-dia.vercel.app`                        | Domínio autorizado a chamar a API (CORS); vários separados por vírgula                           |
| `TZ_APP`           | não         | `America/Sao_Paulo`                                     | Fuso dos turnos e da virada do dia                                                               |
| `DB_SSL`           | não         | vazio                                                   | Vazio verifica o certificado do banco; `disable` só para banco local                             |
| `LLM_API_KEY`      | não         | chave da Anthropic                                      | Texto do relatório pela IA; sem ela, mensagem padrão                                             |
| `LLM_MODEL`        | não         | `claude-haiku-5-5`                                      | Modelo usado no relatório                                                                        |
| `PORT`             | não         | `3000`                                                  | Porta local (o Render define sozinho)                                                            |

**Frontend** (`frontend/.env`; na Vercel, em Environment Variables)

| Variável       | Obrigatória | Exemplo                            | Para que serve                                   |
| -------------- | ----------- | ---------------------------------- | ------------------------------------------------ |
| `VITE_API_URL` | sim         | `https://foco-do-dia.onrender.com` | Endereço da API, sem `/api` e sem barra no final |

## Exemplos da API

Todas as rotas, exceto `/api/health`, pedem o código no cabeçalho `Authorization`. Contrato completo: [Arquitetura, seção 5](docs/arquitetura.md).

```bash
API=https://foco-do-dia.onrender.com
CODIGO=seu-codigo-de-acesso

# Está no ar? (não pede código)
curl $API/api/health
# {"status":"ok"}

# O dia de hoje, por turno
curl -H "Authorization: Bearer $CODIGO" $API/api/hoje

# Criar uma atividade urgente na tarde
curl -X POST -H "Authorization: Bearer $CODIGO" -H "Content-Type: application/json" \
  -d '{"titulo":"Pagar conta de luz","turno":"tarde","prioridade":"urgente"}' \
  $API/api/atividades

# Sem código: recusado
curl $API/api/hoje
# {"erro":"Código de acesso inválido."}
```

## Estrutura do repositório

```
foco-do-dia/
├── backend/            API: Node + Express
│   ├── src/
│   │   ├── routes/     recebe a requisição e valida a entrada (Zod)
│   │   ├── services/   regras de negócio (turnos, fechamento, relatórios)
│   │   ├── db/         PostgreSQL: conexão, esquema e consultas
│   │   └── ai/         cliente da IA e validação da resposta
│   └── tests/          120 testes
├── frontend/           app: React + Tailwind
│   ├── src/
│   │   ├── api/        cliente HTTP e uma função por endpoint
│   │   ├── components/ botões, popups, avisos (espelhando o Figma)
│   │   ├── pages/      uma por tela do protótipo
│   │   └── lib/        datas, textos dos turnos, sessão
│   ├── tests/          49 testes das jornadas
│   └── vercel.json     cabeçalhos de segurança (CSP)
├── docs/               requisitos, arquitetura, ADRs, prompts, uso de IA, jornadas, QA, design
├── .github/workflows/  CI
└── Makefile            atalhos (make help)
```

## Documentação

| Documento                               | Conteúdo                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Requisitos](docs/requisitos.md)        | Problema, regras de negócio, histórias com critérios Gherkin, requisitos não funcionais, visão pós-MVP |
| [Arquitetura](docs/arquitetura.md)      | Diagramas C4, camadas, modelo de dados, contrato da API, fluxos, segurança, implantação                |
| [ADRs](docs/adr/)                       | Decisões: stack, banco de dados, regra × IA nos alertas, ferramentas de IA                             |
| [Jornadas](docs/jornadas.md)            | Jornadas J1–J9 com o que pode e o que não pode, e os popups de confirmação                             |
| [Prompts](docs/prompts.md)              | Biblioteca de prompts P-01 a P-09, com técnicas e versões                                              |
| [Uso de IA](docs/uso-de-ia.md)          | Política, decisões (aceitei / ajustei / rejeitei), revisões, diário de integração e lições aprendidas  |
| [Relatório de QA](docs/relatorio-qa.md) | Revisão por área, cobertura dos testes e portão de QA no ambiente publicado                            |
| [CHANGELOG](CHANGELOG.md)               | O que mudou em cada versão                                                                             |

## Onde está publicado

| Parte | Serviço                 | Endereço                                    |
| ----- | ----------------------- | ------------------------------------------- |
| App   | Vercel                  | https://foco-do-dia.vercel.app              |
| API   | Render (Ohio)           | https://foco-do-dia.onrender.com/api/health |
| Banco | Neon, PostgreSQL (Ohio) | privado                                     |

Cada merge na `main` publica sozinho, depois de passar no CI. Detalhes em [Arquitetura, seção 10](docs/arquitetura.md).

## Limitações conhecidas (MVP)

- **Um único usuário.** Não há cadastro nem login: o acesso é protegido por um código (RNF-10). Quem tiver o código vê os mesmos dados.
- **Servidor gratuito dorme:** a primeira abertura do dia pode levar até 1 minuto ("Acordando o app…").
- **Fechamento automático:** acontece na primeira abertura do app no dia seguinte, não às 23h exatas (RN-07).
- **Alertas só com o app aberto:** notificação no celular com o app fechado fica para depois.
- **IA desligada na versão publicada:** sem `LLM_API_KEY`, o relatório usa a mensagem padrão.
- **Limite de requisições em memória:** vale para uma instância (plano gratuito). Ao escalar, usar Redis.
- **Fixas:** a tela de gestão fica para a próxima versão; no MVP, fixas são criadas pela sugestão do relatório.

## Autor

**Roberto Souza**, product designer. Mini projeto da especialização **Engenharia de Software com IA Generativa**, AKCIT/UFG, entregue em outubro de 2026.

## Licença

[MIT](LICENSE)
