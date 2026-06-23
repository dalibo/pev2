<script lang="ts" setup>
import type { Node } from "@/interfaces"
import { Property, Scope } from "@/enums"
import IoTimingsRow from "@/components/IoTimingsRow.vue"

interface Props {
  node: Node
  exclusive?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  exclusive: () => false,
})

const node = props.node

const shouldShow = props.exclusive
  ? node[Property.EXCLUSIVE_IO_READ_TIME] ||
    node[Property.EXCLUSIVE_IO_WRITE_TIME] ||
    node[Property.EXCLUSIVE_SHARED_IO_READ_TIME] ||
    node[Property.EXCLUSIVE_SHARED_IO_WRITE_TIME] ||
    node[Property.EXCLUSIVE_LOCAL_IO_READ_TIME] ||
    node[Property.EXCLUSIVE_LOCAL_IO_WRITE_TIME] ||
    node[Property.EXCLUSIVE_TEMP_IO_READ_TIME] ||
    node[Property.EXCLUSIVE_TEMP_IO_WRITE_TIME]
  : node[Property.IO_READ_TIME] ||
    node[Property.IO_WRITE_TIME] ||
    node[Property.SHARED_IO_READ_TIME] ||
    node[Property.SHARED_IO_WRITE_TIME] ||
    node[Property.LOCAL_IO_READ_TIME] ||
    node[Property.LOCAL_IO_WRITE_TIME] ||
    node[Property.TEMP_IO_READ_TIME] ||
    node[Property.TEMP_IO_WRITE_TIME]
</script>

<template>
  <table class="table table-sm" v-if="shouldShow">
    <thead>
      <tr>
        <th class="text-nowrap">I/O Timings</th>
        <td class="text-end" width="50%">Read</td>
        <td class="text-end" width="50%">Write</td>
      </tr>
    </thead>
    <tbody>
      <!-- No temp IO: only one line for all IOs is needed -->
      <IoTimingsRow :node="node" :exclusive="exclusive" />
      <IoTimingsRow :node="node" :scope="Scope.SHARED" :exclusive="exclusive" />
      <IoTimingsRow :node="node" :scope="Scope.LOCAL" :exclusive="exclusive" />
      <IoTimingsRow :node="node" :scope="Scope.TEMP" :exclusive="exclusive" />
    </tbody>
  </table>
</template>
