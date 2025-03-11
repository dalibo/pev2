import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Parses 'Execution time line", () => {
    const planService = new PlanService()

    // tslint:disable:max-line-length
    const source = `
"Aggregate  (cost=24729994.62..24729994.63 rows=1 width=8) (actual time=126922.755..126980.072 rows=1 loops=1)"
"  Buffers: shared hit=31033317 read=640327, temp read=271916 written=271928"
"Planning:"
"  Buffers: shared hit=227 read=9"
"Planning Time: 14.620 ms"
"JIT:"
"  Functions: 829"
"  Options: Inlining true, Optimization true, Expressions true, Deforming true"
"  Timing: Generation 113.965 ms, Inlining 706.405 ms, Optimization 7838.603 ms, Emission 7380.843 ms, Total 16039.815 ms"
"Execution Time: 127241.780 ms"`

    const plan = planService.fromSource(source) as IPlanContent
    expect(plan?.["Execution Time"]).toEqual(127241.78)
  })
  test("Parses 'Execution time line", () => {
    // Same plan but with a line break at the end
    const planService = new PlanService()

    // tslint:disable:max-line-length
    const source = `
"Aggregate  (cost=24729994.62..24729994.63 rows=1 width=8) (actual time=126922.755..126980.072 rows=1 loops=1)"
"  Buffers: shared hit=31033317 read=640327, temp read=271916 written=271928"
"Planning:"
"  Buffers: shared hit=227 read=9"
"Planning Time: 14.620 ms"
"JIT:"
"  Functions: 829"
"  Options: Inlining true, Optimization true, Expressions true, Deforming true"
"  Timing: Generation 113.965 ms, Inlining 706.405 ms, Optimization 7838.603 ms, Emission 7380.843 ms, Total 16039.815 ms"
"Execution Time: 127241.780 ms"
`

    const plan = planService.fromSource(source) as IPlanContent
    expect(plan?.["Execution Time"]).toEqual(127241.78)
  })
})
