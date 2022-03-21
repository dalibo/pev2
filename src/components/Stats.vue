<script lang="ts" setup>
import * as _ from "lodash"
import { computed, onBeforeMount, reactive, ref } from "vue"
import type { IPlan, Node, StatsTableItemType } from "@/interfaces"
import { NodeProp } from "@/enums"
import StatsTableItem from "@/components/StatsTableItem.vue"

interface Props {
  plan: IPlan
}
const props = defineProps<Props>()
const plan = reactive<IPlan>(props.plan)

const nodes: Node[] = []
const executionTime = ref<number>(0)

onBeforeMount(() => {
  executionTime.value =
    plan.planStats.executionTime ||
    (plan.content.Plan?.[NodeProp.ACTUAL_TOTAL_TIME] as number)
  if (plan.content.Plan) {
    flatten(nodes, plan.content.Plan)
    _.each(plan.ctes, (cte) => {
      flatten(nodes, cte)
    })
  }
})

function flatten(output: Node[], node: Node) {
  // [level, node, isLastSibbling, branches]
  output.push(node)
  _.each(node.Plans, (subnode) => {
    flatten(output, subnode)
  })
}

function durationPercent(nodes: Node[]) {
  return _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION) / executionTime.value
}

const perTable = computed(() => {
  const tables: { [key: string]: Node[] } = _.groupBy(
    _.filter(nodes, (n) => n[NodeProp.RELATION_NAME] !== undefined),
    NodeProp.RELATION_NAME
  )
  const values: StatsTableItemType[] = []
  _.each(tables, (nodes, tableName) => {
    values.push({
      name: tableName,
      count: nodes.length,
      time: _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION),
      timePercent: durationPercent(nodes),
      nodes,
    })
  })
  return values
})

const perNodeType = computed(() => {
  const nodeTypes: { [key: string]: Node[] } = _.groupBy(
    nodes,
    NodeProp.NODE_TYPE
  )
  const values: StatsTableItemType[] = []
  _.each(nodeTypes, (nodes, nodeType) => {
    values.push({
      name: nodeType,
      count: nodes.length,
      time: _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION),
      timePercent: durationPercent(nodes),
      nodes,
    })
  })
  return values
})

const perIndex = computed(() => {
  const indexes: { [key: string]: Node[] } = _.groupBy(
    _.filter(nodes, (n) => n[NodeProp.INDEX_NAME] !== undefined),
    NodeProp.INDEX_NAME
  )
  const values: StatsTableItemType[] = []
  _.each(indexes, (nodes, indexName) => {
    values.push({
      name: indexName,
      count: nodes.length,
      time: _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION),
      timePercent: durationPercent(nodes),
      nodes,
    })
  })
  return values
})
</script>

<template>
  <div class="p-2 small stats">
    <h6 class="mt-2">Per table stats</h6>
    <table>
      <stats-table-item
        v-for="(value, index) in perTable"
        :key="index"
        :value="value"
        :executionTime="executionTime"
      ></stats-table-item>
      <tbody v-if="!perTable.length">
        <tr>
          <td colspan="3" class="text-center font-italic">No tables used</td>
        </tr>
      </tbody>
    </table>
    <h6>Per node type stats</h6>
    <table>
      <stats-table-item
        v-for="(value, index) in perNodeType"
        :key="index"
        :value="value"
        :executionTime="executionTime"
      ></stats-table-item>
    </table>
    <h6>Per index stats</h6>
    <table>
      <stats-table-item
        v-for="(value, index) in perIndex"
        :key="index"
        :value="value"
        :executionTime="executionTime"
      ></stats-table-item>
      <tbody v-if="!perIndex.length">
        <tr>
          <td colspan="3" class="text-center font-italic">No index used</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
