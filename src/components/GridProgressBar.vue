<script lang="ts" setup>
interface Props {
  percentage: number
  percentage2?: number
}
defineProps<Props>()
</script>

<template>
  <div class="grid-progress progress rounded-0 bg-transparent">
    <div
      class="bg-secondary border-secondary opacity-50"
      :class="{
        'border-start': percentage > 0,
      }"
      :style="{
        width: percentage + '%',
      }"
    ></div>
    <div
      class="bg-secondary border-secondary opacity-20"
      :style="{
        width: percentage2 + '%',
      }"
      :class="{
        'border-start': percentage2 > 0,
      }"
      v-if="percentage2"
    ></div>
  </div>
</template>
