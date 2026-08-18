<script lang="ts" setup>
import { inject } from "vue"
import type { Node, ViewOptions } from "@/interfaces"
import useNode from "@/node"
import { ViewOptionsKey } from "@/symbols"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import { Tippy } from "vue-tippy"
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
