<script lang="ts" setup>
import { inject } from "vue"
import VLink from "../components/VLink.vue"

interface Props {
  title?: string
}

const props = defineProps<Props>()
const currentPath = inject("currentPath")
</script>

<template>
  <div class="d-flex flex-column vh-100">
    <nav class="navbar">
      <div :class="[currentPath == '/plan' ? 'container-fluid' : 'container']">
        <VLink class="btn btn-link" to="/">
          <img src="../assets/logo_pev2.svg" alt="" style="height: 1.5rem" />
        </VLink>
        <div v-if="props?.title" class="text-center ms-auto">
          {{ props?.title }}
        </div>
        <VLink class="btn btn-secondary ms-auto" to="/">New Plan</VLink>
        <VLink class="btn btn-link" to="/about">About</VLink>
      </div>
    </nav>
    <slot></slot>
  </div>
</template>
