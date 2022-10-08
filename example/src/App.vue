<script setup>
import { ref, computed, provide } from "vue"
import AboutView from "./views/AboutView.vue"
import HomeView from "./views/HomeView.vue"
import NotFoundView from "./views/NotFoundView.vue"
import PlanView from "./views/PlanView.vue"

const routes = {
  "/": HomeView,
  "/about": AboutView,
  "/plan": PlanView,
}

const currentPath = ref("/")
provide("currentPath", currentPath)

const currentView = computed(() => {
  return routes[currentPath.value] || NotFoundView
})

const planData = ["", "", ""]
provide("planData", planData)

function setPlanData(name, plan, query) {
  planData[0] = plan
  planData[1] = query
  planData[2] = name
  currentPath.value = "/plan"
}
provide("setPlanData", setPlanData)
window.setPlanData = setPlanData
</script>

<template>
  <component :is="currentView" />
</template>
