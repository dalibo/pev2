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

      <div class="clearfix"></div>

      <div v-if="showQuery" class="plan-query-container">
        <button class="btn btn-close pull-right" v-on:click="showQuery = false">
          <i class="fa fa-close"></i>
        </button>
        <h3>query</h3>
        <pre class="plan-query-text"><code v-html="getFormattedQuery()"></code></pre>
      </div>

      <div class="tags" v-if="viewOptions.showTags && tags.length > 0">
        <span v-for="tag in tags">{{getTagName(tag)}}</span>
      </div>

      <div v-if="currentHighlightType !== highlightTypes.NONE">
        <div class="progress node-bar-container" style="height: 5px;">
          <div class="progress-bar" role="progressbar" v-bind:style="{ width: barWidth + '%', 'background-color': getBarColor(barWidth)}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <span class="node-bar-label" v-if="shouldShowNodeBarLabel()">
          <span class="text-muted">{{viewOptions.highlightType}}:</span> {{highlightValue}}
        </span>
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
import { ColorService } from '../color-service';
import { SyntaxHighlightService } from '../syntax-highlight-service';
import { duration, durationUnit } from '../filters';
import { EstimateDirection, HighlightType, ViewMode } from '../enums';
import * as _ from 'lodash';
import numeral from 'numeral';

@Component({
  filters: {
    duration,
    durationUnit,
  },
})
export default class PlanNode extends Vue {
  @Prop(Object) private node!: any;
  @Prop(Object) private plan!: any;
  @Prop(Object) private viewOptions!: any;

  private MIN_ESTIMATE_MISS: number = 100;
  private COSTLY_TAG: string = 'costliest';
  private SLOW_TAG: string = 'slowest';
  private LARGE_TAG: string = 'largest';
  private ESTIMATE_TAG: string = 'bad estimate';

  // UI flags
  private showDetails: boolean = false;
  private showQuery: boolean = false;

  // calculated properties
  private executionTimePercent: number = NaN;
  private barWidth: number = 0;
  private highlightValue?: string;
  private props: any[] = [];
  private tags: string[] = [];
  private plannerRowEstimateValue?: number;
  private plannerRowEstimateDirection?: EstimateDirection;

  // required for custom change detection
  private currentHighlightType?: string;
  private currentCompactView?: boolean;
  private currentExpandedView?: boolean;

  // expose enum to view
  private estimateDirections = EstimateDirection;
  private highlightTypes = HighlightType;
  private viewModes = ViewMode;

  private planService = new PlanService();
  private helpService = new HelpService();
  private colorService = new ColorService();
  private syntaxHighlightService = new SyntaxHighlightService();

  private created(): void {
    this.currentHighlightType = this.viewOptions.highlightType;
    this.calculateBar();
    this.calculateProps();
    this.calculateDuration();
    this.calculateTags();

    this.plannerRowEstimateDirection = this.node[this.planService.PLANNER_ESIMATE_DIRECTION];
    this.plannerRowEstimateValue = _.round(this.node[this.planService.PLANNER_ESTIMATE_FACTOR]);
  }

  private calculateDuration() {
    this.executionTimePercent = _.round(
      (this.node[this.planService.ACTUAL_DURATION_PROP] / this.plan.planStats.executionTime) * 100);
  }

  // create an array of node propeties so that they can be displayed in the view
  private calculateProps() {
    this.props = _.chain(this.node)
      .omit(this.planService.PLANS_PROP)
      .map((value, key) => {
        return { key, value };
      })
      .value();
  }

  private calculateTags() {
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

  private getNodeTypeDescription() {
    return this.helpService.getNodeTypeDescription(this.node[this.planService.NODE_TYPE_PROP]);
  }

  private getNodeName(): string {
    return (this.node['Node Type']).toUpperCase();
  }

  private getTagName(tagName: string) {
    if (this.viewOptions.viewMode === ViewMode.DOT && !this.showDetails) {
      return tagName.charAt(0);
    }
    return tagName;
  }

  private shouldShowPlannerEstimate() {
    if (this.viewOptions.showPlannerEstimate && this.showDetails) {
      return true;
    }

    if (this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }

    return this.viewOptions.showPlannerEstimate;
  }

  private shouldShowNodeBarLabel(): boolean {
    if (this.showDetails) {
      return true;
    }

    if (this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }

    return true;
  }

  private calculateBar() {
    let value: number;
    switch (this.currentHighlightType) {
      case HighlightType.DURATION:
        value = (this.node[this.planService.ACTUAL_DURATION_PROP]);
        this.barWidth = Math.round(value / this.plan.planStats.maxDuration * 100);
        this.highlightValue = duration(value) + durationUnit(value);
        break;
      case HighlightType.ROWS:
        value = (this.node[this.planService.ACTUAL_ROWS_PROP]);
        this.barWidth = Math.round(value / this.plan.planStats.maxRows * 100);
        this.highlightValue = numeral(value).format('0.00');
        break;
      case HighlightType.COST:
        value = (this.node[this.planService.ACTUAL_COST_PROP]);
        this.barWidth = Math.round(value / this.plan.planStats.maxCost * 100);
        this.highlightValue = numeral(value).format('0.00');
        break;
    }
  }

  private getBarColor(percent: number) {
    return this.colorService.numberToColorHsl(percent);
  }

  private getFormattedQuery(): string {
    const keyItems: string[] = [];

    // relation name will be highlighted for SCAN nodes
    const relationName: string = this.node[this.planService.RELATION_NAME_PROP];
    if (relationName) {
      keyItems.push(this.node[this.planService.SCHEMA_PROP] + '.' + relationName);
      keyItems.push(' ' + relationName);
      keyItems.push(' ' + this.node[this.planService.ALIAS_PROP] + ' ');
    }

    // group key will be highlighted for AGGREGATE nodes
    const groupKey: string[] = this.node[this.planService.GROUP_KEY_PROP];
    if (groupKey) {
      keyItems.push('GROUP BY ' + groupKey.join(','));
    }

    // hash condition will be highlighted for HASH JOIN nodes
    const hashCondition: string = this.node[this.planService.HASH_CONDITION_PROP];
    if (hashCondition) {
      keyItems.push(hashCondition.replace('(', '').replace(')', ''));
    }

    if (this.node[this.planService.NODE_TYPE_PROP].toUpperCase() === 'LIMIT') {
      keyItems.push('LIMIT');
    }
    return this.syntaxHighlightService.highlight(this.plan.query, keyItems);
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
@import '../assets/scss/highlight';
</style>
