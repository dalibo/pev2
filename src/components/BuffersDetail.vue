<script lang="ts" setup>
import { blocks } from "@/filters"
import type { Node } from "@/interfaces"
import { BuffersProp, NodeProp } from "@/enums"

interface Props {
  object: Node
}
const props = defineProps<Props>()

const sharedHitBlocksProp = props.object[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]
const sharedReadBlocksProp = props.object[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]
const sharedDirtiedBlocksProp =
  props.object[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]
const sharedWrittenBlocksProp =
  props.object[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]
const tempReadBlocksProp = props.object[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]
const tempWrittenBlocksProp =
  props.object[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]
const localHitBlocksProp = props.object[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]
const localReadBlocksProp = props.object[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]
const localDirtiedBlocksProp =
  props.object[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]
const localWrittenBlocksProp =
  props.object[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]
</script>
<template>
  <table class="table table-sm">
    <thead>
      <tr>
        <th>Blocks</th>
        <td class="text-end" width="25%">Hit</td>
        <td class="text-end" width="25%">Read</td>
        <td class="text-end" width="25%">Dirtied</td>
        <td class="text-end" width="25%">Written</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Shared</td>
        <td
          class="text-end"
          v-html="blocks(object[sharedHitBlocksProp] as number, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="blocks(object[sharedReadBlocksProp] as number, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="
            blocks(object[sharedDirtiedBlocksProp] as number, true) || '-'
          "
        ></td>
        <td
          class="text-end"
          v-html="
            blocks(object[sharedWrittenBlocksProp] as number, true) || '-'
          "
        ></td>
      </tr>
      <tr>
        <td>Temp</td>
        <td class="text-end bg-hatched"></td>
        <td
          class="text-end"
          v-html="blocks(object[tempReadBlocksProp] as number, true) || '-'"
        ></td>
        <td class="text-end bg-hatched"></td>
        <td
          class="text-end"
          v-html="blocks(object[tempWrittenBlocksProp] as number, true) || '-'"
        ></td>
      </tr>
      <tr>
        <td>Local</td>
        <td
          class="text-end"
          v-html="blocks(object[localHitBlocksProp] as number, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="blocks(object[localReadBlocksProp] as number, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="blocks(object[localDirtiedBlocksProp] as number, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="blocks(object[localWrittenBlocksProp] as number, true) || '-'"
        ></td>
      </tr>
    </tbody>
  </table>
</template>
