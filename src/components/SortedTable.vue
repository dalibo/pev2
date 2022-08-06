<script lang="ts" setup>
import _ from "lodash"
import { computed, provide, ref } from "vue"
import { SortDirection } from "@/enums"

interface Props {
  values: object[]
  sort: string
  dir: SortDirection
}
const props = defineProps<Props>()

const sort = ref<string>(props.sort)
const dir = ref<SortDirection>(props.dir)

provide("sort", sort)
provide("dir", dir)
provide("sortBy", sortBy)

const sortedValues = computed((): object[] => {
  return _.orderBy(props.values, sort.value, dir.value)
})

function sortBy(s: string) {
  if (s === sort.value) {
    dir.value =
      dir.value === SortDirection.asc ? SortDirection.desc : SortDirection.asc
  }
  sort.value = s
}
</script>

<template>
  <table class="table">
    <slot></slot>
    <slot name="head"></slot>
    <slot name="body" :values="sortedValues"></slot>
    <slot name="foot"></slot>
  </table>
</template>
