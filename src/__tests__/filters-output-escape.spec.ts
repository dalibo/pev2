import { describe, expect, test } from "vitest"
import { formatProp } from "@/filters"
import { Property } from "@/enums"

describe("formatNodeProp", () => {
  test("escapes HTML in Output list items", () => {
    const html = formatProp(Property.OUTPUT, [
      "<img src=x onerror=alert(1)>",
    ])
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    expect(html).not.toContain("<img src=x")
  })
})
