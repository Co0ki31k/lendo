CREATE TABLE guest_diet_logistics (
    booking_id BIGINT PRIMARY KEY,
    menu_standard_count INT NOT NULL DEFAULT 0,
    menu_vegetarian_count INT NOT NULL DEFAULT 0,
    menu_vegan_count INT NOT NULL DEFAULT 0,
    menu_gluten_free_count INT NOT NULL DEFAULT 0,
    allergies_notes TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_guest_diet_logistics_booking
        FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT chk_guest_diet_logistics_counts
        CHECK (
            menu_standard_count >= 0
            AND menu_vegetarian_count >= 0
            AND menu_vegan_count >= 0
            AND menu_gluten_free_count >= 0
        )
);
