<script lang="ts" setup>
import { inject } from "vue"
import type { Node, ViewOptions } from "@/interfaces"
import { Property } from "@/enums"
import useNode from "@/node"
import { ViewOptionsKey } from "@/symbols"
import _ from "lodash"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faArrowDownShortWide } from "@fortawesome/free-solid-svg-icons"

const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const node = props.node

const { formattedProp } = useNode(node, viewOptions)
</script>
<template>
  <div v-if="!_.isUndefined(node[Property.SORT_METHOD])" class="mb-2">
    <FontAwesomeIcon
      :icon="faArrowDownShortWide"
      class="text-body-tertiary"
      fixed-width
    />
    <b>Sort: </b>
    <span class="p-0 px-1 alert"> {{ formattedProp("SORT_SPACE_USED") }}</span>
    <span v-html="formattedProp('SORT_SPACE_TYPE')" />
    <i>({{ node[Property.SORT_METHOD] }})</i>
  </div>
</template>
