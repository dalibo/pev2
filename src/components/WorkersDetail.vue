<script lang="ts" setup>
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import _ from "lodash"
import { inject, reactive } from "vue"
import { directive as vTippy } from "vue-tippy"

import { Property } from "@/enums"
import { formatProp } from "@/filters"
import type { Node, ViewOptions } from "@/interfaces"
import useNode from "@/node"
import { getHelpMessage } from "@/services/help-service"
import { store } from "@/store"
import { ViewOptionsKey } from "@/symbols"

interface Props {
  node: Node
}
const props = defineProps<Props>()
const node = reactive<Node>(props.node)
const viewOptions = inject(ViewOptionsKey) as ViewOptions

const { workersLaunchedCount, workersPlannedCount } = useNode(node, viewOptions)
</script>
<template>
  <!-- workers tab -->
  <div>
    <b>Workers planned: </b>
    <span class="px-1">{{ workersPlannedCount }} </span>
    <em
      v-if="
        !node[Property.WORKERS_PLANNED] &&
        !node[Property.WORKERS] &&
        (!store.plan?.isVerbose || !store.plan?.isAnalyze)
      "
      class="text-warning"
    >
      <FontAwesomeIcon
        :icon="faExclamationTriangle"
        class="cursor-help"
        v-tippy="getHelpMessage('fuzzy needs verbose')"
      ></FontAwesomeIcon>
    </em>
  </div>
  <div>
    <b>Workers launched: </b>
    <span class="px-1">{{ workersLaunchedCount }}</span>
    <em
      v-if="
        !node[Property.WORKERS_LAUNCHED] &&
        !node[Property.WORKERS] &&
        (!store.plan?.isVerbose || !store.plan?.isAnalyze)
      "
      class="text-warning"
    >
      <FontAwesomeIcon
        :icon="faExclamationTriangle"
        class="cursor-help"
        v-tippy="getHelpMessage('fuzzy needs verbose')"
      ></FontAwesomeIcon>
    </em>
  </div>

  <div
    v-if="_.isArray(node[Property.WORKERS])"
    class="overflow-auto"
    style="max-height: 300px"
    @wheel.stop
  >
    <template v-for="(worker, index) in node[Property.WORKERS]" :key="index">
      <div class="card mt-2">
        <div class="card-header">
          <b>Worker {{ worker[Property.WORKER_NUMBER] }}</b>
        </div>
        <ul class="list-group list-group-flush">
          <template v-for="(value, key) in worker" :key="key">
            <li class="list-group-item d-flex flex-row">
              <div class="col-6">
                {{ key }}
              </div>
              <div
                class="col-6"
                v-html="formatProp(key as string, value)"
              ></div>
            </li>
          </template>
        </ul>
      </div>
    </template>
  </div>
</template>
