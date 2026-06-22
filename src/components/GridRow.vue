<script lang="ts" setup>
import { computed, inject, ref } from "vue"
import DisabledBadge from "@/components/DisabledBadge.vue"
import type { ViewOptions } from "@/interfaces"
import { EstimateDirection, Property } from "@/enums"
import { HighlightedNodeIdKey, ViewOptionsKey } from "@/symbols"
import {
  formatBlocks,
  formatBlocksAsBytes,
  formatCost,
  formatDuration,
  formatFactor,
  keysToString,
  sortKeys,
  formatTransferRate,
} from "@/filters"
import LevelDivider from "@/components/LevelDivider.vue"
import GridProgressBar from "@/components/GridProgressBar.vue"
import WorkersDetail from "@/components/WorkersDetail.vue"
import MiscDetail from "@/components/MiscDetail.vue"
import SeverityBullet from "@/components/SeverityBullet.vue"
import IoTooltip from "@/components/tooltip/IoTooltip.vue"
import TimeTooltip from "@/components/tooltip/TimeTooltip.vue"
import useNode from "@/node"
import { Tippy, directive as vTippy } from "vue-tippy"
import { getNodeTypeDescription } from "@/services/help-service"
import { store } from "@/store"
import type { FlattenedPlanNode } from "@/store"

interface Props {
  row: FlattenedPlanNode
  columns: string[]
}
const props = defineProps<Props>()
const node = props.row.node

const viewOptions = inject(ViewOptionsKey) as ViewOptions
const highlightedNodeId = inject(HighlightedNodeIdKey)

// UI flags
const activeTab = ref<string>("misc")

const {
  buffersByMetricTooltip,
  costClass,
  costTooltip,
  durationClass,
  estimationClass,
  estimateFactorPercent,
  estimateFactorTooltip,
  executionTimePercent,
  formattedProp,
  heapFetchesClass,
  heapFetchesTooltip,
  isNeverExecuted,
  localDirtiedPercent,
  localHitPercent,
  localReadPercent,
  localWrittenPercent,
  nodeName,
  rowsRemoved,
  rowsRemovedClass,
  rowsRemovedPercent,
  rowsRemovedPercentString,
  rowsRemovedProp,
  rowsRemovedTooltip,
  rowsTooltip,
  sharedDirtiedPercent,
  sharedHitPercent,
  sharedReadPercent,
  sharedWrittenPercent,
  tempReadPercent,
  tempWrittenPercent,
  tilde,
} = useNode(node, viewOptions)
const showDetails = ref<boolean>(false)

const isHighlighted = computed(
  () =>
    highlightedNodeId?.value &&
    (highlightedNodeId?.value == props.row.node.nodeId ||
      props.row.path[props.row.path.length - 2] == highlightedNodeId?.value),
)
</script>
<template>
  <tr
    @click="showDetails = !showDetails"
    class="node"
    :class="{
      'never-executed': isNeverExecuted,
    }"
  >
    <td class="node-index">
      <!-- node id -->
      <a :href="`#plan/node/${node.nodeId}`" @click.stop>
        <span class="font-weight-normal">#{{ node.nodeId }} </span>
      </a>
    </td>
    <Tippy
      class="text-end grid-progress-cell text-nowrap"
      tag="td"
      v-if="columns.includes('time')"
    >
      <template #content>
        <TimeTooltip :node="node" />
      </template>
      <GridProgressBar
        :percentage="
          (node[Property.EXCLUSIVE_DURATION] /
            (store.stats.executionTime ||
              store.plan?.content.Plan[Property.ACTUAL_TOTAL_TIME] ||
              0)) *
          100
        "
        :percentage2="
          (((node[Property.ACTUAL_TOTAL_TIME] || 0) -
            node[Property.EXCLUSIVE_DURATION]) /
            (store.stats.executionTime ||
              store.plan?.content.Plan[Property.ACTUAL_TOTAL_TIME] ||
              0)) *
          100
        "
      ></GridProgressBar>
      <!-- time -->
      <div class="position-relative d-flex">
        <SeverityBullet
          :severity="durationClass"
          v-if="durationClass"
        ></SeverityBullet>
        <span class="flex-grow-1">
          {{
            node[Property.EXCLUSIVE_DURATION]?.toLocaleString(undefined, {
              minimumFractionDigits: 3,
            }) || "-"
          }}
        </span>
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatDuration(node[Property.EXCLUSIVE_DURATION]) }}
        <br />
        <template v-if="executionTimePercent !== Infinity">
          {{ executionTimePercent }}%
        </template>
      </div>
    </Tippy>
    <Tippy
      class="text-end grid-progress-cell text-nowrap"
      tag="td"
      v-if="columns.includes('ioread')"
    >
      <template #content>
        <IoTooltip :node="node" class="mb-0" exclusive />
      </template>
      <template v-if="node[Property.EXCLUSIVE_SUM_IO_READ_TIME]">
        <GridProgressBar
          :percentage="
            (node[Property.EXCLUSIVE_SUM_IO_READ_TIME] /
              ((store.plan?.content.Plan[Property.SUM_IO_READ_TIME] ?? 0) +
                (store.plan?.content.Plan[Property.SUM_IO_WRITE_TIME] ?? 0))) *
            100
          "
        ></GridProgressBar>
        {{
          node[Property.EXCLUSIVE_SUM_IO_READ_TIME].toLocaleString(undefined, {
            minimumFractionDigits: 3,
          })
        }}
        <div v-if="showDetails" class="text-body-secondary mt-1">
          {{ formatDuration(node[Property.EXCLUSIVE_SUM_IO_READ_TIME]) }}
          <br />
          {{
            formatTransferRate(
              node[Property.EXCLUSIVE_AVERAGE_SUM_IO_READ_SPEED],
            )
          }}
        </div>
      </template>
    </Tippy>
    <Tippy
      class="text-end grid-progress-cell text-nowrap"
      tag="td"
      v-if="columns.includes('iowrite')"
    >
      <template #content>
        <IoTooltip :node="node" class="mb-0" exclusive />
      </template>
      <template v-if="node[Property.EXCLUSIVE_SUM_IO_WRITE_TIME]">
        <GridProgressBar
          :percentage="
            (node[Property.EXCLUSIVE_SUM_IO_WRITE_TIME] /
              ((store.plan?.content.Plan[Property.SUM_IO_READ_TIME] ?? 0) +
                (store.plan?.content.Plan[Property.SUM_IO_WRITE_TIME] ?? 0))) *
            100
          "
        ></GridProgressBar>
        {{
          node[Property.EXCLUSIVE_SUM_IO_WRITE_TIME].toLocaleString(undefined, {
            minimumFractionDigits: 3,
          })
        }}
        <div v-if="showDetails" class="text-body-secondary mt-1">
          {{ formatDuration(node[Property.EXCLUSIVE_SUM_IO_WRITE_TIME]) }}
          <br />
          {{
            formatTransferRate(
              node[Property.EXCLUSIVE_AVERAGE_SUM_IO_WRITE_SPEED],
            )
          }}
        </div>
      </template>
    </Tippy>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('rows')"
    >
      <GridProgressBar
        :percentage="
          (node[Property.ACTUAL_ROWS_REVISED] / store.stats.maxRows) * 100
        "
      ></GridProgressBar>
      <!-- rows -->
      <div
        class="position-relative"
        v-tippy="{ content: rowsTooltip, allowHTML: true }"
      >
        {{ tilde + node[Property.ACTUAL_ROWS_REVISED]?.toLocaleString() }}
      </div>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('estimation')"
    >
      <GridProgressBar :percentage="estimateFactorPercent"></GridProgressBar>
      <!-- estimation -->
      <div
        v-if="node[Property.PLANNER_ESTIMATE_FACTOR] != undefined"
        v-tippy="{ content: estimateFactorTooltip, allowHTML: true }"
      >
        <div
          class="position-relative d-flex"
          v-if="node[Property.PLANNER_ESTIMATE_FACTOR] != 1"
        >
          <SeverityBullet
            :severity="estimationClass"
            v-if="estimationClass"
          ></SeverityBullet>
          <span class="flex-grow-1">
            <span
              v-html="formatFactor(node[Property.PLANNER_ESTIMATE_FACTOR] || 0)"
            ></span>
            <span
              v-if="
                node[Property.PLANNER_ESTIMATE_DIRECTION] ===
                EstimateDirection.under
              "
            >
              ▾
            </span>
            <span
              v-if="
                node[Property.PLANNER_ESTIMATE_DIRECTION] ===
                EstimateDirection.over
              "
            >
              ▴
            </span>
          </span>
        </div>
        <div
          v-if="showDetails && node[Property.PLANNER_ESTIMATE_FACTOR] != 1"
          class="text-body-secondary mt-1"
        >
          Planned:<br />
          {{ node[Property.PLAN_ROWS_REVISED]?.toLocaleString() }}
        </div>
      </div>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('cost')"
    >
      <GridProgressBar
        :percentage="
          Math.round(
            (node[Property.EXCLUSIVE_COST] / store.stats.maxCost) * 100,
          )
        "
      ></GridProgressBar>
      <!-- cost -->
      <div
        class="position-relative d-flex"
        v-tippy="{ content: costTooltip, allowHTML: true }"
      >
        <SeverityBullet :severity="costClass" v-if="costClass"></SeverityBullet>
        <span class="flex-grow-1">
          {{ formatCost(node[Property.EXCLUSIVE_COST]) }}
        </span>
      </div>
    </td>
    <td class="text-end text-nowrap" v-if="columns.includes('loops')">
      <!-- loops -->
      <span v-if="node[Property.ACTUAL_LOOPS] != 1">
        {{ node[Property.ACTUAL_LOOPS].toLocaleString() }}
      </span>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('filter')"
    >
      <!-- filter -->
      <template v-if="rowsRemoved">
        <GridProgressBar :percentage="rowsRemovedPercent"></GridProgressBar>
        <div
          class="position-relative d-flex"
          v-tippy="{ content: rowsRemovedTooltip, allowHTML: true }"
        >
          <SeverityBullet
            :severity="rowsRemovedClass"
            v-if="rowsRemovedClass"
          ></SeverityBullet>
          <span class="flex-grow-1"> {{ rowsRemovedPercentString }}% </span>
        </div>
        <div v-if="showDetails" class="text-body-secondary mt-1">
          {{ tilde + formattedProp(rowsRemovedProp) }}
        </div>
      </template>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('heapfetches')"
    >
      <div
        class="position-relative d-flex"
        v-tippy="{ content: heapFetchesTooltip, allowHTML: true }"
      >
        <SeverityBullet
          :severity="heapFetchesClass"
          v-if="heapFetchesClass"
        ></SeverityBullet>
        <span class="flex-grow-1">
          {{ node[Property.HEAP_FETCHES]?.toLocaleString() }}
        </span>
      </div>
    </td>
    <td
      :class="showDetails ? '' : 'text-nowrap text-truncate overflow-hidden'"
      style="max-width: 0"
      @mouseenter="highlightedNodeId = node.nodeId"
      @mouseleave="highlightedNodeId = undefined"
    >
      <LevelDivider
        :row="row"
        :isSubplan="!!node[Property.SUBPLAN_NAME]"
      ></LevelDivider>
      <div class="d-inline">
        <b
          class="border px-1 bg-body-tertiary"
          :class="[
            isHighlighted
              ? 'text-body-emphasis'
              : highlightedNodeId
                ? 'text-body-tertiary'
                : 'text-body-secondary',
          ]"
          style="--bs-border-opacity: 0.5"
        >
          {{ nodeName }}
        </b>
        <DisabledBadge :node="node" />

        <span class="text-body-secondary">
          <template
            v-if="node[Property.RELATION_NAME] || node[Property.FUNCTION_NAME]"
          >
            <span class="text-body-tertiary">on</span>
            <span v-if="node[Property.SCHEMA]"
              >{{ node[Property.SCHEMA] }}.</span
            >{{ node[Property.RELATION_NAME]
            }}{{ node[Property.FUNCTION_NAME] }}
            <span v-if="node[Property.ALIAS]">
              <span class="text-body-tertiary">as</span>
              {{ node[Property.ALIAS] }}
            </span>
          </template>
          <template v-else-if="node[Property.ALIAS]">
            <span class="text-body-tertiary">on</span>
            <span v-html="keysToString(node[Property.ALIAS] as string)"></span>
          </template>
          <template v-if="node[Property.GROUP_KEY]">
            <span class="text-body-tertiary">by</span>
            <span
              v-html="keysToString(node[Property.GROUP_KEY] as string)"
            ></span>
          </template>
          <template v-if="node[Property.SORT_KEY]">
            <span class="text-body-tertiary">by</span>
            <span
              v-html="
                sortKeys(
                  node[Property.SORT_KEY] as string[],
                  node[Property.PRESORTED_KEY] as string[],
                )
              "
            ></span>
          </template>
          <template v-if="node[Property.INDEX_NAME]">
            <span class="text-body-tertiary">using</span>
            <span
              v-html="keysToString(node[Property.INDEX_NAME] as string)"
            ></span>
          </template>
          <template v-if="node[Property.HASH_CONDITION]">
            <span class="text-body-tertiary">on</span>
            <span
              v-html="keysToString(node[Property.HASH_CONDITION] as string)"
            ></span>
          </template>
          <template v-if="node[Property.CTE_NAME]">
            <span class="text-reset">
              <span class="text-body-tertiary">CTE</span>
              {{ node[Property.CTE_NAME] }}
            </span>
          </template>
        </span>
      </div>
      <br />
      <div
        class="plan-node position-relative detailed"
        v-if="showDetails"
        style="width: 100%"
        @click.stop
      >
        <div class="text-wrap">
          <div
            v-if="getNodeTypeDescription(node[Property.NODE_TYPE])"
            class="node-description mt-1"
          >
            <span class="node-type">{{ node[Property.NODE_TYPE] }} Node</span>
            <span
              v-html="getNodeTypeDescription(node[Property.NODE_TYPE])"
            ></span>
          </div>
          <ul class="nav nav-tabs mt-1">
            <li class="nav-item">
              <a
                class="nav-link px-2 py-1"
                :class="{ active: activeTab === 'misc' }"
                @click.prevent.stop="activeTab = 'misc'"
                href=""
                >Misc</a
              >
            </li>
            <li class="nav-item">
              <a
                class="nav-link px-2 py-1"
                :class="{
                  active: activeTab === 'output',
                  disabled: !node[Property.OUTPUT],
                }"
                @click.prevent.stop="activeTab = 'output'"
                href=""
                >Output</a
              >
            </li>
            <li class="nav-item">
              <a
                class="nav-link px-2 py-1"
                :class="{
                  active: activeTab === 'workers',
                  disabled: !(
                    node[Property.WORKERS_PLANNED] ||
                    node[Property.WORKERS_PLANNED_BY_GATHER]
                  ),
                }"
                @click.prevent.stop="activeTab = 'workers'"
                href=""
                >Workers</a
              >
            </li>
          </ul>
          <div class="tab-content bg-body">
            <div
              class="tab-pane p-1 border border-top-0"
              :class="{ 'show active': activeTab === 'misc' }"
            >
              <!-- misc tab -->
              <MiscDetail :node="node" />
            </div>
            <div
              class="tab-pane p-1 border border-top-0 overflow-auto font-monospace"
              :class="{ 'show active': activeTab === 'output' }"
              v-html="formattedProp('OUTPUT')"
              style="max-height: 200px"
              @mousewheel.stop
            ></div>
            <div
              class="tab-pane p-1 border border-top-0 rounded rounded-top-start-0"
              :class="{ 'show active': activeTab === 'workers' }"
            >
              <WorkersDetail :node="node" />
            </div>
          </div>
        </div>
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('shared.hit')"
    >
      <GridProgressBar :percentage="sharedHitPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(Property.EXCLUSIVE_SHARED_HIT_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_SHARED_HIT_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_SHARED_HIT_BLOCKS]) }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('shared.read')"
    >
      <GridProgressBar :percentage="sharedReadPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(
            Property.EXCLUSIVE_SHARED_READ_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_SHARED_READ_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_SHARED_READ_BLOCKS]) }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('shared.dirtied')"
    >
      <GridProgressBar :percentage="sharedDirtiedPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(
            Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{
          formatBlocksAsBytes(node[Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS])
        }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('shared.written')"
    >
      <GridProgressBar :percentage="sharedWrittenPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(
            Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{
          formatBlocksAsBytes(node[Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS])
        }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('temp.read')"
    >
      <GridProgressBar :percentage="tempReadPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(Property.EXCLUSIVE_TEMP_READ_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_TEMP_READ_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_TEMP_READ_BLOCKS]) }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('temp.written')"
    >
      <GridProgressBar :percentage="tempWrittenPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(
            Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]) }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('local.hit')"
    >
      <GridProgressBar :percentage="localHitPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(Property.EXCLUSIVE_LOCAL_HIT_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_LOCAL_HIT_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_LOCAL_HIT_BLOCKS]) }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('local.read')"
    >
      <GridProgressBar :percentage="localReadPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(Property.EXCLUSIVE_LOCAL_READ_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_LOCAL_READ_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_LOCAL_READ_BLOCKS]) }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('local.dirtied')"
    >
      <GridProgressBar :percentage="localDirtiedPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(
            Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]) }}
      </div>
    </td>
    <td
      class="text-end text-nowrap grid-progress-cell"
      v-if="columns.includes('local.written')"
    >
      <GridProgressBar :percentage="localWrittenPercent"></GridProgressBar>
      <div
        class="position-relative"
        v-tippy="{
          content: buffersByMetricTooltip(
            Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ formatBlocks(node[Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ formatBlocksAsBytes(node[Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]) }}
      </div>
    </td>
  </tr>
</template>
