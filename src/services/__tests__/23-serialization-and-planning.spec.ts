import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent, IPlanning, ISerialization } from "@/interfaces"

describe("PlanService", () => {
  test("Serialization and Planning are correctly parsed", () => {
    const planService = new PlanService()
    const source = `
DROP TABLE people;
CREATE TABLE people (
    id int,
    bio text
);

INSERT INTO people
SELECT
    gs,
    repeat(md5(gs::text), 10000)
FROM generate_series(1, 100) gs;

EXPLAIN (ANALYZE, BUFFERS, MEMORY, SERIALIZE)
SELECT bio FROM people;
DROP TABLE
CREATE TABLE
INSERT 0 100
                                                QUERY PLAN
----------------------------------------------------------------------------------------------------------
 Seq Scan on people  (cost=0.00..22.70 rows=1270 width=32) (actual time=0.012..0.030 rows=100.00 loops=1)
   Buffers: shared hit=1
 Planning:
   Buffers: shared hit=6
   Memory: used=6kB  allocated=8kB
 Planning Time: 0.065 ms
 Serialization: time=4.690 ms  output=31251kB  format=text
   Buffers: shared hit=200
 Execution Time: 4.812 ms
(9 rows)
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content["Planning Time"]).toEqual(0.065)
    const serialization = plan.content["Serialization"] as ISerialization
    expect(serialization.Time).toEqual(4.69)
    expect(serialization["Output Volume"]).toEqual(31251)
    const planning = plan.content["Planning"] as IPlanning
    expect(planning["Shared Hit Blocks"]).toEqual(6)
    expect(planning["Shared Read Blocks"]).toEqual(0)
    expect(planning["Memory Used"]).toEqual(6)
    expect(planning["Memory Allocated"]).toEqual(8)
  })
})

describe("PlanService", () => {
  test("Serialization and Planning are correctly parsed (JSON)", () => {
    const planService = new PlanService()
    const source = `
    DROP TABLE people;
    CREATE TABLE people (
        id int,
        bio text
    );

    INSERT INTO people
    SELECT
        gs,
        repeat(md5(gs::text), 10000)
    FROM generate_series(1, 100) gs;

    EXPLAIN (ANALYZE, BUFFERS, MEMORY, SERIALIZE, FORMAT JSON)
    SELECT bio FROM people;
    DROP TABLE
    CREATE TABLE
    INSERT 0 100
                 QUERY PLAN
    -------------------------------------
     [                                  +
       {                                +
         "Plan": {                      +
           "Node Type": "Seq Scan",     +
           "Parallel Aware": false,     +
           "Async Capable": false,      +
           "Relation Name": "people",   +
           "Alias": "people",           +
           "Startup Cost": 0.00,        +
           "Total Cost": 22.70,         +
           "Plan Rows": 1270,           +
           "Plan Width": 32,            +
           "Actual Startup Time": 0.013,+
           "Actual Total Time": 0.047,  +
           "Actual Rows": 100.00,       +
           "Actual Loops": 1,           +
           "Disabled": false,           +
           "Shared Hit Blocks": 1,      +
           "Shared Read Blocks": 0,     +
           "Shared Dirtied Blocks": 0,  +
           "Shared Written Blocks": 0,  +
           "Local Hit Blocks": 0,       +
           "Local Read Blocks": 0,      +
           "Local Dirtied Blocks": 0,   +
           "Local Written Blocks": 0,   +
           "Temp Read Blocks": 0,       +
           "Temp Written Blocks": 0     +
         },                             +
         "Planning": {                  +
           "Shared Hit Blocks": 6,      +
           "Shared Read Blocks": 0,     +
           "Shared Dirtied Blocks": 0,  +
           "Shared Written Blocks": 0,  +
           "Local Hit Blocks": 0,       +
           "Local Read Blocks": 0,      +
           "Local Dirtied Blocks": 0,   +
           "Local Written Blocks": 0,   +
           "Temp Read Blocks": 0,       +
           "Temp Written Blocks": 0,    +
           "Memory Used": 6,            +
           "Memory Allocated": 8        +
         },                             +
         "Planning Time": 0.062,        +
         "Triggers": [                  +
         ],                             +
         "Serialization": {             +
           "Time": 25.481,              +
           "Output Volume": 31251,      +
           "Format": "text",            +
           "Shared Hit Blocks": 200,    +
           "Shared Read Blocks": 0,     +
           "Shared Dirtied Blocks": 0,  +
           "Shared Written Blocks": 0,  +
           "Local Hit Blocks": 0,       +
           "Local Read Blocks": 0,      +
           "Local Dirtied Blocks": 0,   +
           "Local Written Blocks": 0,   +
           "Temp Read Blocks": 0,       +
           "Temp Written Blocks": 0     +
         },                             +
         "Execution Time": 25.577       +
       }                                +
     ]
    (1 row)
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const serialization = plan.content["Serialization"] as ISerialization
    expect(serialization.Time).toEqual(25.481)
    expect(serialization["Output Volume"]).toEqual(31251)
    const planning = plan.content["Planning"] as IPlanning
    expect(planning["Shared Hit Blocks"]).toEqual(6)
    expect(planning["Shared Read Blocks"]).toEqual(0)
  })
})

describe("PlanService", () => {
  test("Planning IO Timing and Buffers are correctly parsed and computed", () => {
    const planService = new PlanService()
    const source = `
 Sort  (cost=3300922.10..3326782.40 rows=10344118 width=105) (actual time=19388.365..21360.337 rows=11000000 loops=1)
   Output: pp.aid, pp.bid, pp.abalance, pp.filler
   Sort Key: pp.filler
   Sort Method: external merge  Disk: 1151688kB
   Buffers: shared hit=35 read=163903, local read=16394 dirtied=16394 written=16394, temp read=778130 written=780004
   I/O Timings: read=1116.067
   ->  Append  (cost=0.00..335490.77 rows=10344118 width=105) (actual time=0.035..3226.246 rows=11000000 loops=1)
         Buffers: shared hit=32 read=163903, local read=16394 dirtied=16394 written=16394
         I/O Timings: read=1116.067
         ->  Seq Scan on pg_temp_5.pp  (cost=0.00..19836.74 rows=344274 width=352) (actual time=0.033..210.609 rows=1000000 loops=1)
               Output: pp.aid, pp.bid, pp.abalance, pp.filler
               Buffers: local read=16394 dirtied=16394 written=16394
               I/O Timings: read=39.730
         ->  Seq Scan on public.pgbench_accounts  (cost=0.00..263933.44 rows=9999844 width=97) (actual time=0.007..2169.508 rows=10000000 loops=1)
               Output: pgbench_accounts.aid, pgbench_accounts.bid, pgbench_accounts.abalance, pgbench_accounts.filler
               Buffers: shared hit=32 read=163903
               I/O Timings: read=1076.337
 Query Identifier: -5424821330993577306
 Planning:
   Buffers: shared hit=32 read=8
   I/O Timings: read=0.073
 Planning Time: 0.292 ms
 Execution Time: 22103.138 ms
(23 lignes)

    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const planning = plan.content["Planning"] as IPlanning
    expect(planning["*Read Blocks"]).toEqual(8)
    expect(planning["I/O Read Time"]).toEqual(0.073)
    expect(planning["*I/O Read Speed"]).toEqual(109589.041)
  })
})
