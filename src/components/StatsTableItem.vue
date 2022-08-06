<script lang="ts" setup>
import _ from "lodash"
import { ref } from "vue"
import type { Node, StatsTableItemType } from "@/interfaces"
import { NodeProp } from "@/enums"
import { duration, durationClass, percent } from "@/filters"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

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
    <tr
      v-on:click.prevent="expanded = !expanded"
      role="button"
      class="user-select-none"
    >
      <th>
        <font-awesome-icon
          fixed-width
          icon="chevron-down"
          v-if="expanded"
        ></font-awesome-icon>
        <font-awesome-icon
          fixed-width
          icon="chevron-right"
          v-else
        ></font-awesome-icon>
        {{ props.value.name }}
      </th>
      <th class="text-right">{{ props.value.count }}</th>
      <th class="text-right">
        <span
          class="alert p-0 px-1"
          :class="durationClass(props.value.timePercent * 100)"
        >
          {{ duration(props.value.time) }}
        </span>
      </th>
      <th class="text-right">{{ percent(props.value.timePercent) }}</th>
    </tr>
  </thead>
  <tbody :class="expanded ? '' : 'd-none'">
    <tr
      v-for="node in _.reverse(
        _.sortBy(props.value.nodes, NodeProp.EXCLUSIVE_DURATION)
      )"
      :key="node.nodeId"
      style="font-size: smaller"
    >
      <td class="pl-3">
        <a :href="'#plan/node/' + node.nodeId" class="mr-1"
          >#{{ node.nodeId }}</a
        >
        {{ node[NodeProp.NODE_TYPE] }}
      </td>
      <td class="text-right"></td>
      <td class="text-right">
        <span class="px-1">
          {{ duration(node[NodeProp.EXCLUSIVE_DURATION]) }}
        </span>
      </td>
      <td class="text-right">
        {{ percent(durationPercent(node)) }}
      </td>
    </tr>
  </tbody>
</template>
