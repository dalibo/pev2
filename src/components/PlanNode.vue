<template>
  <div :class="{'subplan': node[nodeProps.SUBPLAN_NAME], 'd-flex flex-column align-items-center': viewOptions.orientation == orientations.TWOD}">
    <h4 v-if="node[nodeProps.SUBPLAN_NAME]">{{ node[nodeProps.SUBPLAN_NAME] }}</h4>
    <div :class="['text-left plan-node', {'detailed': showDetails, 'never-executed': isNeverExecuted, 'parallel': workersCount}]">
      <div class="workers text-muted py-0 px-1" v-if="workersCount">
        <div v-for="index in workersCountReversed" :style="'top: ' + (1 + index * 2)  + 'px; left: ' + (1 + (index + 1) * 3) + 'px;'">
        </div>
      </div>
      <div class="collapse-handle" v-if="hasChildren">
        <i :class="['fa fa-fw', {'fa-compress': !collapsed, 'fa-expand': collapsed}]" v-on:click.stop="toggleCollapsed()" title="Collpase or expand child nodes"></i>
      </div>
      <div class="plan-node-body">
        <header title="view node details" v-on:click.stop="showDetails = !showDetails">
          <h4>
            {{ getNodeName() }}
          </h4>
          <span v-if="viewOptions.viewMode === viewModes.FULL">
            <span class="node-duration" v-if="node[nodeProps.ACTUAL_DURATION]">
              <span :class="'p-0 px-1 rounded alert ' + durationClass"
                v-html="$options.filters.duration(node[nodeProps.ACTUAL_DURATION])">
              </span>
              <template v-if="executionTimePercent !== Infinity">
                |
                <strong>{{executionTimePercent}}</strong><span class="text-muted">%</span>
              </template>
            </span>
            <span class="node-duration text-warning" v-else-if="isNeverExecuted">
              Never executed
            </span>
          </span>
        </header>

        <div v-if="viewOptions.viewMode === viewModes.FULL" class="font-italic text-left">
          <div v-if="node[nodeProps.RELATION_NAME]">
            <span class="text-muted">on </span>
            <span v-if="node[nodeProps.SCHEMA]">{{node[nodeProps.SCHEMA]}}.</span>{{node[nodeProps.RELATION_NAME]}}
            <span v-if="node[nodeProps.ALIAS]"> ({{node[nodeProps.ALIAS]}})</span>
          </div>

          <div v-if="node[nodeProps.GROUP_KEY]">
            <span class="text-muted">by</span> {{node[nodeProps.GROUP_KEY] | keysToString | truncate(250, '…') }}</div>
          <div v-if="node[nodeProps.SORT_KEY]">
            <span class="text-muted">by</span> {{node[nodeProps.SORT_KEY] | keysToString | truncate(250, '…') }}</div>
          <div v-if="node[nodeProps.JOIN_TYPE]">{{node[nodeProps.JOIN_TYPE] | keysToString | truncate(250, '…') }}
            <span class="text-muted">join</span></div>
          <div v-if="node[nodeProps.INDEX_NAME]"><span class="text-muted">
              using</span> {{node[nodeProps.INDEX_NAME] | keysToString }}</div>
          <div v-if="node[nodeProps.HASH_CONDITION]"><span class="text-muted">
              on</span> {{node[nodeProps.HASH_CONDITION] | keysToString }}</div>
          <div v-if="node[nodeProps.CTE_NAME]">
            <a class="text-reset" href v-on:click.prevent="showCTE(node[nodeProps.CTE_NAME])">
              <i class="fa fa-link text-muted"></i>&nbsp;
              <span class="text-muted">CTE</span> {{node[nodeProps.CTE_NAME]}}
            </a>
          </div>
        </div>

        <div v-if="!allWorkersLaunched && viewOptions.viewMode === viewModes.FULL" class="text-c-3 cursor-help" :title="getHelpMessage('workers planned not launched')">
          <i class="fa fa-exclamation-triangle"></i>&nbsp;
          <span>Not all workers launched</span>
        </div>

        <div v-if="lodash.isNumber(workersCount) && !lodash.isNaN(workersCount) && viewOptions.viewMode === viewModes.FULL">
          <span>Workers: </span>
          <span class="font-weight-bold">{{ workersCount }}</span>
        </div>

        <div class="clearfix"></div>

        <div v-if="viewOptions.highlightType !== highlightTypes.NONE && highlightValue !== null">
          <div class="progress node-bar-container" style="height: 5px;">
            <div class="progress-bar" role="progressbar" v-bind:style="{ width: barWidth + '%', 'background-color': getBarColor(barWidth)}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <span class="node-bar-label" v-if="shouldShowNodeBarLabel()">
            <span class="text-muted">{{viewOptions.highlightType}}:</span>&nbsp;
            <span v-html="highlightValue"></span>
          </span>
        </div>

        <div v-if="shouldShowCost && node[nodeProps.ACTUAL_COST]">
          <span>
            Cost:
            <span :class="'p-0 px-1 alert ' + costClass">{{node[nodeProps.ACTUAL_COST] | cost}}</span>
            |
            <span>{{ costPercent }}<span class="text-muted">%</span></span>
          </span>
        </div>

        <div v-if="shouldShowPlannerEstimate() && plannerRowEstimateDirection != estimateDirections.none && plannerRowEstimateValue">
          <span v-if="plannerRowEstimateDirection === estimateDirections.over"><strong><i class="fa fa-arrow-up"></i> over</strong> estimated rows</span>
          <span v-if="plannerRowEstimateDirection === estimateDirections.under"><strong><i class="fa fa-arrow-down"></i> under</strong> estimated rows</span>
          <span v-if="plannerRowEstimateValue != Infinity"> by
            <span :class="'p-0 px-1 alert ' + estimationClass">
              <strong v-html="$options.filters.factor(plannerRowEstimateValue)"></strong>
            </span>
          </span>
        </div>

        <div v-if="showDetails">
          <div v-if="getNodeTypeDescription()" class="node-description">
            <span class="node-type">{{node[nodeProps.NODE_TYPE]}} Node</span>&nbsp;<span v-html="getNodeTypeDescription()"></span>
          </div>
          <table class="table table-sm prop-list">
            <tr v-for="prop in props" v-if="shouldShowProp(prop.key, prop.value)">
              <td width="40%">{{prop.key}}</td>
              <td v-html="$options.filters.formatNodeProp(prop.key, prop.value, true)"></td>
            </tr>
          </table>
          <div v-if="workersCount">
            <div class="accordion" :id="'accordion-' + _uid" v-if="lodash.isArray(node[nodeProps.WORKERS])">
              <template v-for="(worker, index) in node[nodeProps.WORKERS]">
                <div class="card">
                  <div class="card-header p-0">
                    <button class="btn btn-link btn-sm text-secondary" type="button" data-toggle="collapse" :data-target="'#collapse-' + _uid + '-' + index" style="font-size: inherit;">
                      <i class="fa fa-chevron-right fa-fw"></i>
                      <i class="fa fa-chevron-down fa-fw"></i>
                      Worker {{ worker[workerProps.WORKER_NUMBER] }}
                    </button>
                  </div>

                  <div :id="'collapse-' + _uid + '-' + index" class="collapse" :data-parent="'#accordion-' + _uid">
                    <div class="card-body p-0">
                      <table class="table table-sm prop-list mb-0">
                        <tr v-for="(value, key) in worker" v-if="shouldShowProp(key, value)">
                          <td width="40%">{{key}}</td>
                          <td v-html="$options.filters.formatNodeProp(key, value, true)"></td>
                        </tr>
                      </table>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <div v-else class="font-italic">
              <strong>Workers</strong>: Detailed information not available.
              Consider using <code>EXPLAIN VERBOSE</code>.
            </div>
          </div>

          <div class="text-muted text-right"><em>* Calculated value</em></div>
        </div>

      </div>
    </div>
    <ul v-if="plans" :class="['node-children', {'collapsed': collapsed}]">
      <li v-for="subnode in plans">
        <plan-node :node="subnode" :plan="plan" :viewOptions="viewOptions" :showCTE="showCTE"/>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { HelpService } from '@/services/help-service';
import { ColorService } from '@/services/color-service';
import { cost, duration, factor, formatNodeProp, keysToString, truncate, rows } from '@/filters';
import { EstimateDirection, HighlightType, NodeProp, nodePropTypes, Orientation,
         PropType, ViewMode, WorkerProp } from '@/enums';
import * as _ from 'lodash';

@Component({
  name: 'plan-node',
  filters: {
    cost,
    duration,
    factor,
    formatNodeProp,
    keysToString,
    truncate,
    rows,
  },
})
export default class PlanNode extends Vue {
  @Prop(Object) public node!: any;
  public executionTimePercent: number = NaN;
  @Prop(Object) private plan!: any;
  @Prop(Object) private viewOptions!: any;
  @Prop() private showCTE!: () => void;

  // UI flags
  private showDetails: boolean = false;
  private collapsed: boolean = false;

  // calculated properties
  private costPercent: number = NaN;
  private barWidth: number = 0;
  private highlightValue?: string | null;
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
  private workerProps = WorkerProp;
  private helpService = new HelpService();
  private colorService = new ColorService();
  private lodash = _;

  private created(): void {
    this.calculateProps();
    this.calculateBar();
    this.calculateDuration();
    this.calculateCost();

    this.plans = this.node[NodeProp.PLANS];

    this.plannerRowEstimateDirection = this.node[NodeProp.PLANNER_ESTIMATE_DIRECTION];
    this.plannerRowEstimateValue = this.node[NodeProp.PLANNER_ESTIMATE_FACTOR];
    this.plan.nodeComponents.push(this);
  }

  private destroyed(): void {
    _.remove(this.plan.nodeComponents, (cmp) => cmp === this);
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
      .omit(NodeProp.WORKERS)
      .map((value, key) => {
        return { key, value };
      })
      .value();
  }

  private getNodeTypeDescription() {
    return this.helpService.getNodeTypeDescription(this.node[NodeProp.NODE_TYPE]);
  }

  private getNodeName(): string {
    let nodeName = this.isParallelAware ? 'Parallel ' : '';
    nodeName += this.node[NodeProp.NODE_TYPE];
    if (this.viewOptions.viewMode === ViewMode.DOT && !this.showDetails) {
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
  private calculateBar(): void {
    let value: number;
    if (!this.$options || !this.$options.filters) {
      return;
    }
    switch (this.viewOptions.highlightType) {
      case HighlightType.DURATION:
        value = (this.node[NodeProp.ACTUAL_DURATION]);
        if (value === undefined) {
          this.highlightValue = null;
          break;
        }
        this.barWidth = Math.round(value / this.plan.planStats.maxDuration * 100);
        this.highlightValue = this.$options.filters.duration(value);
        break;
      case HighlightType.ROWS:
        value = (this.node[NodeProp.ACTUAL_ROWS]);
        if (value === undefined) {
          this.highlightValue = null;
          break;
        }
        this.barWidth = Math.round(value / this.plan.planStats.maxRows * 100) || 0;
        this.highlightValue = this.$options.filters.rows(value);
        break;
      case HighlightType.COST:
        value = (this.node[NodeProp.ACTUAL_COST]);
        if (value === undefined) {
          this.highlightValue = null;
          break;
        }
        this.barWidth = Math.round(value / this.plan.planStats.maxCost * 100);
        this.highlightValue = this.$options.filters.cost(value);
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

  private toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  private get hasChildren(): boolean {
    return !!this.plans;
  }

  private get workersCount(): number {
    if (_.isArray(this.node[NodeProp.WORKERS])) {
      return this.node[NodeProp.WORKERS].length;
    }
    return parseInt(this.node[NodeProp.WORKERS], 0);
  }

  private get workersCountReversed(): number[] {
    return [...Array(this.workersCount).keys()].slice().reverse();
  }

  private get isParallelAware(): boolean {
    return this.node[NodeProp.PARALLEL_AWARE];
  }

  private get allWorkersLaunched(): boolean {
    return !this.node[NodeProp.WORKERS_LAUNCHED] ||
      this.node[NodeProp.WORKERS_PLANNED] === this.node[NodeProp.WORKERS_LAUNCHED];
  }

  private getHelpMessage(message: string) {
    return this.helpService.getHelpMessage(message);
  }

  private shouldShowProp(key: string, value: any): boolean {
    return value || nodePropTypes[key] === PropType.increment;
  }

  private get isNeverExecuted(): boolean {
    return this.plan.planStats.executionTime && !this.node[NodeProp.ACTUAL_LOOPS];
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
@import '../assets/scss/highlight';
</style>
