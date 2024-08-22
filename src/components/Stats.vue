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

const perFunction = computed(() => {
  const functions: { [key: string]: Node[] } = _.groupBy(
    _.filter(nodes, (n) => n[NodeProp.FUNCTION_NAME] !== undefined),
    NodeProp.FUNCTION_NAME
  )
  const values: StatsTableItemType[] = []
  _.each(functions, (nodes, functionName) => {
    values.push({
      name: functionName,
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
  <div class="small stats container-fluid mt-2">
    <div class="row row-cols-1 row-cols-lg-2 row-cols-xxl-3 g-4">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <sorted-table
              class="table table-sm mb-0"
              :values="perTable"
              sort="time"
              :dir="SortDirection.desc"
            >
              <thead class="table-secondary">
                <tr>
                  <th scope="col">
                    <sort-link name="name">Table</sort-link>
                  </th>
                  <th scope="col" class="text-end">
                    <sort-link name="count">Count</sort-link>
                  </th>
                  <th scope="col" colspan="2" class="text-end">
                    <sort-link name="time">Time</sort-link>
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
                  <td colspan="3" class="text-center fst-italic">
                    No tables used
                  </td>
                </tr>
              </tbody>
            </sorted-table>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="card-body">
            <sorted-table
              class="table table-sm mb-0"
              :values="perFunction"
              sort="time"
              :dir="SortDirection.desc"
            >
              <thead class="table-secondary">
                <tr>
                  <th scope="col">
                    <sort-link name="name">Function</sort-link>
                  </th>
                  <th scope="col" class="text-end">
                    <sort-link name="count">Count</sort-link>
                  </th>
                  <th scope="col" colspan="2" class="text-end">
                    <sort-link name="time">Time</sort-link>
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
              <tbody v-if="!perFunction.length">
                <tr>
                  <td colspan="3" class="text-center fst-italic">
                    No function used
                  </td>
                </tr>
              </tbody>
            </sorted-table>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="card-body">
            <sorted-table
              class="table table-sm mb-0"
              :values="perNodeType"
              sort="time"
              :dir="SortDirection.desc"
            >
              <thead class="table-secondary">
                <tr>
                  <th scope="col">
                    <sort-link name="name">Node Type</sort-link>
                  </th>
                  <th scope="col" class="text-end">
                    <sort-link name="count">Count</sort-link>
                  </th>
                  <th scope="col" colspan="2" class="text-end">
                    <sort-link name="time">Time</sort-link>
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
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="card-body">
            <sorted-table
              class="table table-sm mb-0"
              :values="perIndex"
              sort="time"
              :dir="SortDirection.desc"
            >
              <thead class="table-secondary">
                <tr>
                  <th scope="col">
                    <sort-link name="name">Index</sort-link>
                  </th>
                  <th scope="col" class="text-end">
                    <sort-link name="count">Count</sort-link>
                  </th>
                  <th scope="col" colspan="2" class="text-end">
                    <sort-link name="time">Time</sort-link>
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
                  <td colspan="3" class="text-center fst-italic">
                    No index used
                  </td>
                </tr>
              </tbody>
            </sorted-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
