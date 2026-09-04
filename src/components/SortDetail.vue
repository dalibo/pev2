<script lang="ts" setup>
import { faArrowDownShortWide } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import _ from "lodash"
import { inject } from "vue"

import { Property } from "@/enums"
import type { Node, ViewOptions } from "@/interfaces"
import useNode from "@/node"
import { ViewOptionsKey } from "@/symbols"

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
