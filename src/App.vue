<template>
  <div id="app">
    <div class="plan">
      <ul>
        <li>
          <PlanNode :node="node" :plan="plan" :viewOptions="viewOptions"/>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { PlanService } from './plan-service';
import PlanNode from './components/PlanNode.vue';
import { HighlightType, ViewMode } from './enums';

import SAMPLE_JSON from './plan.json';
const SAMPLE_QUERY = `
SELECT c.state,
  cat.categoryname,
  sum(o.netamount),
  sum(o.totalamount)
FROM customers c
  INNER JOIN cust_hist ch ON c.customerid = ch.customerid
  INNER JOIN orders o ON ch.orderid = o.orderid
  INNER JOIN orderlines ol ON ol.orderid = o.orderid
  INNER JOIN products p ON ol.prod_id = p.prod_id
  INNER JOIN categories cat ON p.category = cat.category
GROUP BY c.state, cat.categoryname
ORDER BY c.state, sum(o.totalamount) DESC
LIMIT 10 OFFSET 1`;

@Component({
  components: {
    PlanNode,
  },
})
export default class App extends Vue {
  private plan: any;
  private node = SAMPLE_JSON[0].Plan;
  private rootContainer: any;

  private viewOptions: any = {
    showPlanStats: true,
    showHighlightBar: true,
    showPlannerEstimate: true,
    showTags: true,
    highlightType: HighlightType.DURATION,
    viewMode: ViewMode.FULL,
  };

  private highlightTypes = HighlightType;
  private viewModes = ViewMode;

  private planService = new PlanService();

  private created(): void {
    this.getPlan();
  }

  private getPlan(): any {
    this.plan = this.planService.createPlan('', SAMPLE_JSON, SAMPLE_QUERY);
    this.rootContainer = this.plan.content;
    this.plan.planStats = {
      executionTime: this.rootContainer['Execution Time'] || this.rootContainer['Total Runtime'],
      planningTime: this.rootContainer['Planning Time'] || 0,
      maxRows: this.rootContainer[this.planService.MAXIMUM_ROWS_PROP] || 0,
      maxCost: this.rootContainer[this.planService.MAXIMUM_COSTS_PROP] || 0,
      maxDuration: this.rootContainer[this.planService.MAXIMUM_DURATION_PROP] || 0,
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
  background-color: #f7f7f7;
}
</style>
