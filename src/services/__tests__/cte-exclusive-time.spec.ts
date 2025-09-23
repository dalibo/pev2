import { describe, expect, test } from "vitest"
import type { IPlan, IPlanContent, Node } from "@/interfaces"
import { NodeProp } from "@/enums"
import { PlanService } from "@/services/plan-service"
import _ from "lodash"
import * as fs from "fs"
import { fileURLToPath } from "url"
import * as path from "path"

const __filename = fileURLToPath(import.meta.url)
const dir = path.join(path.dirname(__filename), "cte-exclusive-time")
const files = fs.readdirSync(dir)
let tests = files.map((file: string) => file.replace(/\..*/, ""))

function sumExclusiveDuration(nodes: Node[]): number {
  return _.sumBy(nodes, (node) => {
    const baseValue = node[NodeProp.EXCLUSIVE_DURATION]
    const childrenSum = node[NodeProp.PLANS]
      ? sumExclusiveDuration(node[NodeProp.PLANS])
      : 0
    return baseValue + childrenSum
  })
}

tests = _.uniq(tests)
tests.forEach((planTest: string) => {
  describe("From text: Plan " + planTest, () => {
    test("Sum of exclusive times is correct", () => {
      const planFile = path.join(dir, planTest + ".plan")
      const planText = fs.readFileSync(planFile, { encoding: "utf-8" })
      const planService = new PlanService()
      const r = planService.fromSource(planText) as IPlanContent
      const plan: IPlan = planService.createPlan("", r, "")

      // Excpect the sum of exclusives to be approvimatively equal to the
      // duration of the root node
      const min = (plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME] || 0) * 0.99
      const max = (plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME] || 0) * 1.01
      expect(
        sumExclusiveDuration([plan.content.Plan].concat(plan.ctes)),
      ).toBeGreaterThan(min)
      expect(
        sumExclusiveDuration([plan.content.Plan].concat(plan.ctes)),
      ).toBeLessThan(max)
    })
  })
})
