import { useColorMode } from "@vueuse/core"

const { store: theme } = useColorMode({
  attribute: "data-bs-theme",
  storageKey: "theme",
  initialValue: "auto",
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark"
  }

  return {
    theme,
    toggleTheme,
  }
}
