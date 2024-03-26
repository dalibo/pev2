<script lang="ts" setup>
import { computed, inject, onBeforeMount, reactive, ref, watch } from "vue"
import type { Ref } from "vue"
import { directive as vTippy } from "vue-tippy"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { HelpService } from "@/services/help-service"
import { formatNodeProp } from "@/filters"
import { EstimateDirection, NodeProp } from "@/enums"
import useNode from "@/node"
import WorkersDetail from "@/components/WorkersDetail.vue"
import MiscDetail from "@/components/MiscDetail.vue"
import { PlanKey, ViewOptionsKey } from "@/symbols"
import _ from "lodash"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const updateSize = inject<(node: Node) => null>("updateSize")

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const nodeProps = ref<
  {
    key: keyof typeof NodeProp
    value: unknown
  }[]
>()

// UI flags
const activeTab = ref<string>("general")

const helpService = new HelpService()
const getNodeTypeDescription = helpService.getNodeTypeDescription

const {
  costClass,
  durationClass,
  estimationClass,
  executionTimePercent,
  heapFetchesClass,
  plannerRowEstimateDirection,
  plannerRowEstimateValue,
  rowsRemoved,
  rowsRemovedClass,
  rowsRemovedPercentString,
  rowsRemovedProp,
  tilde,
} = useNode(plan, node, viewOptions)

onBeforeMount(() => {
  calculateProps()
})

const shouldShowPlannerEstimate = computed(() => {
  return (
    estimationClass.value &&
    plannerRowEstimateDirection.value !== EstimateDirection.none &&
    plannerRowEstimateValue.value
  )
})

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

// returns the formatted prop
function formattedProp(propName: keyof typeof NodeProp) {
  const property = NodeProp[propName]
  const value = node[property]
  return formatNodeProp(property, value)
}

watch(activeTab, () => {
  window.setTimeout(() => updateSize && updateSize(node), 1)
})
</script>

<template>
  <div class="card-header border-top">
    <div
      v-if="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"
      class="node-description"
    >
      <span class="node-type">{{ node[NodeProp.NODE_TYPE] }} Node</span>
      <span v-html="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"></span>
    </div>
    <ul class="nav nav-tabs card-header-tabs">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'general' }"
          @click.prevent.stop="activeTab = 'general'"
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
          @click.prevent.stop="activeTab = 'iobuffer'"
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
          @click.prevent.stop="activeTab = 'output'"
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
          @click.prevent.stop="activeTab = 'workers'"
          href=""
          >Workers</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'misc' }"
          @click.prevent.stop="activeTab = 'misc'"
          href=""
          >Misc</a
        >
      </li>
    </ul>
  </div>
  <div class="card-body tab-content">
    <div class="tab-pane" :class="{ 'show active': activeTab === 'general' }">
      <!-- general -->
      <div v-if="plan.isAnalyze">
        <font-awesome-icon
          fixed-width
          icon="clock"
          class="text-muted"
        ></font-awesome-icon>
        <b>Timing:</b>
        <span
          class="p-0 px-1 rounded alert"
          :class="durationClass"
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
          >(Planned: {{ tilde + formattedProp("PLAN_ROWS_REVISED") }})</span
        >
        <span
          v-if="
            plannerRowEstimateDirection !== EstimateDirection.none &&
            shouldShowPlannerEstimate
          "
        >
          |
          <span v-if="plannerRowEstimateDirection === EstimateDirection.over"
            ><font-awesome-icon icon="arrow-up"></font-awesome-icon> over</span
          >
          <span v-if="plannerRowEstimateDirection === EstimateDirection.under"
            ><font-awesome-icon icon="arrow-down"></font-awesome-icon>
            under</span
          >
          estimated
          <span v-if="plannerRowEstimateValue != Infinity">
            by
            <span
              class="p-0 px-1 alert"
              :class="estimationClass"
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
          <span class="px-1">{{ tilde + formattedProp(rowsRemovedProp) }}</span
          >|
          <span class="p-0 px-1 alert" :class="rowsRemovedClass"
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
        <b>Heap Fetches:</b>
        <span
          class="p-0 px-1 rounded alert"
          :class="heapFetchesClass"
          v-html="formattedProp('HEAP_FETCHES')"
        ></span>
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
        <span class="p-0 px-1 me-1 alert" :class="costClass">{{
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
    <div class="tab-pane" :class="{ 'show active': activeTab === 'iobuffer' }">
      <!-- iobuffer tab -->
      <dl
        v-if="
          node[NodeProp.EXCLUSIVE_IO_READ_TIME] ||
          node[NodeProp.EXCLUSIVE_IO_WRITE_TIME]
        "
        class="mb-2 list-inline"
      >
        <dt class="list-inline-item align-top">
          <b> I/O Timings: </b>
        </dt>
        <dd class="list-inline-item">
          <span v-if="node[NodeProp.EXCLUSIVE_IO_READ_TIME]" class="ms-2">
            <b>Read:&nbsp;</b>
            {{ formattedProp("EXCLUSIVE_IO_READ_TIME") }}
            <small>~{{ formattedProp("AVERAGE_IO_READ_TIME") }}</small>
          </span>
          <br />
          <span v-if="node[NodeProp.EXCLUSIVE_IO_WRITE_TIME]" class="ms-2">
            <b>Write:&nbsp;</b>
            {{ formattedProp("EXCLUSIVE_IO_WRITE_TIME") }}
            <small>~{{ formattedProp("AVERAGE_IO_WRITE_TIME") }}</small>
          </span>
        </dd>
      </dl>
      <b> Blocks: </b>
      <table class="table table-sm">
        <tr>
          <td></td>
          <th class="text-end" width="25%">Hit</th>
          <th class="text-end" width="25%">Read</th>
          <th class="text-end" width="25%">Dirtied</th>
          <th class="text-end" width="25%">Written</th>
        </tr>
        <tr>
          <th>Shared</th>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_SHARED_HIT_BLOCKS') || '-'"
          ></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_SHARED_READ_BLOCKS') || '-'"
          ></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_SHARED_DIRTIED_BLOCKS') || '-'"
          ></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_SHARED_WRITTEN_BLOCKS') || '-'"
          ></td>
        </tr>
        <tr>
          <th>Temp</th>
          <td class="text-end bg-hatched"></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_TEMP_READ_BLOCKS') || '-'"
          ></td>
          <td class="text-end bg-hatched"></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_TEMP_WRITTEN_BLOCKS') || '-'"
          ></td>
        </tr>
        <tr>
          <th>Local</th>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_LOCAL_HIT_BLOCKS') || '-'"
          ></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_LOCAL_READ_BLOCKS') || '-'"
          ></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_LOCAL_DIRTIED_BLOCKS') || '-'"
          ></td>
          <td
            class="text-end"
            v-html="formattedProp('EXCLUSIVE_LOCAL_WRITTEN_BLOCKS') || '-'"
          ></td>
        </tr>
      </table>
      <div
        v-if="node[NodeProp.WAL_RECORDS] || node[NodeProp.WAL_BYTES]"
        class="mb-2"
      >
        <b>
          <span class="more-info" v-tippy="'Write-Ahead Logging'">WAL</span>:
        </b>
        {{ formattedProp("WAL_RECORDS") }} records
        <small>({{ formattedProp("WAL_BYTES") }})</small>
        <span v-if="node[NodeProp.WAL_FPI]">
          -
          <span class="more-info" v-tippy="'WAL Full Page Images'">FPI</span>:
          {{ formattedProp("WAL_FPI") }}
        </span>
      </div>
      <!-- iobuffer tab -->
    </div>
    <div
      class="tab-pane overflow-auto font-monospace"
      :class="{ 'show active': activeTab === 'output' }"
      v-html="formattedProp('OUTPUT')"
      style="max-height: 200px"
      @mousewheel.stop
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
      <workers-detail :node="node" />
    </div>
    <div class="tab-pane" :class="{ 'show active': activeTab === 'misc' }">
      <!-- misc tab -->
      <misc-detail :node="node" />
    </div>
  </div>
</template>
