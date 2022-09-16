<script lang="ts" setup>
import _ from "lodash"
import {
  computed,
  inject,
  nextTick,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue"
import type { Ref } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { blocks, duration, rows, factor } from "@/filters"
import { EstimateDirection, BufferLocation, NodeProp, Metric } from "../enums"
import { scrollChildIntoParentView } from "@/services/help-service"
import type { IPlan, Node } from "@/interfaces"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
} from "@/symbols"

import tippy, { createSingleton } from "tippy.js"
import type { CreateSingletonInstance, Instance } from "tippy.js"

type Row = [number, Node, boolean, number[]]

const plan = inject(PlanKey) as Ref<IPlan>

const container = ref(null) // The container element

const selectedNodeId = inject(SelectedNodeIdKey)
const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}
const highlightedNodeId = inject(HighlightedNodeIdKey)

const rowRefs: Element[] = []

// The main plan + init plans (all flatten)
let plans: Row[][] = [[]]
let tippyInstances: Instance[] = []
let tippySingleton!: CreateSingletonInstance

const viewOptions = reactive({
  metric: Metric.time,
  buffersMetric: BufferLocation.shared,
})

onBeforeMount((): void => {
  const savedOptions = localStorage.getItem("diagramViewOptions")
  if (savedOptions) {
    _.assignIn(viewOptions, JSON.parse(savedOptions))
  }
  flatten(plans[0], 0, plan.value.content.Plan, true, [])

  _.each(plan.value.ctes, (cte) => {
    const flat: Row[] = []
    flatten(flat, 0, cte, true, [])
    plans.push(flat)
  })

  // switch to the first buffers tab if data not available for the currently
  // chosen one
  const planBufferLocation = _.keys(plan.value.planStats.maxBlocks)
  if (_.indexOf(planBufferLocation, viewOptions.buffersMetric) === -1) {
    viewOptions.buffersMetric = _.min(planBufferLocation) as BufferLocation
  }
})

onMounted((): void => {
  loadTooltips()
})

watch(viewOptions, onViewOptionsChanged)

function onViewOptionsChanged() {
  localStorage.setItem("diagramViewOptions", JSON.stringify(viewOptions))
  nextTick(loadTooltips)
}

function loadTooltips(): void {
  if (tippySingleton) {
    tippySingleton.destroy()
  }
  _.each(tippyInstances, (instance) => {
    instance.destroy()
  })
  tippyInstances = tippy(".diagram tr.node")
  tippySingleton = createSingleton(tippyInstances, {
    delay: 100,
    allowHTML: true,
  })
}

function getTooltipContent(node: Node): string {
  let content = ""
  switch (viewOptions.metric) {
    case Metric.time:
      content += timeTooltip(node)
      break
    case Metric.rows:
      content += rowsTooltip(node)
      break
    case Metric.estimate_factor:
      content += estimateFactorTooltip(node)
      break
    case Metric.cost:
      content += costTooltip(node)
      break
    case Metric.buffers:
      content += buffersTooltip(node)
      break
  }
  if (node[NodeProp.CTE_NAME]) {
    content += "<br><em>CTE " + node[NodeProp.CTE_NAME] + "</em>"
  }
  return content
}

function timeTooltip(node: Node): string {
  return [
    "Duration: <br>Exclusive: ",
    duration(node[NodeProp.EXCLUSIVE_DURATION]),
    ", Total: ",
    duration(node[NodeProp.ACTUAL_TOTAL_TIME]),
  ].join("")
}

function rowsTooltip(node: Node): string {
  return ["Rows: ", rows(node[NodeProp.ACTUAL_ROWS_REVISED] as number)].join("")
}

function estimateFactorTooltip(node: Node): string {
  const estimateFactor = node[NodeProp.PLANNER_ESTIMATE_FACTOR]
  const estimateDirection = node[NodeProp.PLANNER_ESTIMATE_DIRECTION]
  let text = ""
  if (estimateFactor === undefined || estimateDirection === undefined) {
    return "N/A"
  }
  switch (estimateDirection) {
    case EstimateDirection.over:
      text += '<i class="fa fa-arrow-up"></i> over'
      break
    case EstimateDirection.under:
      text += '<i class="fa fa-arrow-down"></i> under'
      break
    default:
      text += "Correctly"
  }
  text += " estimated"
  text +=
    estimateFactor !== 1 ? " by <b>" + factor(estimateFactor) + "</b>" : ""
  text += "<br>"
  text += "Planned: " + node[NodeProp.PLAN_ROWS_REVISED]
  text += " → Actual: " + node[NodeProp.ACTUAL_ROWS_REVISED]
  return text
}

function costTooltip(node: Node): string {
  return ["Cost: ", rows(node[NodeProp.EXCLUSIVE_COST] as number)].join("")
}

function buffersTooltip(node: Node): string {
  let text = ""
  let hit
  let read
  let written
  let dirtied
  switch (viewOptions.buffersMetric) {
    case BufferLocation.shared:
      hit = node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]
      read = node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]
      dirtied = node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]
      written = node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]
      break
    case BufferLocation.temp:
      read = node[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]
      written = node[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]
      break
    case BufferLocation.local:
      hit = node[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]
      read = node[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]
      dirtied = node[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]
      written = node[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]
      break
  }
  text += '<table class="table text-white table-sm table-borderless mb-0">'
  text += hit
    ? '<tr><td>Hit:</td><td class="text-right">' + blocks(hit) + "</td></tr>"
    : ""
  text += read
    ? '<tr><td>Read:</td><td class="text-right">' + blocks(read) + "</td></tr>"
    : ""
  text += dirtied
    ? '<tr><td>Dirtied:</td><td class="text-right">' +
      blocks(dirtied) +
      "</td></tr>"
    : ""
  text += written
    ? '<tr><td>Written:</td><td class="text-right">' +
      blocks(written) +
      "</td></tr>"
    : ""
  text += "</table>"

  if (!hit && !read && !dirtied && !written) {
    text = " N/A"
  }

  switch (viewOptions.buffersMetric) {
    case BufferLocation.shared:
      text = "Shared Blocks:" + text
      break
    case BufferLocation.temp:
      text = "Temp Blocks:" + text
      break
    case BufferLocation.local:
      text = "Local Blocks:" + text
      break
  }
  return text
}

function nodeType(row: Row): string {
  return row[1][NodeProp.NODE_TYPE]
}

function flatten(
  output: Row[],
  level: number,
  node: Node,
  isLast: boolean,
  branches: number[]
) {
  // [level, node, isLastSibbling, branches]
  output.push([level, node, isLast, _.concat([], branches)])
  if (!isLast) {
    branches.push(level)
  }

  _.each(node.Plans, (subnode) => {
    flatten(
      output,
      level + 1,
      subnode,
      subnode === _.last(node.Plans),
      branches
    )
  })
  if (!isLast) {
    branches.pop()
  }
}

function estimateFactorPercent(row: Row): number {
  const node = row[1]
  if (node[NodeProp.PLANNER_ESTIMATE_FACTOR] === Infinity) {
    return 100
  }
  return (
    ((node[NodeProp.PLANNER_ESTIMATE_FACTOR] || 0) / maxEstimateFactor.value) *
    100
  )
}

const maxEstimateFactor = computed((): number => {
  const max = _.max(
    _.map(plans, (plan) => {
      return _.max(
        _.map(plan, (row) => {
          const f = row[1][NodeProp.PLANNER_ESTIMATE_FACTOR]
          if (f !== Infinity) {
            return f
          }
        })
      )
    })
  ) as number
  return max * 2 || 1
})

const dataAvailable = computed((): boolean => {
  if (viewOptions.metric === Metric.buffers) {
    // if current Metric is buffers, view options for buffers should be
    // undefined if there's no buffer data
    return !!viewOptions.buffersMetric
  }
  return true
})

function isCTE(node: Node): boolean {
  return _.startsWith(node[NodeProp.SUBPLAN_NAME], "CTE")
}

watch(
  () => selectedNodeId?.value,
  (newVal) => {
    if (!container.value || !newVal) {
      return
    }
    scrollChildIntoParentView(container.value, rowRefs[newVal as number], false)
  }
)

function setRowRef(nodeId: number, el: Element) {
  rowRefs[nodeId] = el
}
</script>

<template>
  <div class="diagram">
    <div class="flex-shrink-0">
      <div class="form-group text-center my-1">
        <div class="btn-group btn-group-xs">
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.time }"
            v-on:click="viewOptions.metric = Metric.time"
          >
            time
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.rows }"
            v-on:click="viewOptions.metric = Metric.rows"
          >
            rows
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.estimate_factor }"
            v-on:click="viewOptions.metric = Metric.estimate_factor"
          >
            estimation
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.cost }"
            v-on:click="viewOptions.metric = Metric.cost"
          >
            cost
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.buffers }"
            v-on:click="viewOptions.metric = Metric.buffers"
          >
            buffers
          </button>
        </div>
      </div>
      <div
        class="form-group text-center my-1"
        v-if="viewOptions.metric == Metric.buffers"
      >
        <div class="btn-group btn-group-xs">
          <button
            class="btn btn-outline-secondary"
            :class="{
              active: viewOptions.buffersMetric === BufferLocation.shared,
            }"
            v-on:click="viewOptions.buffersMetric = BufferLocation.shared"
            :disabled="!plan.planStats.maxBlocks?.[BufferLocation.shared]"
          >
            shared
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{
              active: viewOptions.buffersMetric === BufferLocation.temp,
            }"
            v-on:click="viewOptions.buffersMetric = BufferLocation.temp"
            :disabled="!plan.planStats.maxBlocks?.[BufferLocation.temp]"
          >
            temp
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{
              active: viewOptions.buffersMetric === BufferLocation.local,
            }"
            v-on:click="viewOptions.buffersMetric = BufferLocation.local"
            :disabled="!plan.planStats.maxBlocks?.[BufferLocation.local]"
          >
            local
          </button>
        </div>
      </div>
      <div class="legend text-center">
        <ul
          class="list-unstyled list-inline mb-0"
          v-if="viewOptions.metric == Metric.buffers"
        >
          <li
            class="list-inline-item"
            v-if="viewOptions.buffersMetric != BufferLocation.temp"
          >
            <span class="bg-hit rounded"></span>
            Hit
          </li>
          <li class="list-inline-item">
            <span class="bg-read"></span>
            Read
          </li>
          <li
            class="list-inline-item"
            v-if="viewOptions.buffersMetric != BufferLocation.temp"
          >
            <span class="bg-dirtied"></span>
            Dirtied
          </li>
          <li class="list-inline-item">
            <span class="bg-written"></span>
            Written
          </li>
        </ul>
      </div>
    </div>
    <div class="overflow-auto flex-grow-1" ref="container">
      <table
        class="m-1"
        v-if="dataAvailable"
        :class="{ highlight: !!highlightedNodeId }"
      >
        <tbody v-for="(flat, index) in plans" :key="index">
          <tr v-if="index === 0 && plans.length > 1">
            <th colspan="3" class="subplan">Main Query Plan</th>
          </tr>
          <template v-for="(row, index) in flat" :key="index">
            <tr v-if="row[1][NodeProp.SUBPLAN_NAME]">
              <td></td>
              <td
                class="subplan pr-2"
                :class="{ 'font-weight-bold': isCTE(row[1]) }"
                :colspan="isCTE(row[1]) ? 3 : 2"
              >
                <span class="tree-lines">
                  <template v-for="i in _.range(row[0])">
                    <template v-if="_.indexOf(row[3], i) != -1">│</template
                    ><template v-else-if="i !== 0">&emsp;</template> </template
                  ><template v-if="index !== 0">{{
                    row[2] ? "└" : "├"
                  }}</template>
                </span>
                <a
                  class="font-italic text-reset"
                  href=""
                  @click.prevent="selectNode(row[1].nodeId, true)"
                >
                  {{ row[1][NodeProp.SUBPLAN_NAME] }}
                </a>
              </td>
            </tr>
            <tr
              class="no-focus-outline node"
              :class="{
                selected: row[1].nodeId === selectedNodeId,
                highlight: row[1].nodeId === highlightedNodeId,
              }"
              :data-tippy-content="getTooltipContent(row[1])"
              :ref="
                (el) => {
                  setRowRef(row[1].nodeId, el as Element)
                }
              "
              @mouseenter="highlightedNodeId = row[1].nodeId"
              @mouseleave="highlightedNodeId = undefined"
              @click.prevent="selectNode(row[1].nodeId, true)"
            >
              <td class="node-index">
                <span class="font-weight-normal small"
                  >#{{ row[1].nodeId }}
                </span>
              </td>
              <td class="node-type pr-2">
                <span class="tree-lines">
                  <template v-for="i in _.range(row[0])">
                    <template v-if="_.indexOf(row[3], i) != -1">│</template
                    ><template v-else-if="i !== 0">&emsp;</template> </template
                  ><template v-if="index !== 0">
                    <template v-if="!row[1][NodeProp.SUBPLAN_NAME]">{{
                      row[2] ? "└" : "├"
                    }}</template
                    ><template v-else>
                      <template v-if="!row[2]">│</template
                      ><template v-else>&emsp;</template>
                    </template>
                  </template>
                </span>
                {{ nodeType(row) }}
              </td>
              <td>
                <!-- time -->
                <div
                  class="progress rounded-0 align-items-center bg-transparent"
                  style="height: 5px"
                  v-if="viewOptions.metric == Metric.time"
                  :key="'node' + index + 'time'"
                >
                  <div
                    class="progress-bar border-secondary bg-secondary"
                    :class="{
                      'border-left': row[1][NodeProp.EXCLUSIVE_DURATION] > 0,
                    }"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (row[1][NodeProp.EXCLUSIVE_DURATION] /
                        (plan.planStats.executionTime ||
                          plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME])) *
                        100 +
                      '%; height:5px;'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                  <div
                    class="progress-bar bg-secondary-light"
                    role="progressbar"
                    :style="
                      'width: ' +
                      ((row[1][NodeProp.ACTUAL_TOTAL_TIME] -
                        row[1][NodeProp.EXCLUSIVE_DURATION]) /
                        (plan.planStats.executionTime ||
                          plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME])) *
                        100 +
                      '%; height:5px;'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <!-- rows -->
                <div
                  class="progress rounded-0 align-items-center bg-transparent"
                  style="height: 5px"
                  v-else-if="viewOptions.metric == Metric.rows"
                  :key="'node' + index + 'rows'"
                >
                  <div
                    class="bg-secondary"
                    role="progressbar"
                    :style="
                      'width: ' +
                      Math.round(
                        (row[1][NodeProp.ACTUAL_ROWS_REVISED] /
                          plan.planStats.maxRows) *
                          100
                      ) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                </div>
                <!-- estimation -->
                <div
                  class="progress rounded-0 align-items-center bg-transparent justify-content-center"
                  style="height: 10px"
                  v-else-if="viewOptions.metric == Metric.estimate_factor"
                  :key="'node' + index + 'estimation'"
                >
                  <span class="text-muted small">
                    <font-awesome-icon
                      fixed-width
                      icon="arrow-down"
                      v-if="
                        row[1][NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
                        EstimateDirection.under
                      "
                    ></font-awesome-icon>
                    <i class="fa fa-fw" v-else />
                  </span>
                  <div
                    class="progress-bar"
                    :class="[
                      row[1][NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
                      EstimateDirection.under
                        ? 'bg-secondary'
                        : 'bg-transparent',
                    ]"
                    role="progressbar"
                    :style="
                      'width: ' + estimateFactorPercent(row) + '%; height:5px;'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                  <div
                    class="progress-bar border-left"
                    role="progressbar"
                    style="width: 1px; height: 5px"
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                  <div
                    class="progress-bar"
                    :class="[
                      row[1][NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
                      EstimateDirection.over
                        ? 'bg-secondary'
                        : 'bg-transparent',
                    ]"
                    role="progressbar"
                    :style="
                      'width: ' + estimateFactorPercent(row) + '%; height:5px;'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                  <span class="text-muted small">
                    <font-awesome-icon
                      fixed-width
                      icon="arrow-up"
                      v-if="
                        row[1][NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
                        EstimateDirection.over
                      "
                    ></font-awesome-icon>
                    <i class="fa fa-fw" v-else />
                  </span>
                </div>
                <!-- cost -->
                <div
                  class="progress rounded-0 align-items-center bg-transparent"
                  style="height: 5px"
                  v-else-if="viewOptions.metric == Metric.cost"
                  :key="'node' + index + 'cost'"
                >
                  <div
                    class="bg-secondary"
                    :class="{
                      'border-secondary border-left':
                        row[1][NodeProp.EXCLUSIVE_COST] > 0,
                    }"
                    role="progressbar"
                    :style="
                      'width: ' +
                      Math.round(
                        (row[1][NodeProp.EXCLUSIVE_COST] /
                          plan.planStats.maxCost) *
                          100
                      ) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                </div>
                <!-- buffers shared -->
                <div
                  class="progress rounded-0 align-items-center bg-transparent"
                  style="height: 5px"
                  v-else-if="
                    viewOptions.metric == Metric.buffers &&
                    viewOptions.buffersMetric == BufferLocation.shared &&
                    plan.planStats.maxBlocks?.[BufferLocation.shared]
                  "
                  :key="'node' + index + 'buffers_shared'"
                >
                  <div
                    class="bg-hit"
                    :class="{
                      'border-left border-hit':
                        row[1][NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] > 0,
                    }"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                  <div
                    class="bg-read"
                    role="progressbar"
                    :class="{
                      'border-left border-read':
                        row[1][NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] > 0,
                    }"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                  <div
                    class="bg-dirtied"
                    :class="{
                      'border-left border-dirtied':
                        row[1][NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] > 0,
                    }"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                  <div
                    class="bg-written"
                    :class="{
                      'border-left border-written':
                        row[1][NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] > 0,
                    }"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                </div>
                <!-- buffers temp -->
                <div
                  class="progress rounded-0 align-items-center bg-transparent"
                  style="height: 5px"
                  v-else-if="
                    viewOptions.metric == Metric.buffers &&
                    viewOptions.buffersMetric == BufferLocation.temp &&
                    plan.planStats.maxBlocks?.[BufferLocation.temp]
                  "
                  :key="'node' + index + 'buffers_temp'"
                >
                  <div
                    class="bg-read"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.temp]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                  <div
                    class="bg-written"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.temp]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                </div>
                <!-- buffers local -->
                <div
                  class="progress rounded-0 align-items-center bg-transparent"
                  style="height: 5px"
                  v-else-if="
                    viewOptions.metric == Metric.buffers &&
                    viewOptions.buffersMetric == BufferLocation.local &&
                    plan.planStats.maxBlocks?.[BufferLocation.local]
                  "
                  :key="'node' + index + 'buffers_local'"
                >
                  <div
                    class="bg-hit"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.local]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                  <div
                    class="bg-read"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.local]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                  <div
                    class="bg-dirtied"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS] /
                          plan.planStats.maxBlocks?.[BufferLocation.local]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                  <div
                    class="bg-written"
                    role="progressbar"
                    :style="
                      'width: ' +
                      (Math.round(
                        (row[1][NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS] /
                          plan.planStats?.maxBlocks?.[BufferLocation.local]) *
                          100
                      ) || 0) +
                      '%'
                    "
                    aria-valuenow="15"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style="height: 5px"
                  ></div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div class="p-2 text-center text-muted" v-else>
        <em> No data available </em>
      </div>
    </div>
  </div>
</template>
