import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Parses Subquery Scan Alias", () => {
    const planService = new PlanService()

    // tslint:disable:max-line-length
    const source = `
EXPLAIN (FORMAT JSON) SELECT * FROM (SELECT  * FROM pg_class LIMIT 40 ) foo where relname = 'aa';
                               QUERY PLAN
-------------------------------------------------------------------------
[
  {
    "Plan": {
      "Node Type": "Subquery Scan",
      "Parallel Aware": false,
      "Async Capable": false,
      "Alias": "foo",
      "Startup Cost": 0.00,
      "Total Cost": 2.27,
      "Plan Rows": 1,
      "Plan Width": 265,
      "Filter": "(foo.relname = 'aa'::name)",
      "Plans": [
        {
          "Node Type": "Limit",
          "Parent Relationship": "Subquery",
          "Parallel Aware": false,
          "Async Capable": false,
          "Startup Cost": 0.00,
          "Total Cost": 1.77,
          "Plan Rows": 40,
          "Plan Width": 265,
          "Plans": [
            {
              "Node Type": "Seq Scan",
              "Parent Relationship": "Outer",
              "Parallel Aware": false,
              "Async Capable": false,
              "Relation Name": "pg_class",
              "Alias": "pg_class",
              "Startup Cost": 0.00,
              "Total Cost": 18.10,
              "Plan Rows": 410,
              "Plan Width": 265
            }
          ]
        }
      ]
    }
  }
]
`

    const plan = planService.fromSource(source) as IPlanContent
    expect(plan?.Plan?.["Node Type"]).toEqual("Subquery Scan")
    expect(plan?.Plan?.["Alias"]).toEqual("foo")
  })

  test("Parses Subquery Scan Alias", () => {
    const planService = new PlanService()

    // tslint:disable:max-line-length
    const source = `
EXPLAIN SELECT * FROM (SELECT  * FROM pg_class LIMIT 40 ) foo where relname = 'aa';
                               QUERY PLAN
-------------------------------------------------------------------------
 Subquery Scan on foo  (cost=0.00..2.27 rows=1 width=265)
   Filter: (foo.relname = 'aa'::name)
   ->  Limit  (cost=0.00..1.77 rows=40 width=265)
         ->  Seq Scan on pg_class  (cost=0.00..18.10 rows=410 width=265)
(4 rows)
`

    const plan = planService.fromSource(source) as IPlanContent
    expect(plan?.Plan?.["Node Type"]).toEqual("Subquery Scan")
    expect(plan?.Plan?.["Alias"]).toEqual("foo")
  })
})
