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
| (preencher na Etapa 4) | | | Segurança / Validação / Resiliência / Documentação / Padrões |

Checklist de revisão aplicado a cada trecho (curso C4, Unidade 3.3.1):

- [ ] Entendo cada linha e conseguiria reescrevê-la
- [ ] Atende aos requisitos e critérios de aceitação
- [ ] Sem chave exposta, SQL injection ou XSS; entradas validadas
- [ ] Segue os padrões do projeto (nomes claros, funções pequenas, sem repetição, JSDoc)
- [ ] Testado e passando

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

- Onde a IA mais ajudou:
- Onde a IA errou ou não entendeu o contexto:
- O que eu faria diferente:
