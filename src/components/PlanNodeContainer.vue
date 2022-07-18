<script setup lang="ts">
import PlanNode from "@/components/PlanNode.vue"

defineProps(["node", "plan", "viewOptions"])
</script>

<template>
  <foreignObject>
    <plan-node
      :node="node.data"
      :plan="plan"
      :viewOptions="viewOptions"
      class="d-flex justify-content-center"
    ></plan-node>
  </foreignObject>
</template>

<style>
foreignObject {
  overflow: visible;
}
</style>
