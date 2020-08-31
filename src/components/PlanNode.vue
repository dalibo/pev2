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
      <div class="plan-node-body card"
           @mouseover="eventBus.$emit('mouseovernode', node)"
           @mouseout="eventBus.$emit('mouseoutnode', node)"
      >
        <div class="card-body header no-focus-outline"
            v-on:click.stop="showDetails = !showDetails"
            :content="(showDetails ? 'Hide' : 'View') + ' node details'"
            v-tippy="{arrow: true}"
        >
          <header class="mb-0">
            <h4>
              {{ getNodeName() }}
            </h4>
            <div class="float-right">
              <span v-if="durationClass" :class="'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' + durationClass" title="Slow"><i class="fa fa-fw fa-clock"></i></span>
              <span v-if="costClass" :class="'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' + costClass" title="Cost is high"><i class="fa fa-fw fa-dollar-sign"></i></span>
              <span v-if="estimationClass" :class="'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' + estimationClass" title="Bad estimation for number of rows"><i class="fa fa-fw fa-thumbs-down"></i></span>
              <span v-if="rowsRemovedClass" :class="'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' + rowsRemovedClass" title="High number of rows removed"><i class="fa fa-fw fa-filter"></i></span>
              <span v-if="heapFetchesClass" :class="'p-0  d-inline-block mb-0 ml-1 text-nowrap alert ' + heapFetchesClass" title="Heap Fetches number is high"><i class="fa fa-fw fa-exchange-alt"></i></span>
            </div>
            <span v-if="viewOptions.viewMode === viewModes.FULL">
              <span class="node-duration text-warning" v-if="isNeverExecuted">
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
              <a class="text-reset" href v-on:click.prevent="eventBus.$emit('clickcte', 'CTE ' + node[nodeProps.CTE_NAME])">
                <i class="fa fa-link text-muted"></i>&nbsp;
                <span class="text-muted">CTE</span> {{node[nodeProps.CTE_NAME]}}
              </a>
            </div>
          </div>

          <div v-if="!allWorkersLaunched && viewOptions.viewMode === viewModes.FULL" class="text-c-3 cursor-help" :title="getHelpMessage('workers planned not launched')">
            <i class="fa fa-exclamation-triangle"></i>&nbsp;
            <span>Not all workers launched</span>
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

        </div>

        <div v-if="showDetails" class="card-header border-top">
          <div v-if="getNodeTypeDescription()" class="node-description">
            <span class="node-type">{{node[nodeProps.NODE_TYPE]}} Node</span>&nbsp;<span v-html="getNodeTypeDescription()"></span>
          </div>
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <a class="nav-link" :class="{'active' : activeTab === 'general' }" @click.prevent="setActiveTab('general')" href>General</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-nowrap" :class="{'active' : activeTab === 'iobuffer' }" @click.prevent="setActiveTab('iobuffer')" href>IO & Buffers</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" :class="{'active' : activeTab === 'output', 'disabled': !node[nodeProps.OUTPUT] }" @click.prevent="setActiveTab('output')" href>Output</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" :class="{'active' : activeTab === 'workers', 'disabled': !workersCount  }" @click.prevent="setActiveTab('workers')" href>Workers</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" :class="{'active' : activeTab === 'misc' }" @click.prevent="setActiveTab('misc')" href>Misc</a>
            </li>
          </ul>
        </div>
        <div class="card-body tab-content" v-if="showDetails">
          <div class="tab-pane" :class="{'show active': activeTab === 'general' }">
            <!-- general -->
            <div v-if="node[nodeProps.EXCLUSIVE_DURATION]">
              <i class="fa fa-fw fa-clock text-muted"></i>
              <b>Timing:</b>&nbsp;
              <span :class="'p-0 px-1 rounded alert ' + durationClass" v-html="formattedProp('EXCLUSIVE_DURATION')"></span>
              <template v-if="executionTimePercent !== Infinity">
                |
                <strong>{{executionTimePercent}}</strong><span class="text-muted">%</span>
              </template>
            </div>
            <div>
              <i class="fa fa-fw fa-align-justify text-muted"></i>
              <b>Rows:</b> <span class="px-1">{{ formattedProp('ACTUAL_ROWS') }}</span> <span class="text-muted" v-if="node[nodeProps.PLAN_ROWS]">(Planned: {{ formattedProp('PLAN_ROWS') }})</span>
              <span v-if="plannerRowEstimateDirection !== estimateDirections.none && shouldShowPlannerEstimate">
                |
                <span v-if="plannerRowEstimateDirection === estimateDirections.over"><i class="fa fa-arrow-up"></i> over</span>
                <span v-if="plannerRowEstimateDirection === estimateDirections.under"><i class="fa fa-arrow-down"></i> under</span>
                estimated
                <span v-if="plannerRowEstimateValue != Infinity"> by
                  <span :class="'p-0 px-1 alert ' + estimationClass" v-html="formattedProp('PLANNER_ESTIMATE_FACTOR')"></span>
                </span>
              </span>
            </div>
            <div v-if="rowsRemoved">
              <i class="fa fa-fw fa-filter text-muted"></i>
              <b>
                {{ nodeProps[rowsRemovedProp] }}:
              </b>
              <span>
                <span class="px-1">{{ formattedProp(rowsRemovedProp) }}</span>|
                <span :class="'p-0 px-1 alert ' + rowsRemovedClass">{{ rowsRemovedPercent == 100 ? '>99' : rowsRemovedPercent }}%</span>
              </span>
            </div>
            <div v-if="node[nodeProps.HEAP_FETCHES]">
              <i class="fa fa-fw fa-exchange-alt text-muted"></i>
              <b>Heap Fetches:</b>&nbsp;
              <span :class="'p-0 px-1 rounded alert ' + heapFetchesClass" v-html="formattedProp('HEAP_FETCHES')"></span>
              &nbsp;
              <i class="fa fa-fw fa-info-circle text-muted" v-if="heapFetchesClass"
                content="Visibility map may be out-of-date. Consider using VACUUM or change autovacuum settings."
                v-tippy="{arrow: true}"
              ></i>
              </span>
            </div>
            <div v-if="node[nodeProps.EXCLUSIVE_COST]">
              <i class="fa fa-fw fa-dollar-sign text-muted"></i>
              <b>Cost:</b> <span :class="'p-0 px-1 mr-1 alert ' + costClass">{{ formattedProp('EXCLUSIVE_COST') }}</span> <span class="text-muted">(Total: {{ formattedProp('TOTAL_COST') }})</span>
            </div>
            <div v-if="node[nodeProps.ACTUAL_LOOPS] > 1">
              <i class="fa fa-fw fa-undo text-muted"></i>
              <b>Loops:</b> <span class="px-1">{{ formattedProp('ACTUAL_LOOPS') }}
              </span>
            </div>
            <!-- general tab -->
          </div>
          <div class="tab-pane" :class="{'show active': activeTab === 'iobuffer' }">
            <div v-if="node[nodeProps.EXCLUSIVE_IO_READ_TIME] || node[nodeProps.EXCLUSIVE_IO_WRITE_TIME]" class="mb-2">
              <b>
                I/O Timings:
              </b>
              <span v-if="node[nodeProps.EXCLUSIVE_IO_READ_TIME]" class="ml-2">
                <b>Read:&nbsp;</b>
                {{ formattedProp('EXCLUSIVE_IO_READ_TIME') }}
              </span>
              <span v-if="node[nodeProps.EXCLUSIVE_IO_WRITE_TIME]" class="ml-2">
                <b>Write:&nbsp;</b>
                {{ formattedProp('EXCLUSIVE_IO_WRITE_TIME') }}
              </span>
            </div>
            <!-- iobuffer tab -->
            <b>
              Blocks:
            </b>
            <table class="table table-sm">
              <tr>
                <td></td>
                <th class="text-right" width="25%">Hit</th>
                <th class="text-right" width="25%">Read</th>
                <th class="text-right" width="25%">Dirtied</th>
                <th class="text-right" width="25%">Written</th>
              </tr>
              <tr>
                <th>Shared</th>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_SHARED_HIT_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_SHARED_READ_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_SHARED_DIRTIED_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_SHARED_WRITTEN_BLOCKS') || '-'"></td>
              </tr>
              <tr>
                <th>Temp</th>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_TEMP_HIT_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_TEMP_READ_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_TEMP_DIRTIED_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_TEMP_WRITTEN_BLOCKS') || '-'"></td>
              </tr>
              <tr>
                <th>Local</th>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_LOCAL_HIT_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_LOCAL_READ_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_LOCAL_DIRTIED_BLOCKS') || '-'"></td>
                <td class="text-right" v-html="formattedProp('EXCLUSIVE_LOCAL_WRITTEN_BLOCKS') || '-'"></td>
              </tr>
            </table>
            <!-- iobuffer tab -->
          </div>
          <div class="tab-pane overflow-auto" :class="{'show active': activeTab === 'output' }" v-html="formattedProp('OUTPUT')" style="max-height: 200px">
            <!-- output tab -->
          </div>
          <div class="tab-pane" :class="{'show active': activeTab === 'workers' }" v-if="workersCount">

            <!-- workers tab -->
            <div v-if="lodash.isNumber(workersCount) && !lodash.isNaN(workersCount) && viewOptions.viewMode === viewModes.FULL">
              <b>Workers: </b> <span class="px-1">{{ workersCount }}</span>
            </div>
            <div class="accordion" v-if="lodash.isArray(node[nodeProps.WORKERS])">
              <template v-for="(worker, index) in node[nodeProps.WORKERS]">
                <div class="card">
                  <div class="card-header p-0">
                    <button class="btn btn-link btn-sm text-secondary" type="button" data-toggle="collapse" :data-target="'#collapse-' + _uid + '-' + index" style="font-size: inherit;">
                      <i class="fa fa-chevron-right fa-fw"></i>
                      <i class="fa fa-chevron-down fa-fw"></i>
                      Worker {{ worker[workerProps.WORKER_NUMBER] }}
                    </button>
                  </div>

                  <div :id="'collapse-' + _uid + '-' + index" class="collapse">
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
            <!-- workers tab -->
          </div>
          <div class="tab-pane" :class="{'show active': activeTab === 'misc'}">
            <!-- misc tab -->
            <table class="table table-sm prop-list">
              <tr v-for="prop in props" v-if="shouldShowProp(prop.key, prop.value)">
                <td width="40%">{{prop.key}}</td>
                <td v-html="$options.filters.formatNodeProp(prop.key, prop.value, true)"></td>
              </tr>
            </table>

            <div class="text-muted text-right"><em>* Calculated value</em></div>
            <!-- misc tab -->
          </div>
        </div>

      </div>
    </div>
    <ul v-if="plans" :class="['node-children', {'collapsed': collapsed}]">
      <li v-for="subnode in plans">
        <plan-node :node="subnode" :plan="plan" :viewOptions="viewOptions" :eventBus="eventBus"/>
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
  @Prop() private eventBus!: InstanceType<typeof Vue>;

  // UI flags
  private showDetails: boolean = false;
  private collapsed: boolean = false;
  private activeTab: string = 'general';

  // calculated properties
  private costPercent: number = NaN;
  private barWidth: number = 0;
  private highlightValue?: string | null;
  private props: any[] = [];
  private plans: any[] = [];
  private plannerRowEstimateValue?: number;
  private plannerRowEstimateDirection?: EstimateDirection;
  private rowsRemoved: number = NaN;
  private rowsRemovedPercent: number = NaN;

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

  // Returns the list of properties that have already been displayed either in
  // the main panel or in other detailed tabs.
  private notMiscProperties: string[] = [
      NodeProp.NODE_TYPE,
      NodeProp.CTE_NAME,
      NodeProp.EXCLUSIVE_DURATION,
      NodeProp.EXCLUSIVE_COST,
      NodeProp.TOTAL_COST,
      NodeProp.PLAN_ROWS,
      NodeProp.ACTUAL_ROWS,
      NodeProp.ACTUAL_LOOPS,
      NodeProp.OUTPUT,
      NodeProp.WORKERS,
      NodeProp.WORKERS_PLANNED,
      NodeProp.WORKERS_LAUNCHED,
      NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS,
      NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS,
      NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS,
      NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS,
      NodeProp.EXCLUSIVE_TEMP_HIT_BLOCKS,
      NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS,
      NodeProp.EXCLUSIVE_TEMP_DIRTIED_BLOCKS,
      NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS,
      NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS,
      NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS,
      NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS,
      NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS,
      NodeProp.SHARED_HIT_BLOCKS,
      NodeProp.SHARED_READ_BLOCKS,
      NodeProp.SHARED_DIRTIED_BLOCKS,
      NodeProp.SHARED_WRITTEN_BLOCKS,
      NodeProp.TEMP_HIT_BLOCKS,
      NodeProp.TEMP_READ_BLOCKS,
      NodeProp.TEMP_DIRTIED_BLOCKS,
      NodeProp.TEMP_WRITTEN_BLOCKS,
      NodeProp.LOCAL_HIT_BLOCKS,
      NodeProp.LOCAL_READ_BLOCKS,
      NodeProp.LOCAL_DIRTIED_BLOCKS,
      NodeProp.LOCAL_WRITTEN_BLOCKS,
      NodeProp.PLANNER_ESTIMATE_FACTOR,
      NodeProp.PLANNER_ESTIMATE_DIRECTION,
      NodeProp.SUBPLAN_NAME,
      NodeProp.GROUP_KEY,
      NodeProp.HASH_CONDITION,
      NodeProp.JOIN_TYPE,
      NodeProp.INDEX_NAME,
      NodeProp.HASH_CONDITION,
      NodeProp.EXCLUSIVE_IO_READ_TIME,
      NodeProp.EXCLUSIVE_IO_WRITE_TIME,
      NodeProp.IO_READ_TIME, // Exclusive value already shown in IO tab
      NodeProp.IO_WRITE_TIME, // Exclusive value already shown in IO tab
      NodeProp.HEAP_FETCHES,
  ];

  private created(): void {
    this.calculateProps();
    this.calculateBar();
    this.calculateDuration();
    this.calculateCost();
    this.calculateRowsRemoved();

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
      (this.node[NodeProp.EXCLUSIVE_DURATION] / executionTime) * 100);
  }

  private calculateCost() {
    const maxTotalCost = this.plan.content.maxTotalCost;
    this.costPercent = _.round((this.node[NodeProp.EXCLUSIVE_COST] / maxTotalCost) * 100);
  }

  private get rowsRemovedProp() {
    const nodeKey = Object.keys(this.node).find(
      (key) => key === NodeProp.ROWS_REMOVED_BY_FILTER || key === NodeProp.ROWS_REMOVED_BY_JOIN_FILTER,
    );
    type NodePropStrings = keyof typeof NodeProp;
    return Object.keys(NodeProp).find((prop) => NodeProp[prop as NodePropStrings] === nodeKey);
  }

  private calculateRowsRemoved() {
    const rowsRemovedProp = this.rowsRemovedProp;

    if (rowsRemovedProp) {
      type NodePropStrings = keyof typeof NodeProp;
      const removed = this.node[NodeProp[rowsRemovedProp as NodePropStrings]];
      this.rowsRemoved = removed;
      const actual = this.node[NodeProp.ACTUAL_ROWS];
      this.rowsRemovedPercent = _.floor(removed / (removed + actual) * 100);
    }
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

  private get shouldShowPlannerEstimate() {
    if ((this.collapsed && !this.showDetails) || this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }
    return (this.estimationClass || this.showDetails) &&
      this.plannerRowEstimateDirection !== EstimateDirection.none &&
      this.plannerRowEstimateValue;
  }

  private get shouldShowCost() {
    if ((this.collapsed && !this.showDetails) || this.viewOptions.viewMode === ViewMode.DOT) {
      return false;
    }

    return this.node[NodeProp.EXCLUSIVE_COST] && (this.costClass || this.showDetails);
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

  private get shouldShowRowsRemoved(): boolean {
    return !!this.rowsRemovedClass && this.viewOptions.viewMode === ViewMode.FULL && !this.collapsed;
  }

  @Watch('viewOptions.highlightType')
  private calculateBar(): void {
    let value: number;
    if (!this.$options || !this.$options.filters) {
      return;
    }
    switch (this.viewOptions.highlightType) {
      case HighlightType.DURATION:
        value = (this.node[NodeProp.EXCLUSIVE_DURATION]);
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
        value = (this.node[NodeProp.EXCLUSIVE_COST]);
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

  private get rowsRemovedClass() {
    let c;
    // high percent of rows removed is relevant only when duration is high
    // as well
    const i = this.rowsRemovedPercent * this.executionTimePercent;
    if (i > 2000) {
      c = 4;
    } else if (i > 500) {
      c = 3;
    }
    if (c) {
      return 'c-' + c;
    }
    return false;
  }

  private get heapFetchesClass() {
    let c;
    const i = this.node[NodeProp.HEAP_FETCHES] /
      (this.node[NodeProp.ACTUAL_ROWS] +
       (this.node[NodeProp.ROWS_REMOVED_BY_FILTER] || 0) +
       (this.node[NodeProp.ROWS_REMOVED_BY_JOIN_FILTER] || 0)
      ) * 100;
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

    return (value ||
            nodePropTypes[key] === PropType.increment ||
            key === NodeProp.ACTUAL_ROWS) &&
           this.notMiscProperties.indexOf(key) === -1;
  }

  private get isNeverExecuted(): boolean {
    return this.plan.planStats.executionTime && !this.node[NodeProp.ACTUAL_LOOPS];
  }

  private get hasSeveralLoops(): boolean {
    return this.node[NodeProp.ACTUAL_LOOPS] > 1;
  }

  private get tilde(): string {
    return this.hasSeveralLoops ? '~' : '';
  }

  private setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // returns the formatted prop
  private formattedProp(propName: keyof typeof NodeProp) {
    const property = NodeProp[propName];
    const value = this.node[property];
    if (!value) {
      return '';
    }
    return this.$options!.filters!.formatNodeProp(property, value, true);
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
</style>
