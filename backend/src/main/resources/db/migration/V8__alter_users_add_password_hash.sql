ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

UPDATE users
SET password_hash = password
WHERE password_hash IS NULL AND password IS NOT NULL;

