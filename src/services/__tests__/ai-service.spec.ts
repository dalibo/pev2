import { describe, expect, test } from "vitest"
import { hashString, parseMarkdown } from "../ai-service"

describe("AI Service Helpers", () => {
  describe("hashString", () => {
    test("handles empty string", () => {
      expect(hashString("")).toBe("")
    })

    test("returns consistent hashes for identical strings", () => {
      const input = "SELECT * FROM users WHERE id = 1"
      expect(hashString(input)).toBe(hashString(input))
    })

    test("produces different hashes for different strings", () => {
      expect(hashString("select 1")).not.toBe(hashString("select 2"))
    })

    test("produces correct string hashes", () => {
      const input = "test"
      expect(hashString(input)).toBe("2487m")
    })
  })

  describe("parseMarkdown", () => {
    test("returns empty string for empty input", () => {
      expect(parseMarkdown("")).toBe("")
    })

    test("escapes HTML to prevent XSS", () => {
      const input = "<script>alert('xss')</script>"
      const output = parseMarkdown(input)
      expect(output).not.toContain("<script>")
      expect(output).toContain("&lt;script&gt;alert('xss')&lt;/script&gt;")
    })

    test("formats headers correctly", () => {
      const input = "# Header 1\n\n## Header 2\n\n### Header 3"
      const output = parseMarkdown(input)
      expect(output).toContain('<h1 class="fs-3 border-bottom pb-2 mt-4 mb-3 fw-bold">Header 1</h1>')
      expect(output).toContain('<h2 class="fs-4 mt-4 mb-2 fw-semibold">Header 2</h2>')
      expect(output).toContain('<h3 class="fs-5 mt-3 mb-2 fw-semibold">Header 3</h3>')
    })

    test("formats bold and italic text correctly", () => {
      const input = "This is **bold** and *italic* text."
      const output = parseMarkdown(input)
      expect(output).toContain("<strong>bold</strong>")
      expect(output).toContain("<em>italic</em>")
    })

    test("formats inline code correctly", () => {
      const input = "Use the `EXPLAIN ANALYZE` command."
      const output = parseMarkdown(input)
      expect(output).toContain('<code class="bg-body-secondary px-1 py-0.5 rounded text-danger font-monospace">EXPLAIN ANALYZE</code>')
    })

    test("formats code blocks correctly", () => {
      const input = "```sql\nSELECT * FROM users;\n```"
      const output = parseMarkdown(input)
      expect(output).toContain('<pre class="bg-dark text-light p-3 rounded my-3 position-relative"><code class="language-sql">SELECT * FROM users;</code></pre>')
    })

    test("formats bullet lists correctly", () => {
      const input = "- First item\n- Second item\nSome other text"
      const output = parseMarkdown(input)
      expect(output).toContain('<ul class="ps-3 my-2"><li>First item</li>\n<li>Second item</li></ul>')
    })

    test("wraps paragraphs correctly", () => {
      const input = "First paragraph.\n\nSecond paragraph."
      const output = parseMarkdown(input)
      expect(output).toContain('<p class="mb-3 lead-sm">First paragraph.</p>')
      expect(output).toContain('<p class="mb-3 lead-sm">Second paragraph.</p>')
    })
  })
})
