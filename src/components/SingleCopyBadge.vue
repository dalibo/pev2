<script lang="ts" setup>
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { inject } from "vue"
import { Tippy } from "vue-tippy"

import { Property } from "@/enums"
import type { Node, ViewOptions } from "@/interfaces"
import useNode from "@/node"
import { ViewOptionsKey } from "@/symbols"

const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const { nodeName } = useNode(props.node, viewOptions)

const appendTo = () => document.body
</script>

<template>
  <Tippy interactive allowHTML :appendTo="appendTo">
    <span v-if="node[Property.SINGLE_COPY]" class="text-info">
      <FontAwesomeIcon fixed-width :icon="faInfoCircle"></FontAwesomeIcon>
    </span>
    <template #content>
      <p>
        <i>{{ nodeName }}</i> runs in <b>single copy</b> mode: parallelism was
        forced, but the subplan is executed by a single process only, so it is
        not actually split among workers.
      </p>
    </template>
  </Tippy>
</template>
