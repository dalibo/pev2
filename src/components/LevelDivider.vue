<script lang="ts" setup>
import type { FlattenedPlanNode } from "@/store"
interface Props {
  row: FlattenedPlanNode
  isSubplan?: boolean
  dense?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isSubplan: false,
  dense: false,
})

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
</script>
<template>
  <span v-if="branches.length" class="plan-tree">
    <span v-for="(hasBranch, i) in row.branches.slice(0, -1)" :key="i">{{
      hasBranch ? VERTICAL : ` ${SPACE}`
    }}</span
    ><span>{{ connector }}</span>
  </span>
</template>

<style scoped>
.plan-tree {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
