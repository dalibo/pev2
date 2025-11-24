import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"
import { NodeProp } from "@/enums"

describe("Worker rows parsing", () => {
  const planService = new PlanService()
  const source = `
->  Parallel Seq Scan on public.user_events e  (cost=0.00..5193.33 rows=33333 width=8) (actual time=0.067..58.0 rows=333333 loops=1)
      Output: e.id, e.user_id
      Buffers: shared hit=11289 read=8319
      Worker 0:  actual time=0.067..57.944 rows=348636 loops=1
        Buffers: shared hit=3879 read=2957
      Worker 1:  actual time=0.038..58.986 rows=351339 loops=1
        Buffers: shared hit=4018 read=2871
Planning Time: 0.157 ms
Execution Time: 60.0 ms
  `
  const r = planService.fromSource(source) as IPlanContent
  const plan: IPlan = planService.createPlan("", r, "")
  const root = plan.content.Plan

  test("Node has workers", () => {
    expect(root[NodeProp.WORKERS]).toBeDefined()
    expect(root[NodeProp.WORKERS]).toHaveLength(2)
  })

  test("Worker 0 has all parsed properties", () => {
    const worker0 = root[NodeProp.WORKERS]?.[0]
    expect(worker0).toBeDefined()
    expect(worker0?.["Worker Number"]).toBe(0)
    expect(worker0?.[NodeProp.ACTUAL_ROWS]).toBe(348636)
    expect(worker0?.[NodeProp.ACTUAL_LOOPS]).toBe(1)
    expect(worker0?.[NodeProp.ACTUAL_TOTAL_TIME]).toBeCloseTo(57.944, 3)
    expect(worker0?.[NodeProp.ACTUAL_STARTUP_TIME]).toBeCloseTo(0.067, 3)
  })

  test("Worker 1 has all parsed properties", () => {
    const worker1 = root[NodeProp.WORKERS]?.[1]
    expect(worker1).toBeDefined()
    expect(worker1?.["Worker Number"]).toBe(1)
    expect(worker1?.[NodeProp.ACTUAL_ROWS]).toBe(351339)
    expect(worker1?.[NodeProp.ACTUAL_LOOPS]).toBe(1)
    expect(worker1?.[NodeProp.ACTUAL_TOTAL_TIME]).toBeCloseTo(58.986, 3)
    expect(worker1?.[NodeProp.ACTUAL_STARTUP_TIME]).toBeCloseTo(0.038, 3)
  })
})
