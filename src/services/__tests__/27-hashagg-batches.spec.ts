import { describe, expect, test } from "vitest"

import { store } from "@/store"

describe("HashAggregate batches", () => {
  test.each([
    ["Batches: 1  Memory Usage: 24kB", 1, 24, undefined, 1],
    ["Batches: 5  Memory Usage: 161kB  Disk Usage: 200kB", 5, 161, 200, 10000],
  ])(
    "parses %s through the plan store",
    (line, batches, memory, disk, rows) => {
      store.parse(
        `HashAggregate  (cost=170.00..270.00 rows=10000 width=4) (actual time=1.000..2.000 rows=${rows} loops=1)
  Group Key: k
  ${line}
  ->  Seq Scan on synthetic_data  (cost=0.00..145.00 rows=10000 width=4) (actual time=0.010..0.500 rows=10000 loops=1)
Planning Time: 0.100 ms
Execution Time: 2.500 ms`,
        "",
      )
      const node = store.plan!.content.Plan
      expect(node["HashAgg Batches"]).toBe(batches)
      expect(node["Peak Memory Usage"]).toBe(memory)
      expect(node["Disk Usage"]).toBe(disk)
      expect(node["Planned Partitions"]).toBe(0)
      expect(node["Batches"]).toBeUndefined()
    },
  )

  test.each([
    "Worker 0:  Batches: 5  Memory Usage: 161kB  Disk Usage: 200kB",
    `Worker 0: actual time=1.000..2.000 rows=5000 loops=1
          Batches: 5  Memory Usage: 161kB  Disk Usage: 200kB`,
  ])("parses HashAggregate worker batches: %s", (worker) => {
    store.parse(
      `Gather  (cost=1170.00..2270.00 rows=10000 width=4) (actual time=1.000..3.000 rows=10000 loops=1)
  Workers Planned: 1
  Workers Launched: 1
  ->  Partial HashAggregate  (cost=170.00..270.00 rows=10000 width=4) (actual time=1.000..2.000 rows=5000 loops=2)
        Group Key: k
        Batches: 1  Memory Usage: 481kB
        ${worker}
        ->  Parallel Seq Scan on synthetic_data  (cost=0.00..145.00 rows=10000 width=4) (actual time=0.010..0.500 rows=10000 loops=2)
Planning Time: 0.100 ms
Execution Time: 3.500 ms`,
      "",
    )
    const node = store.plan!.content.Plan.Plans[0]
    expect(node["HashAgg Batches"]).toBe(1)
    expect(node["Peak Memory Usage"]).toBe(481)
    expect(node.Workers![0]).toMatchObject({
      "Worker Number": 0,
      "HashAgg Batches": 5,
      "Peak Memory Usage": 161,
      "Disk Usage": 200,
    })
  })
})
