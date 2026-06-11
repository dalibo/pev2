<script lang="ts" setup>
import { inject } from "vue"

interface Props {
  to: string
}

const props = defineProps<Props>()

const currentPath = inject("currentPath")

const go = (event) => {
  event.preventDefault()
  currentPath.value = props.to
}
</script>

<template>
  <a v-bind:to="to" v-on:click="go" href>
    <slot></slot>
  </a>
</template>
