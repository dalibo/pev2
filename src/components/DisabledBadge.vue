<script lang="ts" setup>
import { inject } from "vue"
import { Tippy } from "vue-tippy"
import type { Node, ViewOptions } from "@/interfaces"
import { ViewOptionsKey } from "@/symbols"
import { NodeProp } from "@/enums"
import useNode from "@/node"
import { store } from "@/store"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons"

const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node,
}
const props = defineProps<Props>()

const { nodeName } = useNode(props.node, viewOptions)

const appendTo = () => document.body
</script>

<template>
  <Tippy interactive allowHTML :appendTo="appendTo">
    <span
      v-if="node[NodeProp.DISABLED]"
      class="text-danger"
    >
    <FontAwesomeIcon fixed-width :icon="faCircleXmark"
    ></FontAwesomeIcon>
    </span>
    <template #content>
      <p>
        <i>{{nodeName}}</i> has been <b>disabled</b> via a <a href='https://www.postgresql.org/docs/current/runtime-config-query.html' target='_blank'>planner method configuration parameter</a> but has been used anyway.
      </p>
      <p v-if="store.plan?.content.Settings">
        See corresponding 'enable' parameter in <i>Settings</i>.
      </p>
      <p v-else>
        Tip: use the <i>SETTINGS</i> option in your EXPLAIN command to get more details.
      </p>
    </template>
  </Tippy>
</template>
