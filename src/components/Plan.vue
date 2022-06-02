<script lang="ts" setup>
interface Props {
  planSource: string
  planQuery: string
}
defineProps<Props>()
</script>

<template>
  That's me
  <br />
  and only me
  {{ planSource }}
  {{ planQuery }}
</template>
