<template>
  <div :class="{'subplan': node[nodeProps.SUBPLAN_NAME], 'd-flex flex-column align-items-center': viewOptions.orientation == orientations.TWOD}">
    <h4 v-if="node[nodeProps.SUBPLAN_NAME]">{{ node[nodeProps.SUBPLAN_NAME] }}</h4>
    <div :id="'node-' + node.nodeId" :class="['text-left plan-node', {'detailed': showDetails, 'never-executed': !node[nodeProps.ACTUAL_DURATION]}]">
      <div class="collapse-handle" v-if="hasChildren">
        <i :class="['fa fa-fw', {'fa-compress': !collapsed, 'fa-expand': collapsed}]" v-on:click.stop="toggleCollapsed()" title="Collpase or expand child nodes"></i>
      </div>
      <header title="view node details" v-on:click.stop="showDetails = !showDetails">
        <h4>
          {{ getNodeName() }}
        </h4>
        <span v-if="viewOptions.viewMode === viewModes.FULL">
          <span class="node-duration" v-if="node[nodeProps.ACTUAL_DURATION]">
            <span :class="'p-0 px-1 rounded alert ' + durationClass">
              <strong>{{node[nodeProps.ACTUAL_DURATION] | duration}}</strong>{{node[nodeProps.ACTUAL_DURATION] | durationUnit}}</span>
            <template v-if="executionTimePercent !== Infinity">
              |
              <strong>{{executionTimePercent}}</strong><span class="text-muted">%</span>
            </template>
          </span>
          <span class="node-duration text-warning" v-else>
            Never executed
          </span>
        </span>
      </header>

      <button v-if="plan.query && viewOptions.viewMode === viewModes.FULL" title="view corresponding query"
        class="btn btn-sm pull-right py-0 btn-link" v-on:click="showQuery = !showQuery">
        <small>
          <i class="fa fa-database"></i>
        </small>
      </button>

      <div v-if="viewOptions.viewMode === viewModes.FULL" class="font-italic text-left">
        <div v-if="node[nodeProps.RELATION_NAME]">
          <span class="text-muted">on </span>
          <span v-if="node[nodeProps.SCHEMA]">{{node[nodeProps.SCHEMA]}}.</span>{{node[nodeProps.RELATION_NAME]}}
          <span v-if="node[nodeProps.ALIAS]"> ({{node[nodeProps.ALIAS]}})</span>
        </div>

        <div v-if="node[nodeProps.GROUP_KEY]">
          <span class="text-muted">by</span> {{node[nodeProps.GROUP_KEY] | keysToString }}</div>
        <div v-if="node[nodeProps.SORT_KEY]">
          <span class="text-muted">by</span> {{node[nodeProps.SORT_KEY] | keysToString }}</div>
        <div v-if="node[nodeProps.JOIN_TYPE]">{{node[nodeProps.JOIN_TYPE] | keysToString }}
          <span class="text-muted">join</span></div>
        <div v-if="node[nodeProps.INDEX_NAME]"><span class="text-muted">
            using</span> {{node[nodeProps.INDEX_NAME] | keysToString }}</div>
        <div v-if="node[nodeProps.HASH_CONDITION]"><span class="text-muted">
            on</span> {{node[nodeProps.HASH_CONDITION] | keysToString }}</div>
        <div v-if="node[nodeProps.CTE_NAME]">
          <span class="text-muted">CTE</span> {{node[nodeProps.CTE_NAME]}}
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

      <div v-if="viewOptions.highlightType !== highlightTypes.NONE">
        <div class="progress node-bar-container" style="height: 5px;">
          <div class="progress-bar" role="progressbar" v-bind:style="{ width: barWidth + '%', 'background-color': getBarColor(barWidth)}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <span class="node-bar-label" v-if="shouldShowNodeBarLabel()">
          <span class="text-muted">{{viewOptions.highlightType}}:</span> {{highlightValue}}
        </span>
      </div>

      <div v-if="shouldShowCost">
        <span>
          Cost:
          <strong :class="'p-0 px-1 alert ' + costClass">{{lodash.round(node[nodeProps.ACTUAL_COST])}}</strong>
          |
          <span>{{ costPercent }}<span class="text-muted">%</span></span>
          </span>
      </div>

      <div v-if="shouldShowPlannerEstimate() && plannerRowEstimateDirection != estimateDirections.none">
        <span v-if="plannerRowEstimateDirection === estimateDirections.over"><strong><i class="fa fa-arrow-up"></i> over</strong> estimated rows</span>
        <span v-if="plannerRowEstimateDirection === estimateDirections.under"><strong><i class="fa fa-arrow-down"></i> under</strong> estimated rows</span>
        <span v-if="plannerRowEstimateValue != Infinity"> by
        <span :class="'p-0 px-1 alert ' + estimationClass">
          <strong>{{plannerRowEstimateValue}}</strong>x</span>
        </span>
      </div>

      <div v-if="showDetails">
        <div v-if="getNodeTypeDescription()" class="node-description">
          <span class="node-type">{{node[nodeProps.NODE_TYPE]}} Node</span>&nbsp;<span v-html="getNodeTypeDescription()"></span>
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
    <ul v-if="plans" :class="{'collapsed': collapsed}">
      <li v-for="subnode in plans">
        <plan-node :node="subnode" :plan="plan" :viewOptions="viewOptions"/>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { HelpService } from '@/services/help-service';
import { ColorService } from '@/services/color-service';
import { SyntaxHighlightService } from '@/services/syntax-highlight-service';
import { duration, durationUnit, keysToString } from '@/filters';
import { EstimateDirection, HighlightType, NodeProp, Orientation, ViewMode } from '@/enums';
import * as _ from 'lodash';
import numeral from 'numeral';

@Component({
  name: 'plan-node',
  filters: {
    duration,
    durationUnit,
    keysToString,
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

  // UI flags
  private showDetails: boolean = false;
  private showQuery: boolean = false;
  private collapsed: boolean = false;

  // calculated properties
  private executionTimePercent: number = NaN;
  private costPercent: number = NaN;
  private barWidth: number = 0;
  private highlightValue?: string;
  private props: any[] = [];
  private plans: any[] = [];
  private plannerRowEstimateValue?: number;
  private plannerRowEstimateDirection?: EstimateDirection;

  // required for custom change detection
  private currentCompactView?: boolean;

  // expose enum to view
  private estimateDirections = EstimateDirection;
  private highlightTypes = HighlightType;
  private viewModes = ViewMode;
  private orientations = Orientation;

  private nodeProps = NodeProp;
  private helpService = new HelpService();
  private colorService = new ColorService();
  private syntaxHighlightService = new SyntaxHighlightService();
  private lodash = _;

  private created(): void {
    this.calculateBar();
    this.calculateProps();
    this.calculateDuration();
    this.calculateCost();

    this.plans = this.node[NodeProp.PLANS];

    this.plannerRowEstimateDirection = this.node[NodeProp.PLANNER_ESIMATE_DIRECTION];
    this.plannerRowEstimateValue = _.round(this.node[NodeProp.PLANNER_ESTIMATE_FACTOR]);
  }

  private calculateDuration() {
    // use the first node total time if plan execution time is not available
    const executionTime = this.plan.planStats.executionTime || this.plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME];
    this.executionTimePercent = _.round(
      (this.node[NodeProp.ACTUAL_DURATION] / executionTime) * 100);
  }

  private calculateCost() {
    const planCost = this.plan.content.Plan[NodeProp.TOTAL_COST];
    this.costPercent = _.round((this.node[NodeProp.ACTUAL_COST] / planCost) * 100);
  }

  // create an array of node propeties so that they can be displayed in the view
  private calculateProps() {
    this.props = _.chain(this.node)
      .omit(NodeProp.PLANS)
      .map((value, key) => {
        return { key, value };
      })
      .value();
  }

  private getNodeTypeDescription() {
    return this.helpService.getNodeTypeDescription(this.node[NodeProp.NODE_TYPE]);
  }

  private getNodeName(): string {
    const nodeName = this.node[NodeProp.NODE_TYPE];
    if ((this.collapsed || this.viewOptions.viewMode === ViewMode.DOT) && !this.showDetails) {
      return nodeName.replace(/[^A-Z]/g, '').toUpperCase();
    }
    return nodeName.toUpperCase();
  }

  private shouldShowPlannerEstimate() {
    if (this.viewOptions.showPlannerEstimate && this.showDetails) {
      return true;
    }

    if (this.collapsed || this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }

    return this.viewOptions.showPlannerEstimate;
  }

  private get shouldShowCost() {
    if (this.viewOptions.showCost && this.showDetails) {
      return true;
    }

    if (this.collapsed || this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }

    return this.viewOptions.showCost;
  }

  private shouldShowNodeBarLabel(): boolean {
    if (this.showDetails) {
      return true;
    }

    if (this.collapsed || this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }

    return true;
  }

  @Watch('viewOptions.highlightType')
  private calculateBar() {
    let value: number;
    switch (this.viewOptions.highlightType) {
      case HighlightType.DURATION:
        value = (this.node[NodeProp.ACTUAL_DURATION]);
        this.barWidth = Math.round(value / this.plan.planStats.maxDuration * 100);
        this.highlightValue = duration(value) + durationUnit(value);
        break;
      case HighlightType.ROWS:
        value = (this.node[NodeProp.ACTUAL_ROWS]);
        this.barWidth = Math.round(value / this.plan.planStats.maxRows * 100) || 0;
        this.highlightValue = numeral(value).format('0');
        break;
      case HighlightType.COST:
        value = (this.node[NodeProp.ACTUAL_COST]);
        this.barWidth = Math.round(value / this.plan.planStats.maxCost * 100);
        this.highlightValue = numeral(value).format('0.00');
        break;
    }
  }

  private getBarColor(percent: number) {
    return this.colorService.numberToColorHsl(percent);
  }

  private get durationClass() {
    let c;
    const i = this.executionTimePercent;
    if (i > 90) {
      c = 4;
    } else if (i > 40) {
      c = 3;
    } else if (i > 10) {
      c = 2;
    }
    if (c) {
      return 'c-' + c;
    }
    return false;
  }

  private get estimationClass() {
    let c;
    const i = this.node[NodeProp.PLANNER_ESTIMATE_FACTOR];
    if (i > 1000) {
      c = 4;
    } else if (i > 100) {
      c = 3;
    } else if (i > 10) {
      c = 2;
    }
    if (c) {
      return 'c-' + c;
    }
    return false;
  }

  private get costClass() {
    let c;
    const i = this.costPercent;
    if (i > 90) {
      c = 4;
    } else if (i > 40) {
      c = 3;
    } else if (i > 10) {
      c = 2;
    }
    if (c) {
      return 'c-' + c;
    }
    return false;
  }

  private getFormattedQuery(): string {
    const keyItems: string[] = [];

    // relation name will be highlighted for SCAN nodes
    const relationName: string = this.node[NodeProp.RELATION_NAME];
    if (relationName) {
      keyItems.push(this.node[NodeProp.SCHEMA] + '.' + relationName);
      keyItems.push(' ' + relationName);
      keyItems.push(' ' + this.node[NodeProp.ALIAS] + ' ');
    }

    // group key will be highlighted for AGGREGATE nodes
    const groupKey: string[] = this.node[NodeProp.GROUP_KEY];
    if (groupKey) {
      keyItems.push('GROUP BY ' + groupKey.join(', '));
    }

    // hash condition will be highlighted for HASH JOIN nodes
    let hashCondition: string = this.node[NodeProp.HASH_CONDITION];
    if (hashCondition) {
      hashCondition = hashCondition.replace('(', '').replace(')', '');
      keyItems.push(hashCondition);

      // also use reversed condition
      keyItems.push(_.reverse(hashCondition.split(' ')).join(' '));
    }

    let sortKey: string[] = this.node[NodeProp.SORT_KEY];
    if (sortKey) {
      sortKey = _.map(sortKey, (k) => k.replace('(', '').replace(')', ''));
      keyItems.push('ORDER BY ' + sortKey.join(', '));
    }

    if (this.node[NodeProp.NODE_TYPE].toUpperCase() === 'LIMIT') {
      keyItems.push('LIMIT');
    }
    return this.syntaxHighlightService.highlight(this.plan.query, keyItems);
  }

  private toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  private get hasChildren(): boolean {
    return !!this.plans;
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
@import '../assets/scss/highlight';
</style>
