import { describe, expect, test } from "vitest"

import {
  type AttachedFile,
  buildAnalysisPrompt,
  buildProviderRequest,
  formatFileSize,
  hashString,
  limitHistoryEntries,
  parseMarkdown,
  parseProviderResponse,
  validateFileAttachment,
} from "../ai-service"

describe("AI Service Helpers", () => {
  describe("formatFileSize", () => {
    test("formats bytes", () => {
      expect(formatFileSize(500)).toBe("500 B")
      expect(formatFileSize(0)).toBe("0 B")
      expect(formatFileSize(1023)).toBe("1023 B")
    })

    test("formats kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.0 KB")
      expect(formatFileSize(1536)).toBe("1.5 KB")
      expect(formatFileSize(500 * 1024)).toBe("500.0 KB")
    })

    test("formats megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB")
      expect(formatFileSize(2097152)).toBe("2.0 MB")
      expect(formatFileSize(8 * 1024 * 1024)).toBe("8.0 MB")
    })
  })

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

  describe("validateFileAttachment", () => {
    const existing = [
      { name: "schema.sql", size: 1024 },
      { name: "stats.json", size: 2048 },
    ]

    test("validates file within limits", () => {
      const result = validateFileAttachment(
        { name: "config.conf", size: 4096 },
        existing,
      )
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test("detects duplicate files by name and size", () => {
      const result = validateFileAttachment(
        { name: "schema.sql", size: 1024 },
        existing,
      )
      expect(result.valid).toBe(false)
      expect(result.isDuplicate).toBe(true)
    })

    test("rejects files exceeding max single file size", () => {
      const maxSingle = 2 * 1024 * 1024 // 2 MB
      const result = validateFileAttachment(
        { name: "huge.sql", size: maxSingle + 1 },
        existing,
        maxSingle,
      )
      expect(result.valid).toBe(false)
      expect(result.error).toContain(
        "exceeds the maximum allowed size of 2.0 MB",
      )
    })

    test("rejects files that cause total cumulative size to exceed limit", () => {
      const maxTotal = 8 * 1024 * 1024 // 8 MB
      const heavyExisting = [
        { name: "big1.sql", size: 5 * 1024 * 1024 },
        { name: "big2.sql", size: 2 * 1024 * 1024 },
      ]
      const result = validateFileAttachment(
        { name: "newfile.sql", size: 1.5 * 1024 * 1024 },
        heavyExisting,
        2 * 1024 * 1024,
        maxTotal,
      )
      expect(result.valid).toBe(false)
      expect(result.error).toContain(
        "Total attached files size cannot exceed 8.0 MB",
      )
    })
  })

  describe("buildAnalysisPrompt", () => {
    const planSource = "Seq Scan on users  (cost=0.00..35.50 rows=2550 width=8)"

    test("builds prompt with query and plan without attached files", () => {
      const query = "SELECT * FROM users;"
      const prompt = buildAnalysisPrompt(query, planSource, [])

      expect(prompt).toContain("### QUERY\nSELECT * FROM users;")
      expect(prompt).toContain(`### EXPLAIN PLAN\n${planSource}`)
      expect(prompt).not.toContain("SUPPLEMENTARY CONTEXT FILES")
    })

    test("builds prompt when no query is provided", () => {
      const prompt = buildAnalysisPrompt(undefined, planSource, [])

      expect(prompt).toContain("### QUERY\nNo query SQL provided.")
      expect(prompt).toContain(`### EXPLAIN PLAN\n${planSource}`)
    })

    test("builds prompt with attached context files", () => {
      const query =
        "SELECT * FROM orders JOIN users ON orders.user_id = users.id;"
      const attached: AttachedFile[] = [
        {
          id: "1",
          name: "schema.sql",
          size: 100,
          content: "CREATE TABLE orders (id INT, user_id INT);",
        },
        {
          id: "2",
          name: "postgresql.conf",
          size: 50,
          content: "work_mem = 64MB",
        },
      ]

      const prompt = buildAnalysisPrompt(query, planSource, attached)

      expect(prompt).toContain("### SUPPLEMENTARY CONTEXT FILES (2 attached)")
      expect(prompt).toContain(
        "#### File: schema.sql\n```\nCREATE TABLE orders (id INT, user_id INT);\n```",
      )
      expect(prompt).toContain(
        "#### File: postgresql.conf\n```\nwork_mem = 64MB\n```",
      )
    })
  })

  describe("buildProviderRequest", () => {
    const prompt = "Please analyze this query plan."

    describe("Gemini", () => {
      test("constructs default Google Gemini request with API key in query param", () => {
        const req = buildProviderRequest(
          "gemini",
          "gemini-3.7-flash",
          "AIzaSyTestKey123",
          "",
          prompt,
        )

        expect(req.url).toBe(
          "https://generativelanguage.googleapis.com/v1/models/gemini-3.7-flash:generateContent?key=AIzaSyTestKey123",
        )
        expect(req.method).toBe("POST")
        expect(req.headers["Content-Type"]).toBe("application/json")
        const parsed = JSON.parse(req.body)
        expect(parsed.contents[0].parts[0].text).toBe(prompt)
      })

      test("constructs Gemini request with custom endpoint and auth headers", () => {
        const req = buildProviderRequest(
          "gemini",
          "gemini-3.7-flash",
          "AIzaSyTestKey123",
          "https://custom-proxy.internal/gemini",
          prompt,
        )

        expect(req.url).toBe("https://custom-proxy.internal/gemini")
        expect(req.headers["x-goog-api-key"]).toBe("AIzaSyTestKey123")
        expect(req.headers["Authorization"]).toBe("Bearer AIzaSyTestKey123")
      })
    })

    describe("OpenAI", () => {
      test("constructs OpenAI request with Bearer authorization header", () => {
        const req = buildProviderRequest(
          "openai",
          "gpt-4o-mini",
          "sk-test-key-456",
          "",
          prompt,
        )

        expect(req.url).toBe("https://api.openai.com/v1/chat/completions")
        expect(req.method).toBe("POST")
        expect(req.headers["Authorization"]).toBe("Bearer sk-test-key-456")
        const parsed = JSON.parse(req.body)
        expect(parsed.model).toBe("gpt-4o-mini")
        expect(parsed.messages).toEqual([{ role: "user", content: prompt }])
      })

      test("constructs OpenAI request with custom endpoint", () => {
        const req = buildProviderRequest(
          "openai",
          "custom-llm",
          "sk-test",
          "https://my-openai-proxy.internal/v1/chat/completions",
          prompt,
        )

        expect(req.url).toBe(
          "https://my-openai-proxy.internal/v1/chat/completions",
        )
      })
    })

    describe("Anthropic", () => {
      test("constructs Anthropic Claude request with required headers", () => {
        const req = buildProviderRequest(
          "anthropic",
          "claude-3-5-sonnet-latest",
          "sk-ant-key789",
          "",
          prompt,
        )

        expect(req.url).toBe("https://api.anthropic.com/v1/messages")
        expect(req.headers["x-api-key"]).toBe("sk-ant-key789")
        expect(req.headers["anthropic-version"]).toBe("2023-06-01")
        expect(req.headers["dangerously-allow-browser"]).toBe("true")
        const parsed = JSON.parse(req.body)
        expect(parsed.model).toBe("claude-3-5-sonnet-latest")
        expect(parsed.max_tokens).toBe(4096)
        expect(parsed.messages).toEqual([{ role: "user", content: prompt }])
      })
    })

    describe("Ollama", () => {
      test("constructs Ollama request to default local host without API key", () => {
        const req = buildProviderRequest("ollama", "llama3", "", "", prompt)

        expect(req.url).toBe("http://localhost:11434/api/generate")
        expect(req.headers["Authorization"]).toBeUndefined()
        const parsed = JSON.parse(req.body)
        expect(parsed.model).toBe("llama3")
        expect(parsed.prompt).toBe(prompt)
        expect(parsed.stream).toBe(false)
      })

      test("constructs Ollama request with custom endpoint and bearer token", () => {
        const req = buildProviderRequest(
          "ollama",
          "qwen2.5:32b",
          "ollama-token-secret",
          "http://192.168.1.100:11434",
          prompt,
        )

        expect(req.url).toBe("http://192.168.1.100:11434/api/generate")
        expect(req.headers["Authorization"]).toBe("Bearer ollama-token-secret")
      })
    })
  })

  describe("parseProviderResponse", () => {
    test("parses Gemini candidate part text", () => {
      const data = {
        candidates: [
          {
            content: {
              parts: [{ text: "Analysis: Add index on users(email)." }],
            },
          },
        ],
      }
      expect(parseProviderResponse("gemini", data)).toBe(
        "Analysis: Add index on users(email).",
      )
    })

    test("parses OpenAI choices message content", () => {
      const data = {
        choices: [
          {
            message: {
              content: "Bottleneck in Sequential Scan.",
            },
          },
        ],
      }
      expect(parseProviderResponse("openai", data)).toBe(
        "Bottleneck in Sequential Scan.",
      )
    })

    test("parses Anthropic content block text", () => {
      const data = {
        content: [
          {
            type: "text",
            text: "High cost observed in Nested Loop.",
          },
        ],
      }
      expect(parseProviderResponse("anthropic", data)).toBe(
        "High cost observed in Nested Loop.",
      )
    })

    test("parses Ollama direct response field", () => {
      const data = {
        response: "Increase work_mem to eliminate disk spill.",
      }
      expect(parseProviderResponse("ollama", data)).toBe(
        "Increase work_mem to eliminate disk spill.",
      )
    })

    test("returns empty string on null or unexpected response structures", () => {
      expect(parseProviderResponse("gemini", null)).toBe("")
      expect(parseProviderResponse("gemini", {})).toBe("")
      expect(parseProviderResponse("openai", {})).toBe("")
      expect(parseProviderResponse("anthropic", {})).toBe("")
      expect(parseProviderResponse("ollama", {})).toBe("")
    })
  })

  describe("limitHistoryEntries", () => {
    test("preserves entries within limit", () => {
      const list = [1, 2, 3, 4, 5]
      expect(limitHistoryEntries(list, 10)).toEqual([1, 2, 3, 4, 5])
    })

    test("caps entries exceeding limit", () => {
      const list = Array.from({ length: 45 }, (_, i) => i + 1)
      const capped = limitHistoryEntries(list, 30)
      expect(capped.length).toBe(30)
      expect(capped[0]).toBe(1)
      expect(capped[29]).toBe(30)
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
      expect(output).toContain(
        '<h1 class="fs-3 border-bottom pb-2 mt-4 mb-3 fw-bold">Header 1</h1>',
      )
      expect(output).toContain(
        '<h2 class="fs-4 mt-4 mb-2 fw-semibold">Header 2</h2>',
      )
      expect(output).toContain(
        '<h3 class="fs-5 mt-3 mb-2 fw-semibold">Header 3</h3>',
      )
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
      expect(output).toContain(
        '<code class="bg-body-secondary px-1 py-0.5 rounded text-danger font-monospace">EXPLAIN ANALYZE</code>',
      )
    })

    test("formats code blocks correctly", () => {
      const input = "```sql\nSELECT * FROM users;\n```"
      const output = parseMarkdown(input)
      expect(output).toContain(
        '<pre class="bg-dark text-light p-3 rounded my-3 position-relative"><code class="language-sql">SELECT * FROM users;</code></pre>',
      )
    })

    test("formats bullet lists correctly", () => {
      const input = "- First item\n- Second item\nSome other text"
      const output = parseMarkdown(input)
      expect(output).toContain(
        '<ul class="ps-3 my-2"><li>First item</li>\n<li>Second item</li></ul>',
      )
    })

    test("wraps paragraphs correctly", () => {
      const input = "First paragraph.\n\nSecond paragraph."
      const output = parseMarkdown(input)
      expect(output).toContain('<p class="mb-3 lead-sm">First paragraph.</p>')
      expect(output).toContain('<p class="mb-3 lead-sm">Second paragraph.</p>')
    })
  })
})
