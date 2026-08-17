import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { Node } from "@/interfaces"
import _ from "lodash"
import * as fs from "fs"
import { fileURLToPath } from "url"
import * as path from "path"

const __filename = fileURLToPath(import.meta.url)

// Those tests are automatically built from the files in the `from-text`
// directory.
// The xxx-plan file is parsed and the result is expected to equal the content
// of the corresponding xxx-expect file.

function removeKeys(node: Node | Node[]) {
  // Remove keys that cannot be determined from text format
  // for tests where the `-expect` file is actually generated with EXPLAIN
  // (FORMAT JSON)
  if (Array.isArray(node)) {
    node.forEach(removeKeys)
    return node
  }
  delete node["Inner Unique"]

  if (node["Plans"]) {
    removeKeys(node["Plans"])
  }

  return node
}

const dir = path.join(path.dirname(__filename), "from-text")
const files = fs.readdirSync(dir)
let tests = files.filter((file: string) => file.match(/-plan$/))
tests = _.uniq(tests)
tests.forEach((planTest: string) => {
  describe("From text: Plan " + planTest, () => {
    test("", () => {
      const planFile = path.join(dir, planTest)
      const planText = fs.readFileSync(planFile, { encoding: "utf-8" })
      const planExpectFile = path.join(
        dir,
        planTest.replace(/-plan$/, "-expect"),
      )
      const planExpect = fs.readFileSync(planExpectFile, { encoding: "utf-8" })

      const planService = new PlanService()
      const r = planService.fromSource(planText)
      let planJson = JSON.parse(planExpect)
      if (Array.isArray(planJson)) {
        planJson = planJson[0]
      }
      planJson["Plan"] = removeKeys(planJson["Plan"])
      expect(r).toMatchObject(planJson)
    })
  })
})
