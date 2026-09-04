<script lang="ts" setup>
import VLink from "../components/VLink.vue"
import MainLayout from "../layouts/MainLayout.vue"
</script>

<template>
  <MainLayout>
    <div class="container text-center py-5">
      <h1 class="display-4">404</h1>
      <p class="lead text-body-secondary">Page not found</p>
      <VLink class="btn btn-primary" to="/">Return to Home</VLink>
    </div>
  </MainLayout>
</template>
