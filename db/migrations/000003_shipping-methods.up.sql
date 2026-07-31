CREATE TABLE shipping_methods (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    name VARCHAR NOT NULL,
    cost_idr BIGINT NOT NULL
);

CREATE UNIQUE INDEX shipping_methods_name_key ON shipping_methods (name) WHERE deleted_at IS NULL;

CREATE TRIGGER shipping_methods_updated_at
BEFORE UPDATE ON shipping_methods
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
