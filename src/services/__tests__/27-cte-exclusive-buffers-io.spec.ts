import * as fs from "fs"
import * as path from "path"
import { describe, expect, test } from "vitest"

import type { IPlan, IPlanContent } from "@/interfaces"
import { PlanService } from "@/services/plan-service"

const dir = path.join(path.dirname(__filename), "27-cte-exclusive-buffers-io")

describe("CTE Scan exclusive buffers", () => {
  test("Exclusive value is correct for simple example", () => {
    const file = path.join(dir, "27-cte-exclusive-buffers-io.plan")
    const planJSON = fs.readFileSync(file, { encoding: "utf-8" })

    const planService = new PlanService()
    const r = planService.fromSource(planJSON) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const cteScan = plan.content.Plan
    expect(cteScan["Node Type"]).toEqual("CTE Scan")
    expect(cteScan["Shared Hit Blocks"]).toEqual(3261)
    expect(cteScan["*Shared Hit Blocks (exclusive)"]).toEqual(0)
    expect(cteScan["Shared Dirtied Blocks"]).toEqual(68)
    expect(cteScan["*Shared Dirtied Blocks (exclusive)"]).toEqual(0)
    expect(cteScan["Shared Written Blocks"]).toEqual(70)
    expect(cteScan["*Shared Written Blocks (exclusive)"]).toEqual(0)
    expect(cteScan["Temp Written Blocks"]).toEqual(63)
    expect(cteScan["*Temp Written Blocks (exclusive)"]).toEqual(63)
    expect(cteScan["Shared I/O Write Time"]).toEqual(0.319)
    expect(cteScan["*Shared I/O Write Time (exclusive)"]).toEqual(0)
    expect(cteScan["*I/O Write Time (all scopes)"]).toEqual(0.551)
    expect(cteScan["*I/O Write Time (exclusive, all scopes)"]).toEqual(0.232)
  })

  test("Exclusive value is not negative for CTE Scan with limit", () => {
    const file = path.join(dir, "27-cte-exclusive-buffers-io-with-limit.plan")
    const planJSON = fs.readFileSync(file, { encoding: "utf-8" })

    const planService = new PlanService()
    const r = planService.fromSource(planJSON) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    const cteScan = root.Plans[0]
    expect(cteScan["Node Type"]).toEqual("CTE Scan")
    expect(cteScan["Shared Hit Blocks"]).toEqual(448)
    expect(cteScan["*Shared Hit Blocks (exclusive)"]).toEqual(0)
    expect(cteScan["Shared Dirtied Blocks"]).toEqual(6)
    expect(cteScan["*Shared Dirtied Blocks (exclusive)"]).toEqual(0)
    expect(cteScan["Shared Written Blocks"]).toEqual(6)
    expect(cteScan["*Shared Written Blocks (exclusive)"]).toEqual(0)
  })

  test("Exclusive value are correct for CTE Scans using same CTE", () => {
    const file = path.join(
      dir,
      "27-cte-exclusive-buffers-io-several-cte-scans.plan",
    )
    const planJSON = fs.readFileSync(file, { encoding: "utf-8" })

    const planService = new PlanService()
    const r = planService.fromSource(planJSON) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    const root = plan.content.Plan
    const cteScan0 = root.Plans[0]
    expect(cteScan0["Node Type"]).toEqual("CTE Scan")
    expect(cteScan0["Shared Hit Blocks"]).toEqual(3395)
    expect(cteScan0["*Shared Hit Blocks (exclusive)"]).toEqual(0)
    expect(cteScan0["Shared Dirtied Blocks"]).toEqual(67)
    expect(cteScan0["*Shared Dirtied Blocks (exclusive)"]).toEqual(0)
    expect(cteScan0["Shared Written Blocks"]).toEqual(67)
    expect(cteScan0["*Shared Written Blocks (exclusive)"]).toEqual(0)
    expect(cteScan0["Temp Written Blocks"]).toEqual(63)
    expect(cteScan0["*Temp Written Blocks (exclusive)"]).toEqual(63)
    const cteScan1 = root.Plans[1]
    expect(cteScan1["Node Type"]).toEqual("CTE Scan")
    expect(cteScan1["Shared Hit Blocks"]).toEqual(undefined)
    expect(cteScan1["Shared Dirtied Blocks"]).toEqual(undefined)
    expect(cteScan1["Shared Written Blocks"]).toEqual(undefined)
    expect(cteScan1["Temp Written Blocks"]).toEqual(1)
    expect(cteScan1["*Temp Written Blocks (exclusive)"]).toEqual(1)
  })
})
