<template>
  <div id="app">
    <div class="plan compact">
      <ul>
        <li>
          <PlanNode v-bind:node="node" msg="msg" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import PlanNode from './components/PlanNode.vue';
const SAMPLE_JSON = require('./plan.json')

@Component({
  components: {
    PlanNode,
  }
})
export default class App extends Vue {
  node = SAMPLE_JSON[0]['Plan']
}
</script>

<style lang="scss">
@import 'assets/scss/variables';
@import 'assets/scss/reset';
@import 'assets/scss/plan';
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
