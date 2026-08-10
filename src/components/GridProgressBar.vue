<script lang="ts" setup>
import { computed } from "vue"

interface Props {
  percentage: number
  percentage2?: number
}
const props = defineProps<Props>()

// Percentages are computed from plan maximums which may be 0 or NaN (eg. a
// plan where every node returned 0 row), leading to an invalid CSS width.
const width = computed((): number =>
  Number.isFinite(props.percentage) ? props.percentage : 0,
)
const width2 = computed((): number =>
  Number.isFinite(props.percentage2) ? (props.percentage2 as number) : 0,
)
</script>

<template>
  <div class="grid-progress progress rounded-0 bg-transparent">
    <div
      class="bg-secondary border-secondary opacity-50"
      :class="{
        'border-start': width > 0,
      }"
      :style="{
        width: width + '%',
      }"
    ></div>
    <div
      class="bg-secondary border-secondary opacity-20"
      :style="{
        width: width2 + '%',
      }"
      :class="{
        'border-start': width2 > 0,
      }"
      v-if="width2"
    ></div>
  </div>
</template>
