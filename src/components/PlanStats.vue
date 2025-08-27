<script lang="ts" setup>
import _ from "lodash"
import { computed, ref } from "vue"
import type { IPlanStats, ITrigger, JIT, Node } from "@/interfaces"
import { HelpService } from "@/services/help-service"
import { duration, durationClass } from "@/filters"
import { directive as vTippy } from "vue-tippy"
import { NodeProp } from "../enums"
import { formatNodeProp } from "@/filters"
import JitDetails from "@/components/JitDetails.vue"
import IoTooltip from "@/components/tooltip/IoTooltip.vue"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faCaretDown, faInfoCircle } from "@fortawesome/free-solid-svg-icons"

const { planStats, jitDetails, rootNode } = defineProps<{
  planStats: IPlanStats
  rootNode: Node
  jitDetails?: JIT
}>()
const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage
const showSettings = ref<boolean>(false)
const showTriggers = ref<boolean>(false)
const showJitDetails = ref<boolean>(false)
const showIO = ref<boolean>(false)

const planningTimeClass = (percent: number) => {
  let c = NaN
  if (percent > 90) {
    c = 4
  } else if (percent > 40) {
    c = 3
  } else if (percent > 10) {
    c = 2
  }
  if (c) {
    return "c-" + c
  }
  return false
}

const totalTriggerDurationPercent = computed(() => {
  const executionTime = planStats.executionTime || 0
  const totalDuration = triggersTotalDuration.value || 0
  return _.round((totalDuration / executionTime) * 100)
})

function triggerDurationPercent(trigger: ITrigger) {
  const executionTime = planStats.executionTime || 0
  const time = trigger.Time
  return _.round((time / executionTime) * 100)
}

const triggersTotalDuration = computed(() => {
  return _.sumBy(planStats.triggers, (o) => o.Time)
})

function averageIO(node: Node) {
  const readAverage = node[NodeProp.AVERAGE_SUM_IO_READ_SPEED]
  const writeAverage = node[NodeProp.AVERAGE_SUM_IO_WRITE_SPEED]
  const r = []
  if (readAverage) {
    r.push(
      `read=~${formatNodeProp(NodeProp.AVERAGE_SUM_IO_READ_SPEED, readAverage)}`,
    )
  }
  if (writeAverage) {
    r.push(
      `write=~${formatNodeProp(NodeProp.AVERAGE_SUM_IO_WRITE_SPEED, writeAverage)}`,
    )
  }
  return r.join(", ")
}

function hasParallelChildren(node: Node) {
  return node.Plans?.some(function iter(a) {
    if (a[NodeProp.WORKERS_PLANNED] || a[NodeProp.WORKERS_PLANNED_BY_GATHER]) {
      return true
    }
    return Array.isArray(a.Plans) && a.Plans.some(iter)
  })
}
</script>

<template>
  <div
    class="plan-stats flex-shrink-0 d-flex border-bottom border-top align-items-center"
    v-if="planStats"
  >
    <div class="d-inline-block px-2">
      Execution time:
      <template v-if="!planStats.executionTime">
        <span class="text-secondary">
          N/A
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing execution time')"
          ></FontAwesomeIcon>
        </span>
      </template>
      <template v-else>
        <span
          class="stat-value"
          v-html="duration(planStats.executionTime)"
        ></span>
      </template>
    </div>
    <div class="d-inline-block border-start px-2">
      Planning time:
      <template v-if="!planStats.planningTime">
        <span class="text-secondary">
          N/A
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing planning time')"
          ></FontAwesomeIcon>
        </span>
      </template>
      <template v-else>
        <span class="stat-value">
          <span
            :class="
              'mb-0 p-0 px-1 alert ' +
              planningTimeClass(
                (planStats.planningTime / (planStats.executionTime as number)) *
                  100,
              )
            "
            v-html="duration(planStats.planningTime)"
          ></span>
        </span>
      </template>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="planStats.jitTime && planStats.executionTime"
    >
      JIT:
      <span class="stat-value">
        <span
          :class="
            'mb-0 p-0 px-1 alert ' +
            planningTimeClass(
              (planStats.jitTime / planStats.executionTime) * 100,
            )
          "
          v-html="duration(planStats.jitTime)"
        ></span>
        <button
          @click.prevent="showJitDetails = !showJitDetails"
          class="bg-transparent border-0 p-0 m-0 ps-1"
        >
          <FontAwesomeIcon
            :icon="faCaretDown"
            class="text-secondary"
          ></FontAwesomeIcon>
        </button>
        <div class="stat-dropdown-container text-start" v-if="showJitDetails">
          <div>
            <JitDetails :jit="jitDetails" v-if="jitDetails" />
          </div>
        </div>
      </span>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="planStats.triggers && planStats.triggers.length"
    >
      <span class="stat-label">Triggers: </span>
      <span class="stat-value">
        <span
          :class="
            'mb-0 p-0 px-1 alert ' + durationClass(totalTriggerDurationPercent)
          "
          v-html="duration(triggersTotalDuration)"
        ></span>
      </span>
      <button
        @click.prevent="showTriggers = !showTriggers"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <FontAwesomeIcon
          :icon="faCaretDown"
          class="text-secondary"
        ></FontAwesomeIcon>
      </button>
      <div class="stat-dropdown-container text-start" v-if="showTriggers">
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showTriggers = false"
        ></button>
        <h3>Triggers</h3>
        <div v-for="(trigger, index) in planStats.triggers" :key="index">
          {{ trigger["Trigger Name"] }}
          <br />
          <span class="text-secondary">Called</span> {{ trigger["Calls"]
          }}<span class="text-secondary">&times;</span>
          <span class="float-end">
            <span
              :class="
                'p-0 px-1 alert ' +
                durationClass(triggerDurationPercent(trigger))
              "
              v-html="duration(trigger.Time)"
            ></span>
            | {{ triggerDurationPercent(trigger)
            }}<span class="text-secondary">%</span>
          </span>
          <br />
          <span class="text-secondary" v-if="trigger.Relation">on</span>
          {{ trigger.Relation }}
          <div class="clearfix"></div>
          <hr
            v-if="planStats.triggers && index != planStats.triggers.length - 1"
            class="my-2"
          />
        </div>
      </div>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="planStats.settings"
    >
      <span class="stat-label"
        >Settings:
        <span class="badge bg-secondary">{{
          _.keys(planStats.settings).length
        }}</span></span
      >
      <button
        @click.prevent="showSettings = !showSettings"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <FontAwesomeIcon
          :icon="faCaretDown"
          class="text-secondary"
        ></FontAwesomeIcon>
      </button>
      <div class="stat-dropdown-container text-start" v-if="showSettings">
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showSettings = false"
        ></button>
        <h3>PG Settings</h3>
        <em class="text-secondary d-block pb-2">
          Configuration parameters affecting query planning with value different
          from the built-in default value.
        </em>
        <table class="table table-sm table-striped mb-0">
          <tbody>
            <tr v-for="(value, key) in planStats.settings" :key="key">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="averageIO(rootNode)"
    >
      <span class="stat-label">
        IO: <span v-html="averageIO(rootNode)"></span>
      </span>
      <FontAwesomeIcon
        :icon="faInfoCircle"
        class="cursor-help d-inline-block text-secondary"
        v-tippy="{
          content: getHelpMessage('io timings parallel'),
        }"
        v-if="hasParallelChildren(rootNode)"
      ></FontAwesomeIcon>
      <button
        @click.prevent="showIO = !showIO"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <FontAwesomeIcon
          :icon="faCaretDown"
          class="text-secondary"
        ></FontAwesomeIcon>
      </button>
      <div class="stat-dropdown-container text-start" v-if="showIO">
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showIO = false"
        ></button>
        <IoTooltip :node="rootNode" class="mb-0" />
      </div>
    </div>
  </div>
</template>
