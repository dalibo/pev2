// Composable for PlanNode and PlanNodeDetail components
import _ from "lodash"
import { computed, onBeforeMount, ref, watch } from "vue"
import type { Ref } from "vue"
import type { IPlan, Node, Worker, ViewOptions } from "@/interfaces"
import { NodeProp, EstimateDirection, HighlightType } from "@/enums"
import { cost, duration, rows } from "@/filters"
import { numberToColorHsl } from "@/services/color-service"

export default function useNode(
  plan: Ref<IPlan>,
  node: Node,
  viewOptions: ViewOptions
) {
  const executionTimePercent = ref<number>(NaN)
  // UI flags
  // calculated properties
  const costPercent = ref<number>(NaN)
  const barWidth = ref<number>(0)
  const highlightValue = ref<string | null>(null)
  const plannerRowEstimateValue = ref<number>()
  const plannerRowEstimateDirection = ref<EstimateDirection>()
  const rowsRemoved = ref<number>(NaN)
  const rowsRemovedPercent = ref<number>(NaN)
  const rowsRemovedPercentString = ref<string>()

  onBeforeMount(() => {
    calculateBar()
    calculateDuration()
    calculateCost()
    calculateRowsRemoved()
    plannerRowEstimateDirection.value =
      node[NodeProp.PLANNER_ESTIMATE_DIRECTION]
    plannerRowEstimateValue.value = node[NodeProp.PLANNER_ESTIMATE_FACTOR]
  })

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
          (value / (plan.value.planStats.maxDuration as number)) * 100
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
          Math.round(
            (value / (plan.value.planStats.maxRows as number)) * 100
          ) || 0
        highlightValue.value = rows(value)
        break
      case HighlightType.COST:
        value = node[NodeProp.EXCLUSIVE_COST]
        if (value === undefined) {
          highlightValue.value = null
          break
        }
        barWidth.value = Math.round(
          (value / (plan.value.planStats.maxCost as number)) * 100
        )
        highlightValue.value = cost(value)
        break
    }
  }

  const barColor = computed((): string => {
    return numberToColorHsl(barWidth.value)
  })

  const nodeName = computed((): string => {
    let nodeName = isParallelAware.value ? "Parallel " : ""
    nodeName += node[NodeProp.NODE_TYPE]
    return nodeName
  })

  function calculateDuration() {
    // use the first node total time if plan execution time is not available
    const executionTime =
      (plan.value.planStats.executionTime as number) ||
      (plan.value.content?.Plan?.[NodeProp.ACTUAL_TOTAL_TIME] as number)
    const duration = node[NodeProp.EXCLUSIVE_DURATION] as number
    executionTimePercent.value = _.round((duration / executionTime) * 100)
  }

  function calculateCost() {
    const maxTotalCost = plan.value.content.maxTotalCost as number
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

  const isNeverExecuted = computed((): boolean => {
    return !!plan.value.planStats.executionTime && !node[NodeProp.ACTUAL_LOOPS]
  })

  const isParallelAware = computed((): boolean => {
    return node[NodeProp.PARALLEL_AWARE]
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

  return {
    barColor,
    barWidth,
    costClass,
    durationClass,
    estimationClass,
    executionTimePercent,
    filterTooltip,
    heapFetchesClass,
    highlightValue,
    isNeverExecuted,
    isParallelAware,
    nodeName,
    plannerRowEstimateDirection,
    plannerRowEstimateValue,
    rowsRemoved,
    rowsRemovedProp,
    rowsRemovedClass,
    rowsRemovedPercent,
    rowsRemovedPercentString,
    workersLaunchedCount,
    workersPlannedCount,
    workersPlannedCountReversed,
  }
}
