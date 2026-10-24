# Atalhos do projeto (curso C4, Unidade 5.1.2). Rode `make help` para ver a lista.
.PHONY: help install migrate run test lint format

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - Instala as dependências"
	@echo "  make migrate  - Cria as tabelas no banco (precisa do .env)"
	@echo "  make run      - Sobe a API em modo de desenvolvimento"
	@echo "  make test     - Roda os testes com cobertura"
	@echo "  make lint     - Verifica qualidade e segurança do código"
	@echo "  make format   - Formata o código"

install:
	cd backend && npm install

migrate:
	cd backend && npm run migrate

run:
	cd backend && npm run dev

test:
	cd backend && npm run coverage

lint:
	cd backend && npm run lint

format:
	cd backend && npm run format
