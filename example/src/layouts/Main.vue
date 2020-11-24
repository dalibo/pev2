<template>
  <div class="d-flex flex-column vh-100">
    <div class="navbar container flex-shrink-0">
      <v-link class="btn btn-secondary ml-auto" to="/">New Plan</v-link>
      <v-link class="btn btn-link" to="/about">About</v-link>
    </div>
    <slot></slot>
  </div>
</template>

<script>
  import VLink from '../components/VLink.vue'
  export default {
    components: {
      VLink
    }
  }
</script>
