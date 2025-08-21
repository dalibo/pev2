import path from "path"
import { fileURLToPath, URL } from "url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { viteSingleFile } from "vite-plugin-singlefile"
import dts from "vite-plugin-dts"

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
        output: {
          inlineDynamicImports: true,
        },
      },
    }

// https://vitejs.dev/config/
export default defineConfig({
  build: build,
  plugins: [
    vue({
      template: {
        compilerOptions: {
          whitespace: "preserve",
        },
      },
    }),
    process.env.LIB ? dts() : viteSingleFile()
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
})
