ALTER TABLE venues
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

UPDATE venues
SET status = CASE
    WHEN is_verified = TRUE THEN 'APPROVED'
    ELSE 'DRAFT'
END;

CREATE INDEX idx_venues_status ON venues (status);
