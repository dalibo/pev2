-- Script to generate plans with Aggregate nodes, for different strategies and modes
-- We also optionally have Grouping Sets
--
-- tuples only
\t
-- unaligned output format
\a

BEGIN;

DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    order_id    SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    status      TEXT NOT NULL,
    amount      NUMERIC(10, 2) NOT NULL,
    order_date  DATE NOT NULL
);

INSERT INTO orders (customer_id, status, amount, order_date)
SELECT
    (random() * 500)::INT AS customer_id,          -- 5,000 distinct customers
    (ARRAY['pending','shipped','delivered','cancelled','returned'])[floor(random() * 5 + 1)] AS status,
    round((random() * 500 + 5)::NUMERIC, 2) AS amount,
    CURRENT_DATE - (random() * 730)::INT AS order_date  -- last 2 years
FROM generate_series(1, 2000);

ANALYZE orders;

-- =========================
-- Variant A - HashAggregate
-- =========================
\o aggregate-strategy-and-mode.hash-plan
EXPLAIN
SELECT customer_id, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY customer_id, status;

\o aggregate-strategy-and-mode.hash-expect
EXPLAIN (FORMAT JSON)
SELECT customer_id, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY customer_id, status;
\o

-- ============================
-- Variant B-a - GroupAggregate
-- ============================
SET enable_hashagg = off;

\o aggregate-strategy-and-mode.group-plan
EXPLAIN
SELECT customer_id, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY customer_id;
\o

\o aggregate-strategy-and-mode.group-expect
EXPLAIN (FORMAT JSON)
SELECT customer_id, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY customer_id;
\o

-- ===============================================
-- Variant B-b - GroupAggregate with Grouping Sets, and Sort Key
-- ===============================================
SET enable_hashagg = off;

\o aggregate-strategy-and-mode.group-grouping-sets-plan
EXPLAIN
SELECT customer_id, status, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY GROUPING SETS (
    (customer_id, status),
    (customer_id),
    (status),
    ()
);
\o

\o aggregate-strategy-and-mode.group-grouping-sets-expect
EXPLAIN (FORMAT JSON)
SELECT customer_id, status, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY GROUPING SETS (
    (customer_id, status),
    (customer_id),
    (status),
    ()
);
\o

-- ==========================
-- Variant C - MixedAggregate
--
-- Using GROUP BY CUBE (customer_id, status) give a similar result
-- ==========================
RESET enable_hashagg;

\o aggregate-strategy-and-mode.mixed-plan
EXPLAIN
SELECT customer_id, status, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY GROUPING SETS (
    (customer_id, status),
    (customer_id),
    (status),
    ()
);
\o

\o aggregate-strategy-and-mode.mixed-expect
EXPLAIN (FORMAT JSON)
SELECT customer_id, status, COUNT(*) AS order_count, SUM(amount) AS total_spent
FROM orders
GROUP BY GROUPING SETS (
    (customer_id, status),
    (customer_id),
    (status),
    ()
);
\o
