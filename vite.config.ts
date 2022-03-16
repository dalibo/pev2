import path from "path"
import { fileURLToPath, URL } from "url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

const build = process.env.LIB
  ? {
      lib: {
        entry: path.resolve(__dirname, "src/components/index.ts"),
        name: "pev2",
        fileName: (format: string) => `pev2.${format}.js`,
      },
      rollupOptions: {
        external: ["vue"],
        output: {
          // Provide global variables to use in the UMD build
          // Add external deps here
          globals: {
            vue: "Vue",
          },
        },
      },
    }
  : {
      outDir: "dist-app",
    }

// https://vitejs.dev/config/
export default defineConfig({
  build: build,
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
