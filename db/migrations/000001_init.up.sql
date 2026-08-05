CREATE TYPE user_role AS ENUM ('customer', 'admin');

CREATE TYPE order_status AS ENUM ('pending', 'packed', 'shipped', 'delivered', 'cancelled');

CREATE TYPE gender AS ENUM ('M', 'F', 'X');

CREATE TABLE users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    role user_role NOT NULL DEFAULT 'customer',

    email VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,

    phone VARCHAR,
    birthdate DATE,
    gender gender,
    avatar VARCHAR
);

-- partial unique: a soft-deleted row must not block reuse of its email
CREATE UNIQUE INDEX users_email_key ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    name VARCHAR NOT NULL,
    icon VARCHAR,
    img VARCHAR
);

CREATE UNIQUE INDEX categories_name_key ON categories (name) WHERE deleted_at IS NULL;

CREATE TABLE products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    id_category BIGINT REFERENCES categories (id),

    slug VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    brand VARCHAR,
    img VARCHAR,
    summary VARCHAR,

    price_idr BIGINT NOT NULL,
    original_price_idr BIGINT,
    stock INT NOT NULL DEFAULT 0,

    rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
    rating_count INT NOT NULL DEFAULT 0,

    tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE UNIQUE INDEX products_slug_key ON products (slug) WHERE deleted_at IS NULL;

CREATE INDEX products_tags_idx ON products USING GIN (tags);

-- REFERENCES indexes neither side of the constraint, so every FK column is indexed by hand
CREATE INDEX products_id_category_idx ON products (id_category);

CREATE TABLE addresses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    id_user BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    label VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    province VARCHAR NOT NULL,
    postal_code VARCHAR NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX addresses_id_user_idx ON addresses (id_user);

CREATE TABLE saved_payments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    id_user BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    type VARCHAR NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX saved_payments_id_user_idx ON saved_payments (id_user);

CREATE TABLE cart_items (
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_user BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    id_product BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    PRIMARY KEY (id_user, id_product),

    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX cart_items_id_product_idx ON cart_items (id_product);

CREATE TABLE wishlist_items (
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_user BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    id_product BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    PRIMARY KEY (id_user, id_product)
);

CREATE INDEX wishlist_items_id_product_idx ON wishlist_items (id_product);

CREATE TABLE shipping_methods (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    name VARCHAR NOT NULL,
    cost_idr BIGINT NOT NULL
);

CREATE UNIQUE INDEX shipping_methods_name_key ON shipping_methods (name) WHERE deleted_at IS NULL;

CREATE TABLE orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    id_user BIGINT NOT NULL REFERENCES users (id),

    status order_status NOT NULL DEFAULT 'pending',
    payment_method VARCHAR NOT NULL,

    promo_code VARCHAR,
    discount_idr BIGINT NOT NULL DEFAULT 0,
    subtotal_idr BIGINT NOT NULL,
    ship_cost_idr BIGINT NOT NULL DEFAULT 0,
    total_idr BIGINT NOT NULL,

    ship_name VARCHAR NOT NULL,
    ship_phone VARCHAR NOT NULL,
    ship_email VARCHAR NOT NULL,
    ship_address VARCHAR NOT NULL,
    ship_city VARCHAR NOT NULL,
    ship_province VARCHAR NOT NULL,
    ship_postal_code VARCHAR NOT NULL,
    ship_method VARCHAR NOT NULL,
    ship_note VARCHAR
);

CREATE INDEX orders_id_user_idx ON orders (id_user);

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    id_order BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    id_product BIGINT REFERENCES products (id) ON DELETE SET NULL,

    product_name VARCHAR NOT NULL,
    unit_price_idr BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX order_items_id_order_idx ON order_items (id_order);

CREATE INDEX order_items_id_product_idx ON order_items (id_product);

--

CREATE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
   ELSE
      RETURN OLD;
   END IF;
END;
$$ language plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER addresses_updated_at
BEFORE UPDATE ON addresses
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER saved_payments_updated_at
BEFORE UPDATE ON saved_payments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER shipping_methods_updated_at
BEFORE UPDATE ON shipping_methods
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
