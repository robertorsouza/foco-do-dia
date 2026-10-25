# ADR-002 — Banco de dados: PostgreSQL gerenciado (Neon) em vez de SQLite

- **Status:** Aceito · revisado em 25/10/2026
- **Data:** 23/10/2026
- **Decisor:** Roberto
- **Uso de IA:** a limitação do plano gratuito foi identificada com apoio do Claude e confirmada na documentação oficial do Render; decisão do autor.

## Contexto

A primeira proposta de stack usava SQLite, por ser um arquivo só e não exigir servidor. Porém o backend será publicado no plano gratuito do Render, cujo sistema de arquivos é temporário: alterações locais, incluindo um banco SQLite, se perdem a cada novo deploy, reinício ou quando o serviço dorme após 15 minutos sem uso.

O Foco do Dia depende de histórico: o relatório semanal (HU-11), a sugestão de atividades fixas (RN-08: 3 de 7 dias) e as pendências `em aberto` precisam sobreviver de um dia para o outro.

## Opções consideradas

| Opção | Prós | Contras |
| --- | --- | --- |
| A. SQLite no servidor | Zero configuração | **Dados apagados** a cada reinício no plano gratuito; inviabiliza o histórico |
| B. SQLite + disco persistente | Mantém a simplicidade | Disco persistente só existe em plano pago |
| C1. Render Postgres (gratuito) | Mesmo provedor do backend | **Expira 30 dias após a criação**; depois de 14 dias de carência, banco e dados são apagados; sem backup ([Render](https://render.com/docs/free)) |
| **C2. Neon (gratuito)** | Dados persistem; os limites "não apagam seus dados"; 1 GB por projeto; padrão PostgreSQL ([Neon](https://neon.com/faqs/free-plan-limits-and-quotas)) | Serviço a mais; o banco dorme após 5 min sem uso (primeira consulta mais lenta); 100 horas de computação por mês |

## Decisão

**Opção C2:** PostgreSQL gerenciado no **Neon**.

**Revisão de 25/10:** a decisão original era Render Postgres, com Neon como alternativa "se houver limite de prazo". A revisão independente do backend levantou o risco, e a documentação oficial do Render confirmou: o banco gratuito expira em 30 dias e é apagado. Como o produto depende de histórico (relatório semanal, RN-08), a alternativa virou a escolha.

## Consequências

- **Positivas:** histórico confiável para relatórios e sugestões; o mesmo banco serve desenvolvimento e produção.
- **Negativas:** um serviço a mais para configurar; o desenvolvimento local precisa apontar para um banco Postgres.
- **Riscos e mitigação:** banco dormindo após 5 min → a primeira consulta do dia é mais lenta, aceitável para o MVP. Esquema versionado e migração automática no `npm start`, para recriar o banco em minutos se for preciso.

## Lição registrada

Esta decisão nasceu de uma sugestão inicial que não considerava o ambiente de deploy. Validar a infraestrutura antes de fechar a stack evitou perder dados em produção (exemplo do gargalo de qualidade "requisitos de ambiente esquecidos", Unidade II).
- **Segunda lição (25/10):** o próprio ADR já citava o risco de prazo, mas sem verificar. Uma revisão independente pediu a confirmação, e a fonte oficial mudou a decisão. Risco anotado e não verificado é risco aceito sem saber.
