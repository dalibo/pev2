<script lang="ts" setup>
import * as _ from "lodash"
import type { IPlanning } from "@/interfaces"
import { toProperty, Scope } from "@/enums"
import { formatBlocksAsBytes, formatProp } from "@/filters"

interface Props {
  object: IPlanning
  scope?: Scope
}
const props = defineProps<Props>()

const object = props.object
const scope = props.scope ? `${props.scope}_`.toUpperCase() : ""
const name = props.scope ? _.capitalize(props.scope) : "Shared/Local"

const readTimeProp = toProperty(scope + "IO_READ_TIME") as keyof IPlanning
const readSpeedProp = toProperty(
  "AVERAGE_" + scope + "IO_READ_SPEED",
) as keyof IPlanning
const readBlocksProp = toProperty(scope + "READ_BLOCKS") as keyof IPlanning
const writeTimeProp = toProperty(scope + "IO_WRITE_TIME") as keyof IPlanning
const writeSpeedProp = toProperty(
  "AVERAGE_" + scope + "IO_WRITE_SPEED",
) as keyof IPlanning
const writtenBlocksProp = toProperty(
  scope + "WRITTEN_BLOCKS",
) as keyof IPlanning
</script>

<template>
  <tr v-if="object[readTimeProp] || object[writeTimeProp]">
    <td>{{ name }}</td>
    <td class="text-end" v-if="object[readTimeProp]">
      {{ formatProp(readTimeProp, object[readTimeProp]) }}
      <br />
      <small>{{ formatBlocksAsBytes(object[readBlocksProp] as number) }}</small>
      <br />
      <small>~{{ formatProp(readSpeedProp, object[readSpeedProp]) }}</small>
    </td>
    <td class="text-end" v-else>-</td>
    <td class="text-end" v-if="object[writeTimeProp]">
      {{ formatProp(writeTimeProp, object[writeTimeProp]) }}
      <br />
      <small>{{
        formatBlocksAsBytes(object[writtenBlocksProp] as number)
      }}</small>
      <br />
      <small>~{{ formatProp(writeSpeedProp, object[writeSpeedProp]) }}</small>
    </td>
    <td class="text-end" v-else>-</td>
  </tr>
</template>
