import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Maximums are correct", () => {
    const planService = new PlanService()
    const source = `
Seq Scan on pg_class  (cost=0.00..29.68 rows=568 width=773)
`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content.maxDuration).toBe(undefined)
    expect(plan.content.maxCost).toBe(29.68)
  })
})
