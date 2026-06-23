<script lang="ts" setup>
import * as _ from "lodash"
import type { Node } from "@/interfaces"
import { toProperty, Property, Scope } from "@/enums"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { directive as vTippy } from "vue-tippy"
import { getHelpMessage } from "@/services/help-service"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { formatBlocksAsBytes, formatProp } from "@/filters"

interface Props {
  node: Node
  scope?: Scope
  exclusive?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  exclusive: () => false,
})

const exclusivePrefix = props.exclusive ? "EXCLUSIVE_" : ""
const node = props.node
const scope = props.scope ? `${props.scope}_`.toUpperCase() : ""
const name = props.scope ? _.capitalize(props.scope) : "Shared/Local"

const readTimeProp = toProperty(exclusivePrefix + scope + "IO_READ_TIME")
const readSpeedProp = toProperty(
  exclusivePrefix + "AVERAGE_" + scope + "IO_READ_SPEED",
)
const readBlocksProp = toProperty(exclusivePrefix + scope + "READ_BLOCKS")
const writeTimeProp = toProperty(exclusivePrefix + scope + "IO_WRITE_TIME")
const writeSpeedProp = toProperty(
  exclusivePrefix + "AVERAGE_" + scope + "IO_WRITE_SPEED",
)
const writtenBlocksProp = toProperty(exclusivePrefix + scope + "WRITTEN_BLOCKS")
</script>

<template>
  <tr v-if="node[readTimeProp] || node[writeTimeProp]">
    <td>{{ name }}</td>
    <td class="text-end" v-if="node[readTimeProp]">
      {{ formatProp(readTimeProp, node[readTimeProp]) }}
      <br />
      <small>{{ formatBlocksAsBytes(node[readBlocksProp] as number) }}</small>
      <br />
      <small>~{{ formatProp(readSpeedProp, node[readSpeedProp]) }}</small>
      <FontAwesomeIcon
        :icon="faInfoCircle"
        class="cursor-help d-inline-block text-body-tertiary"
        v-tippy="{
          content: getHelpMessage('io timings parallel'),
        }"
        v-if="
          node[Property.WORKERS_PLANNED] ||
          node[Property.WORKERS_PLANNED_BY_GATHER]
        "
      ></FontAwesomeIcon>
    </td>
    <td class="text-end" v-else>-</td>
    <td class="text-end" v-if="node[writeTimeProp]">
      {{ formatProp(writeTimeProp, node[writeTimeProp]) }}
      <br />
      <small>{{
        formatBlocksAsBytes(node[writtenBlocksProp] as number)
      }}</small>
      <br />
      <small>~{{ formatProp(writeSpeedProp, node[writeSpeedProp]) }}</small>
    </td>
    <td class="text-end" v-else>-</td>
  </tr>
</template>
