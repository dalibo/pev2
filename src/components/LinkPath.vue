<script lang="ts" setup>
import { reactive, ref, onMounted } from "vue"
import gsap from "gsap"

interface Props {
  duration: number
}
const props = defineProps<Props>()

const el = ref()
const length = ref<number>(0)
const offset = reactive({
  number: 0,
})

onMounted(() => {
  length.value = el.value.getTotalLength()
  if (!el.value.classList.contains("never-executed")) {
    gsap.to(offset, {
      duration: props.duration,
      number: Number(length.value * 2) || 0,
      repeat: Infinity,
      ease: "linear",
    })
  }
})
</script>
<template>
  <path
    ref="el"
    stroke="grey"
    :stroke-dasharray="length"
    :stroke-dashoffset="offset.number"
  />
</template>
