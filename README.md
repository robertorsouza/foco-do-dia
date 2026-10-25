# Foco do Dia

Planner diário para pessoas com TDAH: checklist por turno, alertas na troca de turno e IA que ajuda a fechar o dia e replanejar o que ficou pendente.

> Mini projeto de Engenharia de Software com IA generativa (especialização AKCIT/UFG), construído com boas práticas (requisitos, ADRs, testes, CI) e IA como copiloto. React + Tailwind, Node.js e PostgreSQL.

**Status:** backend e frontend prontos e testados ponta a ponta. Deploy (Vercel + Render + Neon) em andamento. Este README será completado na entrega final.

**Design:** [protótipo clicável no Figma](https://www.figma.com/design/gHPzXZSxynPrBNYvhBu8Gp) · [jornadas do usuário](docs/jornadas.md)

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Requisitos](docs/requisitos.md) | Problema, regras de negócio, histórias com critérios Gherkin, requisitos não funcionais |
| [Arquitetura](docs/arquitetura.md) | Diagramas C4, camadas, modelo de dados, contrato da API, fluxos, segurança, implantação |
| [ADRs](docs/adr/) | Decisões: stack, banco de dados, regra × IA nos alertas, ferramentas de IA |
| [Prompts](docs/prompts.md) | Biblioteca de prompts P-01 a P-09, com técnicas e versões |
| [Uso de IA](docs/uso-de-ia.md) | Política, decisões (aceitei / ajustei / rejeitei), revisões e diário de integração |
| [Jornadas](docs/jornadas.md) | Jornadas do usuário com o que pode e o que não pode, popups de confirmação e link do protótipo no Figma |
| [Relatório de QA](docs/relatorio-qa.md) | Resultado da revisão por área, cobertura dos testes e portão de QA a executar após o deploy |

## Backend: como rodar

Pré-requisitos: Node.js 22 e, para rodar a API, um PostgreSQL.

```bash
cd backend
npm install
npm test                 # 120 testes, com banco em memória (não precisa de PostgreSQL)
cp .env.example .env     # preencha DATABASE_URL
npm run migrate          # cria as tabelas
npm run dev              # API em http://localhost:3000
```

## Frontend: como rodar

```bash
cd frontend
npm install
npm test                 # 49 testes das jornadas, sem precisar do backend
cp .env.example .env     # VITE_API_URL aponta para a API
npm run dev              # app em http://localhost:5173
```

Ou, da raiz do projeto: `make help`.

Para rodar os testes também num PostgreSQL real: `TEST_DATABASE_URL=postgresql://... npm test`.

## Limitações conhecidas (MVP)

- **Um único usuário.** Não há login: o acesso à API publicada é protegido por um código (RNF-10).
- **Limite de requisições em memória:** vale para uma instância (plano gratuito do Render). Ao escalar, usar Redis.
- **Fechamento automático:** acontece na primeira abertura do app no dia seguinte, não às 23h exatas (RN-07).
- **Alertas só com o app aberto:** notificação no celular com o app fechado fica para depois.
- **Banco gratuito no Neon:** dorme após 5 minutos sem uso, então a primeira consulta do dia é mais lenta.

## Licença

[MIT](LICENSE)
