ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS client_request_notes TEXT,
    ADD COLUMN IF NOT EXISTS pending_change_payload TEXT;

ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS chk_bookings_status;

ALTER TABLE bookings
    ADD CONSTRAINT chk_bookings_status
        CHECK (status IN (
            'SUBMITTED',
            'APPROVED',
            'REJECTED',
            'CANCELLED',
            'EXPIRED',
            'CHANGE_REQUESTED',
            'CANCELLATION_REQUESTED'
        ));
