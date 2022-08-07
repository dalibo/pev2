<script lang="ts" setup>
import _ from "lodash"
import { computed, inject, onBeforeMount, ref } from "vue"
import type { Ref } from "vue"
import type { IPlan, Node, StatsTableItemType } from "@/interfaces"
import { PlanKey } from "@/symbols"
import { NodeProp, SortDirection } from "@/enums"
import SortedTable from "@/components/SortedTable.vue"
import SortLink from "@/components/SortLink.vue"
import StatsTableItem from "@/components/StatsTableItem.vue"

const nodes: Node[] = []
const executionTime = ref<number>(0)

const plan = inject(PlanKey) as Ref<IPlan>

onBeforeMount(() => {
  executionTime.value =
    plan.value.planStats.executionTime ||
    (plan.value.content.Plan?.[NodeProp.ACTUAL_TOTAL_TIME] as number)
  if (plan.value.content.Plan) {
    flatten(nodes, plan.value.content.Plan)
    _.each(plan.value.ctes, (cte) => {
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
    <sorted-table
      class="table table-nonfluid table-sm table-bordered align-top"
      :values="perTable"
      sort="time"
      :dir="SortDirection.desc"
    >
      <thead class="thead-dark">
        <tr>
          <th scope="col">
            <sort-link name="name" class="text-white">Table</sort-link>
          </th>
          <th scope="col" class="text-right">
            <sort-link name="count" class="text-white">Count</sort-link>
          </th>
          <th scope="col" colspan="2" class="text-right">
            <sort-link name="time" class="text-white">Time</sort-link>
          </th>
        </tr>
      </thead>
      <template v-slot:body="sort">
        <template v-for="value in sort.values" :key="value">
          <stats-table-item
            :value="value as StatsTableItemType"
            :executionTime="executionTime"
          ></stats-table-item>
        </template>
      </template>
      <tbody v-if="!perTable.length">
        <tr>
          <td colspan="3" class="text-center font-italic">No tables used</td>
        </tr>
      </tbody>
    </sorted-table>
    <h6>Per node type stats</h6>
    <sorted-table
      class="table table-nonfluid table-sm table-bordered align-top"
      :values="perNodeType"
      sort="time"
      :dir="SortDirection.desc"
    >
      <thead class="thead-dark">
        <tr>
          <th scope="col">
            <sort-link name="name" class="text-white">Node Type</sort-link>
          </th>
          <th scope="col" class="text-right">
            <sort-link name="count" class="text-white">Count</sort-link>
          </th>
          <th scope="col" colspan="2" class="text-right">
            <sort-link name="time" class="text-white">Time</sort-link>
          </th>
        </tr>
      </thead>
      <template v-slot:body="sort">
        <template v-for="value in sort.values" :key="value">
          <stats-table-item
            :value="value as StatsTableItemType"
            :executionTime="executionTime"
          ></stats-table-item>
        </template>
      </template>
    </sorted-table>
    <h6>Per index stats</h6>
    <sorted-table
      class="table table-nonfluid table-sm table-bordered align-top"
      :values="perIndex"
      sort="time"
      :dir="SortDirection.desc"
    >
      <thead class="thead-dark">
        <tr>
          <th scope="col">
            <sort-link name="name" class="text-white">Index</sort-link>
          </th>
          <th scope="col" class="text-right">
            <sort-link name="count" class="text-white">Count</sort-link>
          </th>
          <th scope="col" colspan="2" class="text-right">
            <sort-link name="time" class="text-white">Time</sort-link>
          </th>
        </tr>
      </thead>
      <template v-slot:body="sort">
        <template v-for="value in sort.values" :key="value">
          <stats-table-item
            :value="value as StatsTableItemType"
            :executionTime="executionTime"
          ></stats-table-item>
        </template>
      </template>
      <tbody v-if="!perIndex.length">
        <tr>
          <td colspan="3" class="text-center font-italic">No index used</td>
        </tr>
      </tbody>
    </sorted-table>
  </div>
</template>
