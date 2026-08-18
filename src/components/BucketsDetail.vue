<script lang="ts" setup>
import { inject } from "vue"
import type { Node, ViewOptions } from "@/interfaces"
import { Property } from "@/enums"
import useNode from "@/node"
import { ViewOptionsKey } from "@/symbols"
import _ from "lodash"
import { getHelpMessage } from "@/services/help-service"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { Tippy } from "vue-tippy"

const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const node = props.node

const { bucketsBatchesClass, formattedProp } = useNode(node, viewOptions)
</script>
<template>
  <div v-if="!_.isUndefined(node[Property.HASH_BUCKETS])" class="mb-2">
    <b>Buckets</b>:
    <span class="p-0 px-1">{{ formattedProp("HASH_BUCKETS") }}</span>
    <template v-if="!_.isUndefined(node[Property.HASH_BATCHES])">
      |
      <span class="p-0 px-1 alert" :class="bucketsBatchesClass">
        {{ formattedProp("HASH_BATCHES") }} batches<span
          class="text-body-tertiary"
        ></span>
      </span>
      <Tippy
        :content="getHelpMessage('multiple hash batches')"
        :allowHTML="true"
        v-if="
          !_.isUndefined(node[Property.HASH_BATCHES]) &&
          (node[Property.HASH_BATCHES] as number) > 1
        "
      >
        <span class="text-body-tertiary">
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
          ></FontAwesomeIcon>
        </span>
      </Tippy>
    </template>
    <template v-if="!_.isUndefined(node[Property.PEAK_MEMORY_USAGE])">
      |
      {{ formattedProp("PEAK_MEMORY_USAGE") }}
    </template>
  </div>
</template>
