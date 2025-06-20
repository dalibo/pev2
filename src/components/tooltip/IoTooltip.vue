<script lang="ts" setup>
import { computed, reactive } from "vue"
import type { Node } from "@/interfaces"
import { NodeProp } from "@/enums"
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
        NodeProp[(exclusivePrefix + 'IO_READ_TIME') as keyof typeof NodeProp]
      ] ||
      node[
        NodeProp[(exclusivePrefix + 'IO_WRITE_TIME') as keyof typeof NodeProp]
      ] ||
      node[
        NodeProp[
          (exclusivePrefix + 'SHARED_IO_READ_TIME') as keyof typeof NodeProp
        ]
      ] ||
      node[
        NodeProp[
          (exclusivePrefix + 'SHARED_IO_WRITE_TIME') as keyof typeof NodeProp
        ]
      ] ||
      node[
        NodeProp[
          (exclusivePrefix + 'LOCAL_IO_READ_TIME') as keyof typeof NodeProp
        ]
      ] ||
      node[
        NodeProp[
          (exclusivePrefix + 'LOCAL_IO_WRITE_TIME') as keyof typeof NodeProp
        ]
      ] ||
      node[
        NodeProp[
          (exclusivePrefix + 'TEMP_IO_READ_TIME') as keyof typeof NodeProp
        ]
      ] ||
      node[
        NodeProp[
          (exclusivePrefix + 'TEMP_IO_WRITE_TIME') as keyof typeof NodeProp
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
      <io-timings-row
        :node="node"
        property=""
        :exclusive="exclusive"
        v-if="
          (node[
            NodeProp[
              (exclusivePrefix + 'IO_READ_TIME') as keyof typeof NodeProp
            ]
          ] ||
            node[
              NodeProp[
                (exclusivePrefix + 'IO_WRITE_TIME') as keyof typeof NodeProp
              ]
            ]) &&
          !(
            node[
              NodeProp[
                (exclusivePrefix + 'TEMP_IO_READ_TIME') as keyof typeof NodeProp
              ]
            ] ||
            node[
              NodeProp[
                (exclusivePrefix +
                  'TEMP_IO_WRITE_TIME') as keyof typeof NodeProp
              ]
            ]
          )
        "
      />
      <!-- temp IO along with generic IO: generic IO is for shared/local -->
      <io-timings-row
        :node="node"
        property=""
        v-if="
          (node[
            NodeProp[
              (exclusivePrefix + 'IO_READ_TIME') as keyof typeof NodeProp
            ]
          ] ||
            node[
              NodeProp[
                (exclusivePrefix + 'IO_WRITE_TIME') as keyof typeof NodeProp
              ]
            ]) &&
          (node[
            NodeProp[
              (exclusivePrefix + 'TEMP_IO_READ_TIME') as keyof typeof NodeProp
            ]
          ] ||
            node[
              NodeProp[
                (exclusivePrefix +
                  'TEMP_IO_WRITE_TIME') as keyof typeof NodeProp
              ]
            ])
        "
        name="Shared/Local"
        :exclusive="exclusive"
      />
      <io-timings-row
        :node="node"
        v-if="
          node[
            NodeProp[
              (exclusivePrefix + 'SHARED_IO_READ_TIME') as keyof typeof NodeProp
            ]
          ] ||
          node[
            NodeProp[
              (exclusivePrefix +
                'SHARED_IO_WRITE_TIME') as keyof typeof NodeProp
            ]
          ]
        "
        property="SHARED_"
        name="Shared"
        :exclusive="exclusive"
      />
      <io-timings-row
        :node="node"
        v-if="
          node[
            NodeProp[
              (exclusivePrefix + 'LOCAL_IO_READ_TIME') as keyof typeof NodeProp
            ]
          ] ||
          node[
            NodeProp[
              (exclusivePrefix + 'LOCAL_IO_WRITE_TIME') as keyof typeof NodeProp
            ]
          ]
        "
        property="LOCAL_"
        name="Local"
        :exclusive="exclusive"
      />
      <io-timings-row
        :node="node"
        v-if="
          node[
            NodeProp[
              (exclusivePrefix + 'TEMP_IO_READ_TIME') as keyof typeof NodeProp
            ]
          ] ||
          node[
            NodeProp[
              (exclusivePrefix + 'TEMP_IO_WRITE_TIME') as keyof typeof NodeProp
            ]
          ]
        "
        property="TEMP_"
        name="Temp"
        :exclusive="exclusive"
      />
    </tbody>
  </table>
</template>
