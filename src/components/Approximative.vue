<script lang="ts" setup>
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { inject } from "vue"
import { Tippy } from "vue-tippy"

import type { Node, ViewOptions } from "@/interfaces"
import useNode from "@/node"
import { ViewOptionsKey } from "@/symbols"
const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const { approximativeTooltip, isApproximative } = useNode(
  props.node,
  viewOptions,
)
</script>

<template>
  <Tippy allowHTML :content="approximativeTooltip" v-if="isApproximative">
    <FontAwesomeIcon :icon="faTriangleExclamation" class="text-muted" />
  </Tippy>
</template>
