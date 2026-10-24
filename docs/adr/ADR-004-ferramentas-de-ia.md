# ADR-004 — Ferramentas de IA no desenvolvimento: Claude constrói, Copilot revisa

- **Status:** Aceito
- **Data:** 24/10/2026
- **Decisor:** Roberto
- **Uso de IA:** comparação estruturada com apoio do Claude, usando os critérios de seleção do curso C2 (segurança, desempenho, custo e governança); decisão do autor.

## Contexto

O projeto usa IA generativa como copiloto em todas as etapas. O curso C2 apresenta várias ferramentas (GitHub Copilot, Cursor, Amazon CodeWhisperer / Q Developer, Tabnine, Codeium, Lovable) e propõe escolher com base em quatro critérios: segurança e privacidade, desempenho técnico, custos e governança. O autor tem perfil de Product Design e precisa de ferramentas que expliquem o código, não só que o gerem.

## Opções consideradas

| Critério | Claude (chat + agente) | GitHub Copilot (Free) | Cursor | Lovable |
| --- | --- | --- | --- | --- |
| Segurança e privacidade | Código fica no repositório do autor; sem dados pessoais no projeto | Integrado ao GitHub; revisão em Pull Request | IDE separada, exige instalação | Código gerado na plataforma dele |
| Desempenho técnico | Bom em raciocínio, arquitetura e explicação passo a passo; lê o Figma | Bom em autocompletar, gerar testes e revisar PRs | Bom em edição multi-arquivo | Bom em protótipo rápido; pouco controle |
| Custo | Assinatura já existente | Gratuito (plano Free) | Pago após teste | Pago após cota gratuita |
| Governança | Decisões registradas em ADRs e `uso-de-ia.md` | Revisão rastreável em cada PR | — | Difícil rastrear decisões |

## Decisão

Dois copilotos com papéis separados, mais o autor como auditor:

- **Claude:** construção. Requisitos, arquitetura, ADRs, código a partir do Figma, com explicação de cada arquivo.
- **GitHub Copilot:** revisão e testes. Revisão dos Pull Requests e geração de casos de teste.
- **Autor:** "AI code auditor". Revisa toda contribuição da IA antes do merge (curso C2, Unidade 4.3).

Ambiente: **GitHub Codespaces** (VS Code no navegador) com a extensão do Copilot, o "padrão da indústria" apresentado no curso C4 (Unidade 1.2.1), sem instalar nada localmente. O Claude atua como agente (como o Claude Code do C4, Unidade 1.2.3): lê arquivos, propõe mudanças, roda comandos git e pede confirmação antes de aplicar.

Lovable foi descartado em favor de Figma → código (ver `uso-de-ia.md`). Cursor e CodeWhisperer não trazem ganho que compense uma nova ferramenta em 4 dias.

## Consequências

- **Positivas:** uma IA não revisa o próprio trabalho; a revisão do Copilot é um segundo par de olhos independente. Custo zero adicional.
- **Negativas:** dois ambientes para acompanhar.
- **Mitigação:** todo código passa por Pull Request, onde as duas contribuições e as decisões do autor ficam registradas no mesmo lugar.
