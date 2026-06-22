<script lang="ts" setup>
import _ from "lodash"
import { ref } from "vue"
import type { Node, StatsTableItemType } from "@/interfaces"
import { Property } from "@/enums"
import { formatDuration, durationClass, formatPercent } from "@/filters"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons"

interface Props {
  value: StatsTableItemType
  executionTime?: number
}

const props = defineProps<Props>()

const expanded = ref<boolean>(false)

function durationPercent(node: Node) {
  return (
    (node[Property.EXCLUSIVE_DURATION] as number) /
    (props.executionTime as number)
  )
}
</script>

<template>
  <thead class="thead-light">
    <tr v-on:click.prevent="expanded = !expanded" role="button">
      <th>
        <FontAwesomeIcon
          fixed-width
          :icon="faChevronDown"
          v-if="expanded"
        ></FontAwesomeIcon>
        <FontAwesomeIcon
          fixed-width
          :icon="faChevronRight"
          v-else
        ></FontAwesomeIcon>
        {{ props.value.name }}
      </th>
      <th class="text-end">{{ props.value.count }}</th>
      <th class="text-end">
        <span
          class="alert p-0 px-1"
          :class="durationClass(props.value.timePercent * 100)"
        >
          {{ formatDuration(props.value.time) }}
        </span>
      </th>
      <th class="text-end">{{ formatPercent(props.value.timePercent) }}</th>
    </tr>
  </thead>
  <tbody :class="expanded ? '' : 'd-none'">
    <tr
      v-for="node in _.reverse(
        _.sortBy(props.value.nodes, Property.EXCLUSIVE_DURATION),
      )"
      :key="node.nodeId"
      style="font-size: smaller"
    >
      <td class="ps-3">
        <a :href="`#plan/node/${node.nodeId}`" class="me-1"
          >#{{ node.nodeId }}</a
        >
        {{ node[Property.NODE_TYPE] }}
      </td>
      <td class="text-end"></td>
      <td class="text-end">
        <span class="px-1">
          {{ formatDuration(node[Property.EXCLUSIVE_DURATION]) }}
        </span>
      </td>
      <td class="text-end">
        {{ formatPercent(durationPercent(node)) }}
      </td>
    </tr>
  </tbody>
</template>
