<script lang="ts" setup>
import { inject } from "vue"
import Plan from "@/components/Plan.vue"
import MainLayout from "../layouts/MainLayout.vue"

const planData = inject("planData")
</script>

<template>
  <main-layout :title="planData[2]">
    <plan
      v-if="planData[0]"
      :plan-source="planData[0]"
      :plan-query="planData[1]"
    />
  </main-layout>
</template>
