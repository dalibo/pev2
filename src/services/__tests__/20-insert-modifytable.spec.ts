import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Insert node type is correct from text", () => {
    const planService = new PlanService()
    const source = `
      Insert on foo  (cost=0.00..0.01 rows=1 width=24) (actual time=0.504..0.505 rows=0 loops=1)
        ->  Result  (cost=0.00..0.01 rows=1 width=24) (actual time=0.019..0.020 rows=1 loops=1)
      Planning Time: 0.072 ms
      Trigger foo_system_time_generated_always: time=0.401 calls=1
      Trigger foo_system_time_write_history: time=0.260 calls=1
      Execution Time: 0.842 ms
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root["Node Type"]).toEqual("Insert")
  })

  test("Insert node type is correct from text", () => {
    const planService = new PlanService()
    const source = `
      [
        {
          "Plan": {
            "Node Type": "ModifyTable",
            "Operation": "Insert",
            "Parallel Aware": false,
            "Relation Name": "foo",
            "Alias": "foo",
            "Startup Cost": 0.00,
            "Total Cost": 0.01,
            "Plan Rows": 1,
            "Plan Width": 24,
            "Actual Startup Time": 0.568,
            "Actual Total Time": 0.568,
            "Actual Rows": 0,
            "Actual Loops": 1,
            "Plans": [
              {
                "Node Type": "Result",
                "Parent Relationship": "Member",
                "Parallel Aware": false,
                "Startup Cost": 0.00,
                "Total Cost": 0.01,
                "Plan Rows": 1,
                "Plan Width": 24,
                "Actual Startup Time": 0.018,
                "Actual Total Time": 0.018,
                "Actual Rows": 1,
                "Actual Loops": 1
              }
            ]
          },
          "Planning Time": 0.056,
          "Triggers": [
            {
              "Trigger Name": "foo_system_time_generated_always",
              "Relation": "foo",
              "Time": 0.435,
              "Calls": 1
            },
            {
              "Trigger Name": "foo_system_time_write_history",
              "Relation": "foo",
              "Time": 0.207,
              "Calls": 1
            }
          ],
          "Execution Time": 0.824
        }
      ]
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root["Node Type"]).toEqual("Insert")
  })
})
