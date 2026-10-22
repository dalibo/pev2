import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createApp, nextTick } from "vue"

import AiAnalysis from "@/components/AiAnalysis.vue"

describe("AiAnalysis Component Lifecycle & UI Tests", () => {
  let container: HTMLDivElement
  let app: ReturnType<typeof createApp> | null = null

  beforeEach(() => {
    localStorage.clear()
    container = document.createElement("div")
    document.body.appendChild(container)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    if (app) {
      app.unmount()
      app = null
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  function mountComponent(
    props = {
      planSource: "Seq Scan on users",
      planQuery: "SELECT * FROM users;",
    },
  ) {
    app = createApp(AiAnalysis, props)
    app.mount(container)
    return container
  }

  function getNormalizedText(el: HTMLElement): string {
    return (el.textContent || "").replace(/\s+/g, " ").trim()
  }

  test("renders setup card when no saved configuration exists", async () => {
    const el = mountComponent()
    await nextTick()

    const text = getNormalizedText(el)
    expect(text).toContain("PEV2 - AI Assistant Setup")
    expect(text).toContain("AI Provider")
    expect(text).toContain("Save Configuration")
  })

  test("loads saved configuration and displays analyzer dashboard on mount", async () => {
    localStorage.setItem("pev2_ai_provider", "gemini")
    localStorage.setItem("pev2_ai_key", "test-gemini-key")
    localStorage.setItem("pev2_ai_model", "gemini-3.8-flash")

    const el = mountComponent()
    await nextTick()

    const text = getNormalizedText(el)
    expect(text).toContain("AI Plan Analyzer")
    expect(text).toContain("Using Gemini (gemini-3.8-flash)")
    expect(text).toContain("Analyze Plan")
    expect(text).toContain("Settings")
  })

  test("opens settings panel without wiping stored credentials and cancels cleanly", async () => {
    localStorage.setItem("pev2_ai_provider", "openai")
    localStorage.setItem("pev2_ai_key", "sk-saved-key")
    localStorage.setItem("pev2_ai_model", "gpt-4o-mini")

    const el = mountComponent()
    await nextTick()

    // 1. Click Settings button
    const settingsBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Settings"),
    )
    expect(settingsBtn).toBeDefined()
    settingsBtn?.click()
    await nextTick()

    // Should now be on configuration screen in edit mode
    let text = getNormalizedText(el)
    expect(text).toContain("AI Settings & Configuration")
    expect(text).toContain("Update Settings")
    expect(text).toContain("Cancel")

    // Input fields should contain the saved key
    const keyInput = el.querySelector("#apiKeyInput") as HTMLInputElement
    expect(keyInput?.value).toBe("sk-saved-key")

    // Modify the key in the input
    keyInput.value = "sk-changed-uncommitted"
    keyInput.dispatchEvent(new Event("input"))
    await nextTick()

    // 2. Click Cancel button
    const cancelBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Cancel"),
    )
    expect(cancelBtn).toBeDefined()
    cancelBtn?.click()
    await nextTick()

    // Should return to dashboard
    text = getNormalizedText(el)
    expect(text).toContain("AI Plan Analyzer")
    expect(text).toContain("Using OpenAI (gpt-4o-mini)")

    // LocalStorage should remain unchanged
    expect(localStorage.getItem("pev2_ai_key")).toBe("sk-saved-key")
  })

  test("saves updated configuration and updates dashboard", async () => {
    localStorage.setItem("pev2_ai_provider", "gemini")
    localStorage.setItem("pev2_ai_key", "old-key")
    localStorage.setItem("pev2_ai_model", "gemini-3.8-flash")

    const el = mountComponent()
    await nextTick()

    // Open settings
    const settingsBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Settings"),
    )
    settingsBtn?.click()
    await nextTick()

    // Update key
    const keyInput = el.querySelector("#apiKeyInput") as HTMLInputElement
    keyInput.value = "new-updated-key"
    keyInput.dispatchEvent(new Event("input"))
    await nextTick()

    // Click Update Settings
    const updateBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Update Settings"),
    )
    updateBtn?.click()
    await nextTick()

    expect(localStorage.getItem("pev2_ai_key")).toBe("new-updated-key")
    expect(getNormalizedText(el)).toContain("AI Plan Analyzer")
  })

  test("resets and clears credentials when user clicks reset button", async () => {
    localStorage.setItem("pev2_ai_provider", "gemini")
    localStorage.setItem("pev2_ai_key", "key-to-wipe")
    localStorage.setItem("pev2_ai_model", "gemini-3.8-flash")

    const el = mountComponent()
    await nextTick()

    // Open settings
    const settingsBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Settings"),
    )
    settingsBtn?.click()
    await nextTick()

    // Click Reset
    const resetBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Reset and clear saved credentials"),
    )
    expect(resetBtn).toBeDefined()
    resetBtn?.click()
    await nextTick()

    expect(localStorage.getItem("pev2_ai_key")).toBeNull()
    expect(localStorage.getItem("pev2_ai_provider")).toBeNull()
    expect(getNormalizedText(el)).toContain("PEV2 - AI Assistant Setup")
  })

  test("runs analysis with mocked fetch and renders markdown result", async () => {
    localStorage.setItem("pev2_ai_provider", "gemini")
    localStorage.setItem("pev2_ai_key", "test-api-key")
    localStorage.setItem("pev2_ai_model", "gemini-3.8-flash")

    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "### Optimization Summary\n\nAdd an index on `users(id)` to eliminate the sequential scan.",
              },
            ],
          },
        },
      ],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response)

    const el = mountComponent()
    await nextTick()

    const analyzeBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Analyze Plan"),
    )
    expect(analyzeBtn).toBeDefined()
    analyzeBtn?.click()

    // Wait for async analysis execution
    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()

    expect(global.fetch).toHaveBeenCalled()
    const text = getNormalizedText(el)
    expect(text).toContain("Optimization Summary")
    expect(text).toContain("Add an index on users(id)")

    // History should have recorded entry
    const savedHistory = localStorage.getItem("pev2_ai_history")
    expect(savedHistory).toBeTruthy()
    expect(savedHistory).toContain("Optimization Summary")
  })

  test("handles API error responses gracefully", async () => {
    localStorage.setItem("pev2_ai_provider", "gemini")
    localStorage.setItem("pev2_ai_key", "invalid-key")
    localStorage.setItem("pev2_ai_model", "gemini-3.8-flash")

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: { message: "API key not valid. Please pass a valid API key." },
      }),
    } as Response)

    const el = mountComponent()
    await nextTick()

    const analyzeBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Analyze Plan"),
    )
    analyzeBtn?.click()

    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()

    expect(getNormalizedText(el)).toContain("API key not valid")
  })

  test("auto-populates recommended model when switching providers in setup and settings views", async () => {
    const el = mountComponent()
    await nextTick()

    const providerSelect = el.querySelector(
      "#providerSelect",
    ) as HTMLSelectElement
    const getModelSelect = () =>
      el.querySelector("#modelSelect") as HTMLSelectElement

    expect(providerSelect.value).toBe("gemini")
    expect(getModelSelect().value).toBe("gemini-3.8-flash")
    expect(el.querySelector("#customModelInput")).toBeNull()

    // Switch to OpenAI in initial setup
    providerSelect.value = "openai"
    providerSelect.dispatchEvent(new Event("change"))
    await nextTick()
    expect(getModelSelect().value).toBe("gpt-6.1-sol")

    // Switch to Anthropic in initial setup
    providerSelect.value = "anthropic"
    providerSelect.dispatchEvent(new Event("change"))
    await nextTick()
    expect(getModelSelect().value).toBe("claude-sonnet-5-5")

    // Switch to Ollama in initial setup
    providerSelect.value = "ollama"
    providerSelect.dispatchEvent(new Event("change"))
    await nextTick()
    expect(getModelSelect().value).toBe("llama3.3")

    // Save Ollama configuration
    const saveBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Save Configuration"),
    )
    saveBtn?.click()
    await nextTick()

    // Open Settings when savedConfigExists is true
    const settingsBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Settings"),
    )
    settingsBtn?.click()
    await nextTick()

    const editProviderSelect = el.querySelector(
      "#providerSelect",
    ) as HTMLSelectElement
    expect(editProviderSelect.value).toBe("ollama")
    expect(getModelSelect().value).toBe("llama3.3")

    // Switch provider while editing existing saved config
    editProviderSelect.value = "gemini"
    editProviderSelect.dispatchEvent(new Event("change"))
    await nextTick()
    expect(getModelSelect().value).toBe("gemini-3.8-flash")
    expect(el.querySelector("#customModelInput")).toBeNull()
  })

  test("defaults to recommended Gemini model and hides custom input when retired model is stored in localStorage", async () => {
    localStorage.setItem("pev2_ai_provider", "gemini")
    localStorage.setItem("pev2_ai_key", "test-gemini-key")
    localStorage.setItem("pev2_ai_model", "gemini-2.0-flash")

    const el = mountComponent()
    await nextTick()

    expect(getNormalizedText(el)).toContain("Using Gemini (gemini-3.8-flash)")

    const settingsBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Settings"),
    )
    settingsBtn?.click()
    await nextTick()

    const modelSelect = el.querySelector("#modelSelect") as HTMLSelectElement
    expect(modelSelect.value).toBe("gemini-3.8-flash")
    expect(el.querySelector("#customModelInput")).toBeNull()
  })

  test("renders interactive follow-up chat side panel after analysis and sends follow-up questions", async () => {
    localStorage.setItem("pev2_ai_provider", "gemini")
    localStorage.setItem("pev2_ai_key", "test-api-key")
    localStorage.setItem("pev2_ai_model", "gemini-3.8-flash")

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "### Initial Report\nSeq Scan detected." }],
              },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "Run `CREATE INDEX CONCURRENTLY idx_users_id ON users(id);`",
                  },
                ],
              },
            },
          ],
        }),
      } as Response)

    const el = mountComponent()
    await nextTick()

    // Trigger initial analysis
    const analyzeBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Analyze Plan"),
    )
    analyzeBtn?.click()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()

    // Chat side panel should now be visible
    const chatPanel = el.querySelector("#aiChatSidePanel")
    expect(chatPanel).not.toBeNull()
    expect(getNormalizedText(el)).toContain("Follow-Up Chat")

    // Type a follow-up question and send it
    const chatInput = el.querySelector("#chatInput") as HTMLTextAreaElement
    const sendChatBtn = el.querySelector("#sendChatBtn") as HTMLButtonElement
    expect(chatInput).not.toBeNull()
    expect(sendChatBtn).not.toBeNull()

    chatInput.value = "How do I create that index without locking?"
    chatInput.dispatchEvent(new Event("input"))
    await nextTick()

    sendChatBtn.click()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()

    expect(global.fetch).toHaveBeenCalledTimes(2)
    const text = getNormalizedText(el)
    expect(text).toContain("How do I create that index without locking?")
    expect(text).toContain(
      "CREATE INDEX CONCURRENTLY idx_users_id ON users(id);",
    )

    // Toggle chat panel closed and open again
    const toggleChatBtn = el.querySelector(
      "#toggleChatBtn",
    ) as HTMLButtonElement
    toggleChatBtn.click()
    await nextTick()
    expect(el.querySelector("#aiChatSidePanel")).toBeNull()

    toggleChatBtn.click()
    await nextTick()
    expect(el.querySelector("#aiChatSidePanel")).not.toBeNull()
  })
})
