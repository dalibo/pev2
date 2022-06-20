import { PlanService } from "@/services/plan-service"
import type { IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("correctly handles oneline JSON", () => {
    const planService = new PlanService()

    // tslint:disable:max-line-length
    const source = `[ { "Plan": { "Node Type": "Seq Scan", "Parallel Aware": false, "Relation Name": "pg_class", "Alias": "c", "Startup Cost": 0.00, "Total Cost": 24.84, "Plan Rows": 121, "Plan Width": 64, "Filter": "(relkind = ANY ('{r,p}'::\\"char\\"[]))" } } ]`
    const json = planService.fromSource(source) as IPlanContent
    expect(json?.Plan?.["Node Type"]).toEqual("Seq Scan")
  })
})
