<script lang="ts" setup>
import { inject, reactive } from "vue"
import type { Ref } from "vue"
import { directive as vTippy } from "vue-tippy"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import useNode from "@/node"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { PlanKey, ViewOptionsKey } from "@/symbols"
interface Props {
  node: Node
}
const props = defineProps<Props>()
const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const viewOptions = inject(ViewOptionsKey) as ViewOptions

const {
  rowsRemoved,
  costClass,
  durationClass,
  estimationClass,
  rowsRemovedClass,
  heapFetchesClass,
  filterTooltip,
} = useNode(plan, node, viewOptions)
</script>
<template>
  <span
    v-if="durationClass"
    :class="'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + durationClass"
    v-tippy="'Slow'"
    ><font-awesome-icon fixed-width icon="clock"></font-awesome-icon>
  </span>
  <span
    v-if="costClass"
    :class="'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + costClass"
    v-tippy="'Cost is high'"
    ><font-awesome-icon fixed-width icon="dollar-sign"></font-awesome-icon
  ></span>
  <span
    v-if="estimationClass"
    :class="
      'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + estimationClass
    "
    v-tippy="'Bad estimation for number of rows'"
    ><font-awesome-icon fixed-width icon="thumbs-down"></font-awesome-icon
  ></span>
  <span
    v-if="rowsRemovedClass"
    :class="
      'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + rowsRemovedClass
    "
    v-tippy="filterTooltip"
  >
    <font-awesome-icon fixed-width icon="filter"></font-awesome-icon>
  </span>
  <span
    v-if="heapFetchesClass"
    :class="
      'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + heapFetchesClass
    "
    v-tippy="{
      arrow: true,
      content: 'Heap Fetches number is high',
    }"
  >
    <font-awesome-icon fixed-width icon="exchange-alt"></font-awesome-icon>
  </span>
  <span
    v-if="rowsRemoved && !rowsRemovedClass"
    class="p-0 d-inline-block mb-0 ms-1 text-nowrap"
    v-tippy="filterTooltip"
  >
    <font-awesome-icon
      fixed-width
      icon="filter"
      class="text-muted"
    ></font-awesome-icon>
  </span>
</template>
