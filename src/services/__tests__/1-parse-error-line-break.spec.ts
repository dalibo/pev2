import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Can`t parse plan with line break", () => {
    const planService = new PlanService()
    const planText = `
 Seq Scan on ref  (cost=0.00..14425.02 rows=1000002 width=8) (actual
`
    expect(() => {
      planService.fromText(planText)
    }).toThrow()
  })

  test("Can`t parse plan with line break", () => {
    const planService = new PlanService()
    // tslint:disable:max-line-length
    const source = `
Nested Loop Left Join  (cost=11.95..28.52 rows=5 width=157) (actual time=0.010..0.010 rows=0 loops=1)
  Output: rel_users_exams.user_username, rel_users_exams.exam_id, rel_users_exams.started_at, rel_users_exams.finished_at, exam_1.id, exam_1.title, ex
here is a line break
Planning Time: 1.110 ms
Execution Time: 0.170 ms`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content["Planning Time"]).toBe(1.11)
  })

  test("Can`t parse plan with line break", () => {
    const planService = new PlanService()
    // tslint:disable:max-line-length
    const source = `
 Some Node Type  (cost=1305.69..1734.14 rows=1 width=55)
   CTE cte1
     ->  Sort  (cost=8.57..8.57 rows=2 width=583)
           Sort Key: something,
 blah
   CTE cte2
     ->  CTE Scan on enabledseasons  (cost=0.00..0.04 rows=1 width=8)
`
    planService.fromText(source)
    expect(() => {
      planService.fromText(source)
    }).not.toThrow()
  })
})
