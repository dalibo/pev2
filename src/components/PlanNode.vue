<script lang="ts" setup>
import { inject, nextTick, onMounted, provide, reactive, ref, watch } from "vue"
import type { Ref } from "vue"
import PlanNodeDetail from "@/components/PlanNodeDetail.vue"
import { directive as vTippy } from "vue-tippy"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import { keysToString, sortKeys } from "@/filters"
import { HighlightType, NodeProp } from "@/enums"
import { findNodeBySubplanName } from "@/services/help-service"
import useNode from "@/node"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

const outerEl = ref<Element | null>(null) // The outer Element, useful for CTE and subplans

const selectedNodeId = inject(SelectedNodeIdKey)
if (!selectedNodeId) {
  throw new Error(`Could not resolve ${SelectedNodeIdKey.description}`)
}
const highlightedNodeId = inject(HighlightedNodeIdKey)
const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}
const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const showDetails = ref<boolean>(false)

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const updateNodeSize =
  inject<(node: Node, size: [number, number]) => null>("updateNodeSize")

const {
  nodeName,
  barWidth,
  barColor,
  highlightValue,
  rowsRemoved,
  costClass,
  durationClass,
  estimationClass,
  rowsRemovedClass,
  heapFetchesClass,
  filterTooltip,
  isNeverExecuted,
  workersLaunchedCount,
  workersPlannedCount,
  workersPlannedCountReversed,
} = useNode(plan, node, viewOptions)

onMounted(async () => {
  updateSize(node)
})

function updateSize(node: Node) {
  const rect = outerEl.value?.getBoundingClientRect()
  if (rect) {
    updateNodeSize?.(node, [rect.width, rect.height])
  }
}
provide("updateSize", updateSize)

watch(showDetails, () => {
  window.setTimeout(() => updateSize(node), 1)
})

watch(viewOptions, () => {
  // Using nextTick has the same effect as a debounce making all nodes
  // size to be updated all at once
  nextTick(() => {
    updateSize(node)
  })
})

watch(selectedNodeId, () => {
  if (selectedNodeId.value == node.nodeId) {
    showDetails.value = true
  }
})

function centerCte() {
  const cteNode = findNodeBySubplanName(
    plan.value,
    node[NodeProp.CTE_NAME] as string
  )
  cteNode && selectNode?.(cteNode.nodeId, true)
}
</script>

<template>
  <div
    ref="outerEl"
    @click.prevent.stop="showDetails = !showDetails"
    @mousedown.stop
  >
    <div
      :class="[
        'text-left plan-node',
        {
          detailed: showDetails,
          'never-executed': isNeverExecuted,
          parallel: workersPlannedCount,
          selected: selectedNodeId == node.nodeId,
          highlight: highlightedNodeId == node.nodeId,
        },
      ]"
    >
      <div v-if="node[NodeProp.SUBPLAN_NAME]" class="fixed-bottom text-center">
        <b class="subplan-name font-italic px-1">
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
        @mouseenter="highlightedNodeId = node.nodeId"
        @mouseleave="highlightedNodeId = undefined"
      >
        <div class="card-body header no-focus-outline">
          <header class="mb-0">
            <h4 class="text-body">
              <a
                class="font-weight-normal small"
                href=""
                @click.prevent.stop="selectNode(node.nodeId, true)"
              >
                #{{ node.nodeId }}
              </a>
              {{ nodeName }}
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
          <div class="text-left text-monospace">
            <div
              v-if="node[NodeProp.RELATION_NAME]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-muted">on</span>
              <span v-if="node[NodeProp.SCHEMA]"
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
              <span class="text-muted">by</span>
              <span
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
              <span class="text-muted">using</span>
              <span
                v-html="keysToString(node[NodeProp.INDEX_NAME] as string)"
              ></span>
            </div>
            <div
              v-if="node[NodeProp.HASH_CONDITION]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-muted">on</span>
              <span
                v-html="keysToString(node[NodeProp.HASH_CONDITION] as string)"
              ></span>
            </div>
            <div v-if="node[NodeProp.CTE_NAME]">
              <a class="text-reset" href="" @click.prevent.stop="centerCte">
                <font-awesome-icon
                  icon="search"
                  class="text-muted"
                ></font-awesome-icon>
                <span class="text-muted">CTE</span>
                {{ node[NodeProp.CTE_NAME] }}
              </a>
            </div>
          </div>

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
                  'background-color': barColor,
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
        <plan-node-detail :node="node" v-if="showDetails"></plan-node-detail>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.plan-node {
  cursor: pointer;
}
</style>
