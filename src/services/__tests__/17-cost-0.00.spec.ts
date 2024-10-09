import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Computes exclusive cost correctly", () => {
    const planService = new PlanService()
    const source = `Seq Scan on atividade_economica ae  (cost=0.00..0.00 rows=1 width=36)`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root?.["*Cost (exclusive)"]).toBe(0)
  })
})
