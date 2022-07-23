<script lang="ts" setup>
import {
  computed,
  h,
  inject,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue"
import PlanNodeDetail from "@/components/PlanNodeDetail.vue"
import PlanNodeContext from "@/components/PlanNodeContext.vue"
import { directive as vTippy, useTippy } from "vue-tippy"
import type { IPlan, Node, ViewOptions, Worker } from "@/interfaces"
import { numberToColorHsl } from "@/services/color-service"
import { cost, duration, rows } from "@/filters"
import { EstimateDirection, HighlightType, NodeProp } from "@/enums"
import * as _ from "lodash"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

const selectedNode = inject<number | null>("selectedNode", null)
const highlightedNode = inject<number | null>("highlightedNode", null)

interface Props {
  node: Node
  plan: IPlan
  viewOptions: ViewOptions
}
const props = defineProps<Props>()
const el = ref<Element | null>(null) // The .plan-node Element
const outerEl = ref<Element>() // The outer Element, useful for CTE and subplans

const viewOptions = reactive<ViewOptions>(props.viewOptions)
const node = reactive<Node>(props.node)
const plan = reactive<IPlan>(props.plan)
const nodeProps = ref<
  {
    key: keyof typeof NodeProp
    value: unknown
  }[]
>()

const executionTimePercent = ref<number>(NaN)
// UI flags
// calculated properties
const costPercent = ref<number>(NaN)
const barWidth = ref<number>(0)
const highlightValue = ref<string | null>(null)
const plans = ref<Node[]>([])
const plannerRowEstimateValue = ref<number>()
const plannerRowEstimateDirection = ref<EstimateDirection>()
const rowsRemoved = ref<number>(NaN)
const rowsRemovedPercent = ref<number>(NaN)
const rowsRemovedPercentString = ref<string>()

onBeforeMount(() => {
  calculateProps()
  calculateBar()
  calculateDuration()
  calculateCost()
  calculateRowsRemoved()
  plans.value = node[NodeProp.PLANS]
  plannerRowEstimateDirection.value = node[NodeProp.PLANNER_ESTIMATE_DIRECTION]
  plannerRowEstimateValue.value = node[NodeProp.PLANNER_ESTIMATE_FACTOR]
})

onMounted(async () => {
  const content = h(PlanNodeDetail, {
    node: props.node,
    plan: props.plan,
    viewOptions: props.viewOptions,
  })
  useTippy(outerEl, {
    content: content,
    allowHTML: true,
    interactive: true,
    appendTo: () => document.body,
    placement: "right",
    maxWidth: "none",
    arrow: false,
  })
})

function calculateDuration() {
  // use the first node total time if plan execution time is not available
  const executionTime =
    (plan.planStats.executionTime as number) ||
    (plan?.content?.Plan?.[NodeProp.ACTUAL_TOTAL_TIME] as number)
  const duration = node[NodeProp.EXCLUSIVE_DURATION] as number
  executionTimePercent.value = _.round((duration / executionTime) * 100)
}

function calculateCost() {
  const maxTotalCost = plan.content.maxTotalCost as number
  const cost = node[NodeProp.EXCLUSIVE_COST] as number
  costPercent.value = _.round((cost / maxTotalCost) * 100)
}

type NodePropStrings = keyof typeof NodeProp
const rowsRemovedProp = computed((): NodePropStrings => {
  const nodeKey = Object.keys(node).find(
    (key) =>
      key === NodeProp.ROWS_REMOVED_BY_FILTER_REVISED ||
      key === NodeProp.ROWS_REMOVED_BY_JOIN_FILTER_REVISED
  )
  return Object.keys(NodeProp).find(
    (prop) => NodeProp[prop as NodePropStrings] === nodeKey
  ) as NodePropStrings
})

function calculateRowsRemoved() {
  if (rowsRemovedProp.value) {
    type NodePropStrings = keyof typeof NodeProp
    const removed = node[
      NodeProp[rowsRemovedProp.value as NodePropStrings]
    ] as number
    rowsRemoved.value = removed
    const actual = node[NodeProp.ACTUAL_ROWS_REVISED]
    rowsRemovedPercent.value = _.floor((removed / (removed + actual)) * 100)
    if (rowsRemovedPercent.value === 100) {
      rowsRemovedPercentString.value = ">99"
    } else if (rowsRemovedPercent.value === 0) {
      rowsRemovedPercentString.value = "<1"
    } else {
      rowsRemovedPercentString.value = rowsRemovedPercent.value.toString()
    }
  }
}

// create an array of node propeties so that they can be displayed in the view
function calculateProps() {
  nodeProps.value = _.chain(node)
    .omit(NodeProp.PLANS)
    .omit(NodeProp.WORKERS)
    .map((value, key) => {
      return { key: key as keyof typeof NodeProp, value }
    })
    .value()
}

function getNodeName(): string {
  let nodeName = isParallelAware.value ? "Parallel " : ""
  nodeName += node[NodeProp.NODE_TYPE]
  return nodeName
}

watch(() => viewOptions.highlightType, calculateBar)

function calculateBar(): void {
  let value: number | undefined
  switch (viewOptions.highlightType) {
    case HighlightType.DURATION:
      value = node[NodeProp.EXCLUSIVE_DURATION]
      if (value === undefined) {
        highlightValue.value = null
        break
      }
      barWidth.value = Math.round(
        (value / (plan.planStats.maxDuration as number)) * 100
      )
      highlightValue.value = duration(value)
      break
    case HighlightType.ROWS:
      value = node[NodeProp.ACTUAL_ROWS_REVISED]
      if (value === undefined) {
        highlightValue.value = null
        break
      }
      barWidth.value =
        Math.round((value / (plan.planStats.maxRows as number)) * 100) || 0
      highlightValue.value = rows(value)
      break
    case HighlightType.COST:
      value = node[NodeProp.EXCLUSIVE_COST]
      if (value === undefined) {
        highlightValue.value = null
        break
      }
      barWidth.value = Math.round(
        (value / (plan.planStats.maxCost as number)) * 100
      )
      highlightValue.value = cost(value)
      break
  }
}

function getBarColor(percent: number) {
  return numberToColorHsl(percent)
}

const durationClass = computed(() => {
  let c
  const i = executionTimePercent.value
  if (i > 90) {
    c = 4
  } else if (i > 40) {
    c = 3
  } else if (i > 10) {
    c = 2
  }
  if (c) {
    return "c-" + c
  }
  return false
})

const estimationClass = computed(() => {
  let c
  const i = node[NodeProp.PLANNER_ESTIMATE_FACTOR] as number
  if (i > 1000) {
    c = 4
  } else if (i > 100) {
    c = 3
  } else if (i > 10) {
    c = 2
  }
  if (c) {
    return "c-" + c
  }
  return false
})

const costClass = computed(() => {
  let c
  const i = costPercent.value
  if (i > 90) {
    c = 4
  } else if (i > 40) {
    c = 3
  } else if (i > 10) {
    c = 2
  }
  if (c) {
    return "c-" + c
  }
  return false
})

const rowsRemovedClass = computed(() => {
  let c
  // high percent of rows removed is relevant only when duration is high
  // as well
  const i = rowsRemovedPercent.value * executionTimePercent.value
  if (i > 2000) {
    c = 4
  } else if (i > 500) {
    c = 3
  }
  if (c) {
    return "c-" + c
  }
  return false
})

const heapFetchesClass = computed(() => {
  let c
  const i =
    ((node[NodeProp.HEAP_FETCHES] as number) /
      ((node[NodeProp.ACTUAL_ROWS] as number) +
        ((node[NodeProp.ROWS_REMOVED_BY_FILTER] as number) || 0) +
        ((node[NodeProp.ROWS_REMOVED_BY_JOIN_FILTER] as number) || 0))) *
    100
  if (i > 90) {
    c = 4
  } else if (i > 40) {
    c = 3
  } else if (i > 10) {
    c = 2
  }
  if (c) {
    return "c-" + c
  }
  return false
})

const filterTooltip = computed((): string => {
  return rowsRemovedPercentString.value + "% of rows removed by filter"
})

const workersLaunchedCount = computed((): number => {
  console.warn("Make sure it works for workers that are not array")
  const workers = node[NodeProp.WORKERS] as Worker[]
  return workers ? workers.length : NaN
})

const workersPlannedCount = computed((): number => {
  return node[NodeProp.WORKERS_PLANNED_BY_GATHER] as number
})

const workersPlannedCountReversed = computed((): number[] => {
  const workersPlanned = node[NodeProp.WORKERS_PLANNED_BY_GATHER]
  return [...Array(workersPlanned).keys()].slice().reverse()
})

const isParallelAware = computed((): boolean => {
  return node[NodeProp.PARALLEL_AWARE]
})

const isNeverExecuted = computed((): boolean => {
  return !!plan.planStats.executionTime && !node[NodeProp.ACTUAL_LOOPS]
})
</script>

<template>
  <div ref="outerEl">
    <div
      ref="el"
      :class="[
        'text-left plan-node',
        {
          'never-executed': isNeverExecuted,
          parallel: workersPlannedCount,
          selected: selectedNode == node.nodeId,
          highlight: highlightedNode == node.nodeId,
        },
      ]"
    >
      <div v-if="node[NodeProp.SUBPLAN_NAME]" class="fixed-bottom text-center">
        <b class="bg-light font-italic px-1">
          {{ node[NodeProp.SUBPLAN_NAME] }}
        </b>
      </div>
      <div class="workers text-muted py-0 px-1" v-if="workersPlannedCount">
        <div
          v-for="index in workersPlannedCountReversed"
          :key="index"
          :style="
            'top: ' +
            (1 + index * 2) +
            'px; left: ' +
            (1 + (index + 1) * 3) +
            'px;'
          "
          :class="{ 'border-dashed': index >= workersLaunchedCount }"
        >
          {{ index }}
        </div>
      </div>
      <div
        class="plan-node-body card"
        @mouseenter="highlightedNode = node.nodeId"
        @mouseleave="highlightedNode = null"
      >
        <div class="card-body header no-focus-outline">
          <header class="mb-0">
            <h4 class="text-body">
              <a
                class="font-weight-normal small"
                :href="'#plan/node/' + node.nodeId"
                @click.stop
                >#{{ node.nodeId }}</a
              >
              {{ getNodeName() }}
            </h4>
            <div class="float-right">
              <span
                v-if="durationClass"
                :class="
                  'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' +
                  durationClass
                "
                v-tippy="'Slow'"
                ><font-awesome-icon
                  fixed-width
                  icon="clock"
                ></font-awesome-icon>
              </span>
              <span
                v-if="costClass"
                :class="
                  'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' + costClass
                "
                v-tippy="'Cost is high'"
                ><font-awesome-icon
                  fixed-width
                  icon="dollar-sign"
                ></font-awesome-icon
              ></span>
              <span
                v-if="estimationClass"
                :class="
                  'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' +
                  estimationClass
                "
                v-tippy="'Bad estimation for number of rows'"
                ><font-awesome-icon
                  fixed-width
                  icon="thumbs-down"
                ></font-awesome-icon
              ></span>
              <span
                v-if="rowsRemovedClass"
                :class="
                  'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' +
                  rowsRemovedClass
                "
                v-tippy="filterTooltip"
              >
                <font-awesome-icon
                  fixed-width
                  icon="filter"
                ></font-awesome-icon>
              </span>
              <span
                v-if="heapFetchesClass"
                :class="
                  'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' +
                  heapFetchesClass
                "
                v-tippy="{
                  arrow: true,
                  content: 'Heap Fetches number is high',
                }"
              >
                <font-awesome-icon
                  fixed-width
                  icon="exchange-alt"
                ></font-awesome-icon>
              </span>
              <span
                v-if="rowsRemoved && !rowsRemovedClass"
                class="p-0 d-inline-block mb-0 ml-1 text-nowrap"
                v-tippy="filterTooltip"
              >
                <font-awesome-icon
                  fixed-width
                  icon="filter"
                  class="text-muted"
                ></font-awesome-icon>
              </span>
            </div>
          </header>
          <plan-node-context :node="node"></plan-node-context>

          <div
            v-if="
              viewOptions.highlightType !== HighlightType.NONE &&
              highlightValue !== null
            "
          >
            <div class="progress node-bar-container" style="height: 5px">
              <div
                class="progress-bar"
                role="progressbar"
                v-bind:style="{
                  width: barWidth + '%',
                  'background-color': getBarColor(barWidth),
                }"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span class="node-bar-label">
              <span class="text-muted">{{ viewOptions.highlightType }}:</span>
              <span v-html="highlightValue"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
