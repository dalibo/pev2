/* Script to show as many features as possible: nested & writing CTEs,
temp/local/shared buffers, written/read, I/O timings, different nodes,
partitions, a not-executed node, setting, triggers, JIT, settings,
bad estimations, heap fetches
Parallelism is not possible in a writing query

Tested on: PostgreSQL 17 with default configuration

*/
\timing off
\set ON_ERROR_STOP 1
\set ECHO queries
SET maintenance_work_mem TO '1GB';
SET synchronous_commit TO off ;
/* Parameters shown in SETTINGS */
SET work_mem TO '3MB' ;
SET random_page_cost TO 1.5;
SET parallel_tuple_cost TO 0;
/* Timings */
SET track_io_timing TO on;
SET track_wal_io_timing TO on ;
/* Force JIT */
SET jit TO on ;
SET jit_above_cost TO 0 ;
SET jit_inline_above_cost TO 0 ;
SET jit_optimize_above_cost TO 0 ;
/* Cleaning */
DROP TABLE  IF EXISTS tB, tA, tC1, tC2 ;
/* Tables */
CREATE TABLE tB (i int PRIMARY KEY, x float, filler text DEFAULT 'abc') ;
CREATE UNLOGGED TABLE tA (i int, x float, filler text DEFAULT 'efg') PARTITION BY RANGE (i);
CREATE TABLE tA1 PARTITION OF tA FOR VALUES FROM (MINVALUE) TO (10000000) ;
CREATE TABLE tA2 PARTITION OF tA FOR VALUES FROM (10000000) TO (MAXVALUE) ;
INSERT INTO tA (i) SELECT i FROM generate_series (1,5000000) i ;
INSERT INTO tB (i, x) SELECT i,random() FROM tA WHERE random() < 0.50 ORDER BY x;
/* for triggers  */
CREATE UNLOGGED TABLE tC1 AS SELECT i FROM tB  ;
ALTER TABLE tC1 ADD CONSTRAINT tc1_fkey FOREIGN KEY (i) REFERENCES tB ON DELETE CASCADE, ADD CONSTRAINT tc1_pkey PRIMARY KEY (i);
CREATE UNLOGGED TABLE tC2 AS SELECT i FROM tC1 ;
ALTER TABLE tC2 ADD CONSTRAINT tc2_fkey FOREIGN KEY (i) REFERENCES tC1 ON DELETE CASCADE ; CREATE INDEX ON tC2(i);
VACUUM (ANALYZE) tC1, tC2, tA1 ; /* not tA2 to have different plans on both partitions  */
\dt+
SELECT COUNT(*) as nb_tc1 FROM tc1; SELECT COUNT(*) as nb_tc2 FROM tc2;
BEGIN ;
CREATE TEMP TABLE tBlog (i int, x float) ; /* local buffers */
EXPLAIN (ANALYZE,BUFFERS,VERBOSE,SETTINGS,WAL,SERIALIZE,MEMORY,FORMAT TEXT)
WITH
tBl  AS ( INSERT INTO tBlog SELECT i,x FROM tB
          WHERE i BETWEEN 4000000 AND 5000000
          AND mod(i,99)>0 AND mod(i,98)>0 AND mod(i,98)>0 and i+1>0 /* force bitmap index */
          ORDER BY x),
tAbb AS ( UPDATE tA SET x=2 WHERE i < (
            SELECT max(i)/2 FROM tB  WHERE mod(i,99)=0  AND i+1>0 AND i+2>0  /* for bad stats */
            )
          RETURNING * ),
tAb  AS MATERIALIZED ( SELECT * FROM tAbb ORDER BY x LIMIT 20000)
MERGE INTO tB
USING tAb ON (tB.i=tAb.i)
WHEN NOT MATCHED THEN
   INSERT VALUES (tAb.i, 0.0, '000')
WHEN MATCHED AND tB.x > 0.97 THEN
   DELETE  /*  will raise the ON DELETE trigger (very costly) */
WHEN MATCHED THEN
   UPDATE SET filler=tAb.filler
;
ROLLBACK ;
