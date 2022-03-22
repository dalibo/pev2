<script lang="ts" setup>
import { ref } from "vue"
import useClipboard from "vue-clipboard3"
import { directive as vTippy } from "vue-tippy"

interface Props {
  content: string
}
const props = defineProps<Props>()
const copied = ref<boolean>(false)

function copyRaw() {
  const { toClipboard } = useClipboard()
  toClipboard(props.content)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="copy position-absolute" style="top: 0; right: 0">
    <button
      name="copyRawButton"
      class="btn btn-outline-secondary bg-light btn-sm m-2"
      :class="copied ? 'd-none' : 'd-block'"
      @click="copyRaw"
    >
      <i class="far fa-clipboard fa-fw"></i>
    </button>
    <button
      class="btn btn-outline-secondary bg-light btn-sm m-2"
      :class="copied ? 'd-block' : 'd-none'"
      @click="copyRaw"
      v-tippy="{ placement: 'left', arrow: true, content: 'copied' }"
    >
      <i class="fa fa-check fa-fw text-success"></i>
    </button>
  </div>
</template>
