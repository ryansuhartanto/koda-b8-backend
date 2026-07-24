CREATE INDEX products_id_category_idx ON products (id_category);

CREATE INDEX addresses_id_user_idx ON addresses (id_user);

CREATE INDEX saved_payments_id_user_idx ON saved_payments (id_user);

CREATE INDEX cart_items_id_product_idx ON cart_items (id_product);

CREATE INDEX wishlist_items_id_product_idx ON wishlist_items (id_product);

CREATE INDEX orders_id_user_idx ON orders (id_user);

CREATE INDEX order_items_id_product_idx ON order_items (id_product);
