DROP table tenk1;

CREATE TABLE tenk1 (
  unique1   int4,
  unique2   int4,
  two     int4,
  four    int4,
  ten     int4,
  twenty    int4,
  hundred   int4,
  thousand  int4,
  twothousand int4,
  fivethous int4,
  tenthous  int4,
  odd     int4,
  even    int4,
  stringu1  name,
  stringu2  name,
  string4   name
);
\COPY tenk1 FROM '/home/pierre/work/pev2/src/services/__tests__/tenk.data';


-- Serializable isolation would disable parallel query, so explicitly use an
-- arbitrary other level.
begin isolation level repeatable read;

-- encourage use of parallel plans
set parallel_setup_cost=0;
set parallel_tuple_cost=0;
-- set min_parallel_relation_size=0 -- For 9.6
set min_parallel_table_scan_size=0;
set max_parallel_workers_per_gather=2;

EXPLAIN SELECT two, four FROM tenk1 ORDER BY two;

SELECT '-----';
EXPLAIN (ANALYZE) SELECT two, four FROM tenk1 ORDER BY two;

SELECT '-----';
EXPLAIN (ANALYZE, VERBOSE) SELECT two, four FROM tenk1 ORDER BY two;

SELECT '-----';
EXPLAIN (ANALYZE, FORMAT JSON) SELECT two, four FROM tenk1 ORDER BY two;

SELECT '-----';
EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON) SELECT two, four FROM tenk1 ORDER BY two;

rollback;

CREATE INDEX tenk1_unique1 ON tenk1 USING btree(unique1 int4_ops);

CREATE INDEX tenk1_unique2 ON tenk1 USING btree(unique2 int4_ops);

CREATE INDEX tenk1_hundred ON tenk1 USING btree(hundred int4_ops);

CREATE INDEX tenk1_thous_tenthous ON tenk1 (thousand, tenthous);

CREATE OR REPLACE function sp_parallel_restricted(int) returns int as
  $$begin return $1; end$$ language plpgsql parallel restricted;

-- Serializable isolation would disable parallel query, so explicitly use an
-- arbitrary other level.
begin isolation level repeatable read;

-- encourage use of parallel plans
set parallel_setup_cost=0;
set parallel_tuple_cost=0;
-- set min_parallel_relation_size=0 -- For 9.6
set min_parallel_table_scan_size=0;
set max_parallel_workers_per_gather=4;

--reset the value of workers for each table as it was before this test.
alter table tenk1 set (parallel_workers = 4);

reset enable_material;
reset enable_bitmapscan;
reset enable_indexonlyscan;
reset enable_indexscan;

-- test parallel bitmap heap scan.
set enable_seqscan to off;
set enable_indexscan to off;
set enable_hashjoin to off;
set enable_mergejoin to off;
set enable_material to off;
-- test prefetching, if the platform allows it
DO $$
BEGIN
 SET effective_io_concurrency = 50;
EXCEPTION WHEN invalid_parameter_value THEN
END $$;
set work_mem='64kB';  --set small work mem to force lossy pages

SELECT '-----';
EXPLAIN
SELECT count(*)
FROM tenk1
WHERE tenk1.hundred > 1;

SELECT '-----';
EXPLAIN (ANALYZE)
SELECT count(*)
FROM tenk1
WHERE tenk1.hundred > 1;

SELECT '-----';
EXPLAIN (VERBOSE)
SELECT count(*)
FROM tenk1
WHERE tenk1.hundred > 1;

SELECT '-----';
EXPLAIN (ANALYZE, VERBOSE)
SELECT count(*)
FROM tenk1
WHERE tenk1.hundred > 1;

SELECT '-----';
EXPLAIN (FORMAT JSON)
SELECT count(*)
FROM tenk1
WHERE tenk1.hundred > 1;

SELECT '-----';
EXPLAIN (ANALYZE, FORMAT JSON)
SELECT count(*)
FROM tenk1
WHERE tenk1.hundred > 1;

SELECT '-----';
EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON)
SELECT count(*)
FROM tenk1
WHERE tenk1.hundred > 1;

rollback;
