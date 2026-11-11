import { describe, expect, test } from "vitest"

import type { IPlan } from "@/interfaces"
import { getUnaccountedTime } from "@/services/unaccounted-time"
import { store } from "@/store"

function parse(source: string) {
  store.parse(source, "")
  const plan = store.plan as IPlan
  return { plan, stats: store.stats }
}

describe("getUnaccountedTime", () => {
  test("reports time lost outside of the nodes (e.g. lock waits)", () => {
    const source = `
 Seq Scan on t1  (cost=0.00..129824.02 rows=9000002 width=4) (actual time=0.047..11633.209 rows=9000002 loops=1)
 Planning Time: 0.525 ms
 Execution Time: 22483.325 ms
`
    const { plan, stats } = parse(source)
    const result = getUnaccountedTime(stats, plan.content.Plan)
    expect(result).toBeDefined()
    expect(result?.time).toBeCloseTo(22483.325 - 11633.209, 3)
    expect(Math.round(result?.percent as number)).toBe(48)
  })

  test("does not report when execution time matches the root node", () => {
    const source = `
 Seq Scan on t1  (cost=0.00..129824.02 rows=9000002 width=4) (actual time=0.047..11633.209 rows=9000002 loops=1)
 Planning Time: 0.525 ms
 Execution Time: 11700.000 ms
`
    const { plan, stats } = parse(source)
    expect(getUnaccountedTime(stats, plan.content.Plan)).toBeUndefined()
  })

  test("does not report time explained by serialization", () => {
    const source = `
 Seq Scan on public.pgbench_accounts  (cost=0.00..272414.12 rows=10000012 width=109) (actual time=0.068..650.633 rows=10000000 loops=1)
 Planning Time: 0.107 ms
 Serialization: time=1241.033 ms  output=1092015kB  format=text
 Execution Time: 2287.842 ms
`
    const { plan, stats } = parse(source)
    // 2287.842 - 650.633 - 1241.033 = 396.176 ms (17%): below the threshold
    expect(getUnaccountedTime(stats, plan.content.Plan)).toBeUndefined()
  })

  test("does not report without execution time", () => {
    const source = `
 Seq Scan on t1  (cost=0.00..129824.02 rows=9000002 width=4) (actual time=0.047..11633.209 rows=9000002 loops=1)
`
    const { plan, stats } = parse(source)
    expect(getUnaccountedTime(stats, plan.content.Plan)).toBeUndefined()
  })

  test("does not report a high share below the 10 ms floor", () => {
    const source = `
 Seq Scan on t1  (cost=0.00..1.00 rows=1 width=4) (actual time=0.010..0.020 rows=1 loops=1)
 Planning Time: 0.010 ms
 Execution Time: 5.000 ms
`
    const { plan, stats } = parse(source)
    // 4.98 ms unaccounted (99%) but under 10 ms
    expect(getUnaccountedTime(stats, plan.content.Plan)).toBeUndefined()
  })

  test("does not report a large gap below 25% of the execution time", () => {
    const source = `
 Seq Scan on t1  (cost=0.00..1.00 rows=1 width=4) (actual time=0.010..800.000 rows=1 loops=1)
 Planning Time: 0.010 ms
 Execution Time: 1000.000 ms
`
    const { plan, stats } = parse(source)
    // 200 ms unaccounted but only 20%
    expect(getUnaccountedTime(stats, plan.content.Plan)).toBeUndefined()
  })

  test("subtracts trigger time", () => {
    const withoutTrigger = `
 Seq Scan on t1  (cost=0.00..1.00 rows=1 width=4) (actual time=0.010..500.000 rows=1 loops=1)
 Planning Time: 0.010 ms
 Execution Time: 1000.000 ms
`
    const withTrigger = `
 Seq Scan on t1  (cost=0.00..1.00 rows=1 width=4) (actual time=0.010..500.000 rows=1 loops=1)
 Planning Time: 0.010 ms
 Trigger foo_trigger: time=300.000 calls=1
 Execution Time: 1000.000 ms
`
    const a = parse(withoutTrigger)
    expect(getUnaccountedTime(a.stats, a.plan.content.Plan)?.time).toBeCloseTo(
      500,
      3,
    )
    // 1000 - 500 - 300 = 200 ms (20%): below the threshold
    const b = parse(withTrigger)
    expect(getUnaccountedTime(b.stats, b.plan.content.Plan)).toBeUndefined()
  })
})
