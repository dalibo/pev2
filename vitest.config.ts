import { fileURLToPath } from "node:url"
import { mergeConfig, defineConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      root: fileURLToPath(new URL("./", import.meta.url)),
      exclude: ["node_modules", "dist", "e2e"],
    },
  })
)
