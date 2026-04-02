-- DCP-04 | scripts/seed_postgres.sql
-- Mock source: PostgreSQL — inventory_items
-- Unique type test: UUIDs & Timestamps (design p.23)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS inventory_items (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku           VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    category      VARCHAR(100),
    price         NUMERIC(10, 2) NOT NULL,
    stock_qty     INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO inventory_items (sku, name, category, price, stock_qty, is_active) VALUES
    ('SKU-001', 'Wireless Keyboard',        'Electronics',  49.99,  120, TRUE),
    ('SKU-002', 'Ergonomic Mouse',           'Electronics',  34.99,  200, TRUE),
    ('SKU-003', 'USB-C Hub 7-Port',          'Accessories',  29.99,   85, TRUE),
    ('SKU-004', 'Monitor Stand Adjustable',  'Furniture',    79.99,   40, TRUE),
    ('SKU-005', 'Mechanical Keyboard',       'Electronics', 129.99,   55, TRUE),
    ('SKU-006', 'Webcam 1080p',              'Electronics',  69.99,   90, TRUE),
    ('SKU-007', 'Laptop Stand Aluminium',    'Accessories',  44.99,   67, FALSE),
    ('SKU-008', 'Noise Cancelling Headset',  'Electronics', 199.99,   30, TRUE),
    ('SKU-009', 'Cable Management Kit',      'Accessories',  14.99,  300, TRUE),
    ('SKU-010', 'Standing Desk Mat',         'Furniture',    39.99,   75, TRUE),
    ('SKU-011', 'HDMI 2.1 Cable 2m',         'Accessories',   9.99,  500, TRUE),
    ('SKU-012', 'Portable SSD 1TB',          'Storage',     109.99,   45, TRUE),
    ('SKU-013', 'Smart Power Strip',         'Electronics',  54.99,   60, TRUE),
    ('SKU-014', 'Monitor Light Bar',         'Accessories',  34.99,   88, TRUE),
    ('SKU-015', 'Desk Organiser Set',        'Furniture',    24.99,  110, FALSE);