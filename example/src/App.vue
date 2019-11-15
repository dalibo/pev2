<template>
  <div id="app" class="d-flex flex-column vh-100">
    <div class="navbar container">
      <router-link tag="a" class="btn btn-secondary ml-auto" to="/">
        New Plan
      </router-link>
      <router-link tag="a" class="btn btn-link" to="about">
        About
      </router-link>
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
export const planData: any[] = ['', ''];

@Component
export default class App extends Vue {}
</script>
