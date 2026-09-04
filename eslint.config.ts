import skipFormatting from "@vue/eslint-config-prettier/skip-formatting"
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import pluginVue from "eslint-plugin-vue"

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**"],
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    rules: {
      "vue/component-name-in-template-casing": "error",
      "vue/multi-word-component-names": [
        "error",
        {
          ignores: [
            "Plan",
            "Grid",
            "Copy",
            "Diagram",
            "Stats",
            "Approximative",
          ],
        },
      ],
    },
  },

  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  skipFormatting,
)
