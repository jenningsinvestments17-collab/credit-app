CREATE INDEX IF NOT EXISTS idx_users_type_deleted_created_at
ON users (user_type, deleted_at, created_at);

CREATE INDEX IF NOT EXISTS idx_user_credentials_password_reset_expires_at
ON user_credentials (password_reset_expires_at);

CREATE INDEX IF NOT EXISTS idx_user_credentials_email_verification_expires_at
ON user_credentials (email_verification_expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_created_at
ON sessions (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event_created_at
ON analytics_events (user_id, event_type, created_at);
