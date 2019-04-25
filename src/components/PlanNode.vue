<template>
  <div>
    <div :class="['plan-node', {'expanded': showDetails}]">
      <header title="view node details" v-on:click="showDetails = !showDetails">
        <h4>
          {{ getNodeName() }}
        </h4>
        <span>
          <span class="node-duration">{{node[planService.ACTUAL_DURATION_PROP] | duration}}<span class="text-muted">{{node[planService.ACTUAL_DURATION_PROP] | durationUnit}} | </span>
          <strong>{{executionTimePercent}}</strong><span class="text-muted">%</span>
          </span>
        </span>
      </header>

      <button v-if="plan.query && viewOptions.viewMode === viewModes.FULL" title="view corresponding query"
        class="btn btn-sm btn-default btn-slim pull-right" v-on:click="showQuery = !showQuery">
        <i class="fa fa-database"></i>
      </button>

      <div v-if="showDetails">
        <div v-if="getNodeTypeDescription()" class="node-description">
          <span class="node-type">{{node[planService.NODE_TYPE_PROP]}} Node</span>&nbsp;<span v-html="getNodeTypeDescription()"></span>
        </div>
        <table class="table table-sm prop-list">
          <tr v-for="prop in props">
            <td width="40%">{{prop.key}}</td>
            <td>{{prop.value}}</td>
          </tr>
        </table>

        <div class="text-muted text-right"><em>* Calculated value</em></div>
      </div>

    </div>
    <ul v-if="node.Plans">
      <li v-for="subnode in node.Plans">
        <PlanNode :node="subnode" :plan="plan" :viewOptions="viewOptions"/>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PlanService } from '../plan-service';
import { HelpService } from '../help-service';
import { duration, durationUnit } from '../filters';
import { EstimateDirection, HighlightType, ViewMode } from '../enums';
import * as _ from 'lodash';

@Component({
  filters: {
    duration: duration,
    durationUnit: durationUnit,
  }
})
export default class PlanNode extends Vue {
  @Prop(Object) private node!: any;
  @Prop(Object) private plan!: any;
  @Prop(Object) private viewOptions!: any;

  // UI flags
  showDetails: boolean = false;

  // calculated properties
  executionTimePercent: number = NaN;
  props: Array<any>;

  // expose enum to view
  estimateDirections = EstimateDirection;
  highlightTypes = HighlightType;
  viewModes = ViewMode;

  planService = new PlanService()
  helpService = new HelpService()

  created(): void {
    this.calculateProps();
    this.calculateDuration()
  }

  getNodeTypeDescription() {
    return this.helpService.getNodeTypeDescription(this.node[this.planService.NODE_TYPE_PROP])
  }

  getNodeName (): string {
    return (this.node['Node Type']).toUpperCase()
  }

  calculateDuration() {
    this.executionTimePercent = _.round((this.node[this.planService.ACTUAL_DURATION_PROP] / this.plan.planStats.executionTime) * 100)
  }

  // create an array of node propeties so that they can be displayed in the view
  calculateProps() {
    this.props = _.chain(this.node)
      .omit(this.planService.PLANS_PROP)
      .map((value, key) => {
        return { key: key, value: value };
      })
      .value();
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
</style>
