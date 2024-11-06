<template>
  <div ref="outerEl" @dblclick.stop>
    <div class="execution-memory-node">
      <header class="d-flex">
        <FontAwesomeIcon
          fixed-width
          :icon="faPizzaSlice"
          class="text-secondary py-1"
        ></FontAwesomeIcon>
        <span class="text-body px-1">
          Slice : {{ memoryDetails[SliceProp.SLICE_NUM] }}
        </span>
      </header>
      <header class="d-flex justify-content-between">
        <h4
          class="btn py-0 px-0 d-flex"
          @click.prevent.stop="showDetails = !showDetails"
        >
          <span class="text-secondary">
            <FontAwesomeIcon
              fixed-width
              :icon="faChevronUp"
              v-if="showDetails"
            ></FontAwesomeIcon>
            <FontAwesomeIcon
              fixed-width
              :icon="faChevronDown"
              v-else
            ></FontAwesomeIcon>
          </span>
          <span></span>
          ExecutorMemory
        </h4>
      </header>
      <div
        v-if="showDetails"
        class="d-flex flex-column justify-content-around px-3"
      >
        <span
          v-if="
            memoryDetails[SliceProp.EXECUTOR_MEMORY]?.[
              ExecutorMemoryEnum.AVERAGE_MEMORY
            ]
          "
          class="text-secondary"
        >
          Average memory :
          {{
            memoryDetails[SliceProp.EXECUTOR_MEMORY]?.[
              ExecutorMemoryEnum.AVERAGE_MEMORY
            ]
          }}
        </span>

        <span
          v-if="
            memoryDetails[SliceProp.EXECUTOR_MEMORY]?.[
              ExecutorMemoryEnum.NUMBER_OF_WORKER_THREADS
            ]
          "
          class="text-secondary"
        >
          Number of worker threads :
          {{
            memoryDetails[SliceProp.EXECUTOR_MEMORY]?.[
              ExecutorMemoryEnum.NUMBER_OF_WORKER_THREADS
            ]
          }}
        </span>

        <span
          v-if="
            memoryDetails[SliceProp.EXECUTOR_MEMORY]?.[
              ExecutorMemoryEnum.MAXIMUM_MEMORY
            ]
          "
          class="text-secondary"
        >
          Maximum memory :

          {{
            memoryDetails[SliceProp.EXECUTOR_MEMORY]?.[
              ExecutorMemoryEnum.MAXIMUM_MEMORY
            ]
          }}
        </span>
      </div>

      <span
        v-if="memoryDetails[SliceProp.WORK_MEMORY]"
        class="text-secondary mt-3 px-3"
      >
        WorkMemory : {{ memoryDetails[SliceProp.WORK_MEMORY] }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue"
import {
  faChevronDown,
  faChevronUp,
  faPizzaSlice,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { ExecutorMemoryEnum, SliceProp } from "@/enums"
import type { Slice } from "@/interfaces"

interface Props {
  memoryDetails: Slice
}

const props = defineProps<Props>()
const memoryDetails = reactive<Slice>(props.memoryDetails)
const showDetails = ref<boolean>(false)

const outerEl = ref<Element | null>(null)
</script>
