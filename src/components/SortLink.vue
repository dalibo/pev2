<script lang="ts" setup>
import { inject } from "vue"
import { SortDirection } from "@/enums"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faArrowDownShortWide,
  faArrowDownWideShort,
} from "@fortawesome/free-solid-svg-icons"

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
    <FontAwesomeIcon
      fixed-width
      :icon="faArrowDownShortWide"
      v-if="sort == name && dir == SortDirection.asc"
    ></FontAwesomeIcon>
    <FontAwesomeIcon
      fixed-width
      :icon="faArrowDownWideShort"
      v-else-if="sort == name && dir == SortDirection.desc"
    >
    </FontAwesomeIcon>
  </a>
</template>
