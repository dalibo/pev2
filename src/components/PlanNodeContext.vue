<script lang="ts" setup>
import { inject, reactive } from "vue"
import type { Ref } from "vue"
import { keysToString, sortKeys } from "@/filters"
import { NodeProp } from "@/enums"
import type { IPlan, Node } from "@/interfaces"
import { PlanKey, SelectNodeKey } from "@/symbols"
import { findNodeBySubplanName } from "@/services/help-service"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

interface Props {
  node: Node
}
const props = defineProps<Props>()
const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>

const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}

function centerCte() {
  const cteNode = findNodeBySubplanName(
    plan.value,
    node[NodeProp.CTE_NAME] as string
  )
  cteNode && selectNode?.(cteNode.nodeId, true)
}
</script>

<template>
  <div class="text-left text-monospace">
    <div v-if="node[NodeProp.RELATION_NAME]" class="text-truncate">
      <span class="text-muted">on</span>
      <span v-if="node[NodeProp.SCHEMA]">{{ node[NodeProp.SCHEMA] }}.</span
      >{{ node[NodeProp.RELATION_NAME] }}
      <span v-if="node[NodeProp.ALIAS]">
        <span class="text-muted">as</span>
        {{ node[NodeProp.ALIAS] }}
      </span>
    </div>
    <div v-if="node[NodeProp.GROUP_KEY]" class="text-truncate">
      <span class="text-muted">by</span>
      <span v-html="keysToString(node[NodeProp.GROUP_KEY] as string)"></span>
    </div>
    <div v-if="node[NodeProp.SORT_KEY]" class="text-truncate">
      <span class="text-muted">by</span>
      <span
        v-html="
          sortKeys(
            node[NodeProp.SORT_KEY] as string[],
            node[NodeProp.PRESORTED_KEY] as string[]
          )
        "
      ></span>
    </div>
    <div v-if="node[NodeProp.JOIN_TYPE]">
      {{ node[NodeProp.JOIN_TYPE] }}
      <span class="text-muted">join</span>
    </div>
    <div v-if="node[NodeProp.INDEX_NAME]" class="text-truncate">
      <span class="text-muted">using</span>
      <span v-html="keysToString(node[NodeProp.INDEX_NAME] as string)"></span>
    </div>
    <div v-if="node[NodeProp.HASH_CONDITION]" class="text-truncate">
      <span class="text-muted">on</span>
      <span
        v-html="keysToString(node[NodeProp.HASH_CONDITION] as string)"
      ></span>
    </div>
    <div v-if="node[NodeProp.CTE_NAME]">
      <a class="text-reset" href="" @click.prevent.stop="centerCte">
        <font-awesome-icon icon="search" class="text-muted"></font-awesome-icon>
        <span class="text-muted">CTE</span>
        {{ node[NodeProp.CTE_NAME] }}
      </a>
    </div>
  </div>
</template>
