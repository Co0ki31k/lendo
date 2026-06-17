INSERT INTO booking_statuses (id, status_name)
SELECT 1, 'AVAILABLE'
WHERE NOT EXISTS (
    SELECT 1
    FROM booking_statuses
    WHERE status_name = 'AVAILABLE'
);

INSERT INTO booking_statuses (id, status_name)
SELECT 2, 'PROVISIONAL'
WHERE NOT EXISTS (
    SELECT 1
    FROM booking_statuses
    WHERE status_name = 'PROVISIONAL'
);

INSERT INTO booking_statuses (id, status_name)
SELECT 3, 'CONFIRMED'
WHERE NOT EXISTS (
    SELECT 1
    FROM booking_statuses
    WHERE status_name = 'CONFIRMED'
);
