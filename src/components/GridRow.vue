<script lang="ts" setup>
import { inject, reactive, ref } from "vue"
import type { Ref } from "vue"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { EstimateDirection, NodeProp } from "@/enums"
import { PlanKey, ViewOptionsKey } from "@/symbols"
import {
  blocks,
  blocksAsBytes,
  cost,
  duration,
  factor,
  keysToString,
  sortKeys,
  transferRate,
} from "@/filters"
import LevelDivider from "@/components/LevelDivider.vue"
import GridProgressBar from "@/components/GridProgressBar.vue"
import WorkersDetail from "@/components/WorkersDetail.vue"
import MiscDetail from "@/components/MiscDetail.vue"
import SeverityBullet from "@/components/SeverityBullet.vue"
import IoTooltip from "@/components/tooltip/IoTooltip.vue"
import TimeTooltip from "@/components/tooltip/TimeTooltip.vue"
import useNode from "@/node"
import { directive as vTippy } from "vue-tippy"
import { HelpService } from "@/services/help-service"
const helpService = new HelpService()
const getNodeTypeDescription = helpService.getNodeTypeDescription

interface Props {
  node: Node
  level: number
  isSubplan: boolean
  isLastChild: boolean
  branches: number[]
  index: number
  columns: string[]
}
const props = defineProps<Props>()

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const viewOptions = inject(ViewOptionsKey) as ViewOptions

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
} = useNode(plan, node, viewOptions)
const showDetails = ref<boolean>(false)
</script>
<template>
  <tr @click="showDetails = !showDetails" class="node">
    <td class="node-index text-secondary">
      <!-- node id -->
      <a :href="`#plan/node/${node.nodeId}`" @click.stop>
        <span class="font-weight-normal">#{{ node.nodeId }} </span>
      </a>
    </td>
    <tippy
      class="text-end grid-progress-cell text-nowrap"
      tag="td"
      v-if="columns.includes('time')"
    >
      <template #content>
        <time-tooltip :node="node" />
      </template>
      <GridProgressBar
        :percentage="
          (node[NodeProp.EXCLUSIVE_DURATION] /
            (plan.planStats.executionTime ||
              plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME])) *
          100
        "
        :percentage2="
          ((node[NodeProp.ACTUAL_TOTAL_TIME] -
            node[NodeProp.EXCLUSIVE_DURATION]) /
            (plan.planStats.executionTime ||
              plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME])) *
          100
        "
      ></GridProgressBar>
      <!-- time -->
      <div class="position-relative d-flex">
        <severity-bullet
          :severity="durationClass"
          v-if="durationClass"
        ></severity-bullet>
        <span class="flex-grow-1">
          {{
            node[NodeProp.EXCLUSIVE_DURATION].toLocaleString(undefined, {
              minimumFractionDigits: 3,
            })
          }}
        </span>
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ duration(node[NodeProp.EXCLUSIVE_DURATION]) }}
        <br />
        <template v-if="executionTimePercent !== Infinity">
          {{ executionTimePercent }}%
        </template>
      </div>
    </tippy>
    <tippy
      class="text-end grid-progress-cell text-nowrap"
      tag="td"
      v-if="columns.includes('ioread')"
    >
      <template #content>
        <io-tooltip :node="node" class="mb-0" exclusive />
      </template>
      <template v-if="node[NodeProp.EXCLUSIVE_SUM_IO_READ_TIME]">
        <GridProgressBar
          :percentage="
            (node[NodeProp.EXCLUSIVE_SUM_IO_READ_TIME] /
              (plan.content.Plan[NodeProp.SUM_IO_READ_TIME] +
                plan.content.Plan[NodeProp.SUM_IO_WRITE_TIME])) *
            100
          "
        ></GridProgressBar>
        {{
          node[NodeProp.EXCLUSIVE_SUM_IO_READ_TIME].toLocaleString(undefined, {
            minimumFractionDigits: 3,
          })
        }}
        <div v-if="showDetails" class="text-body-secondary mt-1">
          {{ duration(node[NodeProp.EXCLUSIVE_SUM_IO_READ_TIME]) }}
          <br />
          {{ transferRate(node[NodeProp.EXCLUSIVE_AVERAGE_SUM_IO_READ_SPEED]) }}
        </div>
      </template>
    </tippy>
    <tippy
      class="text-end grid-progress-cell text-nowrap"
      tag="td"
      v-if="columns.includes('iowrite')"
    >
      <template #content>
        <io-tooltip :node="node" class="mb-0" exclusive />
      </template>
      <template v-if="node[NodeProp.EXCLUSIVE_SUM_IO_WRITE_TIME]">
        <GridProgressBar
          :percentage="
            (node[NodeProp.EXCLUSIVE_SUM_IO_WRITE_TIME] /
              (plan.content.Plan[NodeProp.SUM_IO_READ_TIME] +
                plan.content.Plan[NodeProp.SUM_IO_WRITE_TIME])) *
            100
          "
        ></GridProgressBar>
        {{
          node[NodeProp.EXCLUSIVE_SUM_IO_WRITE_TIME].toLocaleString(undefined, {
            minimumFractionDigits: 3,
          })
        }}
        <div v-if="showDetails" class="text-body-secondary mt-1">
          {{ duration(node[NodeProp.EXCLUSIVE_SUM_IO_WRITE_TIME]) }}
          <br />
          {{
            transferRate(node[NodeProp.EXCLUSIVE_AVERAGE_SUM_IO_WRITE_SPEED])
          }}
        </div>
      </template>
    </tippy>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('rows')"
    >
      <GridProgressBar
        :percentage="
          (node[NodeProp.ACTUAL_ROWS_REVISED] / plan.planStats.maxRows) * 100
        "
      ></GridProgressBar>
      <!-- rows -->
      <div
        class="position-relative"
        v-tippy="{ content: rowsTooltip, allowHTML: true }"
      >
        {{ tilde + node[NodeProp.ACTUAL_ROWS_REVISED]?.toLocaleString() }}
      </div>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('estimation')"
    >
      <GridProgressBar :percentage="estimateFactorPercent"></GridProgressBar>
      <!-- estimation -->
      <div
        v-if="node[NodeProp.PLANNER_ESTIMATE_FACTOR] != undefined"
        v-tippy="{ content: estimateFactorTooltip, allowHTML: true }"
      >
        <div
          class="position-relative d-flex"
          v-if="node[NodeProp.PLANNER_ESTIMATE_FACTOR] != 1"
        >
          <severity-bullet
            :severity="estimationClass"
            v-if="estimationClass"
          ></severity-bullet>
          <span class="flex-grow-1">
            <span
              v-html="factor(node[NodeProp.PLANNER_ESTIMATE_FACTOR] || 0)"
            ></span>
            <span
              v-if="
                node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
                EstimateDirection.under
              "
            >
              ▾
            </span>
            <span
              v-if="
                node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===
                EstimateDirection.over
              "
            >
              ▴
            </span>
          </span>
        </div>
        <div
          v-if="showDetails && node[NodeProp.PLANNER_ESTIMATE_FACTOR] != 1"
          class="text-body-secondary mt-1"
        >
          Planned:<br />
          {{ node[NodeProp.PLAN_ROWS_REVISED]?.toLocaleString() }}
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
            (node[NodeProp.EXCLUSIVE_COST] / plan.planStats.maxCost) * 100,
          )
        "
      ></GridProgressBar>
      <!-- cost -->
      <div
        class="position-relative d-flex"
        v-tippy="{ content: costTooltip, allowHTML: true }"
      >
        <severity-bullet
          :severity="costClass"
          v-if="costClass"
        ></severity-bullet>
        <span class="flex-grow-1">
          {{ cost(node[NodeProp.EXCLUSIVE_COST]) }}
        </span>
      </div>
    </td>
    <td class="text-end text-nowrap" v-if="columns.includes('loops')">
      <!-- loops -->
      <span v-if="node[NodeProp.ACTUAL_LOOPS] != 1">
        {{ node[NodeProp.ACTUAL_LOOPS].toLocaleString() }}
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
          <severity-bullet
            :severity="rowsRemovedClass"
            v-if="rowsRemovedClass"
          ></severity-bullet>
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
        <severity-bullet
          :severity="heapFetchesClass"
          v-if="heapFetchesClass"
        ></severity-bullet>
        <span class="flex-grow-1">
          {{ node[NodeProp.HEAP_FETCHES]?.toLocaleString() }}
        </span>
      </div>
    </td>
    <td
      class="node-type"
      :class="showDetails ? '' : 'text-nowrap text-truncate overflow-hidden'"
      style="max-width: 0"
    >
      <level-divider
        :isSubplan="isSubplan"
        isNode
        :isLastChild="isLastChild"
        :level="level"
        :branches="branches"
        :index="index"
      ></level-divider>
      <div class="d-inline">
        <b
          class="border border-secondary px-1 bg-light"
          style="--bs-border-opacity: 0.5"
        >
          {{ nodeName }}
        </b>

        <span class="text-body-secondary">
          <template
            v-if="node[NodeProp.RELATION_NAME] || node[NodeProp.FUNCTION_NAME]"
          >
            <span class="text-secondary">on</span>
            <span v-if="node[NodeProp.SCHEMA]"
              >{{ node[NodeProp.SCHEMA] }}.</span
            >{{ node[NodeProp.RELATION_NAME]
            }}{{ node[NodeProp.FUNCTION_NAME] }}
            <span v-if="node[NodeProp.ALIAS]">
              <span class="text-secondary">as</span>
              {{ node[NodeProp.ALIAS] }}
            </span>
          </template>
          <template v-else-if="node[NodeProp.ALIAS]">
            <span class="text-secondary">on</span>
            <span v-html="keysToString(node[NodeProp.ALIAS] as string)"></span>
          </template>
          <template v-if="node[NodeProp.GROUP_KEY]">
            <span class="text-secondary">by</span>
            <span
              v-html="keysToString(node[NodeProp.GROUP_KEY] as string)"
            ></span>
          </template>
          <template v-if="node[NodeProp.SORT_KEY]">
            <span class="text-secondary">by</span>
            <span
              v-html="
                sortKeys(
                  node[NodeProp.SORT_KEY] as string[],
                  node[NodeProp.PRESORTED_KEY] as string[],
                )
              "
            ></span>
          </template>
          <template v-if="node[NodeProp.JOIN_TYPE]">
            {{ node[NodeProp.JOIN_TYPE] }}
            <span class="text-secondary">join</span>
          </template>
          <template v-if="node[NodeProp.INDEX_NAME]">
            <span class="text-secondary">using</span>
            <span
              v-html="keysToString(node[NodeProp.INDEX_NAME] as string)"
            ></span>
          </template>
          <template v-if="node[NodeProp.HASH_CONDITION]">
            <span class="text-secondary">on</span>
            <span
              v-html="keysToString(node[NodeProp.HASH_CONDITION] as string)"
            ></span>
          </template>
          <template v-if="node[NodeProp.CTE_NAME]">
            <span class="text-reset">
              <span class="text-secondary">CTE</span>
              {{ node[NodeProp.CTE_NAME] }}
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
            v-if="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"
            class="node-description mt-1"
          >
            <span class="node-type">{{ node[NodeProp.NODE_TYPE] }} Node</span>
            <span
              v-html="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"
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
                  disabled: !node[NodeProp.OUTPUT],
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
                    node[NodeProp.WORKERS_PLANNED] ||
                    node[NodeProp.WORKERS_PLANNED_BY_GATHER]
                  ),
                }"
                @click.prevent.stop="activeTab = 'workers'"
                href=""
                >Workers</a
              >
            </li>
          </ul>
          <div class="tab-content bg-white">
            <div
              class="tab-pane p-1 border border-top-0"
              :class="{ 'show active': activeTab === 'misc' }"
            >
              <!-- misc tab -->
              <misc-detail :node="node" />
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
              <workers-detail :node="node" />
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
          content: buffersByMetricTooltip(NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]) }}
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
            NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]) }}
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
            NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]) }}
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
            NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]) }}
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
          content: buffersByMetricTooltip(NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]) }}
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
            NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]) }}
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
          content: buffersByMetricTooltip(NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]) }}
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
          content: buffersByMetricTooltip(NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]) }}
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
            NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]) }}
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
            NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS,
          ),
          allowHTML: true,
        }"
      >
        {{ blocks(node[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]) }}
      </div>
      <div v-if="showDetails" class="text-body-secondary mt-1">
        {{ blocksAsBytes(node[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]) }}
      </div>
    </td>
  </tr>
</template>
