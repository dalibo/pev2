import { describe, expect, test } from "vitest"

import { Property } from "@/enums"
import type { IPlan, IPlanContent } from "@/interfaces"
import { PlanService } from "@/services/plan-service"

describe("PlanService", () => {
  test("Single Copy is parsed from text format into a boolean", () => {
    const planService = new PlanService()
    const source = `
 Gather  (cost=1000.00..13758.07 rows=1 width=4) (actual time=51.2..53.9 rows=1 loops=1)
   Workers Planned: 1
   Workers Launched: 1
   Single Copy: true
   ->  Parallel Seq Scan on tenk1  (cost=0.00..12758.00 rows=1 width=4) (actual time=47.1..47.1 rows=1 loops=1)
         Filter: (unique1 = 1)
`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root[Property.SINGLE_COPY]).toBe(true)
    expect(root[Property.WORKERS_PLANNED]).toBe(1)
    expect(root.Plans[0][Property.FILTER]).toBe("(unique1 = 1)")
  })

  test("Single Copy defaults to false in text format", () => {
    const planService = new PlanService()
    const source = `
 Gather  (cost=1000.00..13758.07 rows=1 width=4)
   Workers Planned: 2
   ->  Parallel Seq Scan on tenk1  (cost=0.00..12758.00 rows=1 width=4)
`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content.Plan[Property.SINGLE_COPY]).toBe(false)
  })

  test("Single Copy is read from JSON format", () => {
    const planService = new PlanService()
    const source = `[
  {
    "Plan": {
      "Node Type": "Gather",
      "Parallel Aware": false,
      "Async Capable": false,
      "Startup Cost": 1000.00,
      "Total Cost": 13758.07,
      "Plan Rows": 1,
      "Plan Width": 4,
      "Single Copy": true,
      "Workers Planned": 1,
      "Plans": [
        {
          "Node Type": "Seq Scan",
          "Parent Relationship": "Outer",
          "Parallel Aware": true,
          "Async Capable": false,
          "Relation Name": "tenk1",
          "Alias": "tenk1",
          "Startup Cost": 0.00,
          "Total Cost": 12758.00,
          "Plan Rows": 1,
          "Plan Width": 4,
          "Filter": "(unique1 = 1)"
        }
      ]
    }
  }
]`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root[Property.SINGLE_COPY]).toBe(true)
    expect(root.Plans[0][Property.SINGLE_COPY]).toBeFalsy()
  })
})
