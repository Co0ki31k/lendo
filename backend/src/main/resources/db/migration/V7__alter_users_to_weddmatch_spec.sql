-- Add new columns required by WeddMatch specification
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Migrate data from existing columns to new structure
UPDATE users
SET
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = COALESCE(SUBSTR(full_name, POSITION(' ' IN full_name) + 1), ''),
    is_active = CASE WHEN enabled = true THEN true ELSE false END
WHERE first_name IS NULL;

-- Map existing role strings to role_id (roles table created in V3)
UPDATE users
SET role_id = CASE
    WHEN role = 'ROLE_ADMIN' THEN 4
    WHEN role = 'ROLE_MANAGER' THEN 3
    WHEN role = 'ROLE_CLIENT' THEN 2
    ELSE 1
END
WHERE role_id IS NULL;

-- Set role_id to NOT NULL after migration
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles (id);

-- Create index on role_id for performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);


