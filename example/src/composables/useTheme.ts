import { ref, watch } from "vue"

type Theme = "light" | "dark"

const theme = ref<Theme>(getInitialTheme())

function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem("theme") as Theme | null
  if (stored === "light" || stored === "dark") {
    return stored
  }
  // Fall back to system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-bs-theme", t)
}

// Apply initial theme
applyTheme(theme.value)

// Watch for changes
watch(theme, (newTheme) => {
  localStorage.setItem("theme", newTheme)
  applyTheme(newTheme)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === "light" ? "dark" : "light"
  }

  return {
    theme,
    toggleTheme,
  }
}
