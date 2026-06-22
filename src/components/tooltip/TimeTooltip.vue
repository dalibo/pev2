<script lang="ts" setup>
import type { Node } from "@/interfaces"
import { Property } from "@/enums"
import { formatDuration } from "@/filters"
interface Props {
  node: Node
}
defineProps<Props>()
</script>

<template>
  Duration:
  <br />Exclusive: {{ formatDuration(node[Property.EXCLUSIVE_DURATION]) }},
  Total:
  {{ formatDuration(node[Property.ACTUAL_TOTAL_TIME]) }}
</template>
