CREATE TABLE partner_profiles (
    user_id UUID PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(30),
    contact_email VARCHAR(255),
    description VARCHAR(1000),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partner_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
