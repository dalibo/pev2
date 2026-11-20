--
-- Script to show CTE Scan and the possible relationship between values for
-- buffers cost.
--
-- By using a table with a ~500bytes, the update node in the CTE spills to disk
-- considering a low value for `work_mem. There should be temp read and written
-- blocks.
--
-- Tested on: PostgreSQL 18 with default configuration (using psql)
--
-- Resulting plans are exported in both TEXT and JSON format.
--

BEGIN;
DROP TABLE IF EXISTS t;

-- 1000 rows * ~500 byte column ~= 500+ kB.
CREATE TABLE t AS
SELECT
  i AS id,
  repeat('x', 500) AS filler
FROM generate_series(1, 1000) AS i;

SET work_mem = '64kB';
SET track_io_timing = 'on';

-- The buffers cost for the `CTE Scan` will exactly match the
-- one from the CTE itself.

\o 27-cte-exclusive-buffers-io.plan
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
WITH update_cte AS (
  UPDATE t set id=id+1 RETURNING id, filler
)
SELECT * FROM update_cte;
\o

-- The buffers cost for the `CTE Scan` is lower because of
-- the LIMIT. This node pulls doesn't need all data from the update. Thus the
-- buffers for this node is only a fragment of the one for the the CTE. Also
-- the time spent in this node is lower. It ends sooner. The update continues
-- after the CTE Scan finsihed.

\o 27-cte-exclusive-buffers-io-with-limit.plan
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
WITH update_cte AS (
  UPDATE t set id=id+1 RETURNING id, filler
)
SELECT * FROM update_cte
LIMIT 100;
\o

-- In the third example, by using UNION ALL, we show how the buffers are shared
-- accross the CTE Scans using the same CTE.

\o 27-cte-exclusive-buffers-io-several-cte-scans.plan
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
WITH update_cte AS (
  UPDATE t set id=id+1 RETURNING id, filler
)
SELECT * FROM update_cte
UNION ALL SELECT * FROM update_cte;
\o

ROLLBACK;
