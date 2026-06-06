import { describe, expect, test } from "vitest"
import { formatNodeProp } from "@/filters"
import { NodeProp } from "@/enums"

describe("formatNodeProp", () => {
  test("escapes HTML in Output list items", () => {
    const html = formatNodeProp(NodeProp.OUTPUT, [
      "<img src=x onerror=alert(1)>",
    ])
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    expect(html).not.toContain("<img src=x")
  })
})
