<script lang="ts" setup>
import type { FlattenedPlanNode } from "@/store"
import { computed, inject } from "vue"
import { HighlightedNodeIdKey } from "@/symbols"
import { store } from "@/store"
interface Props {
  row: FlattenedPlanNode
  isSubplan?: boolean
  dense?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isSubplan: false,
  dense: false,
})

const highlightedNodeId = inject(HighlightedNodeIdKey)

const SPACE = props.dense ? "" : " "

const VERTICAL = `${SPACE}│`
const BRANCH = `${SPACE}├`
const LAST = `${SPACE}└`

const branches = props.row.branches
const count = branches.length
const isBranch = branches[count - 1] === false
const connector = props.isSubplan
  ? isBranch
    ? `${SPACE} `
    : VERTICAL
  : isBranch
    ? LAST
    : BRANCH

function highlightBranch(level: number): boolean {
  if (highlightedNodeId?.value === null) return false
  return level == highlightedNodeLevel.value
}

const isDescendantOfHighlighted = computed((): boolean => {
  if (highlightedNodeId?.value === null) return false
  return props.row.path.includes(highlightedNodeId?.value as number)
})

const highlightedNodeLevel = computed((): number | undefined => {
  if (highlightedNodeId?.value === null) return undefined
  const row = store.nodeById?.get(highlightedNodeId?.value as number)
  return row ? row.level : undefined
})
</script>
<template>
  <span v-if="branches.length" class="plan-tree">
    <span
      v-for="(hasBranch, i) in row.branches.slice(0, -1)"
      :key="i"
      :class="
        hasBranch && isDescendantOfHighlighted && highlightBranch(i)
          ? 'text-body-emphasis'
          : highlightedNodeId
            ? 'text-body-tertiary'
            : 'text-body-secondary'
      "
      >{{ hasBranch ? VERTICAL : ` ${SPACE}` }}</span
    ><span
      :class="
        isDescendantOfHighlighted &&
        (highlightedNodeId == row.node.nodeId ||
          highlightedNodeLevel == row.level - 1)
          ? 'text-body-emphasis'
          : highlightedNodeId
            ? 'text-body-tertiary'
            : 'text-body-secondary'
      "
      >{{
        highlightedNodeId == row.node.nodeId ? `${SPACE}▶` : connector
      }}</span
    >
  </span>
</template>

<style scoped>
.plan-tree {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
