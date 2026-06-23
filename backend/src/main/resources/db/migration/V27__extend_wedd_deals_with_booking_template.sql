ALTER TABLE wedd_deals
    ADD COLUMN source_full_service BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN source_service_notes TEXT,
    ADD COLUMN source_allergies_notes TEXT,
    ADD COLUMN source_menu_standard_count INT NOT NULL DEFAULT 0,
    ADD COLUMN source_menu_vegetarian_count INT NOT NULL DEFAULT 0,
    ADD COLUMN source_menu_vegan_count INT NOT NULL DEFAULT 0,
    ADD COLUMN source_menu_gluten_free_count INT NOT NULL DEFAULT 0;

ALTER TABLE wedd_deals
    ADD CONSTRAINT chk_wedd_deals_source_menu_standard_count
        CHECK (source_menu_standard_count >= 0),
    ADD CONSTRAINT chk_wedd_deals_source_menu_vegetarian_count
        CHECK (source_menu_vegetarian_count >= 0),
    ADD CONSTRAINT chk_wedd_deals_source_menu_vegan_count
        CHECK (source_menu_vegan_count >= 0),
    ADD CONSTRAINT chk_wedd_deals_source_menu_gluten_free_count
        CHECK (source_menu_gluten_free_count >= 0);
