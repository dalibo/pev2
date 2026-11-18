import { describe, expect, it } from "vitest"

import { formatList } from "@/filters"

describe("formatList", () => {
  it("returns an empty string for nullish values", () => {
    expect(formatList(undefined)).toBe("")
    expect(formatList(null)).toBe("")
  })

  it("formats a comma-separated string as a list", () => {
    expect(formatList("alpha, beta,gamma")).toBe(
      '<ul class="list-unstyled mb-0"><li>alpha</li><li>beta</li><li>gamma</li></ul>',
    )
  })

  it("formats an array as a list", () => {
    expect(formatList(["alpha", "beta"])).toBe(
      '<ul class="list-unstyled mb-0"><li>alpha</li><li>beta</li></ul>',
    )
  })

  it("formats a numeric value as a single-item list", () => {
    expect(formatList(42)).toBe(
      '<ul class="list-unstyled mb-0"><li>42</li></ul>',
    )
  })

  it("escapes list item content", () => {
    expect(formatList(["<script>alert('x')</script>"])).toBe(
      '<ul class="list-unstyled mb-0"><li>&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;</li></ul>',
    )
  })

  it("rejects unsupported value types", () => {
    expect(() => formatList(true)).toThrow(
      "Expected string or array of strings, got boolean",
    )
  })
})
