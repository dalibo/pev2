<script lang="ts" setup>
import _ from "lodash"
import { ref } from "vue"
import type { Node, StatsTableItemType } from "@/interfaces"
import { NodeProp } from "@/enums"
import { duration, durationClass, percent } from "@/filters"
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
    (node[NodeProp.EXCLUSIVE_DURATION] as number) /
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
          {{ duration(props.value.time) }}
        </span>
      </th>
      <th class="text-end">{{ percent(props.value.timePercent) }}</th>
    </tr>
  </thead>
  <tbody :class="expanded ? '' : 'd-none'">
    <tr
      v-for="node in _.reverse(
        _.sortBy(props.value.nodes, NodeProp.EXCLUSIVE_DURATION),
      )"
      :key="node.nodeId"
      style="font-size: smaller"
    >
      <td class="ps-3">
        <a :href="`#plan/node/${node.nodeId}`" class="me-1"
          >#{{ node.nodeId }}</a
        >
        {{ node[NodeProp.NODE_TYPE] }}
      </td>
      <td class="text-end"></td>
      <td class="text-end">
        <span class="px-1">
          {{ duration(node[NodeProp.EXCLUSIVE_DURATION]) }}
        </span>
      </td>
      <td class="text-end">
        {{ percent(durationPercent(node)) }}
      </td>
    </tr>
  </tbody>
</template>
