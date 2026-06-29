-- Users table for license management
CREATE TABLE IF NOT EXISTS users (
    machine_id TEXT PRIMARY KEY,
    customer_name TEXT,
    purchase_state INTEGER DEFAULT 0,
    is_online INTEGER DEFAULT 0,
    app_version TEXT,
    created_at TEXT,
    activated_at TEXT,
    deactivated_at TEXT,
    updated_at TEXT,
    updated_by TEXT,
    last_active TEXT,
    last_verified TEXT,
    token_version TEXT,
    update_notification TEXT
);

-- Settings table for global settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_purchase_state ON users(purchase_state);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
