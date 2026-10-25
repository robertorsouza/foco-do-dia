# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### Adicionado
- Documentação de engenharia: requisitos, arquitetura, 4 ADRs, biblioteca de prompts (P-01 a P-08) e registro de uso de IA.
- Backend (Node.js + Express + PostgreSQL): atividades por turno, alertas de troca de turno, fechamento do dia sem bloqueio, seção "Atividades pendentes", atividades fixas e relatórios diário e semanal com IA (PR #1).
- Segurança: verificação de certificado TLS do banco, CORS fechado por padrão, código de acesso, cabeçalhos HTTP (Helmet) e limite de requisições (PR #1 e #2).
- 113 testes automatizados (unidade, integração, cenários de borda e concorrência), lint com regras de segurança e CI no GitHub Actions rodando no banco em memória e num PostgreSQL 16 real (PR #4).
- Migração do banco automática no `npm start` (PR #4).

### Alterado
- Banco de dados de produção: Neon em vez de Render Postgres, cujo plano gratuito expira em 30 dias (ADR-002, PR #4).
- Proteções falham fechadas: sem `NODE_ENV` declarado como local, a API exige código de acesso (PR #4).

### Corrigido
- Contagem dupla de atividade movida no mesmo dia no relatório (PR #1).
- Entradas malformadas (data inexistente, identificador gigante, corpo grande) que geravam erro 500 (PR #2).
- 6 bugs de regra de negócio: dia fechado com atividade nova, edição de dia passado, próximo turno a partir de pendências, fechamento simultâneo, datas fora do lugar e diferença entre o banco de teste e o PostgreSQL (PR #3).
- 15 achados da revisão independente: toque duplo em mover, fixas em dias já existentes, fechamento com destino no próprio dia, exclusão de histórico, tempo da IA, entradas extremas, cache da IA, números da mensagem da IA, delimitação do prompt e queda de conexão (PR #4).
