CREATE TABLE venue_addresses (
    venue_id BIGINT PRIMARY KEY,
    street VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    voivodeship VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    CONSTRAINT fk_venue_addresses_venue
        FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
    CONSTRAINT chk_venue_addresses_latitude
        CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_venue_addresses_longitude
        CHECK (longitude BETWEEN -180 AND 180)
);
