<script lang="ts" setup>
import { inject, reactive } from "vue"
import type { Ref } from "vue"
import PlanNodeContext from "@/components/PlanNodeContext.vue"
import { directive as vTippy } from "vue-tippy"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import { HighlightType, NodeProp } from "@/enums"
import useNode from "@/node"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

const selectedNodeId = inject(SelectedNodeIdKey)
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

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>

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
</script>

<template>
  <div @click.prevent="selectNode(node.nodeId, false)">
    <div
      :class="[
        'text-left plan-node',
        {
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
              <span class="font-weight-normal small" @click.stop>
                #{{ node.nodeId }}
              </span>
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
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.plan-node {
  cursor: pointer;
}
</style>
