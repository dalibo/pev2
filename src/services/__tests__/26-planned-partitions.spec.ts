import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Planned partitions line is correctly parsed", () => {
    const planService = new PlanService()
    const source = `
      HashAggregate  (cost=13760592.78..14872410.30 rows=1736877 width=61)
        Group Key: ml.offer_type, ml.property_main_type, COALESCE(ml.district_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(ml.sale_price, ml.gross_rent_monthly, ml.rent_net_monthly, '0'::real)
        Filter: (array_length(array_agg(ml.id), 1) > 1)
        Planned Partitions: 128
        ->  Seq Scan on post_merged_listings ml  (cost=0.00..11025300.36 rows=32660208 width=33)
              Filter: (duplicate_id IS NULL)
    `
    const plan = planService.fromText(source) as IPlanContent
    expect(plan.Plan["Planned Partitions"]).toEqual(128)
    expect(plan.Plan["HashAgg Batches"]).toBeUndefined()
    expect(plan.Plan["Peak Memory Usage"]).toBeUndefined()
    expect(plan.Plan["Disk Usage"]).toBeUndefined()
  })

  test("Planned partitions line is correctly parsed", () => {
    const planService = new PlanService()
    const source = `
 HashAggregate  (cost=79468.50..98636.70 rows=940257 width=11) (actual time=231.946..413.626 rows=970675 loops=1)
   Group Key: name
   Planned Partitions: 32  Batches: 193  Memory Usage: 4153kB  Disk Usage: 31752kB
   ->  Seq Scan on t1  (cost=0.00..15406.00 rows=1000000 width=11) (actual time=0.118..36.474 rows=1000000 loops=1)
 Planning Time: 0.201 ms
 Execution Time: 438.186 ms
(6 rows)

Time: 438.861 ms
    `
    const plan = planService.fromText(source) as IPlanContent
    expect(plan.Plan["Planned Partitions"]).toEqual(32)
    expect(plan.Plan["HashAgg Batches"]).toEqual(193)
    expect(plan.Plan["Peak Memory Usage"]).toEqual(4153)
    expect(plan.Plan["Disk Usage"]).toEqual(31752)
  })
})
