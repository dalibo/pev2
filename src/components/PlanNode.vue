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

      <div v-if="viewOptions.viewMode === viewModes.FULL">
        <div class="relation-name" v-if="node[planService.RELATION_NAME_PROP]">
          <span class="text-muted">on </span>
          <span v-if="node[planService.SCHEMA_PROP]">{{node[planService.SCHEMA_PROP]}}.</span>{{node[planService.RELATION_NAME_PROP]}}
          <span v-if="node[planService.ALIAS_PROP]"> ({{node[planService.ALIAS_PROP]}})</span>
        </div>

        <div class="relation-name" v-if="node[planService.GROUP_KEY_PROP]">
          <span class="text-muted">by</span> {{node[planService.GROUP_KEY_PROP]}}</div>
        <div class="relation-name" v-if="node[planService.SORT_KEY_PROP]">
          <span class="text-muted">by</span> {{node[planService.SORT_KEY_PROP]}}</div>
        <div class="relation-name" v-if="node[planService.JOIN_TYPE_PROP]">{{node[planService.JOIN_TYPE_PROP]}}
          <span class="text-muted">join</span></div>
        <div class="relation-name" v-if="node[planService.INDEX_NAME_PROP]"><span class="text-muted">
            using</span> {{node[planService.INDEX_NAME_PROP]}}</div>
        <div class="relation-name" v-if="node[planService.HASH_CONDITION_PROP]"><span class="text-muted">
            on</span> {{node[planService.HASH_CONDITION_PROP]}}</div>
        <div class="relation-name" v-if="node[planService.CTE_NAME_PROP]">
          <span class="text-muted">CTE</span> {{node[planService.CTE_NAME_PROP]}}
        </div>
      </div>

      <div class="tags" v-if="viewOptions.showTags && tags.length > 0">
        <span v-for="tag in tags">{{getTagName(tag)}}</span>
      </div>

      <div class="planner-estimate" v-if="shouldShowPlannerEstimate()">
        <span v-if="plannerRowEstimateDirection === estimateDirections.over"><strong>over</strong> estimated rows</span>
        <span v-if="plannerRowEstimateDirection === estimateDirections.under"><strong>under</strong> estimated rows</span>
        <span> by <strong>{{plannerRowEstimateValue}}</strong>x</span>
      </div>

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

  MIN_ESTIMATE_MISS: number = 100;
  COSTLY_TAG: string = 'costliest';
  SLOW_TAG: string = 'slowest';
  LARGE_TAG: string = 'largest';
  ESTIMATE_TAG: string = 'bad estimate';

  // UI flags
  showDetails: boolean = false;

  // calculated properties
  executionTimePercent: number = NaN;
  props: Array<any> = [];
  tags: Array<string> = [];
  plannerRowEstimateValue?: number;
  plannerRowEstimateDirection?: EstimateDirection;

  // expose enum to view
  estimateDirections = EstimateDirection;
  highlightTypes = HighlightType;
  viewModes = ViewMode;

  planService = new PlanService()
  helpService = new HelpService()

  created(): void {
    this.calculateProps()
    this.calculateDuration()
    this.calculateTags()

    this.plannerRowEstimateDirection = this.node[this.planService.PLANNER_ESIMATE_DIRECTION]
    this.plannerRowEstimateValue = _.round(this.node[this.planService.PLANNER_ESTIMATE_FACTOR])
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

  calculateTags() {
    if (this.node[this.planService.SLOWEST_NODE_PROP]) {
      this.tags.push(this.SLOW_TAG);
    }
    if (this.node[this.planService.COSTLIEST_NODE_PROP]) {
      this.tags.push(this.COSTLY_TAG);
    }
    if (this.node[this.planService.LARGEST_NODE_PROP]) {
      this.tags.push(this.LARGE_TAG);
    }
    if (this.node[this.planService.PLANNER_ESTIMATE_FACTOR] >= this.MIN_ESTIMATE_MISS) {
      this.tags.push(this.ESTIMATE_TAG);
    }
  }

  getNodeTypeDescription() {
    return this.helpService.getNodeTypeDescription(this.node[this.planService.NODE_TYPE_PROP])
  }

  getNodeName (): string {
    return (this.node['Node Type']).toUpperCase()
  }

  getTagName(tagName: string) {
    if (this.viewOptions.viewMode === ViewMode.DOT && !this.showDetails) {
      return tagName.charAt(0);
    }
    return tagName;
  }

  shouldShowPlannerEstimate() {
    if (this.viewOptions.showPlannerEstimate && this.showDetails) {
      return true;
    }

    if (this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }

    return this.viewOptions.showPlannerEstimate;
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
</style>
