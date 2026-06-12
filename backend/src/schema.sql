-- ─── Extensiones ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tabla: users ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
	id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
	google_id  TEXT        UNIQUE NOT NULL,
	email      TEXT        NOT NULL,
	username   TEXT        NOT NULL,
	color      TEXT        NOT NULL DEFAULT '#1899D5',
	avatar_url TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tabla: groups ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
	id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
	code       TEXT        UNIQUE NOT NULL,  -- código 6 chars para emparejar
	name       TEXT        NOT NULL DEFAULT 'Mi grupo',
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tabla: group_members ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
	group_id  UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
	user_id   UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
	joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (group_id, user_id)
);

-- ─── Tabla: transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
	id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
	group_id    UUID           NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
	user_id     UUID           NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
	type        TEXT           NOT NULL CHECK (type IN ('income', 'expense')),
	amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
	description TEXT,
	image_url   TEXT,
	date        DATE           NOT NULL DEFAULT CURRENT_DATE,
	created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ─── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_group_date
	ON transactions (group_id, date);

CREATE INDEX IF NOT EXISTS idx_group_members_user
	ON group_members (user_id);
