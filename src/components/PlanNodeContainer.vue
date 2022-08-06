<script setup lang="ts">
import PlanNode from "@/components/PlanNode.vue"

defineProps(["node", "plan"])
</script>

<template>
  <foreignObject>
    <plan-node
      :node="node.data"
      :plan="plan"
      class="d-flex justify-content-center"
    ></plan-node>
  </foreignObject>
</template>

<style>
foreignObject {
  overflow: visible;
}
</style>
