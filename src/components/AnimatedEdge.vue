<script lang="ts" setup>
import { ref, watch } from "vue"
import { animate } from "motion"

interface Props {
  d: string
  strokeColor: string
  strokeWidth?: number
}
const props = defineProps<Props>()

const path = ref<SVGPathElement | null>(null)

watch(
  () => props.d,
  (newVal) => {
    if (path.value) {
      animate(
        path.value,
        { d: newVal },
        {
          duration: 0.2,
          ease: "easeInOut",
        },
      )
    }
  },
)
</script>

<template>
  <path
    ref="path"
    :d="d"
    :stroke="strokeColor"
    fill="none"
    :stroke-width="strokeWidth"
  />
</template>

<style scoped>
path {
  stroke-linecap: butt;
  &.never-executed {
    stroke-dasharray: 0.5em;
    stroke-opacity: 0.5;
  }
}
</style>
