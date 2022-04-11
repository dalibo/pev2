<script lang="ts" setup>
import { computed, onBeforeMount, reactive, ref, watch } from "vue"
import { directive as vTippy } from "vue-tippy"
import type { IPlan, Node, ViewOptions, Worker } from "@/interfaces"
import { HelpService } from "@/services/help-service"
import { numberToColorHsl } from "@/services/color-service"
import {
  cost,
  duration,
  formatNodeProp,
  keysToString,
  sortKeys,
  rows,
} from "@/filters"
import {
  EstimateDirection,
  HighlightType,
  NodeProp,
  nodePropTypes,
  Orientation,
  PropType,
  ViewMode,
  WorkerProp,
} from "@/enums"
import * as _ from "lodash"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

interface Props {
  node: Node
  plan: IPlan
  viewOptions: ViewOptions
}
const props = defineProps<Props>()

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
const selected = ref<boolean>(false)
// UI flags
const showDetails = ref<boolean>(false)
const collapsed = ref<boolean>(false)
const activeTab = ref<string>("general")
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

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage
const getNodeTypeDescription = helpService.getNodeTypeDescription

// Returns the list of properties that have already been displayed either in
// the main panel or in other detailed tabs.
const notMiscProperties: string[] = [
  NodeProp.NODE_TYPE,
  NodeProp.CTE_NAME,
  NodeProp.EXCLUSIVE_DURATION,
  NodeProp.EXCLUSIVE_COST,
  NodeProp.TOTAL_COST,
  NodeProp.PLAN_ROWS,
  NodeProp.ACTUAL_ROWS,
  NodeProp.ACTUAL_LOOPS,
  NodeProp.OUTPUT,
  NodeProp.WORKERS,
  NodeProp.WORKERS_PLANNED,
  NodeProp.WORKERS_LAUNCHED,
  NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS,
  NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS,
  NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS,
  NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS,
  NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS,
  NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS,
  NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS,
  NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS,
  NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS,
  NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS,
  NodeProp.SHARED_HIT_BLOCKS,
  NodeProp.SHARED_READ_BLOCKS,
  NodeProp.SHARED_DIRTIED_BLOCKS,
  NodeProp.SHARED_WRITTEN_BLOCKS,
  NodeProp.TEMP_READ_BLOCKS,
  NodeProp.TEMP_WRITTEN_BLOCKS,
  NodeProp.LOCAL_HIT_BLOCKS,
  NodeProp.LOCAL_READ_BLOCKS,
  NodeProp.LOCAL_DIRTIED_BLOCKS,
  NodeProp.LOCAL_WRITTEN_BLOCKS,
  NodeProp.PLANNER_ESTIMATE_FACTOR,
  NodeProp.PLANNER_ESTIMATE_DIRECTION,
  NodeProp.SUBPLAN_NAME,
  NodeProp.GROUP_KEY,
  NodeProp.HASH_CONDITION,
  NodeProp.JOIN_TYPE,
  NodeProp.INDEX_NAME,
  NodeProp.HASH_CONDITION,
  NodeProp.EXCLUSIVE_IO_READ_TIME,
  NodeProp.EXCLUSIVE_IO_WRITE_TIME,
  NodeProp.IO_READ_TIME, // Exclusive value already shown in IO tab
  NodeProp.IO_WRITE_TIME, // Exclusive value already shown in IO tab
  NodeProp.HEAP_FETCHES,
  NodeProp.WAL_RECORDS,
  NodeProp.WAL_BYTES,
  NodeProp.WAL_FPI,
  NodeProp.NODE_ID,
  NodeProp.ROWS_REMOVED_BY_FILTER,
  NodeProp.ROWS_REMOVED_BY_JOIN_FILTER,
  NodeProp.ACTUAL_ROWS_REVISED,
  NodeProp.PLAN_ROWS_REVISED,
  NodeProp.ROWS_REMOVED_BY_FILTER_REVISED,
  NodeProp.ROWS_REMOVED_BY_JOIN_FILTER_REVISED,
]

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
    const actual = node[NodeProp.ACTUAL_ROWS]
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
  if (viewOptions.viewMode === ViewMode.DOT && !showDetails.value) {
    return nodeName.replace(/[^A-Z]/g, "")
  }
  return nodeName
}

const shouldShowPlannerEstimate = computed(() => {
  if (
    (collapsed.value && !showDetails.value) ||
    viewOptions.viewMode === ViewMode.DOT
  ) {
    return false
  }
  return (
    (estimationClass.value || showDetails.value) &&
    plannerRowEstimateDirection.value !== EstimateDirection.none &&
    plannerRowEstimateValue.value
  )
})

function shouldShowNodeBarLabel(): boolean {
  if (showDetails.value) {
    return true
  }
  if (collapsed.value || viewOptions.viewMode === ViewMode.DOT) {
    return false
  }
  return true
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
      value = node[NodeProp.ACTUAL_ROWS]
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

const hasChildren = computed((): boolean => {
  return !!plans.value
})

const filterTooltip = computed((): string => {
  return rowsRemovedPercentString.value + "% of rows removed by filter"
})

const workersLaunchedCount = computed((): number => {
  console.warn("Make sure it works for workers that are not array")
  const workers = node[NodeProp.WORKERS] as Worker[]
  return workers.length as number
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

const allWorkersLaunched = computed((): boolean => {
  return (
    !node[NodeProp.WORKERS_LAUNCHED] ||
    node[NodeProp.WORKERS_PLANNED] === node[NodeProp.WORKERS_LAUNCHED]
  )
})

function shouldShowProp(key: string, value: unknown): boolean {
  return (
    (!!value ||
      nodePropTypes[key] === PropType.increment ||
      key === NodeProp.ACTUAL_ROWS) &&
    notMiscProperties.indexOf(key) === -1
  )
}

const shouldShowIoBuffers = computed((): boolean => {
  const properties: Array<keyof typeof NodeProp> = [
    "EXCLUSIVE_SHARED_HIT_BLOCKS",
    "EXCLUSIVE_SHARED_READ_BLOCKS",
    "EXCLUSIVE_SHARED_DIRTIED_BLOCKS",
    "EXCLUSIVE_SHARED_WRITTEN_BLOCKS",
    "EXCLUSIVE_TEMP_READ_BLOCKS",
    "EXCLUSIVE_TEMP_WRITTEN_BLOCKS",
    "EXCLUSIVE_LOCAL_HIT_BLOCKS",
    "EXCLUSIVE_LOCAL_READ_BLOCKS",
    "EXCLUSIVE_LOCAL_DIRTIED_BLOCKS",
    "EXCLUSIVE_LOCAL_WRITTEN_BLOCKS",
    "EXCLUSIVE_IO_READ_TIME",
    "EXCLUSIVE_IO_WRITE_TIME",
  ]
  const values = _.map(properties, (property) => {
    const value = node[NodeProp[property]]
    return _.isNaN(value) ? 0 : value
  })
  const sum = _.sum(values)
  return sum > 0
})

const isNeverExecuted = computed((): boolean => {
  return !!plan.planStats.executionTime && !node[NodeProp.ACTUAL_LOOPS]
})

const hasSeveralLoops = computed((): boolean => {
  return (node[NodeProp.ACTUAL_LOOPS] as number) > 1
})

const tilde = computed((): string => {
  return hasSeveralLoops.value ? "~" : ""
})

// returns the formatted prop
function formattedProp(propName: keyof typeof NodeProp) {
  const property = NodeProp[propName]
  const value = node[property]
  return formatNodeProp(property, value)
}
</script>

<template>
  <div
    :class="{
      subplan: node[NodeProp.SUBPLAN_NAME],
      'd-flex flex-column align-items-center':
        viewOptions.orientation == Orientation.TWOD,
    }"
  >
    <h4 v-if="node[NodeProp.SUBPLAN_NAME]">
      {{ node[NodeProp.SUBPLAN_NAME] }}
    </h4>
    <div
      :class="[
        'text-left plan-node',
        {
          detailed: showDetails,
          'never-executed': isNeverExecuted,
          parallel: workersPlannedCount,
          selected: selected,
        },
      ]"
    >
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
        class="collapse-handle"
        v-if="hasChildren"
        v-on:click.stop="collapsed = !collapsed"
      >
        <font-awesome-icon
          fixed-width
          icon="expand"
          v-if="collapsed"
          title="Expand child nodes"
        ></font-awesome-icon>
        <font-awesome-icon
          fixed-width
          icon="compress"
          v-else
          title="Collpase child nodes"
        ></font-awesome-icon>
      </div>
      <div class="plan-node-body card">
        <div
          class="card-body header no-focus-outline"
          v-on:click.stop="showDetails = !showDetails"
        >
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
                  'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' +
                  costClass
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
                  class="exchange-alt"
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
            <span v-if="viewOptions.viewMode === ViewMode.FULL">
              <span class="node-duration text-warning" v-if="isNeverExecuted">
                Never executed
              </span>
            </span>
          </header>

          <div
            v-if="viewOptions.viewMode === ViewMode.FULL"
            class="text-left text-monospace"
          >
            <div
              v-if="node[NodeProp.RELATION_NAME]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-muted">on&nbsp;</span
              ><span v-if="node[NodeProp.SCHEMA]"
                >{{ node[NodeProp.SCHEMA] }}.</span
              >{{ node[NodeProp.RELATION_NAME] }}
              <span v-if="node[NodeProp.ALIAS]">
                <span class="text-muted">as</span>
                {{ node[NodeProp.ALIAS] }}
              </span>
            </div>
            <div
              v-if="node[NodeProp.GROUP_KEY]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-muted">by</span>&nbsp;<span
                v-html="keysToString(node[NodeProp.GROUP_KEY] as string)"
              ></span>
            </div>
            <div
              v-if="node[NodeProp.SORT_KEY]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-muted">by</span>
              <span
                v-html="
                  sortKeys(
                    node[NodeProp.SORT_KEY] as string[],
                    node[NodeProp.PRESORTED_KEY] as string[]
                  )
                "
              ></span>
            </div>
            <div v-if="node[NodeProp.JOIN_TYPE]">
              {{ node[NodeProp.JOIN_TYPE] }}
              <span class="text-muted">join</span>
            </div>
            <div
              v-if="node[NodeProp.INDEX_NAME]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-muted">using</span>&nbsp;<span
                v-html="keysToString(node[NodeProp.INDEX_NAME] as string)"
              ></span>
            </div>
            <div
              v-if="node[NodeProp.HASH_CONDITION]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-muted">on</span>&nbsp;<span
                v-html="keysToString(node[NodeProp.HASH_CONDITION] as string)"
              ></span>
            </div>
            <div v-if="node[NodeProp.CTE_NAME]">
              <a class="text-reset" href="">
                <font-awesome-icon
                  icon="search"
                  class="text-muted"
                ></font-awesome-icon
                >&nbsp;<span class="text-muted">CTE</span>
                {{ node[NodeProp.CTE_NAME] }}
              </a>
            </div>
          </div>

          <div
            v-if="
              !allWorkersLaunched && viewOptions.viewMode === ViewMode.FULL
            "
            class="text-c-3 cursor-help"
            v-tippy="getHelpMessage('workers planned not launched')"
          >
            <font-awesome-icon icon="exclamation-triangle"></font-awesome-icon
            >&nbsp;
            <span>Not all workers launched</span>
          </div>
          <div class="clearfix"></div>

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
            <span class="node-bar-label" v-if="shouldShowNodeBarLabel()">
              <span class="text-muted">{{ viewOptions.highlightType }}:</span
              >&nbsp;
              <span v-html="highlightValue"></span>
            </span>
          </div>
        </div>

        <div v-if="showDetails" class="card-header border-top">
          <div
            v-if="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"
            class="node-description"
          >
            <span class="node-type">{{ node[NodeProp.NODE_TYPE] }} Node</span
            >&nbsp;<span
              v-html="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"
            ></span>
          </div>
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{ active: activeTab === 'general' }"
                @click.prevent="activeTab = 'general'"
                href=""
                >General</a
              >
            </li>
            <li class="nav-item">
              <a
                class="nav-link text-nowrap"
                :class="{
                  active: activeTab === 'iobuffer',
                  disabled: !shouldShowIoBuffers,
                }"
                @click.prevent="activeTab = 'iobuffer'"
                href=""
                >IO & Buffers</a
              >
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{
                  active: activeTab === 'output',
                  disabled: !node[NodeProp.OUTPUT],
                }"
                @click.prevent="activeTab = 'output'"
                href=""
                >Output</a
              >
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{
                  active: activeTab === 'workers',
                  disabled: !(
                    node[NodeProp.WORKERS_PLANNED] ||
                    node[NodeProp.WORKERS_PLANNED_BY_GATHER]
                  ),
                }"
                @click.prevent="activeTab = 'workers'"
                href=""
                >Workers</a
              >
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{ active: activeTab === 'misc' }"
                @click.prevent="activeTab = 'misc'"
                href=""
                >Misc</a
              >
            </li>
          </ul>
        </div>
        <div class="card-body tab-content" v-if="showDetails">
          <div
            class="tab-pane"
            :class="{ 'show active': activeTab === 'general' }"
          >
            <!-- general -->
            <div v-if="plan.isAnalyze">
              <font-awesome-icon
                fixed-width
                icon="clock"
                class="text-muted"
              ></font-awesome-icon>
              <b>Timing:</b>&nbsp;
              <span
                :class="'p-0 px-1 rounded alert ' + durationClass"
                v-html="formattedProp('EXCLUSIVE_DURATION')"
              ></span>
              <template v-if="executionTimePercent !== Infinity">
                |
                <strong>{{ executionTimePercent }}</strong
                ><span class="text-muted">%</span>
              </template>
            </div>
            <div>
              <font-awesome-icon
                fixed-width
                icon="align-justify"
                class="text-muted"
              ></font-awesome-icon>
              <b>Rows:</b>
              <span class="px-1">{{
                tilde + formattedProp("ACTUAL_ROWS_REVISED")
              }}</span>
              <span class="text-muted" v-if="node[NodeProp.PLAN_ROWS]"
                >(Planned:
                {{ tilde + formattedProp("PLAN_ROWS_REVISED") }})</span
              >
              <span
                v-if="
                  plannerRowEstimateDirection !== EstimateDirection.none &&
                  shouldShowPlannerEstimate
                "
              >
                |
                <span
                  v-if="plannerRowEstimateDirection === EstimateDirection.over"
                  ><font-awesome-icon icon="arrow-up"></font-awesome-icon>
                  over</span
                >
                <span
                  v-if="plannerRowEstimateDirection === EstimateDirection.under"
                  ><font-awesome-icon icon="arrow-down"></font-awesome-icon>
                  under</span
                >
                estimated
                <span v-if="plannerRowEstimateValue != Infinity">
                  by
                  <span
                    :class="'p-0 px-1 alert ' + estimationClass"
                    v-html="formattedProp('PLANNER_ESTIMATE_FACTOR')"
                  ></span>
                </span>
              </span>
            </div>
            <div v-if="rowsRemoved">
              <font-awesome-icon
                fixed-width
                icon="filter"
                class="text-muted"
              ></font-awesome-icon>
              <b> {{ NodeProp[rowsRemovedProp] }}: </b>
              <span>
                <span class="px-1">{{
                  tilde + formattedProp(rowsRemovedProp)
                }}</span
                >|
                <span :class="'p-0 px-1 alert ' + rowsRemovedClass"
                  >{{ rowsRemovedPercentString }}%</span
                >
              </span>
            </div>
            <div v-if="node[NodeProp.HEAP_FETCHES]">
              <font-awesome-icon
                fixed-width
                icon="exchange-alt"
                class="text-muted"
              ></font-awesome-icon>
              <b>Heap Fetches:</b>&nbsp;
              <span
                :class="'p-0 px-1 rounded alert ' + heapFetchesClass"
                v-html="formattedProp('HEAP_FETCHES')"
              ></span>
              &nbsp;
              <font-awesome-icon
                icon="info-circle"
                fixed-width
                class="text-muted"
                v-if="heapFetchesClass"
                v-tippy="{
                  arrow: true,
                  content:
                    'Visibility map may be out-of-date. Consider using VACUUM or change autovacuum settings.',
                }"
              ></font-awesome-icon>
            </div>
            <div v-if="node[NodeProp.EXCLUSIVE_COST]">
              <font-awesome-icon
                fixed-width
                icon="dollar-sign"
                class="text-muted"
              ></font-awesome-icon>
              <b>Cost:</b>
              <span :class="'p-0 px-1 mr-1 alert ' + costClass">{{
                formattedProp("EXCLUSIVE_COST")
              }}</span>
              <span class="text-muted"
                >(Total: {{ formattedProp("TOTAL_COST") }})</span
              >
            </div>
            <div v-if="node[NodeProp.ACTUAL_LOOPS] > 1">
              <font-awesome-icon
                fixed-width
                icon="undo"
                class="text-muted"
              ></font-awesome-icon>
              <b>Loops:</b>
              <span class="px-1">{{ formattedProp("ACTUAL_LOOPS") }} </span>
            </div>
            <!-- general tab -->
          </div>
          <div
            class="tab-pane"
            :class="{ 'show active': activeTab === 'iobuffer' }"
          >
            <!-- iobuffer tab -->
            <div
              v-if="
                node[NodeProp.EXCLUSIVE_IO_READ_TIME] ||
                node[NodeProp.EXCLUSIVE_IO_WRITE_TIME]
              "
              class="mb-2"
            >
              <b> I/O Timings: </b>
              <span v-if="node[NodeProp.EXCLUSIVE_IO_READ_TIME]" class="ml-2">
                <b>Read:&nbsp;</b>
                {{ formattedProp("EXCLUSIVE_IO_READ_TIME") }}
              </span>
              <span v-if="node[NodeProp.EXCLUSIVE_IO_WRITE_TIME]" class="ml-2">
                <b>Write:&nbsp;</b>
                {{ formattedProp("EXCLUSIVE_IO_WRITE_TIME") }}
              </span>
            </div>
            <b> Blocks: </b>
            <table class="table table-sm">
              <tr>
                <td></td>
                <th class="text-right" width="25%">Hit</th>
                <th class="text-right" width="25%">Read</th>
                <th class="text-right" width="25%">Dirtied</th>
                <th class="text-right" width="25%">Written</th>
              </tr>
              <tr>
                <th>Shared</th>
                <td
                  class="text-right"
                  v-html="formattedProp('EXCLUSIVE_SHARED_HIT_BLOCKS') || '-'"
                ></td>
                <td
                  class="text-right"
                  v-html="formattedProp('EXCLUSIVE_SHARED_READ_BLOCKS') || '-'"
                ></td>
                <td
                  class="text-right"
                  v-html="
                    formattedProp('EXCLUSIVE_SHARED_DIRTIED_BLOCKS') || '-'
                  "
                ></td>
                <td
                  class="text-right"
                  v-html="
                    formattedProp('EXCLUSIVE_SHARED_WRITTEN_BLOCKS') || '-'
                  "
                ></td>
              </tr>
              <tr>
                <th>Temp</th>
                <td class="text-right bg-hatched"></td>
                <td
                  class="text-right"
                  v-html="formattedProp('EXCLUSIVE_TEMP_READ_BLOCKS') || '-'"
                ></td>
                <td class="text-right bg-hatched"></td>
                <td
                  class="text-right"
                  v-html="
                    formattedProp('EXCLUSIVE_TEMP_WRITTEN_BLOCKS') || '-'
                  "
                ></td>
              </tr>
              <tr>
                <th>Local</th>
                <td
                  class="text-right"
                  v-html="formattedProp('EXCLUSIVE_LOCAL_HIT_BLOCKS') || '-'"
                ></td>
                <td
                  class="text-right"
                  v-html="formattedProp('EXCLUSIVE_LOCAL_READ_BLOCKS') || '-'"
                ></td>
                <td
                  class="text-right"
                  v-html="
                    formattedProp('EXCLUSIVE_LOCAL_DIRTIED_BLOCKS') || '-'
                  "
                ></td>
                <td
                  class="text-right"
                  v-html="
                    formattedProp('EXCLUSIVE_LOCAL_WRITTEN_BLOCKS') || '-'
                  "
                ></td>
              </tr>
            </table>
            <div
              v-if="node[NodeProp.WAL_RECORDS] || node[NodeProp.WAL_BYTES]"
              class="mb-2"
            >
              <b>
                <span class="more-info" v-tippy="'Write-Ahead Logging'"
                  >WAL</span
                >:
              </b>
              {{ formattedProp("WAL_RECORDS") }} records
              <small>({{ formattedProp("WAL_BYTES") }})</small>
              <span v-if="node[NodeProp.WAL_FPI]">
                -
                <span class="more-info" v-tippy="'WAL Full Page Images'"
                  >FPI</span
                >: {{ formattedProp("WAL_FPI") }}
              </span>
            </div>
            <!-- iobuffer tab -->
          </div>
          <div
            class="tab-pane overflow-auto text-monospace"
            :class="{ 'show active': activeTab === 'output' }"
            v-html="formattedProp('OUTPUT')"
            style="max-height: 200px"
          ></div>
          <div
            class="tab-pane"
            :class="{ 'show active': activeTab === 'workers' }"
            v-if="
              node[NodeProp.WORKERS_PLANNED] ||
              node[NodeProp.WORKERS_PLANNED_BY_GATHER]
            "
          >
            <!-- workers tab -->
            <div
              v-if="
                (node[NodeProp.WORKERS_PLANNED] ||
                  node[NodeProp.WORKERS_PLANNED_BY_GATHER]) &&
                viewOptions.viewMode === ViewMode.FULL
              "
            >
              <b>Workers planned: </b>
              <span class="px-1">{{
                node[NodeProp.WORKERS_PLANNED] ||
                node[NodeProp.WORKERS_PLANNED_BY_GATHER]
              }}</span>
              <em
                v-if="
                  !node[NodeProp.WORKERS_PLANNED] &&
                  !node[NodeProp.WORKERS] &&
                  (!plan.isVerbose || !plan.isAnalyze)
                "
                class="text-warning"
              >
                <font-awesome-icon
                  icon="exclamation-triangle"
                  class="cursor-help"
                  v-tippy="getHelpMessage('fuzzy needs verbose')"
                ></font-awesome-icon>
              </em>
            </div>
            <div
              v-if="
                node[NodeProp.WORKERS_LAUNCHED] &&
                viewOptions.viewMode === ViewMode.FULL
              "
            >
              <b>Workers launched: </b>
              <span class="px-1">{{ node[NodeProp.WORKERS_LAUNCHED] }}</span>
            </div>
            <div
              v-if="
                !workersLaunchedCount &&
                node[NodeProp.WORKERS_PLANNED_BY_GATHER]
              "
              class="text-muted"
            >
              <em>
                Detailed information is not available.
                <font-awesome-icon
                  icon="exclamation-triangle"
                  class="cursor-help"
                  v-tippy="getHelpMessage('workers detailed info missing')"
                ></font-awesome-icon>
              </em>
            </div>

            <div class="accordion" v-if="_.isArray(node[NodeProp.WORKERS])">
              <template
                v-for="(worker, index) in node[NodeProp.WORKERS]"
                :key="index"
              >
                <div class="card">
                  <div class="card-header p-0">
                    <button
                      class="btn btn-link btn-sm text-secondary"
                      type="button"
                      data-toggle="collapse"
                      :data-target="'#collapse-' + node.nodeId + '-' + index"
                      style="font-size: inherit"
                    >
                      <font-awesome-icon
                        fixed-width
                        icon="chevron-right"
                      ></font-awesome-icon>
                      <font-awesome-icon
                        fixed-width
                        icon="chevron-down"
                      ></font-awesome-icon>
                      Worker {{ worker[WorkerProp.WORKER_NUMBER] }}
                    </button>
                  </div>

                  <div
                    :id="'collapse-' + node.nodeId + '-' + index"
                    class="collapse"
                  >
                    <div class="card-body p-0">
                      <table class="table table-sm prop-list mb-0">
                        <template v-for="(value, key) in worker" :key="key">
                          <tr v-if="shouldShowProp(key as string, value)">
                            <td width="40%">{{ key }}</td>
                            <td
                              v-html="formatNodeProp(key as string, value)"
                            ></td>
                          </tr>
                        </template>
                      </table>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <!-- workers tab -->
          </div>
          <div
            class="tab-pane"
            :class="{ 'show active': activeTab === 'misc' }"
          >
            <!-- misc tab -->
            <table class="table table-sm prop-list">
              <template v-for="(prop, key) in nodeProps" :key="key">
                <tr v-if="shouldShowProp(prop.key, prop.value)">
                  <td width="40%">{{ prop.key }}</td>
                  <td v-html="formatNodeProp(prop.key, prop.value)"></td>
                </tr>
              </template>
            </table>

            <div class="text-muted text-right">
              <em>* Calculated value</em>
            </div>
            <!-- misc tab -->
          </div>
        </div>
      </div>
    </div>
    <ul v-if="plans" :class="['node-children', { collapsed: collapsed }]">
      <li v-for="subnode in plans" :key="subnode.nodeId">
        <plan-node :node="subnode" :plan="plan" :viewOptions="viewOptions">
          <!--
          <template v-slot:nodeindex="{ node }">
            <slot name="nodeindex" v-bind:node="node"></slot>
          </template>
          -->
        </plan-node>
      </li>
    </ul>
  </div>
</template>
