import path from "path"
import { fileURLToPath, URL } from "url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { viteSingleFile } from "vite-plugin-singlefile"

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
      target: "esnext",
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      brotliSize: false,
      rollupOptions: {
        inlineDynamicImports: true,
        output: {
          manualChunks: () => "everything.js",
        },
      },
    }

// https://vitejs.dev/config/
export default defineConfig({
  build: build,
  plugins: [vue(), viteSingleFile()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
