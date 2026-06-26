<script lang="ts" setup>
import type { IPlanning, Node } from "@/interfaces"
import { Property, Scope } from "@/enums"
import NodeIoTimingsRow from "@/components/NodeIoTimingsRow.vue"
import PlanningIoTimingsRow from "@/components/PlanningIoTimingsRow.vue"

interface Props {
  object: Node | IPlanning
  exclusive?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  exclusive: () => false,
})

const object = props.object

// Note: IPlanning doesn't have exclusive properties
const shouldShow = props.exclusive
  ? (object as Node)[Property.EXCLUSIVE_IO_READ_TIME] ||
    (object as Node)[Property.EXCLUSIVE_IO_WRITE_TIME] ||
    (object as Node)[Property.EXCLUSIVE_SHARED_IO_READ_TIME] ||
    (object as Node)[Property.EXCLUSIVE_SHARED_IO_WRITE_TIME] ||
    (object as Node)[Property.EXCLUSIVE_LOCAL_IO_READ_TIME] ||
    (object as Node)[Property.EXCLUSIVE_LOCAL_IO_WRITE_TIME] ||
    (object as Node)[Property.EXCLUSIVE_TEMP_IO_READ_TIME] ||
    (object as Node)[Property.EXCLUSIVE_TEMP_IO_WRITE_TIME]
  : object[Property.IO_READ_TIME] ||
    object[Property.IO_WRITE_TIME] ||
    object[Property.SHARED_IO_READ_TIME] ||
    object[Property.SHARED_IO_WRITE_TIME] ||
    (object as Node)[Property.LOCAL_IO_READ_TIME] ||
    (object as Node)[Property.LOCAL_IO_WRITE_TIME] ||
    object[Property.TEMP_IO_READ_TIME] ||
    object[Property.TEMP_IO_WRITE_TIME]

function isNode(obj: Node | IPlanning): obj is Node {
  return Property.EXCLUSIVE_IO_READ_TIME in obj
}
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
      <NodeIoTimingsRow
        :object="object"
        :exclusive="exclusive"
        v-if="isNode(object)"
      />
      <PlanningIoTimingsRow :object="object as IPlanning" v-else />
      <NodeIoTimingsRow
        :object="object"
        :scope="Scope.SHARED"
        :exclusive="exclusive"
        v-if="isNode(object)"
      />
      <PlanningIoTimingsRow
        :object="object as IPlanning"
        :scope="Scope.SHARED"
        v-else
      />
      <NodeIoTimingsRow
        :object="object"
        :scope="Scope.LOCAL"
        :exclusive="exclusive"
        v-if="isNode(object)"
      />
      <PlanningIoTimingsRow
        :object="object as IPlanning"
        :scope="Scope.LOCAL"
        v-else
      />
      <NodeIoTimingsRow
        :object="object as Node"
        :scope="Scope.TEMP"
        :exclusive="exclusive"
        v-if="isNode(object)"
      />
      <PlanningIoTimingsRow
        :object="object as IPlanning"
        :scope="Scope.TEMP"
        v-else
      />
    </tbody>
  </table>
</template>
