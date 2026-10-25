# Relatório de QA — Backend

> **Projeto:** Foco do Dia · **Repositório:** [robertorsouza/foco-do-dia](https://github.com/robertorsouza/foco-do-dia) · **Escopo:** API do backend
> **Versão:** 1.0 · 25/10/2026 · **Responsável:** Roberto
> **Uso de IA:** compilado a partir de duas análises de QA do GitHub Copilot Chat, cruzadas com a revisão independente e a suíte de testes do projeto (`docs/uso-de-ia.md`).
> **Quando usar:** depois que o frontend estiver pronto e o sistema publicado (Vercel + Render + Neon). É o portão de qualidade antes da entrega.

---

## 1) Resumo executivo

O backend tem estrutura sólida para um MVP: regras de negócio explícitas, validação de entrada, camada de banco isolada, controle de acesso e testes automatizados que rodam no banco em memória e num PostgreSQL real. A separação entre app, rotas, serviços e repositório facilita manutenção e testes.

O estado atual é **apto para testes de pré-produção**, mas não "pronto para produção sem mais testes". O que falta não é refazer nada, e sim **confirmar no ambiente real** o que os testes automáticos já cobrem em ambiente controlado.

| Item | Avaliação |
| --- | --- |
| Status | Apto para revisão e testes de pré-produção |
| Maturidade | Boa para MVP / alpha |
| Risco principal | Ambiente real: variáveis, proxy, fuso horário e IA em produção |
| Recomendação | Executar o portão de QA (seção 7) depois do frontend e do deploy |

**O que mudou depois das análises do Copilot:** vários riscos apontados como críticos foram tratados no PR #4 (revisão independente). Esta versão do relatório marca, item por item, o que **já está coberto por teste automático** e o que **ainda precisa de validação manual** no ambiente publicado.

---

## 2) Escopo revisado

- Autenticação e segurança
- Rotas da API
- Regras de negócio dos dias e atividades
- Persistência e transações
- Relatórios diários e semanais
- IA para sugestões do relatório
- Testes automatizados

## 3) Critérios de avaliação

- Integridade funcional
- Segurança
- Tratamento de erros
- Consistência das regras de negócio
- Observabilidade de falhas
- Robustez em cenários reais

---

## 4) Resultado da revisão

| Área | Status | Risco | Observações | A validar no ambiente real |
| --- | --- | --- | --- | --- |
| A. Estrutura e arquitetura | Bom | Baixo | Camadas separadas; API organizada por rotas e serviços; repositório isolado; código legível e documentado | — |
| B. Segurança | Bom | Médio | CORS fechado por padrão; limite de requisições; código de acesso obrigatório fora de ambiente local (falha fechada, PR #4); SQL parametrizado; TLS do banco verificado; limite de 20 KB no corpo | CORS com o domínio real da Vercel; código de acesso; `trust proxy` atrás do Render; logs sem dados sensíveis |
| C. Regras de negócio | Bom | Médio | Criação, edição, exclusão e movimentação definidas (RN-01 a RN-14); estados `pendente`, `feita`, `movida`, `deixada_de_lado`, `em_aberto` coerentes; fechamento automático dos dias anteriores | Virada de dia e fuso horário com o servidor em UTC |
| D. Persistência e transações | Bom | Médio | Fechamento atômico (`UPDATE ... WHERE fechado_em IS NULL`); troca de status condicional contra toque duplo (PR #4); destinos validados antes de gravar; testes de concorrência no PostgreSQL real no CI | Comportamento com o Neon (banco que dorme após 5 min) |
| E. Relatórios e IA | Bom, com ressalvas | Médio | IA só para mensagem e atividades parecidas; regras objetivas no código; fallback sem IA; validação contra alucinação, tom punitivo e injeção de prompt; tempo limite de 10 s no total | Latência real da IA; chave inválida ou sem crédito |

> As análises do Copilot classificaram a área D como risco **alto**. Ela foi rebaixada para **médio** porque os quatro cenários apontados (fechamento simultâneo, desfazer transação, reabertura do dia, atualização simultânea da mesma atividade) passaram a ter teste no PostgreSQL real, executado no CI a cada Pull Request.

---

## 5) Testes de QA por área

Legenda:
- ✅ **Automático:** coberto por teste que roda no CI (arquivo indicado).
- ⏳ **Manual:** validar no ambiente publicado, depois do frontend.
- Em itens com ✅, a validação manual é opcional e serve de confirmação.

### A. Infra e configuração
Status: **necessário validar no deploy**

| # | Teste | Cobertura | Como testar | Resultado |
| --- | --- | --- | --- | --- |
| A1 | Backend inicia com as variáveis corretas | ⏳ | Painel do Render → Logs: aparece "Banco atualizado." e "Foco do Dia API em…" | [ ] |
| A2 | `DATABASE_URL` aponta para o Neon | ⏳ | Render → Environment | [ ] |
| A3 | `FRONTEND_URL` igual ao domínio da Vercel | ⏳ | Render → Environment; comparar com a URL do frontend | [ ] |
| A4 | `APP_ACCESS_TOKEN` com 12+ caracteres | ⏳ | Render → Environment | [ ] |
| A5 | `NODE_ENV=production` definido | ⏳ | Render → Environment | [ ] |
| A6 | Servidor se recusa a subir com variável faltando | ✅ `seguranca.test.js`, `revisao-independente.test.js` | Opcional: remover uma variável no Render e ver o erro no log | [ ] |
| A7 | TLS do banco aplicado (`DB_SSL` vazio = verificar certificado) | ✅ `seguranca.test.js` | Log sem o aviso "certificado do banco NÃO está sendo verificado" | [ ] |
| A8 | Migração roda sozinha no primeiro deploy | ⏳ | Log do Render mostra "Banco atualizado." antes de subir | [ ] |
| A9 | `/api/health` responde 200 | ✅ `api.test.js` | Abrir `https://<api>.onrender.com/api/health` no navegador | [ ] |

Resultado esperado: o serviço sobe sem falhas e responde corretamente no ambiente real.

### B. Segurança
Status: **coberto por testes; confirmar no ambiente real**

| # | Teste | Cobertura | Como testar | Resultado |
| --- | --- | --- | --- | --- |
| B1 | Sem código de acesso → 401 | ✅ `seguranca.test.js` | Abrir `/api/hoje` direto no navegador | [ ] |
| B2 | Código inválido → 401 | ✅ `seguranca.test.js` | No app, digitar um código errado | [ ] |
| B3 | Código válido → acesso liberado | ✅ `seguranca.test.js` | No app, digitar o código certo | [ ] |
| B4 | CORS bloqueia origem não permitida | ✅ `seguranca.test.js` | Opcional: chamar a API de outro site | [ ] |
| B5 | CORS permite o domínio do frontend | ✅ `seguranca.test.js` | O app da Vercel carrega os dados sem erro de CORS no console | [ ] |
| B6 | Limite de requisições (300 a cada 15 min) | ✅ `seguranca.test.js` | — | [ ] |
| B7 | Bloqueio após 10 códigos errados | ✅ `seguranca.test.js` | Opcional: errar o código 11 vezes no app | [ ] |
| B8 | O código de acesso não aparece nos logs | ⏳ | Render → Logs: procurar o valor do código | [ ] |
| B9 | Cabeçalhos de segurança (Helmet) em produção | ✅ `seguranca.test.js` | Navegador → DevTools → Network → resposta da API | [ ] |
| B10 | Respostas 401, 422, 429 e 500 com mensagem curta em português | ✅ `api.test.js`, `seguranca.test.js` | — | [ ] |

Resultado esperado: a API não fica exposta e continua estável sob abuso.

### C. Atividades
Status: **aprovado em testes automatizados**

| # | Teste | Cobertura | Resultado |
| --- | --- | --- | --- |
| C1 | Criar atividade válida | ✅ `api.test.js` | [ ] |
| C2 | Título vazio → 422 | ✅ `api.test.js` | [ ] |
| C3 | Título com 81 caracteres → 422 | ✅ `api.test.js` | [ ] |
| C4 | Turno inexistente → 422 | ✅ `api.test.js`, `seguranca.test.js` | [ ] |
| C5 | Criar em data passada → 422 | ✅ `regras-de-borda.test.js` | [ ] |
| C6 | Editar atividade pendente e concluída (ida e volta) | ✅ `api.test.js` | [ ] |
| C7 | Editar atividade que saiu do dia (em aberto, movida, deixada de lado) → 409 | ✅ `regras-de-borda.test.js` | [ ] |
| C8 | Excluir só pendente ou feita, de hoje em diante | ✅ `revisao-independente.test.js` | [ ] |
| C9 | Mover para o próximo turno, incluindo noite → manhã de amanhã | ✅ `api.test.js`, `turnos.test.js` | [ ] |
| C10 | Mover para amanhã e para data específica; data passada → 422 | ✅ `api.test.js` | [ ] |
| C11 | Deixar atividade de lado | ✅ `api.test.js` | [ ] |
| C12 | Toque duplo em "mover" cria uma única cópia | ✅ `revisao-independente.test.js` (PostgreSQL real) | [ ] |
| C13 | Desfazer movimento: volta para a origem sem rastro; recusa se a cópia foi feita ou a origem é de dia passado | ✅ `desfazer.test.js`; no app, `jornadas.test.jsx` | [ ] |

Resultado esperado: regras de negócio atendidas, sem inconsistência de estado.

### D. Dias e fechamento
Status: **aprovado em testes, inclusive de concorrência no PostgreSQL real; confirmar a virada de dia no ambiente publicado**

| # | Teste | Cobertura | Como testar | Resultado |
| --- | --- | --- | --- | --- |
| D1 | Fechar o dia com destinos misturados | ✅ `api.test.js` | — | [ ] |
| D2 | Fechar sem escolhas → tudo vira "em aberto" | ✅ `api.test.js` | — | [ ] |
| D3 | Fechar o mesmo dia duas vezes → 409 | ✅ `api.test.js` | — | [ ] |
| D4 | Dois fechamentos simultâneos: um 200, um 409 | ✅ `regras-de-borda.test.js` (PostgreSQL real no CI) | — | [ ] |
| D5 | Destino no próprio dia ao fechar → 422, nada gravado | ✅ `revisao-independente.test.js` | — | [ ] |
| D6 | Reabertura do dia ao adicionar atividade depois de fechar | ✅ `regras-de-borda.test.js` | — | [ ] |
| D7 | Fechar dia futuro → 422 | ✅ `regras-de-borda.test.js` | — | [ ] |
| D8 | Fechamento automático no dia seguinte | ✅ `api.test.js` | ⏳ No dia seguinte ao uso, abrir o app e conferir a seção "Atividades pendentes" | [ ] |
| D9 | Virada de dia à 00:00 em São Paulo, com o servidor em UTC | ✅ `turnos.test.js` (datas no fuso) | ⏳ Usar o app entre 21h e 00h e conferir que "hoje" não pula de dia antes da meia-noite local | [ ] |
| D10 | Alertas nos horários de borda (11h44, 11h45, 12h00) | ✅ `turnos.test.js` | ⏳ Deixar o app aberto às 11h45 com uma pendência na manhã | [ ] |

Resultado esperado: o dia fecha sem bloquear o fluxo e sem criar inconsistência no banco.

### E. Relatórios e IA
Status: **aprovado em testes; confirmar latência e chave em produção**

| # | Teste | Cobertura | Como testar | Resultado |
| --- | --- | --- | --- | --- |
| E1 | Relatório sem IA (sem chave) | ✅ `relatorios.test.js` | — | [ ] |
| E2 | Relatório com IA | ✅ `relatorios.test.js` (IA simulada) | ⏳ Com a chave real, abrir o relatório de um dia com atividades | [ ] |
| E3 | Falha da IA não quebra o relatório | ✅ `relatorios.test.js` | — | [ ] |
| E4 | Chave da IA inválida ou sem crédito | ⏳ | Colocar uma chave errada no Render; o relatório aparece sem sugestões e o log mostra "[ia] relatório seguirá sem sugestões" | [ ] |
| E5 | JSON da IA com crases, texto extra ou inválido | ✅ `relatorios.test.js` | — | [ ] |
| E6 | A IA não recebe campos internos (id, datas de criação) | ✅ `relatorios.test.js` | — | [ ] |
| E7 | Pares de "parecidas" com títulos inventados são descartados | ✅ `relatorios.test.js` | — | [ ] |
| E8 | Mensagem punitiva é descartada | ✅ `relatorios.test.js` | — | [ ] |
| E9 | Números da mensagem conferem com a contagem real | ✅ `revisao-independente.test.js` | — | [ ] |
| E10 | Título com `</dados>` não fecha o bloco do prompt | ✅ `revisao-independente.test.js` | — | [ ] |
| E11 | Espera total pela IA de até 10 s | ✅ `revisao-independente.test.js` | ⏳ Cronometrar o relatório com a IA real | [ ] |
| E12 | Percentual, contagem e plano de amanhã corretos | ✅ `relatorios.test.js` | — | [ ] |
| E13 | Relatório semanal com pendências agrupadas | ✅ `api.test.js` | — | [ ] |
| E14 | Cache: reabrir o relatório de um dia fechado não chama a IA de novo | ✅ (lógica no `relatoriosService.js`) | ⏳ Abrir o relatório duas vezes e conferir no log uma única chamada | [ ] |

Resultado esperado: o relatório é entregue de forma previsível e resiliente.

### F. Atividades fixas
Status: **aprovado em testes automatizados**

| # | Teste | Cobertura | Resultado |
| --- | --- | --- | --- |
| F1 | Criar fixa e vê-la nos próximos dias | ✅ `api.test.js` | [ ] |
| F2 | Fixa nova aparece também em dias futuros que já existiam, sem duplicar | ✅ `revisao-independente.test.js` | [ ] |
| F3 | Desativar fixa tira as cópias pendentes dos dias futuros | ✅ `revisao-independente.test.js` | [ ] |
| F4 | Abrir o mesmo dia várias vezes não duplica fixas | ✅ `regras-de-borda.test.js` | [ ] |

Resultado esperado: a recorrência funciona sem duplicar nem deixar sobras.

---

## 6) Riscos identificados

| # | Risco | Nível original (Copilot) | Nível atual | Mitigação já feita | O que falta |
| --- | --- | --- | --- | --- | --- |
| 1 | Concorrência no fechamento do dia e na mesma atividade | Alto | Baixo | Fechamento atômico, troca de status condicional, validação antes de gravar; testes no PostgreSQL real no CI | — |
| 2 | Proteção desligada se uma variável estiver vazia | Crítico | Baixo | Falha fechada: sem `NODE_ENV` local declarado, o servidor exige todas as proteções (PR #4) | A1 a A5 no deploy |
| 3 | Validação em produção real (variáveis, TLS, proxy) | Alto | Médio | Verificação na inicialização; `trust proxy` fora de ambiente local; TLS verificado por padrão | Seção 5.A |
| 4 | Fuso horário e virada de dia | Alto | Médio | Datas calculadas no fuso `America/Sao_Paulo`, independente do servidor; testes com horários de borda | D9 e D10 |
| 5 | Robustez da IA (latência, chave, formato) | Médio | Baixo | Fallback, validação, tempo limite total, cache | E2, E4, E11 e E14 |
| 6 | Logs com dados sensíveis | Médio | Baixo | O código de acesso nunca é registrado; erros detalhados só no log, nunca na resposta | B8 |
| 7 | Reabertura de dias fechados com vários usuários | Médio | Fora do escopo | MVP de um único usuário (requisitos, seção 7) | Reavaliar ao adicionar login |
| 8 | Limite de requisições em memória ao escalar | — | Baixo | Premissa documentada: 1 instância no Render gratuito (arquitetura, seção 7) | Usar Redis ao escalar |

---

## 7) Recomendação de release

Com base nesta revisão:

- **Backend:** aprovado para testes de pré-produção.
- **Não aprovado** como "release sem validação adicional".
- **Recomendado:** executar o portão abaixo depois do frontend e do deploy.

**Portão de QA (critérios mínimos para entregar):**

- [x] CI verde no último commit da `main` (inclui concorrência no PostgreSQL real) — `90d190d`, PR #11
- [ ] Seção 5.A completa: variáveis, migração e `/api/health` no Render — A1–A5, A7 e A8 ✅ (25/10); falta A9
- [ ] CORS, código de acesso e limite validados com o app publicado (B1 a B5, B8)
- [ ] Virada de dia e alertas testados no ambiente real (D8 a D10)
- [ ] IA testada com a chave real, com chave inválida e cronometrada (E2, E4, E11)
- [ ] Fluxo completo feito pelo app: criar → concluir → mover → fechar o dia → relatório → pendências

---

## 8) Conclusão

O backend está bem construído e tem boa base para evoluir. A combinação de arquitetura clara, testes nos dois bancos e regras de negócio explícitas deixa a maturidade acima da média para um MVP. Mesmo assim, a etapa de QA no ambiente publicado é o que garante a estabilidade: os testes automáticos provam a lógica, e só o ambiente real prova a configuração.

| Item | Status final |
| --- | --- |
| Recomendação | Executar o portão de QA (seção 7) antes da entrega |
| Risco geral | Controlado, mas não nulo |

---

## 9) Registro de execução

Preencher ao executar o portão.

| Data | Ambiente (URLs) | Executado por | Itens que passaram | Itens que falharam | Ação tomada |
| --- | --- | --- | --- | --- | --- |
| 25/10 | App: https://foco-do-dia.vercel.app · API: https://foco-do-dia.onrender.com (Render, Ohio) · Banco: Neon (AWS US East 2, Ohio) | Roberto (autor), com conferência da IA pelos prints | **A1, A8:** log do Render com "Banco atualizado." e "Your service is live". **A2–A5:** variáveis conferidas na tela de configuração. **A4** também provado pelo servidor ter subido (sem 12+ caracteres ele se recusa). **A3, B5:** domínio da Vercel igual ao `FRONTEND_URL`, e o app carrega os dados. **A7:** log sem o aviso de certificado não verificado. **B3:** entrar com o código certo funcionou. CI verde na `main` | Nenhum | Render instalou Node 26 em vez do 22 dos testes → Node 22 fixado no `package.json` (PR #11) |

**Ainda a executar:** A9, B1, B2, B8, o fluxo completo pelo app e o relatório sem IA (ver a lista abaixo). D8 a D10 dependem do relógio: rodar amanhã (D8), à noite (D9) e às 11h45 (D10).

**Fora do escopo desta entrega:** E2, E11 e E14 precisam da chave da IA (`LLM_API_KEY`), que o autor decidiu não configurar agora. Sem a chave, o relatório usa a mensagem padrão (RNF-06, ADR-003), coberta por teste.
