# BeliMudah API

E-commerce services.

## Layout

- `apps/go`: Gin
- `apps/js`: Express
- `db/`: Migrations

## Requirements

- [mise](https://mise.jdx.dev)
- Running Postgres server

## Setup

```sh
mise install
aube install

cp .env.example .env # set PGPASSWORD, PGDATABASE, JWT_SECRET
createdb ecommerce
mise run db:up
```

## Running

```sh
mise run dev
mise run dev:go # Gin only
mise run dev:js # Express only
```

Docs are at either:

- <http://localhost:3001/docs>
- <http://localhost:3002/docs>

`GET /healthz` to check each service's database connection.

## Tasks

| command                     | description                             |
| --------------------------- | --------------------------------------- |
| `mise run dev`              | run services with auto-reload           |
| `mise run docs`             | regenerate OpenAPI specs                |
| `mise run db:up`            | migrations: apply                       |
| `mise run db:down`          | migrations: roll back                   |
| `mise run db:create <name>` | migrations: scaffold empty up/down file |
| `mise run test`             | run tests                               |
| `mise run test:watch`       | run tests with auto-reload              |
| `mise run check`            | vet Go, lint and format JS              |

## ERD

```mermaid
---
title: BeliMudah
---
erDiagram

categories ||--o{ products       : "groups"
users      ||--o{ addresses      : "has"
users      ||--o{ saved_payments : "has"
users      ||--o{ cart_items     : "has"
products   ||--o{ cart_items     : "in"
users      ||--o{ wishlist_items : "has"
products   ||--o{ wishlist_items : "in"
users      ||--o{ orders         : "places"
orders     ||--o{ order_items    : "detailed by"
products   |o--o{ order_items    : "snapshotted in"

users {
    int id PK

    timestamptz  created_at
    timestamptz  updated_at
    timestamptz? deleted_at

    enum   role "customer | admin"
    string email UK
    string password_hash
    string name

    string? phone
    date?   birthdate
    enum?   gender "M | F | X"
    string? avatar
}

categories {
    int id PK

    timestamptz  created_at
    timestamptz  updated_at
    timestamptz? deleted_at

    string  name UK
    string? icon
    string? img
}

products {
    int id PK

    timestamptz  created_at
    timestamptz  updated_at
    timestamptz? deleted_at

    int? id_category FK

    string  slug UK
    string  name
    string? brand
    string? img
    string? summary

    bigint  price_idr
    bigint? original_price_idr
    int     stock

    decimal rating
    int     rating_count
    string  tags "TEXT[]"
}

addresses {
    int id PK

    timestamptz  created_at
    timestamptz  updated_at
    timestamptz? deleted_at

    int id_user FK

    string  label
    string  name
    string  phone
    string  address
    string  city
    string  province
    string  postal_code
    bool    is_default
}

saved_payments {
    int id PK

    timestamptz  created_at
    timestamptz  updated_at
    timestamptz? deleted_at

    int id_user FK

    string type
    bool   is_default
}

cart_items {
    timestamptz created_at

    int id_user    PK,FK
    int id_product PK,FK

    int quantity
}

wishlist_items {
    timestamptz created_at

    int id_user    PK,FK
    int id_product PK,FK
}

orders {
    int id PK

    timestamptz  created_at
    timestamptz  updated_at
    timestamptz? deleted_at

    int id_user FK

    enum   status "pending | packed | shipped | delivered | cancelled"
    string payment_method

    string? promo_code
    bigint  discount_idr
    bigint  subtotal_idr
    bigint  ship_cost_idr
    bigint  total_idr

    string  ship_name
    string  ship_phone
    string  ship_email
    string  ship_address
    string  ship_city
    string  ship_province
    string  ship_postal_code
    string  ship_method
    string? ship_note
}

order_items {
    int id PK

    int  id_order   FK
    int? id_product FK

    string product_name
    bigint unit_price_idr
    int    quantity
}
```

## License

[MIT](LICENSE)
