<template>
  <div id="app">
    <div class="plan">
      <ul>
        <li>
          <PlanNode :node="node" :plan="plan" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { PlanService } from './plan-service';
import PlanNode from './components/PlanNode.vue';
const SAMPLE_JSON = require('./plan.json')

@Component({
  components: {
    PlanNode,
  },
})
export default class App extends Vue {
  plan: any
  node = SAMPLE_JSON[0]['Plan']

  planService = new PlanService()

  created(): void {
    this.getPlan()
  }

  getPlan(): any {
    this.plan = this.planService.createPlan(null, SAMPLE_JSON, '')
    this.rootContainer = this.plan.content;
    this.plan.planStats = {
      executionTime: this.rootContainer['Execution Time'] || this.rootContainer['Total Runtime'],
      planningTime: this.rootContainer['Planning Time'] || 0,
      maxRows: this.rootContainer[this.planService.MAXIMUM_ROWS_PROP] || 0,
      maxCost: this.rootContainer[this.planService.MAXIMUM_COSTS_PROP] || 0,
      maxDuration: this.rootContainer[this.planService.MAXIMUM_DURATION_PROP] || 0
    };
  }
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
