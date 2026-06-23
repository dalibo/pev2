<script lang="ts" setup>
import { computed, reactive } from "vue"
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

const exclusivePrefix = computed(() => (props.exclusive ? "EXCLUSIVE_" : ""))

const node = reactive<Node>(props.node)
</script>

<template>
  <table
    class="table table-sm"
    v-if="
      node[
        Property[(exclusivePrefix + 'IO_READ_TIME') as keyof typeof Property]
      ] ||
      node[
        Property[(exclusivePrefix + 'IO_WRITE_TIME') as keyof typeof Property]
      ] ||
      node[
        Property[
          (exclusivePrefix + 'SHARED_IO_READ_TIME') as keyof typeof Property
        ]
      ] ||
      node[
        Property[
          (exclusivePrefix + 'SHARED_IO_WRITE_TIME') as keyof typeof Property
        ]
      ] ||
      node[
        Property[
          (exclusivePrefix + 'LOCAL_IO_READ_TIME') as keyof typeof Property
        ]
      ] ||
      node[
        Property[
          (exclusivePrefix + 'LOCAL_IO_WRITE_TIME') as keyof typeof Property
        ]
      ] ||
      node[
        Property[
          (exclusivePrefix + 'TEMP_IO_READ_TIME') as keyof typeof Property
        ]
      ] ||
      node[
        Property[
          (exclusivePrefix + 'TEMP_IO_WRITE_TIME') as keyof typeof Property
        ]
      ]
    "
  >
    <thead>
      <tr>
        <th class="text-nowrap">I/O Timings</th>
        <td class="text-end" width="50%">Read</td>
        <td class="text-end" width="50%">Write</td>
      </tr>
    </thead>
    <tbody>
      <!-- No temp IO: only one line for all IOs is needed -->
      <IoTimingsRow
        :node="node"
        v-if="
          node[
            Property[
              (exclusivePrefix + 'IO_READ_TIME') as keyof typeof Property
            ]
          ] ||
          node[
            Property[
              (exclusivePrefix + 'IO_WRITE_TIME') as keyof typeof Property
            ]
          ]
        "
        :exclusive="exclusive"
      />
      <IoTimingsRow
        :node="node"
        v-if="
          node[
            Property[
              (exclusivePrefix + 'SHARED_IO_READ_TIME') as keyof typeof Property
            ]
          ] ||
          node[
            Property[
              (exclusivePrefix +
                'SHARED_IO_WRITE_TIME') as keyof typeof Property
            ]
          ]
        "
        :scope="Scope.SHARED"
        :exclusive="exclusive"
      />
      <IoTimingsRow
        :node="node"
        v-if="
          node[
            Property[
              (exclusivePrefix + 'LOCAL_IO_READ_TIME') as keyof typeof Property
            ]
          ] ||
          node[
            Property[
              (exclusivePrefix + 'LOCAL_IO_WRITE_TIME') as keyof typeof Property
            ]
          ]
        "
        :scope="Scope.LOCAL"
        :exclusive="exclusive"
      />
      <IoTimingsRow
        :node="node"
        v-if="
          node[
            Property[
              (exclusivePrefix + 'TEMP_IO_READ_TIME') as keyof typeof Property
            ]
          ] ||
          node[
            Property[
              (exclusivePrefix + 'TEMP_IO_WRITE_TIME') as keyof typeof Property
            ]
          ]
        "
        :scope="Scope.TEMP"
        :exclusive="exclusive"
      />
    </tbody>
  </table>
</template>
