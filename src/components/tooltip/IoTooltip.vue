<script lang="ts" setup>
import { ref } from "vue"
import type { Node } from "@/interfaces"
import { NodeProp } from "@/enums"
import { duration, transferRate } from "@/filters"
import { HelpService } from "@/services/help-service"
interface Props {
  node: Node
}
const props = defineProps<Props>()
const read = ref(props.node[NodeProp.EXCLUSIVE_IO_READ_TIME])
const averageRead = ref(props.node[NodeProp.AVERAGE_IO_READ_SPEED])
const write = ref(props.node[NodeProp.EXCLUSIVE_IO_WRITE_TIME])
const averageWrite = ref(props.node[NodeProp.AVERAGE_IO_WRITE_SPEED])
const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage
</script>

<template>
  IO:
  <table class="table table-sm table-borderless mb-0">
    <tbody>
      <tr v-if="read">
        <td>Read:</td>
        <td class="text-end">
          {{ duration(read) }}
          <br /><small>~ {{ transferRate(averageRead) }}</small>
        </td>
      </tr>
      <tr v-if="write">
        <td>Write:</td>
        <td class="text-end">
          {{ duration(write) }}
          <br /><small>~ {{ transferRate(averageWrite) }}</small>
        </td>
      </tr>
    </tbody>
  </table>
  <template
    v-if="
      node[NodeProp.WORKERS_PLANNED] || node[NodeProp.WORKERS_PLANNED_BY_GATHER]
    "
  >
    <small>{{ getHelpMessage("io timings parallel") }}</small>
  </template>
</template>
