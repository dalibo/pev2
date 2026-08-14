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
    id          INT PRIMARY KEY,
    customer_id INT,
    amount      NUMERIC
);

INSERT INTO customers
SELECT g, 'Customer_' || g
FROM generate_series(1, 1000) AS g;

INSERT INTO orders
SELECT g, (g % 1000) + 1, random()*100
 FROM generate_series(1,5000) g;

ANALYZE customers;
ANALYZE orders;

\o parent-relationship-plan
EXPLAIN
SELECT c.name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id;
\o

\o parent-relationship-expect
EXPLAIN (FORMAT JSON)
SELECT c.name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id;
\o

ROLLBACK;
