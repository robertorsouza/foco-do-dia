# Atalhos do projeto (curso C4, Unidade 5.1.2). Rode `make help` para ver a lista.
.PHONY: help install migrate run web test lint format

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - Instala as dependências (backend e frontend)"
	@echo "  make migrate  - Cria as tabelas no banco (precisa do backend/.env)"
	@echo "  make run      - Sobe a API em modo de desenvolvimento"
	@echo "  make web      - Sobe o frontend em modo de desenvolvimento"
	@echo "  make test     - Roda os testes com cobertura (backend e frontend)"
	@echo "  make lint     - Verifica qualidade e segurança do código"
	@echo "  make format   - Formata o código"

install:
	cd backend && npm install
	cd frontend && npm install

migrate:
	cd backend && npm run migrate

run:
	cd backend && npm run dev

web:
	cd frontend && npm run dev

test:
	cd backend && npm run coverage
	cd frontend && npm run coverage

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

format:
	cd backend && npm run format
	cd frontend && npm run format
