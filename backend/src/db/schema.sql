-- Esquema do Foco do Dia (PostgreSQL). Idempotente: pode rodar várias vezes.
-- Modelo descrito em docs/arquitetura.md, seção 4.

CREATE TABLE IF NOT EXISTS dias (
  data         DATE PRIMARY KEY,
  fechado_em   TIMESTAMPTZ,            -- nulo = dia aberto (RN-07)
  sugestoes_ia JSONB                   -- cache das sugestões do relatório
);

CREATE TABLE IF NOT EXISTS atividades_fixas (
  id         SERIAL PRIMARY KEY,
  titulo     VARCHAR(80) NOT NULL,
  turno      TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('normal', 'urgente')),
  ativa      BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atividades (
  id            SERIAL PRIMARY KEY,
  data          DATE NOT NULL REFERENCES dias (data),
  titulo        VARCHAR(80) NOT NULL,                                                  -- RN-02
  turno         TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),            -- RN-01
  prioridade    TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('normal', 'urgente')),
  status        TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'feita', 'movida', 'deixada_de_lado', 'em_aberto')), -- RN-05
  origem_id     INTEGER REFERENCES atividades (id) ON DELETE SET NULL,  -- de onde foi movida
  fixa_id       INTEGER REFERENCES atividades_fixas (id) ON DELETE SET NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atividades_data ON atividades (data);
CREATE INDEX IF NOT EXISTS idx_atividades_status ON atividades (status);
