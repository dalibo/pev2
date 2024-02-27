<script lang="ts" setup>
defineProps(["severity"])
</script>

<template>
  <svg
    height="1em"
    width="1em"
    viewBox="0 0 20 20"
    class="me-1"
    style="margin-left: -8px"
  >
    <circle
      r="7"
      cx="10"
      cy="10"
      :class="severity"
      stroke="white"
      stroke-width="1"
    />
  </svg>
</template>
