-- Script to generate plans with Inner and Outer parent relationships
--
-- tuples only
\t
-- unaligned output format
\a

BEGIN;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    id   INT PRIMARY KEY,
    name TEXT
);

CREATE TABLE orders (
    order_id    INT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date  DATE
);

INSERT INTO customers
SELECT g, 'Customer_' || g
FROM generate_series(1, 100000) AS g;

INSERT INTO orders (order_id, customer_id, order_date)
SELECT g,
       (random() * 99999)::INT + 1,
       CURRENT_DATE - (random() * 365)::INT
FROM generate_series(1, 500000) AS g;

ANALYZE customers;
ANALYZE orders;

SET enable_nestloop = off;
SET enable_mergejoin = off;
SET enable_hashagg = off;

\o hash-semi-join-plan
EXPLAIN
SELECT c.id, c.name
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
\o

\o hash-semi-join-expect
EXPLAIN (FORMAT JSON)
SELECT c.id, c.name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.id
);
\o

\o hash-anti-join-plan
EXPLAIN
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
\o

\o hash-anti-join-expect
EXPLAIN (FORMAT JSON)
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.id
);
\o

-- JSON format needs to be a bit adapted:
--  - root array removed

ROLLBACK;
