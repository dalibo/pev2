import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Computes io timings and speed correctly", () => {
    const planService = new PlanService()
    const source = `
     Update on a  (cost=0.00..266690.72 rows=0 width=0) (actual time=10.00..11.00 rows=0 loops=1)
         Buffers: shared hit=2 read=4 dirtied=6 written=8
         I/O Timings: read=2 write=4
         ->  Seq Scan on a  (cost=0.00..0.00 rows=10 width=1) (actual time=9.00..10.00 rows=10000000 loops=1)
               Buffers: shared hit=1 read=2 written=4
               I/O Timings: read=1 write=2
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    expect(root?.["*I/O Read Time (exclusive)"]).toBe(1)
    expect(root?.["*I/O Read Speed (exclusive)"]).toBe(2000) // 16 Mo/s

    expect(root?.["*I/O Write Time (exclusive)"]).toBe(2)
    expect(root?.["*I/O Write Speed (exclusive)"]).toBe(2000) // 16 Mo/s
  })
})
