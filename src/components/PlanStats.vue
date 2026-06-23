<script lang="ts" setup>
import _ from "lodash"
import { computed, ref } from "vue"
import type { ISerialization, ITrigger, Node } from "@/interfaces"
import { getHelpMessage } from "@/services/help-service"
import { formatDuration, durationClass, formatKilobytes } from "@/filters"
import { directive as vTippy } from "vue-tippy"
import { Property } from "../enums"
import { formatProp } from "@/filters"
import JitDetails from "@/components/JitDetails.vue"
import BuffersDetail from "@/components/BuffersDetail.vue"
import IoTable from "@/components/IoTable.vue"
import { store } from "@/store"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faCaretDown, faInfoCircle } from "@fortawesome/free-solid-svg-icons"

const showSettings = ref<boolean>(false)
const showTriggers = ref<boolean>(false)
const showJitDetails = ref<boolean>(false)
const showSerializationDetails = ref<boolean>(false)
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
  const executionTime = store.stats.executionTime || 0
  const totalDuration = triggersTotalDuration.value || 0
  return _.round((totalDuration / executionTime) * 100)
})

function triggerDurationPercent(trigger: ITrigger) {
  const executionTime = store.stats.executionTime || 0
  const time = trigger.Time
  return _.round((time / executionTime) * 100)
}

const triggersTotalDuration = computed(() => {
  return _.sumBy(store.stats.triggers, (o) => o.Time)
})

function averageIO(node: Node) {
  const readAverage = node[Property.AVERAGE_SUM_IO_READ_SPEED]
  const writeAverage = node[Property.AVERAGE_SUM_IO_WRITE_SPEED]
  const r = []
  if (readAverage) {
    r.push(
      `read=~${formatProp(Property.AVERAGE_SUM_IO_READ_SPEED, readAverage)}`,
    )
  }
  if (writeAverage) {
    r.push(
      `write=~${formatProp(Property.AVERAGE_SUM_IO_WRITE_SPEED, writeAverage)}`,
    )
  }
  return r.join(", ")
}

function hasParallelChildren(node: Node) {
  return node.Plans?.some(function iter(a) {
    if (a[Property.WORKERS_PLANNED] || a[Property.WORKERS_PLANNED_BY_GATHER]) {
      return true
    }
    return Array.isArray(a.Plans) && a.Plans.some(iter)
  })
}

const shouldShowSerializationBuffers = computed((): boolean => {
  if (!store.stats.serialization) {
    return false
  }
  const properties: (keyof ISerialization)[] = [
    Property.SHARED_HIT_BLOCKS,
    Property.SHARED_READ_BLOCKS,
    Property.SHARED_DIRTIED_BLOCKS,
    Property.SHARED_WRITTEN_BLOCKS,
    Property.TEMP_READ_BLOCKS,
    Property.TEMP_WRITTEN_BLOCKS,
    Property.LOCAL_HIT_BLOCKS,
    Property.LOCAL_READ_BLOCKS,
    Property.LOCAL_DIRTIED_BLOCKS,
    Property.LOCAL_WRITTEN_BLOCKS,
  ]
  const values = _.map(properties, (property) => {
    const value = store.stats.serialization?.[property]
    return _.isNaN(value) ? 0 : value
  })
  const sum = _.sum(values)
  return sum > 0
})
</script>

<template>
  <div
    class="plan-stats flex-shrink-0 d-flex border-bottom border-top align-items-center"
    v-if="store.stats"
  >
    <div class="d-inline-block px-2">
      Execution time:
      <template v-if="!store.stats.executionTime">
        <span class="text-body-tertiary">
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
          v-html="formatDuration(store.stats.executionTime)"
        ></span>
      </template>
    </div>
    <div class="d-inline-block border-start px-2">
      Planning time:
      <template v-if="!store.stats.planningTime">
        <span class="text-body-tertiary">
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
                (store.stats.planningTime /
                  (store.stats.executionTime as number)) *
                  100,
              )
            "
            v-html="formatDuration(store.stats.planningTime)"
          ></span>
        </span>
      </template>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="store.stats.serialization"
    >
      Serialization:
      <span class="stat-value">
        <span
          :class="
            'mb-0 p-0 px-1 alert ' +
            planningTimeClass(
              (store.stats.serialization.Time /
                (store.stats.executionTime as number)) *
                100,
            )
          "
          v-html="formatDuration(store.stats.serialization.Time)"
        ></span>
      </span>
      <button
        @click.prevent="showSerializationDetails = !showSerializationDetails"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <FontAwesomeIcon
          :icon="faCaretDown"
          class="text-body-tertiary"
        ></FontAwesomeIcon>
      </button>
      <div
        class="stat-dropdown-container text-start"
        v-if="showSerializationDetails"
      >
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showSerializationDetails = false"
        ></button>
        <h3>Serialization</h3>
        <div>
          <b>Time:</b>
          <span>{{ formatDuration(store.stats.serialization.Time) }}</span>
        </div>
        <div>
          <b>Output Volume: </b>
          <span>
            {{
              formatKilobytes(store.stats.serialization["Output Volume"])
            }}</span
          >
        </div>
        <div v-if="shouldShowSerializationBuffers">
          <BuffersDetail :object="store.stats.serialization" />
        </div>
      </div>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="store.stats.jitTime && store.stats.executionTime"
    >
      JIT:
      <span class="stat-value">
        <span
          :class="
            'mb-0 p-0 px-1 alert ' +
            planningTimeClass(
              (store.stats.jitTime / store.stats.executionTime) * 100,
            )
          "
          v-html="formatDuration(store.stats.jitTime)"
        ></span>
        <button
          @click.prevent="showJitDetails = !showJitDetails"
          class="bg-transparent border-0 p-0 m-0 ps-1"
        >
          <FontAwesomeIcon
            :icon="faCaretDown"
            class="text-body-tertiary"
          ></FontAwesomeIcon>
        </button>
        <div class="stat-dropdown-container text-start" v-if="showJitDetails">
          <div>
            <JitDetails
              :jit="store.plan?.content.JIT"
              v-if="store.plan?.content.JIT"
            />
          </div>
        </div>
      </span>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="store.stats.triggers && store.stats.triggers.length"
    >
      <span class="stat-label">Triggers: </span>
      <span class="stat-value">
        <span
          :class="
            'mb-0 p-0 px-1 alert ' + durationClass(totalTriggerDurationPercent)
          "
          v-html="formatDuration(triggersTotalDuration)"
        ></span>
      </span>
      <button
        @click.prevent="showTriggers = !showTriggers"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <FontAwesomeIcon
          :icon="faCaretDown"
          class="text-body-tertiary"
        ></FontAwesomeIcon>
      </button>
      <div class="stat-dropdown-container text-start" v-if="showTriggers">
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showTriggers = false"
        ></button>
        <h3>Triggers</h3>
        <div v-for="(trigger, index) in store.stats.triggers" :key="index">
          {{ trigger["Trigger Name"] }}
          <br />
          <span class="text-body-tertiary">Called</span> {{ trigger["Calls"]
          }}<span class="text-body-tertiary">&times;</span>
          <span class="float-end">
            <span
              :class="
                'p-0 px-1 alert ' +
                durationClass(triggerDurationPercent(trigger))
              "
              v-html="formatDuration(trigger.Time)"
            ></span>
            | {{ triggerDurationPercent(trigger)
            }}<span class="text-body-tertiary">%</span>
          </span>
          <br />
          <span class="text-body-tertiary" v-if="trigger.Relation">on</span>
          {{ trigger.Relation }}
          <div class="clearfix"></div>
          <hr
            v-if="
              store.stats.triggers && index != store.stats.triggers.length - 1
            "
            class="my-2"
          />
        </div>
      </div>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="store.stats.settings"
    >
      <span class="stat-label"
        >Settings:
        <span class="badge bg-secondary">{{
          _.keys(store.stats.settings).length
        }}</span></span
      >
      <button
        @click.prevent="showSettings = !showSettings"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <FontAwesomeIcon
          :icon="faCaretDown"
          class="text-body-tertiary"
        ></FontAwesomeIcon>
      </button>
      <div class="stat-dropdown-container text-start" v-if="showSettings">
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showSettings = false"
        ></button>
        <h3>PG Settings</h3>
        <em class="text-body-tertiary d-block pb-2">
          Configuration parameters affecting query planning with value different
          from the built-in default value.
        </em>
        <table class="table table-sm table-striped mb-0">
          <tbody>
            <tr v-for="(value, key) in store.stats.settings" :key="key">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div
      class="d-inline-block border-start px-2 position-relative"
      v-if="store.plan?.content.Plan && averageIO(store.plan?.content.Plan)"
    >
      <span class="stat-label">
        IO: <span v-html="averageIO(store.plan?.content.Plan)"></span>
      </span>
      <FontAwesomeIcon
        :icon="faInfoCircle"
        class="cursor-help d-inline-block text-body-tertiary"
        v-tippy="{
          content: getHelpMessage('io timings parallel'),
        }"
        v-if="hasParallelChildren(store.plan?.content.Plan)"
      ></FontAwesomeIcon>
      <button
        @click.prevent="showIO = !showIO"
        class="bg-transparent border-0 p-0 m-0 ps-1"
      >
        <FontAwesomeIcon
          :icon="faCaretDown"
          class="text-body-tertiary"
        ></FontAwesomeIcon>
      </button>
      <div class="stat-dropdown-container text-start" v-if="showIO">
        <button
          class="btn btn-xs btn-close float-end"
          v-on:click="showIO = false"
        ></button>
        <IoTable :object="store.plan?.content.Plan" class="mb-0" />
      </div>
    </div>
  </div>
</template>
