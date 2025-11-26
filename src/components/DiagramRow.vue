<script lang="ts" setup>
import { inject, reactive, ref, watch } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons"
import type { Ref } from "vue"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { EstimateDirection, BufferLocation, NodeProp, Metric } from "../enums"
import LevelDivider from "@/components/LevelDivider.vue"
import TimeTooltip from "@/components/tooltip/TimeTooltip.vue"
import IoTooltip from "@/components/tooltip/IoTooltip.vue"
import useNode from "@/node"

import { Tippy } from "vue-tippy"

interface Props {
  node: Node
  level: number
  isSubplan: boolean
  isLastChild: boolean
  branches: number[]
  index: number
  viewOptions: {
    metric: Metric
    buffersMetric: BufferLocation
  }
}
const props = defineProps<Props>()
const node = reactive<Node>(props.node)
const diagramViewOptions = reactive(props.viewOptions)
const rootEl = ref(null)

const plan = inject(PlanKey) as Ref<IPlan>
const selectedNodeId = inject(SelectedNodeIdKey)
const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}
const highlightedNodeId = inject(HighlightedNodeIdKey)

const _viewOptions = inject(ViewOptionsKey) as ViewOptions
const {
  buffersByLocationTooltip,
  costTooltip,
  estimateFactorPercent,
  estimateFactorTooltip,
  isNeverExecuted,
  nodeName,
  rowsTooltip,
} = useNode(plan, node, _viewOptions)

const scrollTo = inject<(el: Element) => null>("scrollTo")

watch(
  () => selectedNodeId?.value,
  (newVal) => {
    if (newVal == node.nodeId && rootEl.value) {
      scrollTo?.(rootEl.value)
    }
  },
)
</script>

<template>
  <Tippy
    class="no-focus-outline node"
    :class="{
      selected: node.nodeId === selectedNodeId,
      highlight: node.nodeId === highlightedNodeId,
      'never-executed': isNeverExecuted,
    }"
    tag="tr"
    @mouseenter="highlightedNodeId = node.nodeId"
    @mouseleave="highlightedNodeId = undefined"
    @click.prevent="selectNode(node.nodeId, true)"
  >
    <template #content>
      <template v-if="node[NodeProp.CTE_NAME]">
        <div>
          <em>CTE {{ node[NodeProp.CTE_NAME] }} </em>
        </div>
      </template>
      <TimeTooltip
        :node="node"
        v-if="diagramViewOptions.metric == Metric.time"
      />
      <IoTooltip
        :node="node"
        v-else-if="diagramViewOptions.metric == Metric.io"
        exclusive
        class="mb-0"
      />
      <template v-else-if="diagramViewOptions.metric == Metric.rows">
        <div v-html="rowsTooltip"></div>
      </template>
      <template v-else-if="diagramViewOptions.metric == Metric.estimate_factor">
        <div v-html="estimateFactorTooltip"></div>
      </template>
      <template v-else-if="diagramViewOptions.metric == Metric.cost">
        <div v-html="costTooltip"></div>
      </template>
      <template v-else-if="diagramViewOptions.metric == Metric.buffers">
        <div
          v-html="buffersByLocationTooltip(diagramViewOptions.buffersMetric)"
        ></div
      ></template>
    </template>
    <td class="node-index" ref="rootEl">
      <span class="fw-normal small">#{{ node.nodeId }} </span>
    </td>
    <td class="node-type pe-2">
      <LevelDivider
        :isSubplan="isSubplan"
        isNode
        :isLastChild="!!isLastChild"
        :level="level"
        :branches="branches"
        :index="index"
        dense
      ></LevelDivider>
      {{ nodeName }}
    </td>
    <td>
      <!-- time -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-if="diagramViewOptions.metric == Metric.time"
      >
        <div
          class="progress-bar border-secondary bg-secondary"
          :class="{
            'border-start': node[NodeProp.EXCLUSIVE_DURATION] > 0,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (node[NodeProp.EXCLUSIVE_DURATION] /
                (plan.planStats.executionTime ||
                  plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME] ||
                  0)) *
                100 +
              '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="progress-bar bg-secondary-light"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (((node[NodeProp.ACTUAL_TOTAL_TIME] || 0) -
                node[NodeProp.EXCLUSIVE_DURATION]) /
                (plan.planStats.executionTime ||
                  plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME] ||
                  0)) *
                100 +
              '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- rows -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="diagramViewOptions.metric == Metric.rows"
      >
        <div
          class="bg-secondary"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              Math.round(
                (node[NodeProp.ACTUAL_ROWS_REVISED] / plan.planStats.maxRows) *
                  100,
              ) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- estimation -->
      <div
        class="progress rounded-0 align-items-center bg-transparent justify-content-center"
        style="height: 10px"
        v-else-if="diagramViewOptions.metric == Metric.estimate_factor"
      >
        <span class="text-secondary small">
          <FontAwesomeIcon
            fixed-width
            :icon="faArrowDown"
            v-if="
              node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
              EstimateDirection.under
            "
          ></FontAwesomeIcon>
          <i class="fa fa-fw d-inline-block" v-else />
        </span>
        <div
          class="progress-bar"
          :class="[
            node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
            EstimateDirection.under
              ? 'bg-secondary'
              : 'bg-transparent',
          ]"
          role="progressbar"
          style="height: 5px"
          :style="{ width: estimateFactorPercent + '%' }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="progress-bar border-start bg-secondary"
          role="progressbar"
          style="width: 1px; height: 5px"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="progress-bar"
          :class="[
            node[NodeProp.PLANNER_ESTIMATE_DIRECTION] === EstimateDirection.over
              ? 'bg-secondary'
              : 'bg-transparent',
          ]"
          role="progressbar"
          style="height: 5px"
          :style="{ width: estimateFactorPercent + '%' }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <span class="text-secondary small">
          <FontAwesomeIcon
            fixed-width
            :icon="faArrowUp"
            v-if="
              node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
              EstimateDirection.over
            "
          ></FontAwesomeIcon>
          <i class="fa fa-fw d-inline-block" v-else />
        </span>
      </div>
      <!-- cost -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="diagramViewOptions.metric == Metric.cost"
      >
        <div
          class="bg-secondary"
          :class="{
            'border-secondary border-start': node[NodeProp.EXCLUSIVE_COST] > 0,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              Math.round(
                (node[NodeProp.EXCLUSIVE_COST] / plan.planStats.maxCost) * 100,
              ) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- buffers shared -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="
          diagramViewOptions.metric == Metric.buffers &&
          diagramViewOptions.buffersMetric == BufferLocation.shared &&
          plan.planStats.maxBlocks?.[BufferLocation.shared]
        "
      >
        <div
          class="bg-hit"
          :class="{
            'border-start border-hit':
              node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] > 0,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="bg-read"
          role="progressbar"
          :class="{
            'border-start border-read':
              node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] > 0,
          }"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="bg-dirtied"
          :class="{
            'border-start border-dirtied':
              node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] > 0,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="bg-written"
          :class="{
            'border-start border-written':
              node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] > 0,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- buffers temp -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="
          diagramViewOptions.metric == Metric.buffers &&
          diagramViewOptions.buffersMetric == BufferLocation.temp &&
          plan.planStats.maxBlocks?.[BufferLocation.temp]
        "
      >
        <div
          class="bg-read"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.temp]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="bg-written"
          role="progressbar"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.temp]) *
                  100,
              ) || 0) + '%',
          }"
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
          diagramViewOptions.metric == Metric.buffers &&
          diagramViewOptions.buffersMetric == BufferLocation.local &&
          plan.planStats.maxBlocks?.[BufferLocation.local]
        "
      >
        <div
          class="bg-hit"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.local]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="bg-read"
          role="progressbar"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.local]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
          style="height: 5px"
        ></div>
        <div
          class="bg-dirtied"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS] /
                  plan.planStats.maxBlocks?.[BufferLocation.local]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="bg-written"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS] /
                  plan.planStats?.maxBlocks?.[BufferLocation.local]) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- io -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="
          diagramViewOptions.metric == Metric.io &&
          (plan.content.Plan[NodeProp.SUM_IO_READ_TIME] ||
            plan.content.Plan[NodeProp.SUM_IO_WRITE_TIME])
        "
      >
        <div
          class="bg-read"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_SUM_IO_READ_TIME] /
                  plan.planStats?.maxIo) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="bg-written"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (Math.round(
                (node[NodeProp.EXCLUSIVE_SUM_IO_WRITE_TIME] /
                  plan.planStats?.maxIo) *
                  100,
              ) || 0) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </td>
  </Tippy>
</template>
