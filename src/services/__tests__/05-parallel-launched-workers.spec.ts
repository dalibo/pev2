import { describe, expect, it } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

import { findNodeById } from "@/services/help-service"

// In this plan, we have a Bitmap Index Scan node (#12) which doesn't have
// any information on workers.
// It must be considered as having workers though.
// The number of loops as well as number of workers should be taken into
// account for the time calculation.

describe("Parallel nodes duration - not all workers launched", () => {
  const planService = new PlanService()
  // tslint:disable:max-line-length
  const source = `
 Finalize Aggregate  (cost=105660.73..105660.74 rows=1 width=8) (actual time=1092.605..1094.361 rows=1 loops=1)
   Output: sum((blah.i + j.j))
   ->  Gather  (cost=105658.26..105660.67 rows=24 width=8) (actual time=1076.814..1094.352 rows=8 loops=1)
         Output: (PARTIAL sum((blah.i + j.j)))
         Workers Planned: 24
         Workers Launched: 7
         ->  Partial Aggregate  (cost=104658.26..104658.27 rows=1 width=8) (actual time=1080.614..1080.614 rows=1 loops=8)
               Output: PARTIAL sum((blah.i + j.j))
               Worker 0:  actual time=1086.259..1086.260 rows=1 loops=1
               Worker 1:  actual time=1084.860..1084.861 rows=1 loops=1
               Worker 2:  actual time=1069.617..1069.618 rows=1 loops=1
               Worker 3:  actual time=1074.450..1074.452 rows=1 loops=1
               Worker 4:  actual time=1079.213..1079.214 rows=1 loops=1
               Worker 5:  actual time=1085.714..1085.715 rows=1 loops=1
               Worker 6:  actual time=1088.632..1088.632 rows=1 loops=1
               ->  Nested Loop  (cost=0.26..83824.92 rows=4166667 width=8) (actual time=0.454..1072.781 rows=125000 loops=8)
                     Output: blah.i, j.j
                     Worker 0:  actual time=0.505..1078.589 rows=83620 loops=1
                     Worker 1:  actual time=0.505..1077.215 rows=83620 loops=1
                     Worker 2:  actual time=0.455..1061.673 rows=167240 loops=1
                     Worker 3:  actual time=0.349..1066.490 rows=166060 loops=1
                     Worker 4:  actual time=0.419..1071.207 rows=164980 loops=1
                     Worker 5:  actual time=0.636..1077.959 rows=83620 loops=1
                     Worker 6:  actual time=0.611..1081.030 rows=83620 loops=1
                     ->  Parallel Seq Scan on public.blah  (cost=0.00..484.67 rows=4167 width=4) (actual time=0.007..1.455 rows=12500 loops=8)
                           Output: blah.i
                           Worker 0:  actual time=0.008..1.363 rows=8362 loops=1
                           Worker 1:  actual time=0.007..1.346 rows=8362 loops=1
                           Worker 2:  actual time=0.006..1.534 rows=16724 loops=1
                           Worker 3:  actual time=0.006..1.590 rows=16606 loops=1
                           Worker 4:  actual time=0.007..1.544 rows=16498 loops=1
                           Worker 5:  actual time=0.012..1.383 rows=8362 loops=1
                           Worker 6:  actual time=0.005..1.353 rows=8362 loops=1
                     ->  Function Scan on pg_catalog.generate_series j  (cost=0.26..10.26 rows=1000 width=4) (actual time=0.084..0.084 rows=10 loops=100000)
                           Output: j.j
                           Function Call: generate_series(1, expensive(((blah.i + 10) - blah.i)))
                           Worker 0:  actual time=0.126..0.127 rows=10 loops=8362
                           Worker 1:  actual time=0.126..0.127 rows=10 loops=8362
                           Worker 2:  actual time=0.062..0.062 rows=10 loops=16724
                           Worker 3:  actual time=0.063..0.063 rows=10 loops=16606
                           Worker 4:  actual time=0.063..0.064 rows=10 loops=16498
                           Worker 5:  actual time=0.126..0.127 rows=10 loops=8362
                           Worker 6:  actual time=0.126..0.127 rows=10 loops=8362
 Planning Time: 0.333 ms
 Execution Time: 1094.777 ms
`
  const r = planService.fromSource(source) as IPlanContent
  const plan: IPlan = planService.createPlan("", r, "")

  it("only takes launched workers into account", () => {
    const bitmapindexscan = findNodeById(plan, 6)
    expect(bitmapindexscan?.["*Duration (exclusive)"]).toBe(1050)
  })
})
