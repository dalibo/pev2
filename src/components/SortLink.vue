<script lang="ts" setup>
import { inject } from "vue"
import { SortDirection } from "@/enums"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

interface Props {
  name: string
}
defineProps<Props>()

const dir = inject<string>("dir")
const sort = inject<string>("sort")
const sortBy = inject<(a: string) => void>("sortBy")
</script>

<template>
  <a href="#" @click.prevent="sortBy && sortBy(name)">
    <slot>{{ name }}</slot>
    <font-awesome-icon
      fixed-width
      icon="arrow-down-short-wide"
      v-if="sort == name && dir == SortDirection.asc"
    ></font-awesome-icon>
    <font-awesome-icon
      fixed-width
      icon="arrow-down-wide-short"
      v-else-if="sort == name && dir == SortDirection.desc"
    >
    </font-awesome-icon>
  </a>
</template>
