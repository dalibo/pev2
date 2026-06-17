import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlanContent } from "@/interfaces"

// Guards against catastrophic backtracking in PlanService.cleanupSource: the
// frame-stripping regexes must stay linear so a large single-line plan is
// cleaned quickly rather than in O(n^2) time.
describe("PlanService cleanupSource backtracking", () => {
  test("cleans a large single-line JSON plan quickly", () => {
    const filter = "(a = " + "1 OR a = ".repeat(15000) + "1)"
    const source =
      `[{"Plan":{"Node Type":"Seq Scan","Relation Name":"t","Alias":"t",` +
      `"Startup Cost":0.00,"Total Cost":1.00,"Plan Rows":1,"Plan Width":4,` +
      `"Filter":"${filter}"}}]`

    const planService = new PlanService()
    const start = performance.now()
    const json = planService.fromSource(source) as IPlanContent
    const elapsedMs = performance.now() - start

    expect(json?.Plan?.["Node Type"]).toEqual("Seq Scan")
    expect(elapsedMs).toBeLessThan(2000)
  }, 10000)
})
