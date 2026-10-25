# Foco do Dia — Registro de Uso de IA

> Autor: Roberto, engenheiro responsável pelo projeto.
>
> Este documento reúne meus registros de revisão e tomada de decisão sobre o que a IA produziu em cada etapa do projeto. Para cada sugestão, registro o que pedi, o que a IA propôs e **o que eu decidi**, com o motivo.
> Princípio: a IA propõe, eu decido e registro (human-in-the-loop).

## Ferramentas e papéis

| Ferramenta | Papel no projeto |
| --- | --- |
| Claude | Copiloto de construção: rascunho de requisitos, arquitetura, ADRs e código (ADR-004) |
| GitHub Copilot | Copiloto de revisão: revisão de Pull Requests e geração de testes (ADR-004) |
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
| 25/10 | Visibilidade | Repositório ainda privado; o curso exige público | Pendente: tornar público antes da entrega | Conferir o checklist de submissão do curso (C4, Unidade 5.3.1) cedo, não no último dia |

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

## Lições aprendidas (preencher ao final)

- Onde a IA mais ajudou: (preencher)
- Onde a IA errou ou não entendeu o contexto: sugeriu SQLite sem considerar o deploy; propôs timer e desafios, inadequados para TDAH; não previu injeção de prompt no primeiro desenho do P-07. (revisar e completar)
- O que eu faria diferente: criar o repositório vazio e configurar o acesso ao GitHub logo no primeiro dia. (revisar e completar)
