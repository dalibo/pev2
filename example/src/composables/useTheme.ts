import { ref, watch } from "vue"

export type Theme = "light" | "dark"

const STORAGE_KEY = "pev2-theme"

function getSystemTheme(): Theme {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark"
  }
  return "light"
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") {
    return stored
  }
  return null
}

function applyTheme(theme: Theme) {
  // Our custom CSS variables
  document.documentElement.setAttribute("data-theme", theme)
  // Bootstrap 5 dark mode
  document.documentElement.setAttribute("data-bs-theme", theme)
}

// Global reactive theme state
const currentTheme = ref<Theme>(getStoredTheme() || getSystemTheme())

// Apply initial theme
applyTheme(currentTheme.value)

// Watch for changes and persist
watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
  localStorage.setItem(STORAGE_KEY, newTheme)
})

// Listen for system theme changes (only if no stored preference)
if (window.matchMedia) {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!getStoredTheme()) {
        currentTheme.value = e.matches ? "dark" : "light"
      }
    })
}

export function useTheme() {
  function toggleTheme() {
    currentTheme.value = currentTheme.value === "light" ? "dark" : "light"
  }

  function setTheme(theme: Theme) {
    currentTheme.value = theme
  }

  return {
    theme: currentTheme,
    toggleTheme,
    setTheme,
  }
}
