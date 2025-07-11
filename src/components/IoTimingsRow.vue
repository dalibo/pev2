<script lang="ts" setup>
import { inject, reactive } from "vue"
import type { Ref } from "vue"
import * as _ from "lodash"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { NodeProp, Scope } from "@/enums"
import { PlanKey, ViewOptionsKey } from "@/symbols"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { directive as vTippy } from "vue-tippy"
import { HelpService } from "@/services/help-service"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import useNode from "@/node"

interface Props {
  node: Node
  scope?: Scope
  exclusive?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  exclusive: () => false,
})

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage

const exclusivePrefix = props.exclusive ? "EXCLUSIVE_" : ""

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const viewOptions = inject(ViewOptionsKey) as ViewOptions
const { formattedProp } = useNode(plan, node, viewOptions)
const scope = props.scope ? `${props.scope}_`.toUpperCase() : ""
const name = props.scope ? _.capitalize(props.scope) : "Shared/Local"
const readTimeProp = (exclusivePrefix +
  scope +
  "IO_READ_TIME") as keyof typeof NodeProp
const readSpeedProp = (exclusivePrefix +
  "AVERAGE_" +
  scope +
  "IO_READ_SPEED") as keyof typeof NodeProp
const writeTimeProp = (exclusivePrefix +
  scope +
  "IO_WRITE_TIME") as keyof typeof NodeProp
const writeSpeedProp = (exclusivePrefix +
  "AVERAGE_" +
  scope +
  "IO_WRITE_SPEED") as keyof typeof NodeProp
</script>

<template>
  <tr>
    <td>{{ name }}</td>
    <td class="text-end" v-if="node[NodeProp[readTimeProp]]">
      {{ formattedProp(readTimeProp) }}
      <br />
      <small>~{{ formattedProp(readSpeedProp) }}</small>
      <FontAwesomeIcon
        :icon="faInfoCircle"
        class="cursor-help d-inline-block text-secondary"
        v-tippy="{
          content: getHelpMessage('io timings parallel'),
        }"
        v-if="
          node[NodeProp.WORKERS_PLANNED] ||
          node[NodeProp.WORKERS_PLANNED_BY_GATHER]
        "
      ></FontAwesomeIcon>
    </td>
    <td class="text-end" v-else>-</td>
    <td class="text-end" v-if="node[NodeProp[writeTimeProp]]">
      {{ formattedProp(writeTimeProp) }}
      <br />
      <small>~{{ formattedProp(writeSpeedProp) }}</small>
    </td>
    <td class="text-end" v-else>-</td>
  </tr>
</template>
