# ADR-001 — Stack: JavaScript de ponta a ponta

- **Status:** Aceito
- **Data:** 23/10/2026
- **Decisor:** Roberto
- **Uso de IA:** opções e trade-offs levantados com apoio do Claude; decisão e justificativa revisadas pelo autor.

## Contexto

O Foco do Dia precisa de backend (API REST, regras de negócio, integração com IA) e frontend (checklist por turno, alertas, relatórios), entregues e publicados em 4 dias (até 26/10). O autor vem de Product Design, conhece React + Tailwind do lado do design e quer uma stack em que a IA copiloto (Claude e GitHub Copilot) gere e explique bem o código.

## Opções consideradas

| Opção | Prós | Contras |
| --- | --- | --- |
| **A. Node.js + Express / React + Tailwind (Vite)** | Uma linguagem só; React + Tailwind já conhecido pelo autor; ecossistema enorme; copilotos geram muito bem; deploy gratuito simples (Vercel + Render) | Express é minimalista: estrutura de camadas precisa ser definida por nós |
| B. Python + FastAPI / React + Tailwind | FastAPI gera documentação da API sozinho; Python é ótimo para IA | Duas linguagens para aprender e manter em 4 dias |
| C. Next.js full-stack (front e API no mesmo projeto) | Um projeto só; deploy único na Vercel | Mistura front e back, o que enfraquece a demonstração de arquitetura em camadas cobrada no curso |

## Decisão

**Opção A:** backend em Node.js + Express, frontend em React + Tailwind criado com Vite.

## Consequências

- **Positivas:** curva de aprendizado menor; o design do Figma vira componentes Tailwind com fidelidade; backend e frontend separados deixam a arquitetura visível e testável.
- **Negativas:** precisamos impor a separação `routes/ → services/ → db/` por convenção, já que o Express não obriga.
- **Riscos e mitigação:** código gerado por IA sem padrão → ESLint + Prettier e revisão em Pull Request desde o primeiro commit.
