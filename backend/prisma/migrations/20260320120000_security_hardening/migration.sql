-- Add refresh token revocation support
ALTER TABLE "refresh_tokens"
ADD COLUMN IF NOT EXISTS "revoked" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "refresh_tokens_token_revoked_idx"
ON "refresh_tokens" ("token", "revoked");

-- Add optimistic locking field for characters
ALTER TABLE "characters"
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
