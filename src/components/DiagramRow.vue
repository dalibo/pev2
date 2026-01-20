<script lang="ts" setup>
import { computed, inject, reactive, ref, watch } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons"
import {
  HighlightedNodeIdKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import type { ViewOptions } from "@/interfaces"
import { EstimateDirection, BufferLocation, NodeProp, Metric } from "../enums"
import LevelDivider from "@/components/LevelDivider.vue"
import TimeTooltip from "@/components/tooltip/TimeTooltip.vue"
import IoTooltip from "@/components/tooltip/IoTooltip.vue"
import useNode from "@/node"
import { store } from "@/store"
import type { FlattenedPlanNode } from "@/store"

import { Tippy } from "vue-tippy"

interface Props {
  row: FlattenedPlanNode
  viewOptions: {
    metric: Metric
    buffersMetric: BufferLocation
  }
}
const props = defineProps<Props>()
const node = props.row.node
const diagramViewOptions = reactive(props.viewOptions)
const rootEl = ref(null)

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
} = useNode(node, _viewOptions)

const scrollTo = inject<(el: Element) => null>("scrollTo")

watch(
  () => selectedNodeId?.value,
  (newVal) => {
    if (newVal == node.nodeId && rootEl.value) {
      scrollTo?.(rootEl.value)
    }
  },
)

const isHighlighted = computed(
  () =>
    highlightedNodeId?.value &&
    (highlightedNodeId?.value == props.row.node.nodeId ||
      props.row.path[props.row.path.length - 2] == highlightedNodeId?.value),
)
</script>

<template>
  <Tippy
    class="no-focus-outline node"
    :class="{
      selected: node.nodeId === selectedNodeId,
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
    <td class="text-body-secondary" ref="rootEl">
      <span class="fw-normal small">#{{ node.nodeId }} </span>
    </td>
    <td>
      <LevelDivider
        :row="row"
        :isSubplan="!!node[NodeProp.SUBPLAN_NAME]"
        dense
      ></LevelDivider>
      <span
        :class="[
          isHighlighted
            ? 'text-body-emphasis'
            : highlightedNodeId
              ? 'text-body-tertiary'
              : 'text-body-secondary',
        ]"
      >
        <b>{{ nodeName }}</b>
      </span>
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
                (store.stats.executionTime ||
                  store.plan?.content.Plan[NodeProp.ACTUAL_TOTAL_TIME] ||
                  0)) *
                100 +
              '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="progress-bar bg-secondary opacity-20"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (((node[NodeProp.ACTUAL_TOTAL_TIME] || 0) -
                node[NodeProp.EXCLUSIVE_DURATION]) /
                (store.stats.executionTime ||
                  store.plan?.content.Plan[NodeProp.ACTUAL_TOTAL_TIME] ||
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
                (node[NodeProp.ACTUAL_ROWS_REVISED] / store.stats.maxRows) *
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
        <span class="text-body-tertiary small">
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
        <span class="text-body-tertiary small">
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
                (node[NodeProp.EXCLUSIVE_COST] / store.stats.maxCost) * 100,
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
          store.stats.maxBlocks?.[BufferLocation.shared]
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
                  store.stats.maxBlocks?.[BufferLocation.shared]) *
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
                  store.stats.maxBlocks?.[BufferLocation.shared]) *
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
                  store.stats.maxBlocks?.[BufferLocation.shared]) *
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
                  store.stats.maxBlocks?.[BufferLocation.shared]) *
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
          store.stats.maxBlocks?.[BufferLocation.temp]
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
                  store.stats.maxBlocks?.[BufferLocation.temp]) *
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
                  store.stats.maxBlocks?.[BufferLocation.temp]) *
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
          store.stats.maxBlocks?.[BufferLocation.local]
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
                  store.stats.maxBlocks?.[BufferLocation.local]) *
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
                  store.stats.maxBlocks?.[BufferLocation.local]) *
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
                  store.stats.maxBlocks?.[BufferLocation.local]) *
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
                  store.stats.maxBlocks?.[BufferLocation.local]) *
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
          (store.plan?.content.Plan[NodeProp.SUM_IO_READ_TIME] ||
            store.plan?.content.Plan[NodeProp.SUM_IO_WRITE_TIME])
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
                  store.stats.maxIo) *
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
                  store.stats.maxIo) *
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
