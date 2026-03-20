<script lang="ts" setup>
import { blocks } from "@/filters"
import type { ISerialization, Node } from "@/interfaces"
import { BuffersProp, NodeProp } from "@/enums"

interface Props {
  object: Node | ISerialization
}
const props = defineProps<Props>()

const sharedHitBlocks =
  NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]
    : props.object[BuffersProp.SHARED_HIT_BLOCKS]
const sharedReadBlocks =
  NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]
    : props.object[BuffersProp.SHARED_READ_BLOCKS]
const sharedDirtiedBlocks =
  NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]
    : props.object[BuffersProp.SHARED_DIRTIED_BLOCKS]
const sharedWrittenBlocks =
  NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]
    : props.object[BuffersProp.SHARED_WRITTEN_BLOCKS]
const localHitBlocks =
  NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]
    : props.object[BuffersProp.LOCAL_HIT_BLOCKS]
const localReadBlocks =
  NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]
    : props.object[BuffersProp.LOCAL_READ_BLOCKS]
const localDirtiedBlocks =
  NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]
    : props.object[BuffersProp.LOCAL_DIRTIED_BLOCKS]
const localWrittenBlocks =
  NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]
    : props.object[BuffersProp.LOCAL_WRITTEN_BLOCKS]
const tempReadBlocks =
  NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]
    : props.object[BuffersProp.TEMP_READ_BLOCKS]
const tempWrittenBlocks =
  NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS in props.object
    ? props.object[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]
    : props.object[BuffersProp.TEMP_WRITTEN_BLOCKS]
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
        <td class="text-end" v-html="blocks(sharedHitBlocks, true) || '-'"></td>
        <td
          class="text-end"
          v-html="blocks(sharedReadBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="blocks(sharedDirtiedBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="blocks(sharedWrittenBlocks, true) || '-'"
        ></td>
      </tr>
      <tr>
        <td>Temp</td>
        <td class="text-end bg-hatched"></td>
        <td class="text-end" v-html="blocks(tempReadBlocks, true) || '-'"></td>
        <td class="text-end bg-hatched"></td>
        <td
          class="text-end"
          v-html="blocks(tempWrittenBlocks, true) || '-'"
        ></td>
      </tr>
      <tr>
        <td>Local</td>
        <td class="text-end" v-html="blocks(localHitBlocks, true) || '-'"></td>
        <td class="text-end" v-html="blocks(localReadBlocks, true) || '-'"></td>
        <td
          class="text-end"
          v-html="blocks(localDirtiedBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="blocks(localWrittenBlocks, true) || '-'"
        ></td>
      </tr>
    </tbody>
  </table>
</template>
