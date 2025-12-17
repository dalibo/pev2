<script lang="ts" setup>
import { inject, reactive } from "vue"
import _ from "lodash"
import type { Node, ViewOptions } from "@/interfaces"
import { NodeProp, WorkerProp } from "@/enums"
import { ViewOptionsKey } from "@/symbols"
import { HelpService } from "@/services/help-service"
import useNode from "@/node"
import { formatNodeProp } from "@/filters"
import { directive as vTippy } from "vue-tippy"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import { store } from "@/store"

interface Props {
  node: Node
}
const props = defineProps<Props>()
const node = reactive<Node>(props.node)
const viewOptions = inject(ViewOptionsKey) as ViewOptions

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage

const { workersLaunchedCount, workersPlannedCount } = useNode(node, viewOptions)
</script>
<template>
  <!-- workers tab -->
  <div>
    <b>Workers planned: </b>
    <span class="px-1">{{ workersPlannedCount }} </span>
    <em
      v-if="
        !node[NodeProp.WORKERS_PLANNED] &&
        !node[NodeProp.WORKERS] &&
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
        !node[NodeProp.WORKERS_LAUNCHED] &&
        !node[NodeProp.WORKERS] &&
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
    v-if="_.isArray(node[NodeProp.WORKERS])"
    class="overflow-auto"
    style="max-height: 300px"
    @wheel.stop
  >
    <template v-for="(worker, index) in node[NodeProp.WORKERS]" :key="index">
      <div class="card mt-2">
        <div class="card-header">
          <b>Worker {{ worker[WorkerProp.WORKER_NUMBER] }}</b>
        </div>
        <ul class="list-group list-group-flush">
          <template v-for="(value, key) in worker" :key="key">
            <li class="list-group-item d-flex flex-row">
              <div class="col-6">
                {{ key }}
              </div>
              <div
                class="col-6"
                v-html="formatNodeProp(key as string, value)"
              ></div>
            </li>
          </template>
        </ul>
      </div>
    </template>
  </div>
</template>
