import { describe, expect, test } from "vitest"
import type { IPlan, IPlanContent } from "@/interfaces"
import { PlanService } from "@/services/plan-service"
import _ from "lodash"
import * as fs from "fs"
import { fileURLToPath } from "url"
import * as path from "path"

const __filename = fileURLToPath(import.meta.url)
const dir = path.join(path.dirname(__filename), "21-io-timings")
const files = fs.readdirSync(dir)
let tests = files.map((file: string) => file.replace(/\..*/, ""))
tests = _.uniq(tests)
tests.forEach((planTest: string) => {
  describe("From text: Plan " + planTest, () => {
    test("", () => {
      const planFile = path.join(dir, planTest + ".plan")
      const planText = fs.readFileSync(planFile, { encoding: "utf-8" })
      const planExpectFile = path.join(dir, planTest + ".expect")
      const planExpect = fs.readFileSync(planExpectFile, { encoding: "utf-8" })
      const planService = new PlanService()
      const r = planService.fromSource(planText) as IPlanContent
      const plan: IPlan = planService.createPlan("", r, "")
      // Verify timings for the first node
      expect(plan.content.Plan).toMatchObject(JSON.parse(planExpect))
    })
  })
})
