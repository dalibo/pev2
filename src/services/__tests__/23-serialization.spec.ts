import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent, ISerialization } from "@/interfaces"

describe("PlanService", () => {
  test("Serialization is correctly parsed", () => {
    const planService = new PlanService()
    const source = `
    DROP TABLE IF EXISTS people;

    CREATE TABLE people (
        id int,
        bio text
    );

    INSERT INTO people
    SELECT
        gs,
        repeat(md5(gs::text), 10000)
    FROM generate_series(1, 100) gs;

    EXPLAIN (ANALYZE, BUFFERS, SERIALIZE)
    SELECT bio FROM people;
    DROP TABLE
    CREATE TABLE
    INSERT 0 100
                                                    QUERY PLAN
    ----------------------------------------------------------------------------------------------------------
     Seq Scan on people  (cost=0.00..22.70 rows=1270 width=32) (actual time=0.009..0.046 rows=100.00 loops=1)
       Buffers: shared hit=1
     Planning:
       Buffers: shared hit=6
     Planning Time: 0.038 ms
     Serialization: time=8.480 ms  output=31251kB  format=text
       Buffers: shared hit=200
     Execution Time: 8.553 ms
    (8 rows)
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const serialization = plan.content["Serialization"] as ISerialization
    expect(serialization.Time).toEqual(8.48)
    expect(serialization["Output Volume"]).toEqual(31251)
  })
})

describe("PlanService", () => {
  test("Serialization is correctly parsed", () => {
    const planService = new PlanService()
    const source = `
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
           "Total Cost": 2.00,          +
           "Plan Rows": 100,            +
           "Plan Width": 18,            +
           "Actual Startup Time": 0.006,+
           "Actual Total Time": 0.025,  +
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
           "Shared Hit Blocks": 5,      +
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
         "Planning Time": 0.039,        +
         "Triggers": [                  +
         ],                             +
         "Serialization": {             +
           "Time": 5.169,               +
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
         "Execution Time": 5.212        +
       }                                +
     ]
    (1 row)
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const serialization = plan.content["Serialization"] as ISerialization
    expect(serialization.Time).toEqual(5.169)
    expect(serialization["Output Volume"]).toEqual(31251)
  })
})
