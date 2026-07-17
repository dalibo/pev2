import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Parallel Aware correctly set", () => {
    const planService = new PlanService()
    const source = `Seq Scan on tenk1  (cost=0.00..333.00 rows=10000 width=148)`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root?.["Parallel Aware"]).toBe(false)
  })

  test("Parallel Aware correctly set", () => {
    const planService = new PlanService()
    const source = `Parallel Seq Scan on tenk1  (cost=0.00..333.00 rows=10000 width=148)`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root?.["Parallel Aware"]).toBe(true)
  })
})
