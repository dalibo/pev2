import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"
import { findNodeById } from "@/services/help-service"

// Plan where every node returned 0 row, taken from
// https://github.com/dalibo/pev2/issues/945
const zeroRowsPlan = `
Nested Loop Left Join  (cost=11.95..28.52 rows=5 width=157) (actual time=0.010..0.010 rows=0 loops=1)
  ->  Bitmap Heap Scan on public.rel_users_exams  (cost=11.80..20.27 rows=5 width=52) (actual time=0.009..0.009 rows=0 loops=1)
        Recheck Cond: (1 = rel_users_exams.exam_id)
        ->  Bitmap Index Scan on rel_users_exams_pkey  (cost=0.00..11.80 rows=5 width=0) (actual time=0.005..0.005 rows=0 loops=1)
              Index Cond: (1 = rel_users_exams.exam_id)
  ->  Materialize  (cost=0.15..8.17 rows=1 width=105) (never executed)
        ->  Index Scan using exam_pkey on public.exam exam_1  (cost=0.15..8.17 rows=1 width=105) (never executed)
              Index Cond: (exam_1.id = 1)
Planning Time: 1.110 ms
Execution Time: 0.170 ms`

describe("plan with 0 actual rows", () => {
  test("actual rows are 0, not undefined", () => {
    const planService = new PlanService()
    const r = planService.fromSource(zeroRowsPlan) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")

    // Executed node
    const nestedLoop = findNodeById(plan, 1)
    expect(nestedLoop?.["Actual Rows"]).toBe(0)
    expect(nestedLoop?.["*Actual Rows Revised"]).toBe(0)

    // Never executed node
    const materialize = findNodeById(plan, 4)
    expect(materialize?.["Node Type"]).toBe("Materialize")
    expect(materialize?.["Actual Rows"]).toBe(0)
    expect(materialize?.["*Actual Rows Revised"]).toBe(0)
  })

  test("planned rows are still available", () => {
    const planService = new PlanService()
    const r = planService.fromSource(zeroRowsPlan) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const nestedLoop = findNodeById(plan, 1)
    expect(nestedLoop?.["Plan Rows"]).toBe(5)
  })

  test("max rows is 0", () => {
    const planService = new PlanService()
    const r = planService.fromSource(zeroRowsPlan) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content.maxRows).toBe(0)
  })
})
