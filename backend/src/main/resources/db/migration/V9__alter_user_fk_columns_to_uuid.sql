ALTER TABLE venues
    DROP CONSTRAINT IF EXISTS fk_venues_manager;

ALTER TABLE user_favorites
    DROP CONSTRAINT IF EXISTS fk_user_favorites_user;

ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS fk_bookings_client;

ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS fk_messages_sender;

ALTER TABLE venues
    ALTER COLUMN manager_id TYPE UUID USING manager_id::uuid;

ALTER TABLE user_favorites
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

ALTER TABLE bookings
    ALTER COLUMN client_id TYPE UUID USING client_id::uuid;

ALTER TABLE messages
    ALTER COLUMN sender_id TYPE UUID USING sender_id::uuid;

ALTER TABLE venues
    ADD CONSTRAINT fk_venues_manager
        FOREIGN KEY (manager_id) REFERENCES users (id);

ALTER TABLE user_favorites
    ADD CONSTRAINT fk_user_favorites_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_client
        FOREIGN KEY (client_id) REFERENCES users (id);

ALTER TABLE messages
    ADD CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users (id);
