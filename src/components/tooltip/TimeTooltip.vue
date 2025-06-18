<script lang="ts" setup>
import type { Node } from "@/interfaces"
import { NodeProp } from "@/enums"
import { duration } from "@/filters"
interface Props {
  node: Node
}
defineProps<Props>()
</script>

<template>
  Duration:
  <br />Exclusive: {{ duration(node[NodeProp.EXCLUSIVE_DURATION]) }}, Total:
  {{ duration(node[NodeProp.ACTUAL_TOTAL_TIME]) }}
</template>
