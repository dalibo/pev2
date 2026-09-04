export interface AttachedFile {
  id: string
  name: string
  size: number
  content: string
}

export type Provider = "gemini" | "openai" | "ollama" | "anthropic"

export interface ProviderRequestConfig {
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  isDuplicate?: boolean
}

export function hashString(str: string): string {
  if (!str) return ""
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash.toString(36)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateFileAttachment(
  file: { name: string; size: number },
  existingFiles: { name: string; size: number }[],
  maxFileSize: number = 2 * 1024 * 1024, // 2 MB
  maxTotalSize: number = 8 * 1024 * 1024, // 8 MB
): FileValidationResult {
  if (existingFiles.some((f) => f.name === file.name && f.size === file.size)) {
    return { valid: false, isDuplicate: true }
  }

  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum allowed size of ${formatFileSize(maxFileSize)}.`,
    }
  }

  const currentTotal = existingFiles.reduce((sum, f) => sum + f.size, 0)
  if (currentTotal + file.size > maxTotalSize) {
    return {
      valid: false,
      error: `Total attached files size cannot exceed ${formatFileSize(maxTotalSize)}.`,
    }
  }

  return { valid: true }
}

export function buildAnalysisPrompt(
  planQuery: string | undefined,
  planSource: string,
  attachedFiles: AttachedFile[] = [],
): string {
  let filesContext = ""
  if (attachedFiles.length > 0) {
    filesContext = `\n\n### SUPPLEMENTARY CONTEXT FILES (${attachedFiles.length} attached)`
    for (const file of attachedFiles) {
      filesContext += `\n\n#### File: ${file.name}\n\`\`\`\n${file.content}\n\`\`\``
    }
  }

  return `You are a database performance expert. Analyze the following PostgreSQL EXPLAIN plan, the query (if provided), and any supplementary context files (such as DDL schemas, table statistics, configuration parameters, or execution logs). Identify bottlenecks, expensive operations, and provide actionable optimization recommendations (e.g. index additions, query rewrites, configuration changes). Keep the explanation clear, professional, and concise.

### QUERY
${planQuery || "No query SQL provided."}

### EXPLAIN PLAN
${planSource}${filesContext}`
}

export function buildProviderRequest(
  provider: Provider,
  modelName: string,
  apiKey: string,
  endpointUrl: string,
  prompt: string,
): ProviderRequestConfig {
  const activeEndpoint = endpointUrl.trim()
  const trimmedKey = apiKey.trim()

  if (provider === "gemini") {
    let url = activeEndpoint
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (!url) {
      url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent`
      if (trimmedKey) {
        url += `?key=${trimmedKey}`
      }
    } else if (trimmedKey) {
      headers["x-goog-api-key"] = trimmedKey
      headers["Authorization"] = `Bearer ${trimmedKey}`
    }

    return {
      url,
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  }

  if (provider === "openai") {
    const url = activeEndpoint || "https://api.openai.com/v1/chat/completions"
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (trimmedKey) {
      headers["Authorization"] = `Bearer ${trimmedKey}`
    }
    return {
      url,
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
      }),
    }
  }

  if (provider === "anthropic") {
    const url = activeEndpoint || "https://api.anthropic.com/v1/messages"
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "dangerously-allow-browser": "true",
    }
    if (trimmedKey) {
      headers["x-api-key"] = trimmedKey
    }
    return {
      url,
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelName,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    }
  }

  // Ollama
  const baseUrl = activeEndpoint || "http://localhost:11434"
  const url = `${baseUrl}/api/generate`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (trimmedKey) {
    headers["Authorization"] = `Bearer ${trimmedKey}`
  }
  return {
    url,
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelName,
      prompt,
      stream: false,
    }),
  }
}

export function parseProviderResponse(
  provider: Provider,
  data: unknown,
): string {
  if (!data || typeof data !== "object") return ""
  const record = data as Record<string, unknown>
  if (provider === "gemini") {
    const candidates = record.candidates as
      Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
    return candidates?.[0]?.content?.parts?.[0]?.text || ""
  }
  if (provider === "openai") {
    const choices = record.choices as
      Array<{ message?: { content?: string } }> | undefined
    return choices?.[0]?.message?.content || ""
  }
  if (provider === "anthropic") {
    const content = record.content as Array<{ text?: string }> | undefined
    return content?.[0]?.text || ""
  }
  if (provider === "ollama") {
    return (record.response as string) || ""
  }
  return ""
}

export function limitHistoryEntries<T>(
  entries: T[],
  maxEntries: number = 30,
): T[] {
  return entries.slice(0, maxEntries)
}

// Custom simple markdown formatter to output safe HTML
export function parseMarkdown(text: string): string {
  if (!text) return ""

  // Escape HTML tags to prevent XSS (Security rule from mandatory-secure-web-skills)
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // 1. Code blocks: ```lang ... ```
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_, lang, code) => {
    const languageClass = lang ? `language-${lang}` : ""
    return `<pre class="bg-dark text-light p-3 rounded my-3 position-relative"><code class="${languageClass}">${code}</code></pre>`
  })

  // 2. Inline code: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-body-secondary px-1 py-0.5 rounded text-danger font-monospace">$1</code>',
  )

  // 3. Headers: ### Header
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, title) => {
    const level = hashes.length
    const classes =
      level === 1
        ? "fs-3 border-bottom pb-2 mt-4 mb-3 fw-bold"
        : level === 2
          ? "fs-4 mt-4 mb-2 fw-semibold"
          : "fs-5 mt-3 mb-2 fw-semibold"
    return `<h${level} class="${classes}">${title}</h${level}>`
  })

  // 4. Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

  // 5. Italics: *text*
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  // 6. Bullet lists: lines starting with - or *
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")

  const lines = html.split("\n")
  let inList = false
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("<li>")) {
      if (!inList) {
        lines[i] = `<ul class="ps-3 my-2">${lines[i]}`
        inList = true
      }
    } else {
      if (inList) {
        lines[i - 1] = `${lines[i - 1]}</ul>`
        inList = false
      }
    }
  }
  if (inList) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}</ul>`
  }
  html = lines.join("\n")

  // 7. Paragraphs
  const paragraphs = html.split(/\n\n+/)
  return paragraphs
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ""
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<li>")
      ) {
        return trimmed
      }
      return `<p class="mb-3 lead-sm">${trimmed.replace(/\n/g, "<br>")}</p>`
    })
    .filter(Boolean)
    .join("")
}
