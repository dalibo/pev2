<template>
  <a
    v-bind:to="to"
    v-on:click="go"
    href
  >
    <slot></slot>
  </a>
</template>

<script>

  export default {
    props: {
      to: {
        type:String,
        required: true
      }
    },
    methods: {
      go (event) {
        event.preventDefault()
        this.$root.currentRoute = this.to
      }
    }
  }
</script>
