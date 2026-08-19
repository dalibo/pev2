<script lang="ts" setup>
import { inject } from "vue"
import VLink from "../components/VLink.vue"
import { useTheme } from "../composables/useTheme"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons"

interface Props {
  title?: string
}

const props = defineProps<Props>()
const version = __APP_VERSION__
const currentPath = inject("currentPath")
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <div class="d-flex flex-column vh-100">
    <nav class="navbar">
      <div :class="[currentPath == '/plan' ? 'container-fluid' : 'container']">
        <div class="d-flex align-items-center">
          <VLink class="btn btn-link pe-1" to="/">
            <img
              src="../assets/logo_pev2.svg"
              alt="PEV2"
              style="height: 1.5rem"
            />
          </VLink>
          <span
            class="badge bg-secondary-subtle text-secondary-emphasis font-monospace fw-normal small ms-1"
            title="PEV2 Version"
          >
            v{{ version }}
          </span>
        </div>
        <div v-if="props?.title" class="text-center ms-auto">
          {{ props?.title }}
        </div>
        <VLink class="btn btn-secondary ms-auto" to="/">New Plan</VLink>
        <button
          class="btn btn-link"
          @click="toggleTheme"
          :title="
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          "
        >
          <FontAwesomeIcon :icon="theme === 'dark' ? faMoon : faSun" />
        </button>
        <VLink class="btn btn-link" to="/about">About</VLink>
      </div>
    </nav>
    <slot></slot>
  </div>
</template>
