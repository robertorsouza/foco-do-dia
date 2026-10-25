# Jornadas do usuário — Foco do Dia

> Versão 1.0 · 25/10/2026 · Autor: Roberto
> Uso de IA: mapa montado com apoio do Claude a partir das regras do backend (RN, HU) e revisado pelo autor. O protótipo clicável está no Figma: https://www.figma.com/design/gHPzXZSxynPrBNYvhBu8Gp

Cada jornada lista o que o usuário **pode** fazer, o que **não pode** e o que o app mostra em cada caso. As mensagens de "não pode" são as mesmas que a API devolve, então o frontend não inventa regra: ele só exibe.

**Princípio de tom (decisão do autor):** o app pergunta, não impõe. Confirmações usam "Sim / Não" com palavras claras ("Sim, fechar", "Ainda não"). Nenhuma mensagem culpa o usuário.

**Quando pede confirmação (popup Sim/Não):** só nas ações que não dá para desfazer — excluir, deixar de lado, fechar o dia, tornar fixa. Marcar como feita e mover não pedem confirmação, mas o usuário fica ciente: um aviso diz o que aconteceu e, ao mover, traz o botão **Desfazer** por alguns segundos (decisão do autor, 25/10).

**De onde vem o código de acesso:** no MVP há um único usuário. O próprio autor define o código na configuração do servidor (`APP_ACCESS_TOKEN`) e digita uma vez no app. Não há envio por e-mail: isso exigiria cadastro e serviço de e-mail, e fica para depois do MVP.

---

## J1. Entrar no app

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Primeiro acesso, código certo | ✅ | Vai para **Hoje**. O código fica salvo no aparelho | RNF-10 |
| Código errado | ❌ | "Esse código não confere. Confira e tente de novo." | RNF-10 |
| 10 códigos errados em 15 min | ❌ | "Muitas tentativas. Respire e tente de novo em 15 minutos." | RNF-10 (limite de tentativas) |
| Servidor dormindo (plano gratuito) | ⏳ | "Acordando o app… Na primeira vez do dia pode levar até 1 minuto." | Limitação do Render gratuito |
| Código trocado no servidor | ❌ | Volta para a tela de código: "Seu código mudou. Digite o novo." | API responde 401 |

## J2. Planejar o dia (adicionar)

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Adicionar com título e turno | ✅ | A atividade entra no fim do turno; urgentes vão para o topo | HU-01, RN-10 |
| Título vazio | ❌ | Botão "+" fica desabilitado | Validação (1 a 80 caracteres) |
| Título com mais de 80 caracteres | ❌ | "Use até 80 caracteres." | Validação |
| Primeiro dia, nada planejado | — | Estado vazio: "Seu dia está em branco. Comece pelo que importa agora." | — |
| Adicionar num dia que já foi fechado hoje | ✅ | O dia reabre sozinho, sem aviso de erro | RN-13 |

## J3. Fazer as atividades (menu da atividade)

Tocar numa atividade abre o **menu da atividade**. As opções mudam conforme o status.

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Marcar como feita / desmarcar | ✅ | Toque no círculo. Aviso: "Feita. Toque de novo para desmarcar." | HU-02 |
| Editar título, turno ou urgência (pendente ou feita, hoje) | ✅ | Campo editável no menu | HU-02 |
| Levar para o próximo turno | ✅ | Aviso: "Foi para a tarde." com **Desfazer** por 6 s | HU-05 |
| Levar para amanhã | ✅ | Aviso: "Foi para amanhã à tarde." com **Desfazer** por 6 s | HU-05, RN-11 |
| Desfazer depois de mover | ✅ | A atividade volta para onde estava, sem deixar rastro no histórico | HU-05 |
| Desfazer depois que a cópia foi feita, ou num dia que já passou | ❌ | "Não dá mais para desfazer esse movimento." | HU-05, RN-13 |
| Mover uma atividade já feita | ❌ | Opção não aparece no menu | API: "Só dá para mover atividades que ainda não foram feitas." |
| Deixar de lado | ✅ com confirmação | Popup: "Deixar 'Mercado' de lado?" · **Sim, deixar de lado** / **Manter** | HU-06 |
| Excluir (pendente ou feita, de hoje em diante) | ✅ com confirmação | Popup: "Excluir 'Mercado'?" · **Sim, excluir** / **Cancelar** | HU-03, RN-13 |
| Excluir ou editar algo do histórico (movida, de dia passado) | ❌ | Popup informativo: "Essa já faz parte do histórico" · **Entendi** | RN-13 |
| Dois toques ao mesmo tempo (ex.: mover duas vezes) | ❌ | "Essa atividade já foi resolvida. Atualize a tela." | Concorrência (PR #4) |

## J4. Alerta de fim de turno

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Faltam 15 min e há pendências | — | Painel: "A manhã está acabando. Faltam 2. Já fez alguma?" Urgentes primeiro | HU-04, RN-04, RN-10 |
| Sem pendências no turno | — | Nenhum alerta | RN-04 |
| Marcar as que já fez | ✅ | Volta para Hoje com os círculos para marcar | HU-02 |
| Levar todas para o próximo turno | ✅ | Aviso: "Foi para a tarde." com **Desfazer** | HU-05 |
| Agora não | ✅ | Fecha o painel. Não volta a perguntar no mesmo turno | RNF-01 |
| App fechado na hora do alerta | — | Alerta não aparece (limitação do MVP) | README |

## J5. Fechar o dia

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Abrir o fechamento | ✅ | Botão **Fechar o dia** no fim da tela Hoje. Cada pendência já vem com o destino sugerido | RN-11 |
| Usar todas as sugestões | ✅ | Marca a sugestão em todas de uma vez | RN-11 |
| "Próximo turno" para atividade da manhã ou da tarde | ❌ | Opção não aparece (cairia no próprio dia) | RN-07 |
| "Próximo turno" para atividade da noite | ✅ | Vai para amanhã de manhã | RN-07 |
| Fechar o dia | ✅ com confirmação | Popup: "Fechar o dia?" · **Sim, fechar** / **Ainda não** | RN-07 |
| Depois de fechar | — | Hoje mostra "Dia fechado. Bom descanso." e o relatório | HU-07 |
| Não fechar | ✅ | Nada acontece. Amanhã, na primeira abertura, o dia fecha sozinho; o que ficou sem destino vai para Atividades pendentes | RN-07 |
| Fechar um dia futuro | ❌ | Não existe botão para isso | RN-14 |

## J6. Atividades pendentes

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Ver o que ficou sem destino | ✅ | Seção separada dos turnos, com "Em aberto desde 24/10" | HU-11, RN-12 |
| Trazer para hoje | ✅ | Popup: "Em qual turno?" · Manhã / Tarde / Noite · **Trazer** / **Cancelar** | HU-11 |
| Deixar de lado | ✅ com confirmação | Mesmo popup da J3 | HU-06 |
| Excluir | ❌ | Opção não aparece (faz parte do histórico) | RN-13 |
| Levar para o "próximo turno" | ❌ | Opção não aparece | RN-14 |

## J7. Consultar dias passados

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Abrir um dia anterior | ✅ | Toque na data, no topo de Hoje ("‹ Domingo, 25 de outubro"). Selo "Só para consulta". Mostra feitas, movidas e em aberto | RN-13 |
| Marcar, editar ou excluir ali | ❌ | Sem botões de ação. Se tentar pela API: "Esse dia já foi fechado. Para retomar, crie a atividade de novo." | RN-13 |
| Criar atividade num dia passado | ❌ | Não existe esse caminho. API: "Escolha hoje ou uma data futura." | RN-14 |

## J8. Relatórios

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Ver o relatório do dia | ✅ | Total, resumo, resultado por turno, destinos | HU-07 |
| IA fora do ar ou lenta (mais de 10 s) | ✅ | Mensagem padrão, sem quebrar a tela: "Você concluiu 4 de 7 hoje. Cada uma conta." | RNF-06, ADR-003 |
| Ver a semana | ✅ | Aba **Semana**: barras por dia e um resumo curto | HU-08 |
| Tornar fixa uma sugestão | ✅ com confirmação | Popup: "Tornar 'Ler 10 páginas' fixa?" · **Sim, tornar fixa** / **Não, obrigado** | RN-08, RN-09 |
| A IA mudar algo sozinha | ❌ | Nunca. Toda sugestão espera o "Sim" do usuário | RN-09 |

## J9. Fixas

| Situação | Pode? | O que o app mostra | Regra |
| --- | --- | --- | --- |
| Abrir a aba Fixas | ✅ | Tela explicativa "Próxima versão" | Decisão do autor (requisitos, seção 10) |
| Criar fixa pelo relatório | ✅ | Aparece sozinha a partir de amanhã, no turno sugerido | RN-08 |
| Gerenciar a lista, dias da semana, pausar | ⏳ | Próxima versão | Requisitos, seção 10 |

---

## Telas e popups no Figma

| Tipo | Nome no Figma |
| --- | --- |
| Tela | 01 Código de acesso · 01b Código errado · 01c Muitas tentativas · 01d Acordando o app |
| Tela | 02 Hoje · 02b Hoje vazio · 02c Dia fechado · 02d Dia passado |
| Tela | 03 Alerta de fim de turno · 04 Fechar o dia · 05 Relatório do dia · 05b Relatório da semana · 06 Fixas |
| Popup | P1 Menu da atividade · P2 Excluir · P3 Deixar de lado · P4 Não permitido · P5 Fechar o dia · P6 Tornar fixa · P7 Trazer para hoje |

| Aviso | T1 Movida · T2 Fixa criada · T3 Erro de rede · T4 Trazida para hoje |

## Como usar o protótipo

1. Abra o arquivo no Figma e clique em **Present** (▶, no canto superior direito). No menu de fluxos, escolha:
   - **1 · Jornada completa**: começa em "Acordando o app" e passa sozinho para a tela de código;
   - **2 · Primeiro dia (vazio)**;
   - **3 · Meu dia (direto em Hoje)**.
2. Pontos clicáveis:
   - **Código:** tocar no campo simula um código errado; tocar de novo, o bloqueio por tentativas. "Entrar" vai para Hoje.
   - **Hoje:** tocar em "Mercado" ou "Revisar o frontend" abre o menu da atividade (P1). Tocar no cabeçalho da Manhã simula o alerta das 11:45. A data no topo abre o dia anterior. "Fechar o dia", "Trazer para hoje" e "Deixar de lado" abrem os popups.
   - **Menu da atividade:** "Excluir" e "Deixar de lado" trocam para o popup de confirmação; "Levar…" mostra o aviso e fecha sozinho.
   - **Dia anterior:** tocar numa atividade abre o aviso "Essa já faz parte do histórico" (P4).
   - **Relatório:** abas Dia/Semana e "Tornar fixa" com confirmação.
3. O aviso de erro de rede (T3) está no arquivo como referência visual; ele não tem gatilho no protótipo.
