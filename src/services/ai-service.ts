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
  html = html.replace(/`([^`]+)`/g, '<code class="bg-body-secondary px-1 py-0.5 rounded text-danger font-monospace">$1</code>')

  // 3. Headers: ### Header
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, title) => {
    const level = hashes.length
    const classes = level === 1 ? "fs-3 border-bottom pb-2 mt-4 mb-3 fw-bold" :
                    level === 2 ? "fs-4 mt-4 mb-2 fw-semibold" :
                    "fs-5 mt-3 mb-2 fw-semibold"
    return `<h${level} class="${classes}">${title}</h${level}>`
  })

  // 4. Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 5. Italics: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // 6. Bullet lists: lines starting with - or *
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
  
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
