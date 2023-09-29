<script lang="ts" setup>
import _ from "lodash"
import type { Ref } from "vue"
import { PlanKey } from "@/symbols"
import { computed, inject, ref } from "vue"
import type { IPlan, ITrigger, Node } from "@/interfaces"
import { HelpService } from "@/services/help-service"
import { duration, durationClass } from "@/filters"
import { directive as vTippy } from "vue-tippy"
import { NodeProp } from "../enums"
import { formatNodeProp } from "@/filters"

import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from "@fortawesome/free-solid-svg-icons"
import { far } from "@fortawesome/free-regular-svg-icons"
import { fab } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

// Add all icons to the library
library.add(fas, far, fab)

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage
const plan = inject(PlanKey) as Ref<IPlan>
const showSettings = ref<boolean>(false)
const showTriggers = ref<boolean>(false)
const rootNode = computed(() => plan.value && plan.value.content.Plan)

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
  const executionTime = plan.value.planStats.executionTime || 0
  const totalDuration = triggersTotalDuration.value || 0
  return _.round((totalDuration / executionTime) * 100)
})

function triggerDurationPercent(trigger: ITrigger) {
  const executionTime = plan.value.planStats.executionTime || 0
  const time = trigger.Time
  return _.round((time / executionTime) * 100)
}

const triggersTotalDuration = computed(() => {
  return _.sumBy(plan.value.planStats.triggers, (o) => o.Time)
})

function averageIO(node: Node) {
  const read = node[NodeProp.AVERAGE_IO_READ_TIME]
  const write = node[NodeProp.AVERAGE_IO_WRITE_TIME]
  const r = []
  if (read) {
    r.push(`read=~${formatNodeProp(NodeProp.AVERAGE_IO_READ_TIME, read)}`)
  }
  if (write) {
    r.push(`write=~${formatNodeProp(NodeProp.AVERAGE_IO_WRITE_TIME, write)}`)
  }
  return r.join(", ")
}
</script>

<template>
  <div
    class="plan-stats flex-shrink-0 d-flex border-bottom border-top align-items-center"
    v-if="plan"
  >
    <div class="d-inline-block px-2">
      Execution time:
      <template v-if="!plan.planStats.executionTime">
        <span class="text-muted">
          N/A
          <font-awesome-icon
            icon="info-circle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing execution time')"
          ></font-awesome-icon>
        </span>
      </template>
      <template v-else>
        <span
          class="stat-value"
          v-html="duration(plan.planStats.executionTime)"
        ></span>
      </template>
    </div>
    <div class="d-inline-block border-start px-2">
      Planning time:
      <template v-if="!plan.planStats.planningTime">
        <span class="text-muted">
          N/A
          <font-awesome-icon
            icon="info-circle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing planning time')"
          ></font-awesome-icon>
        </span>
      </template>
      <template v-else>
        <span class="stat-value">
          <span
            :class="
                      'mb-0 p-0 px-1 alert ' +
                      planningTimeClass(
                        (plan.planStats.planningTime / (plan.planStats.executionTime as number)) *
                         100
                      )
                    "
            v-html="duration(plan.planStats.planningTime)"
          ></span>
        </span>
      </template>
    </div>
    <div
      class="d-inline-block border-start px-2"
      v-if="plan.planStats.jitTime && plan.planStats.executionTime"
    >
      JIT:
      <span class="stat-value">
        <span
          :class="
            'mb-0 p-0 px-1 alert ' +
            planningTimeClass(
              (plan.planStats.jitTime / plan.planStats.executionTime) * 100
            )
          "
          v-html="duration(plan.planStats.jitTime)"
        ></span>
      </span>
    </div>
    <div class="d-inline-block border-start px-2 position-relative">
      <span class="stat-label">Triggers: </span>
      <template
        v-if="plan.planStats.triggers && plan.planStats.triggers.length"
      >
        <span class="stat-value">
          <span
            :class="
              'mb-0 p-0 px-1 alert ' +
              durationClass(totalTriggerDurationPercent)
            "
            v-html="duration(triggersTotalDuration)"
          ></span>
        </span>
        <button
          @click.prevent="showTriggers = !showTriggers"
          class="bg-transparent border-0 p-0 m-0 ps-1"
        >
          <font-awesome-icon
            icon="caret-down"
            class="text-muted"
          ></font-awesome-icon>
        </button>
        <div class="stat-dropdown-container text-start" v-if="showTriggers">
          <button
            class="btn btn-xs btn-close float-end"
            v-on:click="showTriggers = false"
          ></button>
          <h3>Triggers</h3>
          <div v-for="(trigger, index) in plan.planStats.triggers" :key="index">
            {{ trigger["Trigger Name"] }}
            <br />
            <span class="text-muted">Called</span> {{ trigger["Calls"]
            }}<span class="text-muted">&times;</span>
            <span class="float-end">
              <span
                :class="
                  'p-0 px-1 alert ' +
                  durationClass(triggerDurationPercent(trigger))
                "
                v-html="duration(trigger.Time)"
              ></span>
              | {{ triggerDurationPercent(trigger)
              }}<span class="text-muted">%</span>
            </span>
            <br />
            <span class="text-muted" v-if="trigger.Relation">on</span>
            {{ trigger.Relation }}
            <div class="clearfix"></div>
            <hr
              v-if="
                plan.planStats.triggers &&
                index != plan.planStats.triggers.length - 1
              "
              class="my-2"
            />
          </div>
        </div>
      </template>
      <span v-else class="text-muted"> N/A </span>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="plan.planStats.settings"
    >
      <span class="stat-label"
        >Settings:
        <span class="badge bg-secondary">{{
          _.keys(plan.planStats.settings).length
        }}</span></span
      >
      <button
        @click.prevent="showSettings = !showSettings"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <font-awesome-icon
          icon="caret-down"
          class="text-muted"
        ></font-awesome-icon>
      </button>
      <div class="stat-dropdown-container text-start" v-if="showSettings">
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showSettings = false"
        ></button>
        <h3>PG Settings</h3>
        <em class="text-muted d-block pb-2">
          Configuration parameters affecting query planning with value different
          from the built-in default value.
        </em>
        <table class="table table-sm table-striped mb-0">
          <tbody>
            <tr v-for="(value, key) in plan.planStats.settings" :key="key">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="
        rootNode &&
        (rootNode[NodeProp.AVERAGE_IO_READ_TIME] ||
          rootNode[NodeProp.AVERAGE_IO_WRITE_TIME])
      "
    >
      IO: {{ averageIO(rootNode) }}
    </div>
  </div>
</template>
