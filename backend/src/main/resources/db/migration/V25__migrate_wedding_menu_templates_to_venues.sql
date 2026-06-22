ALTER TABLE dishes
    ADD COLUMN venue_id BIGINT;

UPDATE dishes
SET venue_id = source.venue_id
FROM (
    SELECT DISTINCT ON (wedding_menu_dish.dish_id)
           wedding_menu_dish.dish_id,
           booking.venue_id
    FROM wedding_menu_dishes wedding_menu_dish
    JOIN wedding_menus wedding_menu ON wedding_menu.id = wedding_menu_dish.wedding_menu_id
    JOIN bookings booking ON booking.id = wedding_menu.booking_id
    ORDER BY wedding_menu_dish.dish_id, wedding_menu.id
) AS source
WHERE dishes.id = source.dish_id
  AND dishes.venue_id IS NULL;

ALTER TABLE dishes
    ALTER COLUMN venue_id SET NOT NULL;

ALTER TABLE dishes
    ADD CONSTRAINT fk_dishes_venue
        FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE;

CREATE INDEX idx_dishes_venue_id ON dishes (venue_id);

ALTER TABLE wedding_menus
    ADD COLUMN venue_id BIGINT,
    ADD COLUMN menu_type VARCHAR(30);

UPDATE wedding_menus
SET venue_id = booking.venue_id,
    menu_type = 'STANDARD'
FROM bookings booking
WHERE booking.id = wedding_menus.booking_id;

ALTER TABLE wedding_menus
    ALTER COLUMN venue_id SET NOT NULL,
    ALTER COLUMN menu_type SET NOT NULL;

ALTER TABLE wedding_menus
    ADD CONSTRAINT fk_wedding_menus_venue
        FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE;

ALTER TABLE wedding_menus
    ADD CONSTRAINT chk_wedding_menus_menu_type
        CHECK (menu_type IN ('STANDARD', 'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE'));

ALTER TABLE wedding_menus
    DROP CONSTRAINT IF EXISTS wedding_menus_booking_id_key;

ALTER TABLE wedding_menus
    DROP COLUMN booking_id;

ALTER TABLE wedding_menus
    ADD CONSTRAINT uq_wedding_menus_venue_type UNIQUE (venue_id, menu_type);

CREATE INDEX idx_wedding_menus_venue_id ON wedding_menus (venue_id);
