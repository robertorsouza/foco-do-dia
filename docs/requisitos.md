# Foco do Dia — Documento de Requisitos

> Versão 0.5 · 25/10/2026 · Autor: Roberto (v0.5: ajustes da revisão independente — RN-07, RN-13, HU-06, HU-09, RNF-06 e RNF-10)
> Uso de IA: rascunho gerado com apoio do Claude a partir das decisões do autor; revisado e validado pelo autor. Histórico de revisões em `docs/uso-de-ia.md`.

---

## 1. Definição do problema

### Contexto
Pessoas com TDAH costumam começar o dia com boas intenções, mas perdem o fio ao longo dos turnos. Ao final do dia, fica a sensação de não ter feito nada, mesmo quando muita coisa foi feita.

### Quem sofre
Adultos com TDAH que querem organizar a rotina diária sem ferramentas complexas.

### A dor
- Listas de tarefas comuns são longas e complexas (prazos, níveis de prioridade, subtarefas) e geram sobrecarga.
- Timers de foco e desafios geram pressão e acabam abandonados.
- O que não é feito some da lista ou se acumula sem plano, sem fechamento.

### O que falta
Uma ferramenta que ajude a **fechar o dia**: acompanhe sem cobrar, lembre na hora certa e transforme o que ficou pendente em um plano possível.

### Proposta de valor
Um checklist simples por turno (manhã, tarde e noite), com alertas nas trocas de turno e uma IA que ajuda a concluir, replanejar e perceber padrões.

### Objetivo mensurável (GQM)

| Objetivo | Pergunta | Métrica |
| --- | --- | --- |
| Ajudar o usuário a concluir suas atividades diárias | Quanto do que foi planejado é concluído? | % de atividades concluídas por dia (concluídas ÷ planejadas) |
| Evitar pendências esquecidas | O usuário dá destino ao que não fez? | % de pendências com destino definido (no dia ou na semana) |
| Verificar se os alertas ajudam | O usuário responde aos alertas? | % de alertas de troca de turno respondidos |

### Por que este projeto (critérios de seleção do curso C4, Unidade 2)

| Critério | Como o Foco do Dia atende |
| --- | --- |
| Escopo limitado | Uma entidade principal (atividade) com CRUD, três turnos e dois relatórios |
| Potencial de uso da IA | IA no desenvolvimento (copiloto) e no produto (relatório do dia, prompt P-07) |
| Familiaridade tecnológica | React + Tailwind, que o autor já domina como designer |
| Relevância pessoal | Nasce de uma ideia própria de planner para TDAH |
| Testabilidade | Regras de negócio objetivas (RN-01 a RN-12) viram testes automatizados |

Encaixa no exemplo "Micro-API de gerenciamento de tarefas" sugerido pelo curso, com frontend e IA no produto como diferencial.

---

## 2. Princípios de design (restrições do produto)

1. **Sem complexidade:** uma atividade tem só título, turno e, se o usuário quiser, a marcação de urgente.
2. **Uma decisão por vez:** cada alerta pede no máximo uma ação, com resposta em um toque.
3. **Tom acolhedor, nunca punitivo:** "faltam 2" em vez de "você atrasou 2".
4. **Sem timer e sem desafios.**
5. **Provocar a conclusão, sem ser arbitrário:** o app ajuda a fechar o checklist, mas nunca bloqueia o usuário. O que ficar pendente ganha um lugar para ser retomado.

---

## 3. Jornada: começo, meio e fim

| Momento | O que acontece |
| --- | --- |
| **Começo** | O dia abre já montado com atividades fixas e pendências reagendadas, urgentes no topo. O usuário confirma ou ajusta. |
| **Meio** | Perto do fim de cada turno, se houver pendências, um alerta pergunta se algo já foi feito e oferece atualizar ou mover para o próximo turno. |
| **Fim** | O app sugere um destino para cada pendência; o usuário confirma com um toque, ajusta ou deixa para depois. Em seguida, vê o relatório do dia. |
| **Depois** | O que ficou sem destino sai dos turnos e vai para a seção "Atividades pendentes", separada do dia, com os dias em que cada atividade ficou pendente. Os turnos do dia seguinte começam limpos. |

---

## 4. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Toda atividade pertence a exatamente um turno: manhã, tarde ou noite. |
| RN-02 | Uma atividade tem título (obrigatório, até 80 caracteres), turno e prioridade: `normal` (padrão) ou `urgente`. |
| RN-03 | Turnos terminam às 12h (manhã), 18h (tarde) e 23h (noite). |
| RN-04 | O alerta de troca de turno dispara 15 minutos antes do fim do turno, somente se houver atividades pendentes naquele turno. |
| RN-05 | Status possíveis de uma atividade: `pendente`, `feita`, `movida`, `deixada de lado` ou `em aberto` (o dia fechou sem destino definido). |
| RN-06 | Destinos possíveis de uma pendência: próximo turno, amanhã, outra data ou deixar de lado. |
| RN-07 | O sistema nunca impede o fechamento do dia. O dia fecha quando o usuário escolhe fechar ou, se ele não fechar, automaticamente na primeira vez que o app é usado no dia seguinte. Ao fechar, os destinos escolhidos não podem cair no próprio dia sendo fechado. Ao fechar, nenhuma atividade fica pendente nos turnos: o usuário define o destino ou, se não definir, ela passa a `em aberto` e vai para a seção "Atividades pendentes". |
| RN-08 | Uma atividade concluída em 3 ou mais dos últimos 7 dias gera sugestão de torná-la fixa. |
| RN-09 | Nenhuma sugestão da IA altera dados sem confirmação do usuário. |
| RN-10 | Atividades urgentes aparecem no topo do turno e são citadas primeiro nos alertas. |
| RN-11 | Destino sugerido ao fechar o dia: urgente → amanhã de manhã; normal → amanhã, no mesmo turno. |
| RN-12 | A seção "Atividades pendentes" é separada dos turnos diários e não altera o checklist de nenhum dia. Cada atividade nela mostra desde quando está pendente e quantos dias ficou assim. Ela só sai da seção quando o usuário define um destino. |
| RN-13 | Adicionar, mover ou desmarcar uma atividade em um dia de hoje já fechado reabre esse dia, para que a nova pendência passe pelo fechamento normal. Atividades de dias passados não podem ser editadas nem excluídas. Só se excluem atividades pendentes ou feitas, de hoje em diante; as movidas, deixadas de lado ou em aberto fazem parte do histórico dos relatórios (para tirar algo da seção "Atividades pendentes", usa-se "deixar de lado"). |
| RN-14 | Atividades só são criadas para hoje ou datas futuras. Só se fecha hoje ou dias anteriores. "Próximo turno" não vale para atividades em aberto: para elas, escolhe-se amanhã ou outra data. |

---

## 5. Requisitos funcionais (histórias de usuário)

Priorização MoSCoW: **Must** (obrigatório no MVP), **Should** (importante), **Could** (se der tempo).

Critérios de aceitação no padrão **Gherkin / BDD** (Dado / Quando / Então = Given / When / Then), para que cada critério vire um teste automatizado.

### HU-01 — Adicionar atividade · Must
**Como** usuário, **quero** adicionar atividades em manhã, tarde ou noite, **para** organizar meu dia sem complicação.

- **Dado** que estou no dia atual, **quando** informo um título, escolho um turno e salvo, **então** a atividade aparece no turno escolhido com status `pendente` e prioridade `normal`.
- **Dado** que marco a opção "urgente" ao criar, **quando** salvo, **então** a atividade aparece no topo do turno, destacada.
- **Dado** que deixo o título vazio, **quando** tento salvar, **então** vejo uma mensagem curta pedindo o título e nada é salvo.

### HU-02 — Concluir atividade · Must
**Como** usuário, **quero** marcar uma atividade como feita com um toque, **para** sentir progresso.

- **Dado** uma atividade pendente, **quando** toco nela, **então** ela fica `feita` e o progresso do turno atualiza (ex.: "2 de 3").
- **Dado** uma atividade feita, **quando** toco nela de novo, **então** ela volta para `pendente`.

### HU-03 — Editar e excluir atividade · Must
**Como** usuário, **quero** editar o título, o turno ou a prioridade e excluir atividades, **para** corrigir meu plano.

- **Dado** uma atividade, **quando** abro e altero título, turno ou prioridade e salvo, **então** a mudança aparece na lista.
- **Dado** uma atividade, **quando** excluo e confirmo, **então** ela some do dia.

### HU-04 — Alerta de troca de turno · Must
**Como** usuário, **quero** receber um alerta perto do fim do turno se ainda houver pendências, **para** não perder o fio.

- **Dado** que são 11h45 e há pendências na manhã, **então** recebo uma notificação: "A manhã está acabando. Faltam 2. Já fez alguma?"
- **Dado** que uma das pendências é urgente, **então** ela é citada primeiro no alerta.
- **Dado** que são 11h45 e não há pendências na manhã, **então** nenhum alerta é enviado.

### HU-05 — Atualização proativa no alerta · Must
**Como** usuário, **quero** que o alerta me deixe marcar como feito ou mover o que falta, **para** resolver em um toque.

- **Dado** o alerta aberto, **quando** marco uma atividade como "já fiz", **então** ela fica `feita`.
- **Dado** o alerta aberto, **quando** escolho "mover para o próximo turno", **então** as pendências restantes passam para o turno seguinte, mantendo a prioridade.

### HU-06 — Fechar o dia com ajuda, sem bloqueio · Must
**Como** usuário, **quero** ajuda para decidir o destino do que não fiz, sem ser obrigado, **para** fechar o dia sem culpa.

- **Dado** pendências ao fechar o dia, **então** o app mostra cada uma com um destino sugerido já marcado (RN-11), com as urgentes no topo.
- **Dado** as sugestões na tela, **quando** toco em "Confirmar sugestões", **então** todas as pendências recebem o destino sugerido de uma vez.
- **Dado** as sugestões na tela, **quando** troco o destino de uma pendência, **então** só aquela muda.
- **Dado** que escolho "decidir depois", **então** o dia fecha e as pendências sem destino saem dos turnos e vão para a seção "Atividades pendentes" (RN-07).
- **Dado** que o dia não foi fechado, **quando** o app é usado pela primeira vez no dia seguinte, **então** o sistema fecha o dia anterior aplicando a mesma regra, sem notificação de cobrança.
- **Dado** que escolho "próximo turno" para uma atividade da manhã ou da tarde ao fechar o dia, **então** o app pede outro destino (o próximo turno ainda é hoje).
- **Dado** o dia seguinte, **então** os turnos começam só com as atividades fixas e as reagendadas para aquele dia; nada da seção "Atividades pendentes" aparece nos turnos.

### HU-07 — Relatório do dia · Must
**Como** usuário, **quero** ver o relatório do dia com o que fiz e o que não fiz, em tom acolhedor, **para** reconhecer meu progresso.

- **Dado** que fechei o dia, **quando** abro o relatório, **então** vejo as contagens e a lista de feitas e não feitas, por turno, começando pelo que foi feito.
- **Dado** que a IA está indisponível, **então** o relatório mostra os números normalmente, apenas sem as sugestões.

### HU-08 — Sugestão do próximo dia · Should
**Como** usuário, **quero** que a IA monte uma sugestão de amanhã com minhas pendências, **para** começar o dia sem planejar do zero.

- **Dado** pendências movidas para amanhã, **quando** abro o novo dia, **então** elas aparecem distribuídas nos turnos sugeridos, urgentes no topo, e posso editar antes de confirmar.

### HU-09 — Sugestão de atividades fixas · Should
**Como** usuário, **quero** que a IA sugira tornar fixas as atividades que repito, **para** não precisar cadastrá-las todo dia.

- **Dado** uma atividade concluída em 3 ou mais dos últimos 7 dias (RN-08), **então** o relatório sugere torná-la fixa naquele turno.
- **Quando** aceito, **então** ela passa a aparecer automaticamente nos próximos dias, inclusive nos que já foram abertos, sem duplicar uma atividade com o mesmo título.
- **Quando** desativo uma fixa, **então** as cópias ainda pendentes dos próximos dias saem dos turnos.

### HU-10 — Correlação de atividades · Could
**Como** usuário, **quero** que a IA aponte atividades parecidas em turnos ou dias diferentes, **para** me organizar melhor.

- **Dado** atividades com títulos semelhantes em turnos ou dias diferentes, **então** o relatório lista os pares e sugere agrupá-los em um turno.

### HU-11 — Seção "Atividades pendentes" · Should
**Como** usuário, **quero** que o que ficou sem destino vá para um lugar separado, **para** que meus turnos do dia fiquem limpos e eu retome as pendências com calma.

- **Dado** atividades `em aberto`, **quando** abro a seção "Atividades pendentes", **então** vejo cada uma com a data de origem e há quantos dias está pendente, urgentes no topo.
- **Dado** uma atividade na seção, **quando** escolho um destino (amanhã, outra data ou deixar de lado), **então** ela sai da seção e vai para o dia escolhido.
- **Dado** os turnos de qualquer dia, **então** nenhuma atividade da seção aparece neles (RN-12).
- **Dado** o relatório semanal, **então** ele mostra o bloco "Atividades pendentes" com os dias em que cada atividade ficou pendente e o % de conclusão de cada dia (métrica GQM).
- O relatório diário continua existindo; o semanal é um complemento.

---

## 6. Requisitos não funcionais (ISO/IEC 25010)

| ID | Característica | Requisito |
| --- | --- | --- |
| RNF-01 | Usabilidade | Baixa carga cognitiva: no máximo 1 ação por alerta, textos com até 15 palavras e nenhuma tela com mais de 3 botões principais. |
| RNF-02 | Usabilidade | Interface clean e responsiva, utilizável no celular e no desktop. |
| RNF-03 | Segurança | A chave da API de IA fica apenas no backend, em variável de ambiente. Nunca no frontend nem no GitHub. |
| RNF-04 | Privacidade | A IA recebe apenas títulos, status e prioridade das atividades, sem dados pessoais do usuário. |
| RNF-09 | Segurança | Proteção contra injeção de prompt (OWASP Top 10 para LLM): textos do usuário são enviados à IA como dados, nunca como instruções, e a resposta da IA é validada antes de ser exibida. |
| RNF-10 | Segurança | A API publicada exige um código de acesso (APP_ACCESS_TOKEN), digitado uma vez no app; CORS aceita só o domínio do frontend; a conexão com o banco verifica o certificado TLS. O servidor não sobe sem essas proteções em nenhum ambiente que não seja declaradamente local (`NODE_ENV=development` ou `test`): na dúvida, falha fechado. |
| RNF-05 | Confiabilidade | O app funciona normalmente se a IA falhar; só as sugestões ficam indisponíveis. |
| RNF-06 | Eficiência de desempenho | O relatório com sugestões carrega em até 10 segundos (espera total pela IA, sem novas tentativas); as ações do checklist respondem em até 1 segundo. |
| RNF-07 | Manutenibilidade | Backend em camadas (rotas, serviços, banco), com testes automatizados cobrindo as regras de negócio RN-01 a RN-14. |
| RNF-08 | Compatibilidade | Notificações funcionam nos navegadores Chrome e Edge atuais, com o app aberto. |

---

## 7. Fora do escopo do MVP

- Login e múltiplos usuários (o MVP atende um usuário; o acesso é protegido por código, RNF-10).
- Notificação no celular com o app fechado (push).
- Horários de turno personalizáveis.
- IA preditiva que aprende o horário de cada pessoa.
- Relatórios mensais ou de longo prazo: cansativos para o público com TDAH (decisão do autor).
- Box "Logo mais" (ver seção 10).

---

## 8. Rastreabilidade

| História | Regras de negócio | Requisitos não funcionais |
| --- | --- | --- |
| HU-01 | RN-01, RN-02, RN-10 | RNF-01 |
| HU-02 | RN-05 | RNF-06 |
| HU-03 | RN-01, RN-02 | — |
| HU-04 | RN-03, RN-04, RN-10 | RNF-01, RNF-08 |
| HU-05 | RN-05, RN-09 | RNF-01 |
| HU-06 | RN-05, RN-06, RN-07, RN-11 | RNF-01 |
| HU-07 | — | RNF-05, RNF-06 |
| HU-08 | RN-09, RN-10 | RNF-04 |
| HU-09 | RN-08, RN-09 | RNF-04 |
| HU-10 | RN-09 | RNF-04 |
| HU-11 | RN-05, RN-07, RN-10, RN-12 | RNF-01 |

---

## 9. Decisões validadas pelo autor (23/10)

- Turnos terminam às 12h, 18h e 23h (RN-03).
- Alerta 15 minutos antes do fim do turno (RN-04).
- Atividade fixa: concluída em 3 de 7 dias (RN-08).

---

## 10. Visão pós-MVP

### Box "Logo mais" — proposta do autor

**Problema:** nem tudo o que surge na cabeça é uma tarefa para concluir. Ideias, coisas para pesquisar ou pensar com calma acabam virando atividades nos turnos, ocupando espaço e gerando a sensação de pendência. Para quem tem TDAH, a ideia que não é anotada se perde; a ideia anotada no lugar errado vira cobrança.

**Proposta:** um espaço separado, chamado **"Logo mais"**, para guardar o que o usuário não pretende resolver de imediato e quer explorar melhor, sem obrigação de concluir.

| | Turnos do dia | Atividades pendentes | Logo mais |
| --- | --- | --- | --- |
| O que guarda | O que fazer hoje | O que ficou sem destino ao fechar o dia | Ideias e coisas para explorar depois |
| Origem | O usuário planeja | O sistema move ao fechar o dia | O usuário escolhe guardar |
| Precisa ser concluído? | Sim, o app provoca a conclusão | Sim, precisa ganhar um destino | Não. Pode amadurecer, virar atividade ou ser descartado |
| Aparece em alertas e relatórios? | Sim | Sim, no relatório semanal | Não, para não gerar cobrança |

**Histórias futuras (rascunho):**

- **HU-F01:** Como usuário, quero guardar uma ideia no "Logo mais" com um toque, para não perdê-la sem transformá-la em tarefa.
- **HU-F02:** Como usuário, quero acrescentar notas a um item do "Logo mais", para explorar a ideia aos poucos.
- **HU-F03:** Como usuário, quero transformar um item do "Logo mais" em atividade de um turno quando estiver pronto, para agir sobre ele.
- **HU-F04:** Como usuário, quero mover uma atividade de um turno para o "Logo mais", para tirar do dia o que não é para agora.

**Princípios mantidos:** sem prazo, sem contagem de dias, sem alertas. Possível papel futuro da IA: só quando o usuário pedir, ajudar a desdobrar uma ideia em próximos passos.

