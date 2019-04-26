<template>
  <div id="app">

    <div class="menu small p-2 bg-light border rounded" :class="{'menu-hidden': hideMenu}">
      <header>
        <button v-on:click="hideMenu = !hideMenu" class="btn p-0">
          <i class="fa fa-cogs"></i>
        </button>
      </header>
      <ul>
        <li>
          <input id="showPlannerEstimate" type="checkbox" v-model="viewOptions.showPlannerEstimate">
          <label class="clickable" for="showPlannerEstimate"> show planner estimate</label>
        </li>
        <li>
          <input id="showTags" type="checkbox" v-model="viewOptions.showTags">
          <label class="clickable" for="showTags"> show analysis tags</label>
        </li>
        <li>
          <label>view mode: </label>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.FULL}" v-on:click="viewOptions.viewMode = viewModes.FULL">full</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.COMPACT}" v-on:click="viewOptions.viewMode = viewModes.COMPACT">compact</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.DOT}" v-on:click="viewOptions.viewMode = viewModes.DOT">dot</button>
          </div>
        </li>

        <li>
          <label>graph metric: </label>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.NONE}" v-on:click="viewOptions.highlightType = highlightTypes.NONE">none</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.DURATION}" v-on:click="viewOptions.highlightType = highlightTypes.DURATION">duration</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.ROWS}" v-on:click="viewOptions.highlightType = highlightTypes.ROWS">rows</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.COST}" v-on:click="viewOptions.highlightType = highlightTypes.COST">cost</button>
          </div>
        </li>
      </ul>
    </div>

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
const SAMPLE_QUERY = `SELECT c.state,
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
ORDER BY c.state, sum(o.totalamount) DESC LIMIT 10 OFFSET 1`;

@Component({
  components: {
    PlanNode,
  },
})
export default class App extends Vue {
  private plan: any;
  private node = SAMPLE_JSON[0].Plan;
  private rootContainer: any;
  private hideMenu: boolean = true;

  private viewOptions: any = {
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
@import 'assets/scss/fonts';

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  .menu {
    position: absolute;
    z-index: 1;

    &-hidden {

      ul, h3 {
        display: none;
      }
    }
  }
}
</style>
