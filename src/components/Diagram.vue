<script lang="ts" setup>
import _ from "lodash"
import {
  computed,
  inject,
  onBeforeMount,
  provide,
  reactive,
  ref,
  watch,
} from "vue"
import type { Ref } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { BufferLocation, NodeProp, Metric } from "../enums"
import { HelpService, scrollChildIntoParentView } from "@/services/help-service"
import type { IPlan, Node } from "@/interfaces"
import { HighlightedNodeIdKey, PlanKey, SelectNodeKey } from "@/symbols"
import DiagramRow from "@/components/DiagramRow.vue"
import LevelDivider from "@/components/LevelDivider.vue"

import { directive as vTippy } from "vue-tippy"

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage

type Row = [number, Node, boolean, number[]]

const plan = inject(PlanKey) as Ref<IPlan>

const container = ref(null) // The container element

const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}
const highlightedNodeId = inject(HighlightedNodeIdKey)

// The main plan + init plans (all flatten)
const plans: Row[][] = [[]]

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

watch(viewOptions, onViewOptionsChanged)

function onViewOptionsChanged() {
  localStorage.setItem("diagramViewOptions", JSON.stringify(viewOptions))
}

function flatten(
  output: Row[],
  level: number,
  node: Node,
  isLast: boolean,
  branches: number[],
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
      branches,
    )
  })
  if (!isLast) {
    branches.pop()
  }
}

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

function scrollTo(el: Element) {
  if (!container.value) {
    return
  }
  scrollChildIntoParentView(container.value, el, false)
}

provide("scrollTo", scrollTo)
</script>

<template>
  <div class="diagram">
    <div class="flex-shrink-0">
      <div class="text-center my-1">
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
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.io }"
            v-on:click="viewOptions.metric = Metric.io"
            :disabled="!plan.planStats.maxIo"
          >
            IO
          </button>
        </div>
      </div>
      <div class="text-center my-1" v-if="viewOptions.metric == Metric.buffers">
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
        <template v-if="viewOptions.metric == Metric.io">
          <ul class="list-unstyled list-inline mb-0 d-inline-block">
            <li class="list-inline-item">
              <span class="bg-read"></span>
              Read
            </li>
            <li class="list-inline-item">
              <span class="bg-written"></span>
              Write
            </li>
          </ul>
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help d-inline-block text-secondary"
            v-tippy="{
              content: getHelpMessage('hint track_io_timing'),
              allowHTML: true,
            }"
          ></FontAwesomeIcon>
        </template>
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
                class="subplan pe-2"
                :class="{ 'fw-bold': isCTE(row[1]) }"
                :colspan="isCTE(row[1]) ? 3 : 2"
              >
                <level-divider
                  :isSubplan="!!row[1][NodeProp.SUBPLAN_NAME]"
                  :isLastChild="!!row[2]"
                  :level="row[0]"
                  :branches="row[3]"
                  :index="index"
                  dense
                ></level-divider>
                <a
                  class="fst-italic text-reset"
                  href=""
                  @click.prevent="selectNode(row[1].nodeId, true)"
                >
                  {{ row[1][NodeProp.SUBPLAN_NAME] }}
                </a>
              </td>
            </tr>
            <diagram-row
              :node="row[1]"
              :isSubplan="!!row[1][NodeProp.SUBPLAN_NAME]"
              :isLastChild="!!row[2]"
              :level="row[0]"
              :branches="row[3]"
              :index="index"
              :viewOptions="viewOptions"
            ></diagram-row>
          </template>
        </tbody>
      </table>
      <div class="p-2 text-center text-secondary" v-else>
        <em> No data available </em>
      </div>
    </div>
  </div>
</template>
