import { describe, expect, test } from "vitest"

import { Property } from "@/enums"
import { formatProp } from "@/filters"

describe("formatNodeProp", () => {
  test("escapes HTML in Output list items", () => {
    const html = formatProp(Property.OUTPUT, ["<img src=x onerror=alert(1)>"])
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    expect(html).not.toContain("<img src=x")
  })
})
