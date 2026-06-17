ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS bookings_calendar_id_key;

ALTER TABLE bookings
    ADD COLUMN price_per_guest DECIMAL(10, 2),
    ADD COLUMN max_price_per_guest DECIMAL(10, 2),
    ADD COLUMN full_service BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN service_notes TEXT,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    ADD COLUMN decision_comment TEXT,
    ADD COLUMN decided_at TIMESTAMP;

UPDATE bookings
SET price_per_guest = CASE
        WHEN estimated_guests > 0 THEN ROUND(total_estimated_cost / estimated_guests, 2)
        ELSE 0
    END,
    max_price_per_guest = CASE
        WHEN estimated_guests > 0 THEN ROUND(total_estimated_cost / estimated_guests, 2)
        ELSE 0
    END,
    status = 'APPROVED'
WHERE price_per_guest IS NULL
   OR max_price_per_guest IS NULL;

ALTER TABLE bookings
    ALTER COLUMN price_per_guest SET NOT NULL,
    ALTER COLUMN max_price_per_guest SET NOT NULL;

ALTER TABLE bookings
    ADD CONSTRAINT chk_bookings_price_per_guest
        CHECK (price_per_guest >= 0),
    ADD CONSTRAINT chk_bookings_max_price_per_guest
        CHECK (max_price_per_guest >= 0),
    ADD CONSTRAINT chk_bookings_status
        CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'));

CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_calendar_id_status ON bookings (calendar_id, status);
