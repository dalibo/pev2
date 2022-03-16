<script lang="ts" setup>
import { inject } from "vue"
import Plan from "@/components/Plan.vue"
import MainLayout from "../layouts/MainLayout.vue"

const planData = inject("planData")
</script>

<template>
  <main-layout>
    <plan
      v-if="planData[0]"
      :plan-source="planData[0].value"
      :plan-query="planData[1].value"
    />
  </main-layout>
</template>
