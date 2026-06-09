ALTER TABLE wedd_deals
    ADD COLUMN original_guest_count INT NOT NULL DEFAULT 0,
    ADD COLUMN allow_guest_count_adjustment BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN min_guest_count INT,
    ADD COLUMN max_guest_count INT;

UPDATE wedd_deals
SET original_guest_count = 0
WHERE original_guest_count = 0;

ALTER TABLE wedd_deals
    ADD CONSTRAINT chk_wedd_deals_original_guest_count
        CHECK (original_guest_count >= 0),
    ADD CONSTRAINT chk_wedd_deals_min_guest_count
        CHECK (min_guest_count IS NULL OR min_guest_count >= 0),
    ADD CONSTRAINT chk_wedd_deals_max_guest_count
        CHECK (max_guest_count IS NULL OR max_guest_count >= 0),
    ADD CONSTRAINT chk_wedd_deals_guest_count_range
        CHECK (
            (allow_guest_count_adjustment = FALSE AND min_guest_count IS NULL AND max_guest_count IS NULL)
            OR
            (allow_guest_count_adjustment = TRUE AND min_guest_count IS NOT NULL AND max_guest_count IS NOT NULL AND min_guest_count <= max_guest_count)
        );
