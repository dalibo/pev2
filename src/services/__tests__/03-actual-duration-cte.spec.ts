import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  const planService = new PlanService()
  // tslint:disable:max-line-length
  const source = `
Result  (cost=0.01..0.05 rows=2 width=4) (actual time=1001.083..1001.087 rows=2 loops=1)
 CTE test
   ->  Result  (cost=0.00..0.01 rows=1 width=0) (actual time=1001.076..1001.076 rows=1 loops=1)
 ->  Append  (cost=0.00..0.04 rows=2 width=4) (actual time=1001.082..1001.085 rows=2 loops=1)
       ->  CTE Scan on test  (cost=0.00..0.02 rows=1 width=4) (actual time=1001.081..1001.082 rows=1 loops=1)
       ->  CTE Scan on test  (cost=0.00..0.02 rows=1 width=4) (actual time=0.001..0.002 rows=1 loops=1)
Total runtime: 1001.133 ms
(7 rows)
`
  const r = planService.fromSource(source) as IPlanContent
  const plan: IPlan = planService.createPlan("", r, "")
  it("doesn't not include CTE duration", () => {
    const root = plan.content.Plan
    expect((root?.["*Duration (exclusive)"] as number) - 0.002 < 0).toBeTruthy()
  })
})
