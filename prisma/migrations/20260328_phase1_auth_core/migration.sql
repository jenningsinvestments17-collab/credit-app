CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE "UserType" AS ENUM ('client', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SessionStatus" AS ENUM ('active', 'revoked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RoleCode" AS ENUM ('client', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" CITEXT NOT NULL UNIQUE,
  "email_verified_at" TIMESTAMPTZ,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "phone" TEXT,
  "user_type" "UserType" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_users_type_status" ON "users" ("user_type", "status");

CREATE TABLE IF NOT EXISTS "user_credentials" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "password_hash" TEXT NOT NULL,
  "password_algo" TEXT NOT NULL DEFAULT 'scrypt',
  "password_updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "failed_login_count" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMPTZ,
  "email_verification_token_hash" TEXT,
  "email_verification_expires_at" TIMESTAMPTZ,
  "password_reset_token_hash" TEXT,
  "password_reset_expires_at" TIMESTAMPTZ,
  "password_reset_requested_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_user_credentials_locked_until" ON "user_credentials" ("locked_until");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "session_token_hash" TEXT NOT NULL UNIQUE,
  "csrf_secret_hash" TEXT,
  "ip_address" INET,
  "user_agent" TEXT,
  "status" "SessionStatus" NOT NULL DEFAULT 'active',
  "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ NOT NULL,
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user_status" ON "sessions" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires_at" ON "sessions" ("expires_at");

CREATE TABLE IF NOT EXISTS "roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" "RoleCode" NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "assigned_by_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("user_id", "role_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles" ("role_id");
