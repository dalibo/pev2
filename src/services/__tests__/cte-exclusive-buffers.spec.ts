import { describe, expect, test } from "vitest"

import { Property } from "@/enums"
import type { IPlan, IPlanContent } from "@/interfaces"
import { PlanService } from "@/services/plan-service"

describe("PlanService", () => {
  test("CTE buffers and IO are subtracted from the CTE Scans", () => {
    const planService = new PlanService()
    const source = `
 Append  (cost=0.00..1.00 rows=20 width=4) (actual time=0.010..1.000 rows=20 loops=1)
   Buffers: shared hit=100 read=10, temp written=5
   I/O Timings: shared read=0.500
   CTE t
     ->  Seq Scan on foo  (cost=0.00..1.00 rows=10 width=4) (actual time=0.005..0.400 rows=10 loops=1)
           Buffers: shared hit=100 read=10
           I/O Timings: shared read=0.500
   ->  CTE Scan on t a  (cost=0.00..0.20 rows=10 width=4) (actual time=0.006..0.600 rows=10 loops=1)
         Buffers: shared hit=60 read=10, temp written=5
         I/O Timings: shared read=0.500
   ->  CTE Scan on t b  (cost=0.00..0.20 rows=10 width=4) (actual time=0.001..0.300 rows=10 loops=1)
         Buffers: shared hit=40
`
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const [scanA, scanB] = plan.content.Plan[Property.PLANS]
    expect(scanA[Property.EXCLUSIVE_SHARED_HIT_BLOCKS]).toEqual(0)
    expect(scanA[Property.EXCLUSIVE_SHARED_READ_BLOCKS]).toEqual(0)
    expect(scanA[Property.EXCLUSIVE_SHARED_IO_READ_TIME]).toEqual(0)
    expect(scanA[Property.EXCLUSIVE_SUM_IO_READ_TIME]).toEqual(0)
    // Temp blocks written by the scan itself are kept
    expect(scanA[Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]).toEqual(5)
    expect(scanB[Property.EXCLUSIVE_SHARED_HIT_BLOCKS]).toEqual(0)
    // The CTE keeps its own buffers
    expect(plan.ctes[0][Property.EXCLUSIVE_SHARED_HIT_BLOCKS]).toEqual(100)
  })
})
