<script lang="ts" setup>
import type { Node } from "@/interfaces"
import { NodeProp } from "@/enums"
import { formatDuration } from "@/filters"
interface Props {
  node: Node
}
defineProps<Props>()
</script>

<template>
  Duration:
  <br />Exclusive: {{ formatDuration(node[NodeProp.EXCLUSIVE_DURATION]) }},
  Total:
  {{ formatDuration(node[NodeProp.ACTUAL_TOTAL_TIME]) }}
</template>
