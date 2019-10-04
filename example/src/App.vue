<template>
  <div id="app" class="d-flex flex-column vh-100">
    <div class="navbar container">
      <router-link tag="button" class="btn btn-secondary ml-auto" to="/">
        New Plan
      </router-link>
      <router-link tag="a" class="btn btn-link" to="about">
        About
      </router-link>
    </div>
    <div class="container">
      <div class="alert alert-warning">
        This is the demo application for <a href="https://github.com/dalibo/pev2">PEV2</a>. It is serverless and doesn't store your plans.
        <br>
        Please consider using <a href="https://explain.dalibo.com">explain.dalibo.com</a> instead if you want to save or share your plans.
      </div>
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
