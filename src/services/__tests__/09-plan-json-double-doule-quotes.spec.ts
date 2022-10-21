import { PlanService } from "@/services/plan-service"
import type { IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("correctly handles two double quotes in JSON", () => {
    const planService = new PlanService()
    const source = `
"[
  {
    ""Plan"": {
      ""Node Type"": ""ModifyTable"",
      ""Operation"": ""Delete"",
      ""Parallel Aware"": false,
      ""Async Capable"": false,
      ""Relation Name"": ""toto123456789"",
      ""Schema"": ""public"",
      ""Alias"": ""toto123456789"",
      ""Startup Cost"": 0.00,
      ""Total Cost"": 72124.00,
      ""Plan Rows"": 0,
      ""Plan Width"": 0,
      ""Plans"": [
        {
          ""Node Type"": ""Seq Scan"",
          ""Parent Relationship"": ""Outer"",
          ""Parallel Aware"": false,
          ""Async Capable"": false,
          ""Relation Name"": ""toto123456789"",
          ""Schema"": ""public"",
          ""Alias"": ""toto123456789"",
          ""Startup Cost"": 0.00,
          ""Total Cost"": 72124.00,
          ""Plan Rows"": 5000000,
          ""Plan Width"": 6,
          ""Output"": [""ctid""]
        }
      ]
    },
    ""Settings"": {
    },
    ""Planning Time"": 0.041
  }
]"
`
    planService.fromJson(source) as unknown as IPlanContent
  })
})
