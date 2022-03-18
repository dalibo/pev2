import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Workers taken into account", () => {
    const planService = new PlanService()
    const source = `
 Finalize Aggregate  (cost=2734224.57..2734224.58 rows=1 width=8)
   ->  Gather  (cost=2734223.33..2734224.54 rows=12 width=8)
         Workers Planned: 12
         ->  Partial Aggregate  (cost=2733223.33..2733223.34 rows=1 width=8)
               ->  Parallel Seq Scan on bigtable  (cost=0.00..2629056.67 rows=41666667 width=0)
 JIT:
   Functions: 4
   Options: Inlining true, Optimization true, Expressions true, Deforming true
(8 lignes)
`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    const aggregateNode = root && root.Plans[0].Plans[0].Plans[0]
    aggregateNode &&
      expect(aggregateNode["*Workers Planned By Gather"]).toEqual(12)
  })
})
