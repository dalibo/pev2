<script lang="ts" setup>
import { ref } from "vue"
import useClipboard from "vue-clipboard3"
import { directive as vTippy } from "vue-tippy"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faCheck, faClipboard } from "@fortawesome/free-solid-svg-icons"

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
      class="btn btn-outline-secondary btn-sm m-2"
      :class="copied ? 'd-none' : 'd-block'"
      @click="copyRaw"
    >
      <FontAwesomeIcon fixed-width :icon="faClipboard" />
    </button>
    <button
      class="btn btn-outline-secondary btn-sm m-2"
      :class="copied ? 'd-block' : 'd-none'"
      @click="copyRaw"
      v-tippy="{ placement: 'left', arrow: true, content: 'copied' }"
    >
      <FontAwesomeIcon fixed-width :icon="faCheck" />
    </button>
  </div>
</template>
