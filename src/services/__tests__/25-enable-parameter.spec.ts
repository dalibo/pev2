import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Disabled property is parsed and converted to boolean", () => {
    const planService = new PlanService()
    const source = `
      Seq Scan on t1  (cost=0.00..21370.00 rows=333333 width=22)
        Disabled: true
        Filter: ((c1 + 0) < 1000000)
      Settings: enable_seqscan = 'off'
    `
    const plan = planService.fromText(source) as IPlanContent
    expect(plan.Plan["Disabled"]).toBe(true)
  })
})
