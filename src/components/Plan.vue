<template>
  <div class="plan-container">
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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PlanNode from './PlanNode.vue';
import { PlanService } from '../plan-service';
import { HighlightType, ViewMode } from '../enums';

@Component({
  components: {
    PlanNode,
  },
})
export default class Plan extends Vue {
  @Prop(Array) private planJson!: any[];
  @Prop(String) private planQuery!: string;
  private plan: any;
  private node!: any;
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
    this.loadPlan();
  }

  private loadPlan(): void {
    this.node = this.planJson[0].Plan;
    this.plan = this.planService.createPlan('', this.planJson, this.planQuery);
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
@import '../assets/scss/plan';

</style>
