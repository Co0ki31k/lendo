CREATE TABLE dishes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL,
    CONSTRAINT chk_dishes_category
        CHECK (category IN ('PRZYSTAWKA', 'ZUPA', 'DANIE_GLOWNE', 'DESER', 'KOLACJA'))
);

CREATE TABLE ingredients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL,
    default_unit VARCHAR(10) NOT NULL,
    waste_percentage DOUBLE PRECISION NOT NULL,
    CONSTRAINT chk_ingredients_category
        CHECK (category IN ('MIESO', 'NABIAL', 'WARZYWA_OWOCE', 'SUCHE')),
    CONSTRAINT chk_ingredients_default_unit
        CHECK (default_unit IN ('G', 'ML', 'SZT')),
    CONSTRAINT chk_ingredients_waste_percentage
        CHECK (waste_percentage >= 0 AND waste_percentage < 1)
);

CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    dish_id BIGINT NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients (id) ON DELETE RESTRICT,
    quantity_per_guest DOUBLE PRECISION NOT NULL,
    CONSTRAINT chk_recipes_quantity_per_guest
        CHECK (quantity_per_guest > 0),
    CONSTRAINT uq_recipes_dish_ingredient UNIQUE (dish_id, ingredient_id)
);

CREATE TABLE wedding_menus (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE
);

CREATE TABLE wedding_menu_dishes (
    wedding_menu_id BIGINT NOT NULL REFERENCES wedding_menus (id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
    PRIMARY KEY (wedding_menu_id, dish_id)
);

CREATE INDEX idx_recipes_dish_id ON recipes (dish_id);
CREATE INDEX idx_recipes_ingredient_id ON recipes (ingredient_id);
CREATE INDEX idx_wedding_menu_dishes_dish_id ON wedding_menu_dishes (dish_id);
