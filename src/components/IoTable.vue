<script lang="ts" setup>
import type { Node } from "@/interfaces"
import { Property, Scope } from "@/enums"
import IoTimingsRow from "@/components/IoTimingsRow.vue"

interface Props {
  object: Node
  exclusive?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  exclusive: () => false,
})

const object = props.object

const shouldShow = props.exclusive
  ? object[Property.EXCLUSIVE_IO_READ_TIME] ||
    object[Property.EXCLUSIVE_IO_WRITE_TIME] ||
    object[Property.EXCLUSIVE_SHARED_IO_READ_TIME] ||
    object[Property.EXCLUSIVE_SHARED_IO_WRITE_TIME] ||
    object[Property.EXCLUSIVE_LOCAL_IO_READ_TIME] ||
    object[Property.EXCLUSIVE_LOCAL_IO_WRITE_TIME] ||
    object[Property.EXCLUSIVE_TEMP_IO_READ_TIME] ||
    object[Property.EXCLUSIVE_TEMP_IO_WRITE_TIME]
  : object[Property.IO_READ_TIME] ||
    object[Property.IO_WRITE_TIME] ||
    object[Property.SHARED_IO_READ_TIME] ||
    object[Property.SHARED_IO_WRITE_TIME] ||
    object[Property.LOCAL_IO_READ_TIME] ||
    object[Property.LOCAL_IO_WRITE_TIME] ||
    object[Property.TEMP_IO_READ_TIME] ||
    object[Property.TEMP_IO_WRITE_TIME]
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
      <IoTimingsRow :object="object" :exclusive="exclusive" />
      <IoTimingsRow
        :object="object"
        :scope="Scope.SHARED"
        :exclusive="exclusive"
      />
      <IoTimingsRow
        :object="object"
        :scope="Scope.LOCAL"
        :exclusive="exclusive"
      />
      <IoTimingsRow
        :object="object"
        :scope="Scope.TEMP"
        :exclusive="exclusive"
      />
    </tbody>
  </table>
</template>
