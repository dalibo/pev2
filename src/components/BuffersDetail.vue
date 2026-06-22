<script lang="ts" setup>
import { formatBlocks } from "@/filters"
import type { ISerialization, Node } from "@/interfaces"
import { Property } from "@/enums"

interface Props {
  object: Node | ISerialization
}
const props = defineProps<Props>()

const sharedHitBlocks =
  Property.EXCLUSIVE_SHARED_HIT_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_SHARED_HIT_BLOCKS]
    : props.object[Property.SHARED_HIT_BLOCKS]
const sharedReadBlocks =
  Property.EXCLUSIVE_SHARED_READ_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_SHARED_READ_BLOCKS]
    : props.object[Property.SHARED_READ_BLOCKS]
const sharedDirtiedBlocks =
  Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]
    : props.object[Property.SHARED_DIRTIED_BLOCKS]
const sharedWrittenBlocks =
  Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]
    : props.object[Property.SHARED_WRITTEN_BLOCKS]
const localHitBlocks =
  Property.EXCLUSIVE_LOCAL_HIT_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_LOCAL_HIT_BLOCKS]
    : props.object[Property.LOCAL_HIT_BLOCKS]
const localReadBlocks =
  Property.EXCLUSIVE_LOCAL_READ_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_LOCAL_READ_BLOCKS]
    : props.object[Property.LOCAL_READ_BLOCKS]
const localDirtiedBlocks =
  Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]
    : props.object[Property.LOCAL_DIRTIED_BLOCKS]
const localWrittenBlocks =
  Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]
    : props.object[Property.LOCAL_WRITTEN_BLOCKS]
const tempReadBlocks =
  Property.EXCLUSIVE_TEMP_READ_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_TEMP_READ_BLOCKS]
    : props.object[Property.TEMP_READ_BLOCKS]
const tempWrittenBlocks =
  Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS in props.object
    ? props.object[Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]
    : props.object[Property.TEMP_WRITTEN_BLOCKS]
</script>
<template>
  <table class="table table-sm">
    <thead>
      <tr>
        <th>Buffers</th>
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
          v-html="formatBlocks(sharedHitBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="formatBlocks(sharedReadBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="formatBlocks(sharedDirtiedBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="formatBlocks(sharedWrittenBlocks, true) || '-'"
        ></td>
      </tr>
      <tr>
        <td>Temp</td>
        <td class="text-end bg-hatched"></td>
        <td
          class="text-end"
          v-html="formatBlocks(tempReadBlocks, true) || '-'"
        ></td>
        <td class="text-end bg-hatched"></td>
        <td
          class="text-end"
          v-html="formatBlocks(tempWrittenBlocks, true) || '-'"
        ></td>
      </tr>
      <tr>
        <td>Local</td>
        <td
          class="text-end"
          v-html="formatBlocks(localHitBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="formatBlocks(localReadBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="formatBlocks(localDirtiedBlocks, true) || '-'"
        ></td>
        <td
          class="text-end"
          v-html="formatBlocks(localWrittenBlocks, true) || '-'"
        ></td>
      </tr>
    </tbody>
  </table>
</template>
