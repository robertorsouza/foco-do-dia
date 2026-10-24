# ADR-002 — Banco de dados: PostgreSQL gerenciado em vez de SQLite

- **Status:** Aceito
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
| **C. PostgreSQL gerenciado (Render Postgres ou Neon)** | Dados persistem; gratuito; padrão de mercado; consultas por data eficientes | Exige variável `DATABASE_URL` e um passo a mais de configuração |

## Decisão

**Opção C:** PostgreSQL gerenciado. Render Postgres como primeira escolha, Neon como alternativa se houver limite de prazo no plano gratuito.

## Consequências

- **Positivas:** histórico confiável para relatórios e sugestões; o mesmo banco serve desenvolvimento e produção.
- **Negativas:** um serviço a mais para configurar; o desenvolvimento local precisa apontar para um banco Postgres.
- **Riscos e mitigação:** banco gratuito com prazo de validade → registrar a data de expiração no README e manter o script de criação das tabelas versionado, para recriar em minutos.

## Lição registrada

Esta decisão nasceu de uma sugestão inicial que não considerava o ambiente de deploy. Validar a infraestrutura antes de fechar a stack evitou perder dados em produção (exemplo do gargalo de qualidade "requisitos de ambiente esquecidos", Unidade II).
