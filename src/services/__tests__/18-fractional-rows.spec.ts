import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Takes fractional rows into account correctly", () => {
    const planService = new PlanService()
    const source = `
                                                   QUERY PLAN
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Nested Loop  (cost=0.00..12.97 rows=4 width=16) (actual time=0.017..0.025 rows=1.00 loops=1)
   Buffers: shared hit=4
   ->  Function Scan on unnest w  (cost=0.00..0.04 rows=4 width=12) (actual time=0.006..0.007 rows=4.00 loops=1)
   ->  Limit  (cost=0.00..3.22 rows=1 width=4) (actual time=0.003..0.004 rows=0.25 loops=4)
         Buffers: shared hit=4
         ->  Seq Scan on data  (cost=0.00..41.88 rows=13 width=4) (actual time=0.003..0.003 rows=0.25 loops=4)
               Filter: (v = w.q)
               Rows Removed by Filter: 6
               Buffers: shared hit=4
 Planning:
   Buffers: shared hit=4
 Planning Time: 0.142 ms
 Execution Time: 0.044 ms
(13 rows)
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    const seqScanNode = root?.Plans[1].Plans[0]
    expect(seqScanNode["Node Type"]).toEqual("Seq Scan")
    expect(seqScanNode["Actual Rows"]).toEqual(0.25)
    expect(seqScanNode["*Actual Rows Is Fractional"]).toBeTruthy()
  })
})
