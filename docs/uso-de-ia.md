# Foco do Dia — Registro de Uso de IA

> Autor: Roberto, engenheiro responsável pelo projeto.
>
> Este documento reúne meus registros de revisão e tomada de decisão sobre o que a IA produziu em cada etapa do projeto. Para cada sugestão, registro o que pedi, o que a IA propôs e **o que eu decidi**, com o motivo.
> Princípio: a IA propõe, eu decido e registro (human-in-the-loop).

## Ferramentas e papéis

| Ferramenta | Papel no projeto |
| --- | --- |
| Claude | Copiloto de construção: rascunho de requisitos, arquitetura, ADRs e código (ADR-004) |
| GitHub Copilot | Copiloto de revisão: revisão de Pull Requests e geração de testes (ADR-004). No plano Free, via Copilot Chat com os prompts P-05 e P-08 |
| Agente revisor independente | Instância separada do Claude, sem acesso à conversa nem participação no código, usada para a revisão final do backend (prompt P-09) |
| Eu (Roberto) | "AI code auditor": reviso toda contribuição da IA antes do merge (curso C2, Unidade 4.3) |
| Figma | Design das telas (feito pelo autor) |

## Política de uso de IA no projeto

Regras que sigo em todo o projeto (curso C2, Unidades IV e VI):

1. **Nenhuma aceitação cega:** toda sugestão da IA é lida e entendida antes de entrar no projeto.
2. **Dupla verificação:** o código gerado pelo Claude é revisado pelo Copilot no Pull Request e depois por mim.
3. **Teste obrigatório:** código gerado por IA só entra com testes passando no CI.
4. **Sem dados sensíveis nos prompts:** nenhuma chave, senha ou dado pessoal é enviado à IA.
5. **Registro:** toda decisão relevante fica neste documento ou em um ADR.

## Como preencher

Uma linha por interação relevante. Decisão: **Aceitei** (usei como veio), **Ajustei** (mudei parte) ou **Rejeitei** (descartei).

A partir da Etapa 4, cada linha cita o prompt usado da biblioteca `docs/prompts.md` (P-01 a P-07), que segue a anatomia de 6 componentes do curso C3 (persona, tarefa, contexto, exemplos, formato, restrições) e indica a técnica: zero-shot, one-shot, few-shot, Chain-of-Thought, Skeleton-of-Thought, Tree-of-Thought ou prompt chaining.

## Registro

| Data | Etapa | O que pedi à IA | O que a IA sugeriu | Decisão | Por quê |
| --- | --- | --- | --- | --- | --- |
| 23/10 | 1. Problema | Estruturar a definição do problema a partir da minha ideia | Problema, dor, proposta de valor e objetivos GQM | Aceitei | Refletia a ideia que eu tinha descrito |
| 23/10 | 1. Problema | Sugerir funcionalidades para um planner de TDAH | Timer de foco e desafios de 30 dias | Rejeitei | Timers e desafios geram pressão e abandono no público com TDAH. Troquei por alertas de troca de turno e relatório do dia |
| 23/10 | 2. Requisitos | Rascunho de regras de negócio e histórias | RN-03, RN-04 e RN-08 com valores sugeridos (turnos, 15 min, 3 de 7 dias) | Aceitei | Validei os valores com o perfil do usuário |
| 23/10 | 2. Requisitos | Status das atividades (RN-05) | Atividade só com título e turno, sem prioridade | Ajustei | Incluí prioridade `normal` / `urgente`. Duas opções não aumentam a complexidade e ajudam a decidir o que fazer primeiro |
| 23/10 | 2. Requisitos | Regra de fechamento do dia (RN-07) | O dia só fecha quando todas as pendências tiverem destino | Ajustei | A regra era arbitrária e punitiva para TDAH. Agora o dia nunca é bloqueado: pendências sem destino ficam `em aberto` e vão para um bloco no relatório semanal |
| 23/10 | 2. Requisitos | Revisar HU-06 com as mudanças | HU-06 reescrita: destino sugerido, confirmação em um toque, "decidir depois" e fechamento automático às 23h | Aceitei | Coerente com o princípio de provocar a conclusão sem bloquear |
| 23/10 | 2. Requisitos | Revisar o escopo | Relatório semanal estava fora do escopo | Ajustei | Criei a HU-11 (relatório semanal com pendências da semana) como complemento do diário |
| 23/10 | 3. Arquitetura | Propor a stack | Frontend em React + Vite | Ajustei | Pedi React + Tailwind, que domino como designer e acelera o visual clean (ADR-001) |
| 23/10 | 3. Arquitetura | Propor o banco de dados | SQLite, por ser simples | Ajustei | No plano gratuito do Render os dados do SQLite se perdem a cada reinício. Troquei por PostgreSQL gerenciado (ADR-002) |
| 23/10 | 3. Arquitetura | Ferramenta de protótipo | Lovable para gerar o frontend | Rejeitei | Prefiro desenhar no Figma e gerar o código a partir dele: mais controle visual e rastreabilidade design → código |
| 23/10 | 3. Arquitetura | Onde usar a IA no produto | Regra decide o alerta; IA só nas sugestões do relatório | Aceitei | Alerta previsível e testável é essencial para TDAH; app funciona sem IA (ADR-003) |
| 23/10 | 3. Arquitetura | Fechamento automático às 23h | Fechamento preguiçoso; pendências sem destino ficavam `em aberto` num bloco do relatório semanal | Ajustei | Nenhuma atividade pode ficar pendente nos turnos. O que não tiver destino vai para a seção separada "Atividades pendentes", com os dias em que ficou pendente, sem afetar os turnos diários (RN-12, HU-11) |
| 23/10 | 2. Requisitos | Período do relatório de pendências | Perguntou se haveria relatório mensal além do semanal | Rejeitei | Apenas semanal. Pensar em checklist de longo prazo é cansativo para o público com TDAH |
| 23/10 | 2. Requisitos | Encaixar minha ideia do box "Logo mais" (ideias para explorar, sem obrigação de concluir) | Registrar como visão pós-MVP, com histórias futuras, fora do escopo de 26/10 | Aceitei | Cortei escopo para entregar no prazo sem perder a visão do produto. A ideia fica documentada na seção 10 dos requisitos |
| 23/10 | 3. Arquitetura | Diagramas, modelo de dados e endpoints | C4 níveis 1 e 2, camadas, modelo de dados, 13 endpoints e fluxos | Aceitei | Revisei e os endpoints cobrem todas as histórias do MVP; a rastreabilidade está na tabela de endpoints |
| 24/10 | 4. Backend | Escrever testes das regras de turno antes do código (TDD, P-04b) | 23 testes citando RN e HU; depois a implementação mínima | A revisar | Confirmar se os testes cobrem o comportamento que espero dos alertas |
| 24/10 | 4. Backend | Implementar o relatório com IA (P-07) | Regras objetivas (RN-08, RN-11) no código; IA só com mensagem e parecidas (P-07 v2) | A revisar | Proposta da IA: menos risco de alucinação e menos custo. Confirmar se concordo |
| 24/10 | 4. Backend | Teste da API em banco PostgreSQL real | Encontrou contagem dupla de atividade movida no mesmo dia; corrigida com teste | A revisar | Bug achado no teste manual com curl, não nos testes automáticos |

## Evidência de revisão de código: IA bruta × revisão humana

Formato do laboratório do curso C4 (Unidade III). Para os trechos mais importantes, registro o código como a IA gerou e o código depois da minha revisão, com o que mudou e por quê.

| Trecho | O que a IA gerou | O que eu corrigi | Categoria |
| --- | --- | --- | --- |
| `db/pool.js`: TLS do banco | `ssl: { rejectUnauthorized: false }` fora do localhost: aceitava qualquer certificado, risco de interceptação (MITM). Apontado pelo Copilot Chat na revisão do PR #1 | Aceitei. Agora o certificado é verificado por padrão; desligar só com `DB_SSL=no-verify`, com aviso no log | Segurança |
| `app.js`: CORS | Sem `FRONTEND_URL`, o CORS ficava aberto para qualquer site. Apontado pelo Copilot Chat | Aceitei. Agora é fechado por padrão (fail-closed) e aceita uma lista de domínios | Segurança |
| `routes/`: sem autenticação | Nenhuma rota exigia identificação; publicada, qualquer pessoa poderia ler e apagar dados. Apontado pelo Copilot Chat, que sugeriu token, sessão ou mTLS | Aceitei com ajuste. Login completo está fora do escopo do MVP; implementei um código de acesso digitado uma vez no app (não embutido no frontend) e o servidor se recusa a subir em produção sem ele (RNF-10) | Segurança |
| `seguranca.js`: limite em memória | Copilot Chat (P-08) apontou como severidade **alta**: com 2+ instâncias, cada uma conta as tentativas separadamente. Sugeriu Redis | **Discordei da severidade.** O plano gratuito do Render roda 1 instância e não escala sozinho; Redis seria serviço extra para um problema que o MVP não tem. Documentei a premissa na arquitetura | Arquitetura |
| `tests/`: limite geral sem teste | Copilot Chat (P-08): o limite de 300 requisições não tinha teste; uma mudança acidental passaria no CI | **Aceitei.** 2 testes: uso real do frontend não é bloqueado; a 301ª requisição recebe 429 | Testes |
| `app.js`: Helmet/CSP | Copilot Chat (P-08), "a confirmar": a CSP poderia bloquear scripts se a API servisse HTML. Sugeriu desligar a CSP | **Discordei.** A API só devolve JSON e o frontend está em outra origem. Desligar a CSP reduziria a segurança sem ganho | Segurança |
| Veredito do Copilot | "Corrigir antes do merge", baseado principalmente no item de severidade alta | **Ajustei o veredito.** O item principal não se aplica ao cenário real; após o teste do item 2, pode fazer merge | Processo |
| `tests/regras-de-borda.test.js`: concorrência | Copilot Chat (P-08, PR #3), média: o teste de corrida usava `GET /hoje` e não o botão "Fechar o dia"; um bug só no endpoint de fechamento passaria | **Aceitei.** Novo teste dispara dois fechamentos manuais em paralelo: um 200, um 409 e a atividade em aberto uma única vez | Testes |
| `diasService.js`: conflito ignorado em silêncio | Copilot Chat (P-08, PR #3), baixa, "a confirmar": ignorar o 409 poderia esconder erros; sugeriu log e devolver `conflito=true` | **Aceitei em parte.** Adicionei o registro no log; outros erros já eram relançados. Não criei o `conflito=true`, porque nenhuma tela usa essa informação | Resiliência |
| `db/pool.js` e IA | Na primeira versão, a própria IA que gerou o código (Claude) não apontou esses 3 riscos | Mantive a dupla verificação: uma IA não revisa o próprio código | Processo |

Checklist de revisão aplicado a cada trecho (curso C4, Unidade 3.3.1):

- [ ] Entendo cada linha e conseguiria reescrevê-la
- [ ] Atende aos requisitos e critérios de aceitação
- [ ] Sem chave exposta, SQL injection ou XSS; entradas validadas
- [ ] Segue os padrões do projeto (nomes claros, funções pequenas, sem repetição, JSDoc)
- [ ] Testado e passando

## Diário de integração: erros, acertos e aprendizados

Registro do que aconteceu ao colocar o projeto para funcionar de verdade (GitHub, banco, deploy), em ordem. Cada linha separa o que deu errado, como resolvi e o que aprendi.

| Data | Situação | O que deu errado | Como resolvemos | Aprendizado |
| --- | --- | --- | --- | --- |
| 23/10 | Escolha do banco | A IA sugeriu SQLite. No plano gratuito do Render os arquivos se apagam a cada reinício, e o banco junto | Troquei por PostgreSQL gerenciado (ADR-002) | Validar o ambiente de deploy antes de fechar a stack. A IA sugere o "padrão", não o que cabe na infraestrutura |
| 23/10 | Fechamento automático às 23h | O servidor gratuito dorme sem uso, então uma tarefa agendada às 23h não rodaria | Fechamento "preguiçoso": o dia anterior fecha na primeira requisição do dia seguinte | Restrição de infraestrutura muda a arquitetura. Isso virou documentação (arquitetura, seção 6.2) |
| 24/10 | Ferramentas do curso | O curso usa Python (FastAPI, Pydantic, Pytest); o projeto usa JavaScript | Equivalentes diretos: Express, Zod, Vitest, com justificativa no ADR-001 | Entender o conceito importa mais que a ferramenta. Pydantic e Zod resolvem o mesmo problema |
| 24/10 | Segurança do prompt do produto | O primeiro desenho do P-07 não tratava injeção de prompt: um título de tarefa poderia conter instruções para a IA | Títulos delimitados como dados, regra no prompt e validação da resposta (RNF-09) | Texto do usuário que chega à IA é entrada não confiável, igual a um formulário |
| 24/10 | Teste no banco real | Os 63 testes automáticos passavam, mas no teste manual com PostgreSQL real uma atividade movida no mesmo dia contava duas vezes | Corrigido e criado o teste 64 | Teste automático verde não garante tudo. Rodar o sistema de verdade encontra o que ninguém pensou em testar |
| 24/10 | Acesso ao GitHub (1) | O Claude não enxergava o repositório: a conexão só cobria os repositórios das organizações do CEIA, não a conta pessoal | Instalei o app do Claude na conta pessoal e autorizei o `foco-do-dia` | No GitHub, "autorizar" um app (ele sabe quem eu sou) é diferente de "instalar" (ele acessa meus repositórios) |
| 25/10 | Acesso ao GitHub (2) | Procurei a permissão nas configurações do repositório, mas ela fica nas configurações da conta | Foto → Settings → Applications → Installed GitHub Apps | Permissões de apps são da conta, não do repositório |
| 25/10 | Envio do código | O repositório nasceu com um README no GitHub e o código local tinha outro: conflito ao juntar os históricos | `git rebase` sobre o commit inicial, juntando os dois textos do README | Criar o repositório vazio evita conflito; quando acontece, o Git mostra exatamente onde está |
| 25/10 | Fluxo de Pull Request | Os commits do backend tinham sido feitos direto na `main` | Reorganizei: `main` só com a documentação; backend na branch `feat/backend`, entregue pelo Pull Request #1 | Toda mudança de código entra por PR, com CI e revisão antes do merge |
| 25/10 | Abrir o Pull Request | O comando `gh pr create` foi bloqueado (usa uma API que o ambiente não permite) | Abri o PR pela API REST do GitHub | Quando uma ferramenta falha, há outra via para o mesmo resultado; o erro dizia qual usar |
| 25/10 | CI no GitHub | Primeira execução real do GitHub Actions | Passou de primeira: lint, formatação e 64 testes | O CI tinha sido simulado localmente num clone limpo antes do envio, o que evitou surpresa |
| 25/10 | Revisão automática do Copilot | Ao pedir o Copilot como reviewer do PR, a lista veio vazia ("Nothing to show") | Revisão automática de PR exige plano pago; usei o Copilot Chat (plano Free) com o prompt P-05 e colei o resultado no PR | Planos gratuitos têm limites; o mesmo objetivo (revisão independente) foi atingido por outro caminho |
| 25/10 | Revisão de segurança | O Copilot encontrou 3 riscos reais (TLS, CORS, autenticação) que passaram pelos 64 testes e pela IA que gerou o código | Corrigidos com 13 testes novos (77 no total) | Um segundo revisor, de outra ferramenta, enxerga o que o autor não vê. Testes verificam o que foi pensado; revisão encontra o que não foi |
| 25/10 | Auditoria de segurança | 6 pontos novos apareceram ao atacar o servidor real (datas inválidas, id gigante, corpo grande, mensagens, cabeçalhos, limite de tentativas) | Corrigidos com 7 testes (84 no total) | Testar com o sistema rodando, como um atacante faria, complementa testes unitários e revisão de código |
| 25/10 | Revisão de QA do PR #2 | O Copilot recomendou não fazer merge por um risco de escala que não existe no plano gratuito | Aceitei 1 de 3 itens e documentei a premissa dos outros 2 | Uma revisão de IA não conhece o contexto de negócio e de infraestrutura. A decisão final é do engenheiro, com justificativa |
| 25/10 | Revisão da lógica | 6 bugs de regra de negócio, incluindo uma diferença entre o banco de teste (pg-mem) e o PostgreSQL real | Corrigidos com TDD; 94 testes; conferido no banco real | Revisões de segurança não acham bugs de lógica, e vice-versa. E o ambiente de teste precisa se comportar como a produção |
| 25/10 | Prompt de QA refinado | No PR #2, o Copilot superestimou um risco de escala por não saber que o Render gratuito usa uma instância | Acrescentei essa restrição ao P-08 no PR #3; a resposta veio calibrada e com veredito "pode fazer merge" | Ciclo iterativo do curso C3: a resposta anterior mostra o contexto que faltava no prompt |
| 25/10 | "Pronto" que não era pronto | A cada revisão pedida pelo autor, apareciam problemas novos; a IA vinha declarando o backend pronto cedo demais, pressionada pelo prazo | O autor questionou; adotamos uma definição de pronto explícita e uma revisão por um agente independente | O critério de "pronto" é do engenheiro, não da IA nem do cronômetro |
| 25/10 | Revisão independente | 15 achados (6 médios) que escaparam de 3 rodadas anteriores | Corrigidos com TDD; banco trocado para o Neon; CI com PostgreSQL real | Revisão sem o viés de quem escreveu encontra o que as outras não encontram |
| 25/10 | Banco de teste | O pg-mem não desfaz transações nem reproduz bloqueios: um teste falhava só nele | Validar antes de gravar (funciona nos dois) e rodar a suíte também no PostgreSQL real | Uma ferramenta de teste mais simples que a produção precisa ser complementada, não descartada |
| 25/10 | Relatório de QA | Duas análises de QA do Copilot listavam riscos já tratados no PR #4 como "críticos" e não diziam o que já tinha teste | Compilei as análises num único relatório (`relatorio-qa.md`) que marca, item por item, o que é automático e o que precisa de validação manual após o deploy | Um relatório de QA útil separa o que já está provado do que ainda falta provar, e reavalia o risco depois das correções |
| 25/10 | Banco no Neon | Primeiro abri o perfil do Neon no GitHub achando que era o cadastro. Na criação do projeto, a tela oferecia vários serviços extras (storage, functions, AI gateway, realtime, auth) | Cadastro em neon.com com a conta do GitHub; projeto `foco-do-dia` em AWS US East 2 (Ohio), só com o Postgres ligado. O endereço do banco ficou guardado fora do chat e do repositório | Ligar só o que a arquitetura usa (menos superfície de ataque e de custo). Banco e backend na mesma região: o Render será criado em Ohio. Segredo nunca vai para chat ou Git |
| 25/10 | Telas no Figma | A conversão automática de HTML para Figma foi bloqueada pela rede do ambiente da IA | A IA desenhou as 5 telas direto no Figma via API, com componentes reutilizáveis (Tag, Check, Item, Botão, Chip). O HTML de referência ficou em `docs/design/telas.html` | Ter um plano B quando uma ferramenta falha. Componentes desde o início facilitam ajustes e a tradução para React |
| 25/10 | Jornadas e protótipo | Ao mapear as jornadas, faltava na tela Hoje um caminho para "Fechar o dia" e para ver dias anteriores; e a tela "Dia fechado" mostrava pendências que, pela regra, já teriam destino | Mapa de jornadas (`jornadas.md`) tirado das regras e das mensagens reais da API; botão e navegação pela data adicionados; estados e 7 popups de confirmação ligados num protótipo clicável no Figma | Desenhar as jornadas a partir das regras do backend revela telas e caminhos que faltam antes de escrever o frontend |
| 25/10 | Frontend: teste ponta a ponta | Rodando o app de verdade (backend + PostgreSQL + navegador) com uma semana de dados, a seção "Atividades pendentes" chegou a 10 itens, e a tela de dia fechado mostrava a barra de progresso cheia (só as feitas aparecem depois de fechar) | Pendências mostram 3 e o resto a um toque ("Ver mais"); dia fechado usa a contagem do relatório. As duas falhas só apareceram com dados reais, não no protótipo | Testar com dados realistas, não só com o caso bonito do protótipo. Uma lista longa pesa para quem tem TDAH |
| 25/10 | Frontend: fonte e segurança | A fonte vinha do Google Fonts e foi bloqueada na rede do ambiente; isso também seria uma dependência externa em produção | Fonte Inter empacotada no próprio app (@fontsource) e política de segurança (CSP) na Vercel liberando só a API do Render. Testei o build de produção com a CSP ativa: nenhuma violação | Menos dependências externas = menos falhas e menos rastreamento do usuário |
| 25/10 | Frontend: limite de requisições | No teste ponta a ponta, o limite de 300 requisições em 15 minutos foi atingido pelo script que criou os dados de teste | Reiniciar a API entre a carga de dados e o teste. Uso normal do app fica bem abaixo (cerca de 1 por minuto com o app aberto) | O limite protege a API; os testes precisam respeitá-lo em vez de desligá-lo |
| 25/10 | Revisão de QA do frontend (Copilot, P-08 v3) | O Copilot apontou 1 item "a confirmar" (acessibilidade dos popups) olhando o arquivo errado, e deixou sem resposta 4 das 7 verificações pedidas | Conferi no código: o item já estava feito, mas sem teste → **ajustei** (teste de foco e Esc; foco inicial no "não" das confirmações, para um Enter sem querer não excluir). Para as 4 verificações que faltaram, pedi uma segunda rodada só com elas | Uma resposta que não fala de um ponto não aprovou esse ponto. Conferir a cobertura da revisão, não só os achados |
| 25/10 | Jornada J3: "deixar o usuário ciente" | Ao revisar as jornadas, percebi que o documento dizia que mover "dá para voltar atrás", mas o app não oferecia caminho de volta | Decisão: aviso depois de marcar e botão **Desfazer** por 6 s depois de mover. Exigiu um endpoint novo no backend (`desfazer-movimento`), com 7 testes escritos antes (TDD), para desfazer sem sujar o histórico | Revisar o texto das jornadas contra o app revelou uma promessa que o produto não cumpria |
| 25/10 | Jornada J1: código por e-mail? | Dúvida do autor: o código de acesso seria enviado por e-mail? | Não no MVP: um usuário só, que define o código no servidor. E-mail exige cadastro e serviço de envio → pós-MVP. Na entrega, o código vai junto com o link para os avaliadores | Separar o que é do MVP do que é de produto completo |
| 25/10 | Revisão de QA do frontend, 2ª rodada (Copilot, só os 4 itens que faltaram) | O Copilot revisou a **versão antiga** (PR #8, já na main) e afirmou que o "Desfazer" não existia, quando ele estava no PR #9 | Conferi cada item no código do PR #9: item 1 **rejeitado** (versão desatualizada); item 3 **ajustado** só no ponto que ele acertou (teste de tocar fora do popup, mais 2 testes); itens 2 e 4 aceitos sem mudança (confirmações e textos sem problemas) | A IA revisora pode estar olhando outra versão do código. Sinal de alerta: afirmar que algo "não existe" logo depois de ter sido feito. Sempre conferir qual versão foi revisada |
| 25/10 | PRs mergeados antes do último commit (2 vezes) | O PR #8 e o PR #9 foram mergeados enquanto a IA ainda subia commits. As mudanças ficaram fora da `main` | A IA abriu PRs de complemento (#9, #10) e passou a avisar "pode mergear" só no fim. Conferir a aba **Commits** antes do merge | Um PR é uma "foto" no momento do merge. Combinar quem sinaliza que o trabalho terminou |
| 25/10 | Deploy do backend no Render | Dúvidas reais de quem publica pela primeira vez: o Render sugeriu Python 3; o Health Check foi digitado sem a barra (`api/health`); não ficou claro de onde vinha a `LLM_API_KEY` | Linguagem **Node** (o backend é JavaScript); `/api/health` com barra; IA deixada de fora por ora (o app usa a mensagem padrão). Logs: "Banco atualizado." e "Your service is live" | Cada campo de configuração tem um motivo. Entender o motivo evita errar o campo |
| 25/10 | Versão do Node em produção | O log mostrou que o Render instalou o Node 26, enquanto os testes rodam no 22 | Node 22 fixado no `package.json` do backend e do frontend (PR #11) | Ler o log do deploy, não só o "deu certo". Produção deve usar a mesma versão dos testes |
| 25/10 | Frontend na Vercel e ligação com a API | Risco de o domínio da Vercel ser diferente do `FRONTEND_URL` cadastrado no Render (o CORS bloquearia o app) | O domínio saiu igual (`foco-do-dia.vercel.app`). O autor entrou com o código no app publicado | Backend e frontend precisam "se reconhecer": um endereço errado vira "Sem conexão" |
| 25/10 | Visibilidade | Repositório ainda privado; o curso exige público | Tornado público pelo autor | Conferir o checklist de submissão do curso (C4, Unidade 5.3.1) cedo, não no último dia |

## Auditoria de segurança do backend (25/10)

Depois de aplicar a revisão do Copilot, pedi uma segunda verificação completa: leitura do código, ataques simulados contra o servidor rodando em modo produção com PostgreSQL real e análise das dependências.

| # | Verificação | Como foi verificada | Resultado | Ação |
| --- | --- | --- | --- | --- |
| 1 | SQL injection | Leitura de todas as consultas + ataque com título `'); DROP TABLE atividades; --` | ✅ Todas parametrizadas; nomes de coluna vêm de lista fixa | — |
| 2 | Chaves e senhas no código ou no histórico do Git | Busca em todo o histórico | ✅ Nenhuma; `.env` no `.gitignore` | — |
| 3 | Dependências vulneráveis | `npm audit` | ✅ 0 vulnerabilidades | — |
| 4 | Acesso sem código | Requisição sem e com código errado | ✅ 401 nas duas | — |
| 5 | Produção sem proteções | Subir o servidor com `NODE_ENV=production` sem configuração | ✅ O servidor se recusa a iniciar | — |
| 6 | CORS | Preflight de um domínio estranho | ✅ Navegador bloqueado | — |
| 7 | Atribuição indevida de campos | Criar atividade enviando `status: feita` e `id` | ✅ Campos extras ignorados | — |
| 8 | Data inexistente (`2026-02-31`) | Ataque com o servidor rodando | ❌ Erro 500 | Corrigido: 422 "Essa data não existe." |
| 9 | Identificador gigante | `DELETE /atividades/99999999999` | ❌ Erro 500 | Corrigido: 422 |
| 10 | Corpo grande demais (50 KB) | Ataque com o servidor rodando | ❌ Erro 500 | Corrigido: 413 |
| 11 | Mensagens de validação | Turno inválido | ⚠️ Em inglês e técnicas | Corrigido: português e acolhedoras (RNF-01) |
| 12 | Cabeçalhos de segurança HTTP | Inspeção da resposta | ❌ Nenhum | Corrigido: Helmet (nosniff, HSTS, CSP) |
| 13 | Adivinhação do código e abuso | Muitas tentativas seguidas | ❌ Sem limite | Corrigido: 10 tentativas erradas e 300 requisições por IP a cada 15 min |
| 14 | XSS (título com `<script>`) | Criar atividade com HTML | ⚠️ Guardado como texto, correto no backend | Regra para o frontend: exibir sempre como texto, nunca como HTML (React faz isso por padrão) |

**Resultado:** 7 testes novos, 84 no total, CI verde. Os erros 500 não eram falhas de segurança graves, mas um 500 indica uma entrada que o sistema não previu. Depois da correção, toda entrada malformada recebe uma resposta clara.

**Aprendizado:** revisões diferentes acham coisas diferentes. Os testes automáticos validaram as regras de negócio; o Copilot achou 3 falhas de configuração; os ataques simulados acharam 6 casos de borda. Nenhuma camada sozinha encontrou tudo.

## Revisão completa da lógica do backend (25/10)

Terceira rodada de revisão, pedida pelo autor antes do frontend. Desta vez o foco foi a **lógica de negócio**: percorrer cada regra procurando caminhos que os testes não cobriam. Método: TDD — primeiro um teste que prova o bug (red), depois a correção (green).

| # | Bug encontrado | Cenário real | Correção | Regra |
| --- | --- | --- | --- | --- |
| 1 | Atividade adicionada depois de fechar o dia ficava presa como pendente para sempre | Fecho o dia às 21h e lembro de mais uma tarefa | O dia reabre; no dia seguinte, ela vai para "Atividades pendentes" | RN-13 |
| 2 | Desmarcar como feita uma atividade de dia passado criava pendência fora do fluxo | Mexo no histórico de ontem por engano | Dias passados não são editáveis (409, com orientação) | RN-13 |
| 3 | "Próximo turno" a partir da seção de pendências mandava a atividade para o passado | Retomo uma pendência de 3 dias atrás | Recusado com orientação: "escolha amanhã ou outra data" | RN-14 |
| 4 | Duas requisições na virada do dia podiam fechar o mesmo dia ao mesmo tempo e devolver erro | Celular e computador abertos à meia-noite | Fechamento atômico no banco: um fecha, o outro ignora | RN-07 |
| 5 | Dava para criar atividade em data passada e fechar dia futuro | Erro de digitação na data | Recusado com 422 | RN-14 |
| 6 | **Os testes não refletiam o banco real:** o banco em memória (pg-mem) responde diferente do PostgreSQL ao `ON CONFLICT ... RETURNING`. Nos testes, cada visita a um dia futuro duplicava as atividades fixas; em produção, a reabertura do dia nunca aconteceria | Descoberto ao investigar por que a correção do bug 1 não funcionava nos testes; confirmado comparando os dois bancos | Consulta antes de inserir, o que funciona igual nos dois | HU-09 |

**Resultado:** 8 testes novos, 94 no total; cenários conferidos também no PostgreSQL real (reabertura do dia, fechamento em paralelo: um 200 e um 409, nenhum erro 500).

**Aprendizado principal:** o bug 6 é o mais importante. Uma ferramenta de teste que se comporta diferente da produção pode esconder bugs e criar outros. Por isso todo cenário crítico foi conferido também no banco real.

## Revisão independente do backend (25/10)

Quarta rodada, pedida pelo autor depois de perceber um padrão: **a cada revisão, apareciam coisas novas, e o "está pronto" da IA não era confiável**. Até aqui, todas as revisões tinham sido feitas pelo Copilot ou pela própria IA que escreveu o código. Para tirar esse viés, a revisão foi feita por um **agente separado**, sem acesso à conversa, com o prompt P-09: ler requisitos e código, e provar cada suspeita executando.

**Resultado:** nenhum problema alto, 6 médios, 9 baixos. O agente também confirmou de forma independente o que já estava correto (SQL injection, código de acesso, CORS, fuso horário, regras de cálculo, validação da IA, segredos).

| # | Sev. | Achado | Por que as revisões anteriores não pegaram | Decisão e correção |
| --- | --- | --- | --- | --- |
| 1 | Média | Toque duplo em "mover para amanhã" criava a atividade 2 vezes | Os testes de concorrência rodavam no banco em memória, que não reproduz bloqueios | Corrigido: troca de status condicional. Teste no PostgreSQL real |
| 2 | Média | Fixa nova não aparecia num dia que já existia (fluxo principal da HU-09) | Os testes criavam a fixa antes de o dia existir | Corrigido: a fixa entra nos próximos dias abertos, sem duplicar título |
| 3 | Média | Fechar o dia com "próximo turno" reabria o próprio dia | A reabertura (RN-13) foi criada depois e ninguém testou junto com o fechamento | Corrigido: o fechamento valida todos os destinos antes de gravar |
| 4 | Média | Dava para excluir atividades de dias passados e a original de uma movida | A RN-13 cobriu edição, mas esqueceu exclusão | Corrigido: só se exclui pendente ou feita, de hoje em diante |
| 5 | Média | A espera pela IA chegava a 20 s, não 10 s | A biblioteca da IA tenta de novo por padrão; o limite era por tentativa | Corrigido: sem nova tentativa. Teste com servidor que nunca responde |
| 6 | Média | Sem `NODE_ENV=production`, a API subia **sem código de acesso** | A proteção foi pensada para "produção", não para "qualquer ambiente não local" | Corrigido: falha fechada. `NODE_ENV` vazio conta como produção |
| 7 | Média | O banco gratuito do Render expira em 30 dias e é apagado | O ADR-002 citava o risco, mas ninguém verificou | Confirmado na documentação oficial. **Banco trocado para o Neon** (ADR-002 revisado) |
| 8 | Baixa | O documento dizia "fecha às 23h"; o código fecha na primeira abertura do dia seguinte | Diferença entre documento e código | Documento corrigido (RN-07, HU-06, arquitetura 6.2) |
| 9 | Baixa | Ano 0000, 9999 ou caractere nulo no título geravam erro 500 | A validação aceitava valores que o PostgreSQL recusa | Corrigido: ano entre 2000 e 2100; sem caracteres de controle |
| 10 | Baixa | Desativar uma fixa não a tirava dos dias futuros já abertos | Mesmo motivo do item 2 | Corrigido: cópias pendentes futuras são removidas |
| 11 | Baixa | O relatório de hoje chamava a IA a cada abertura, mesmo com o dia fechado | O cache só valia para dias passados | Corrigido: cache também para hoje fechado |
| 12 | Baixa | A IA podia repetir o "5 de 7" do exemplo num dia de "1 de 3" | O exemplo do prompt tinha números | Corrigido: números conferidos com a contagem real; exemplo sem números (P-07 v3) |
| 13 | Baixa | Um título com `</dados>` fechava o bloco de dados do prompt | A proteção RNF-09 só testava o texto da instrução | Corrigido: `<` e `>` escapados. Teste do ataque real |
| 14 | Baixa | Queda de conexão derrubava o servidor; migração não rodava no deploy | Ninguém tinha simulado o primeiro deploy | Corrigido: `pool.on('error')`, migração no `npm start` |
| 15 | Baixa | Testes de concorrência no banco em memória não provavam nada | Ferramenta de teste diferente da produção | Corrigido: o CI roda a suíte também num PostgreSQL 16 real |

**Testes:** 18 novos, 113 no total, passando no banco em memória e no PostgreSQL real.

**Aprendizados:**
- **Quem escreve não deve ser o único a revisar.** Quatro bugs reais passaram por três rodadas de revisão feitas pela IA que escreveu o código. Um revisor sem esse contexto achou em minutos.
- **"Pronto" precisa de critério, não de sensação.** Adotamos uma definição de pronto: nenhum problema alto ou médio aberto, toda regra com teste, CI verde e riscos restantes documentados.
- **Pedir que a revisão prove executando** separa achado real de opinião: 9 dos 15 itens vieram com teste no banco real.
- **Risco anotado e não verificado é risco aceito sem saber** (item 7).

## Frontend: decisões e revisões (25/10)

| Decisão | Por quê |
| --- | --- |
| O frontend não decide regras: mostra as mensagens da API como estão | As regras ficam testadas num lugar só (backend). Onde a API recusaria, a opção nem aparece (ex.: "levar" numa atividade feita) |
| Confirmação Sim/Não só para o que não dá para desfazer | Excluir, deixar de lado, fechar o dia, tornar fixa. Marcar e mover não pedem confirmação, para não cansar |
| Resumo da semana sem IA | O backend não gera texto da IA para a semana. O resumo é uma frase calculada (o dia que mais rendeu), sem números inventados |
| "Ver mais pendências" | Achado do teste ponta a ponta: uma lista longa de pendências pesa |
| Rotas por `#` (hash) | Funciona em hospedagem estática da Vercel sem configuração extra |
| 42 testes de tela pelas jornadas J1–J9 | Cada teste confere o que o app envia para a API e o que mostra; inclui XSS e o caso "a API recusou" |

## Decisões de escopo

Para entregar um MVP funcional até 26/10 sem perder a visão do produto, decidi o que fica para depois. Cada corte está documentado em "Fora do escopo" e na "Visão pós-MVP" do `requisitos.md`.

| O que ficou para depois | Por quê |
| --- | --- |
| Box "Logo mais" (ideia minha) | Valioso, mas é uma nova área do produto. Documentado como pós-MVP com 4 histórias futuras |
| Notificação no celular com o app fechado | Exige outra camada técnica (push); arriscado para 4 dias |
| IA preditiva que aprende o horário de cada pessoa | O MVP usa regra fixa, previsível e testável (ADR-003) |
| Horários de turno personalizáveis | Os horários padrão atendem o primeiro teste |
| Login e múltiplos usuários | O MVP atende um usuário |
| Relatório mensal | Retirado de vez: longo prazo é cansativo para TDAH. Fica só o semanal |

## Lições aprendidas

> Reflexão do autor ao final do projeto (25/10). Texto redigido com apoio da IA a partir do relato do autor; revisado por ele antes da entrega.

### O que eu aprendi

Durante o projeto, aprendi muito além do que esperava. Eu não sou desenvolvedor, e o trabalho com a IA me fez entender, na prática, coisas que antes eram só nomes:

- **Banco de dados, backend e frontend são partes diferentes, cada uma com seu papel.** O frontend é a tela que a pessoa usa (Vercel). O backend é onde moram as regras (Render). O banco guarda os dados e só o backend fala com ele (Neon). Entendi também por que a escolha do banco depende de onde ele vai rodar: o SQLite apagaria os dados no Render, e o Postgres gratuito do Render expiraria em 30 dias.
- **Integrar é a parte em que mais aparecem erros.** Endereço que não bate, variável com nome errado, uma barra faltando no Health Check, a linguagem errada sugerida pela plataforma. Os erros não são sinal de fracasso: aparecem justamente nessas horas, e o que importa é como são encontrados e registrados.
- **Cada mudança precisa de um commit e de um PR.** O commit registra o que mudou e por quê; o PR junta as mudanças, roda o CI e guarda a minha decisão de revisão. É isso que torna o trabalho rastreável — inclusive os erros, como os PRs que mergeei antes da hora.
- **Revisar a IA é um trabalho de verdade.** Fui o auditor: aceitei, ajustei e rejeitei sugestões. Aprendi que a IA revisora pode olhar a versão errada do código, que silêncio numa resposta não é aprovação e que é preciso conferir com evidência.
- **Testar com o caso real muda o resultado.** Os testes automáticos provam a lógica; só o ambiente publicado e os dados reais mostraram a lista de pendências longa demais e a versão errada do Node.

### Onde a IA mais ajudou

Velocidade para gerar código, testes e documentação rastreável; explicações passo a passo (técnica de Feynman) para eu entender cada etapa; e, como revisora independente, achar bugs reais e prová-los executando.

### Onde a IA errou ou não entendeu o contexto

Sugeriu SQLite sem considerar o deploy; propôs timer e desafios, inadequados para TDAH; não previu injeção de prompt no primeiro desenho do P-07; declarou o backend pronto antes da hora e revisou o próprio código sem enxergar 4 bugs de concorrência e fluxo; escreveu que mover "dá para voltar atrás" quando o app ainda não oferecia isso. O Copilot, como revisor, chegou a analisar uma versão desatualizada do código.

### O que eu faria diferente

Criar o repositório e configurar o acesso ao GitHub no primeiro dia; definir o critério de "pronto" e fazer a revisão independente desde o início, não no fim; combinar com a IA um sinal claro de "pode mergear" antes de aprovar cada PR.
