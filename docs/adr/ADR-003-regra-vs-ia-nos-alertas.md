# ADR-003 — Regra de negócio decide quando alertar; a IA sugere no relatório

- **Status:** Aceito
- **Data:** 23/10/2026
- **Decisor:** Roberto
- **Uso de IA:** decisão construída com prompt chaining (critérios → revisão do autor → comparação → ajuste → ADR), no estilo do caso Salesforce da Unidade IV.

## Contexto

A visão do produto prevê uma IA "preditiva e proativa": perceber que o turno está acabando, oferecer marcar atividades como feitas e ajudar a replanejar. A questão é **onde** a IA entra:

1. Para decidir **quando** disparar o alerta de troca de turno (HU-04).
2. Para gerar **sugestões** de replanejamento, atividades fixas e correlações (HU-07 a HU-10).

## Critérios de avaliação

- Previsibilidade para o público com TDAH (alerta errado ou fora de hora quebra a confiança).
- Testabilidade (RNF-07).
- Funcionamento se a IA falhar (RNF-05).
- Custo e latência (alerta é verificado a cada minuto).
- Privacidade (RNF-04).

## Opções consideradas

| Opção | Previsível | Testável | Funciona sem IA | Custo |
| --- | --- | --- | --- | --- |
| A. IA decide tudo, inclusive quando alertar | Não | Difícil (não determinística) | Não | Alto: chamada ao LLM a cada minuto |
| **B. Regra decide quando alertar; IA sugere no relatório e no fechamento** | Sim | Sim | Sim, só sem sugestões | Baixo: 1 chamada por relatório, com cache |
| C. Sem IA no MVP | Sim | Sim | Sim | Zero, mas perde o diferencial do produto e o objetivo do curso |

## Decisão

**Opção B.**

- O alerta é decidido pela função `deveAlertar(agora, pendencias)` na camada `services/`: 15 minutos antes do fim do turno e só se houver pendências (RN-04), citando urgentes primeiro (RN-10).
- A atualização "proativa" no alerta é uma ação de um toque, oferecida pela regra, não pelo LLM.
- O LLM entra no relatório do dia: plano sugerido para amanhã, candidatas a fixa e atividades parecidas. Sempre com confirmação do usuário (RN-09).

## Consequências

- **Positivas:** alertas confiáveis e cobertos por testes automatizados; app funciona mesmo com a IA fora do ar; custo de IA mínimo.
- **Negativas:** o alerta não "aprende" o horário real de cada pessoa no MVP.
- **Evolução prevista:** a IA preditiva que aprende horários fica para versão futura, já listada em "Fora do escopo" do documento de requisitos.

## Disclosure de IA

Rascunho e tabela comparativa gerados com apoio do Claude. Os critérios de previsibilidade para TDAH e a decisão final foram definidos pelo autor.
