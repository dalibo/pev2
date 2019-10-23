<template>
  <div :class="['plan-container d-flex flex-column overflow-hidden flex-grow-1 bg-light', viewOptions.viewMode, viewOptions.orientation]">
    <div class="plan-stats d-flex border-bottom border-top form-inline" v-if="plan">
      <div class="d-inline-block px-2">
        Execution time:
        <template v-if="!plan.planStats.executionTime">
          <span class="text-muted">
            N/A
            <i class="fa fa-info-circle cursor-help" :title="getHelpMessage('missing execution time')"></i>
          </span>
        </template>
        <template v-else>
          <span class="stat-value" v-html="$options.filters.duration(plan.planStats.executionTime)"></span>
        </template>
      </div>
      <div class="d-inline-block border-left px-2">
        Planning time:
        <template v-if="!plan.planStats.planningTime">
          <span class="text-muted">
            N/A
            <i class="fa fa-info-circle cursor-help" :title="getHelpMessage('missing planning time')"></i>
          </span>
        </template>
        <template v-else>
          <span class="stat-value" v-html="$options.filters.duration(plan.planStats.planningTime)"></span>
        </template>
      </div>
      <div class="d-inline-block border-left px-2">
        Slowest:
        <template v-if="!plan.planStats.maxDuration">
          <span class="text-muted">
            N/A
            <i class="fa fa-info-circle cursor-help" :title="getHelpMessage('missing slowest')"></i>
          </span>
        </template>
        <template v-else>
          <span class="stat-value" v-html="$options.filters.duration(plan.planStats.maxDuration)"></span>
          <button class="bg-transparent border-0 p-0 m-0 pl-1" @click.prevent="showNode(plan.slowestNode, false, true)">
            <i class="fa fa-thumb-tack text-muted"></i>
          </button>
        </template>
      </div>
      <div class="d-inline-block border-left px-2">
        Largest:
        <template v-if="!plan.planStats.maxRows">
          <span class="text-muted">
            N/A
            <i class="fa fa-info-circle cursor-help" :title="getHelpMessage('no rows')"></i>
          </span>
        </template>
        <template v-else>
          <span class="stat-value">{{plan.planStats.maxRows | rows}} <span class="text-muted">rows</span></span>
        </template>
      </div>
      <div class="d-inline-block border-left px-2">
        Costliest:
        <template v-if="!plan.planStats.maxCost">
          <span class="text-muted">
            N/A
            <i class="fa fa-info-circle cursor-help" :title="getHelpMessage('missing costliest')"></i>
          </span>
        </template>
        <template v-else>
          <span>{{plan.planStats.maxCost | cost}}</span>
          <button class="bg-transparent border-0 p-0 m-0 pl-1" @click.prevent="showNode(plan.costliestNode, false, true)">
            <i class="fa fa-thumb-tack text-muted"></i>
          </button>
        </template>
      </div>
      <div v-if="plan.planStats.triggers.length" class="d-inline-block border-left px-2 position-relative">
        <span class="stat-label">Triggers: </span>
        <span class="stat-value">
          <span :class="'mb-0 p-0 px-1 alert ' + triggerDurationClass(totalTriggerDurationPercent)" v-html="$options.filters.duration(triggersTotalDuration)"></span>
        </span>
        <button @click.prevent="showTriggers = !showTriggers" class="bg-transparent border-0 p-0 m-0 pl-1">
          <i class="fa fa-caret-down text-muted"></i>
        </button>
        <div class="plan-triggers-container text-left" v-if="showTriggers">
          <button class="btn btn-close pull-right" v-on:click="showTriggers = false">
            <i class="fa fa-close"></i>
          </button>
          <h3>Triggers</h3>
          <div v-for="(trigger, index) in plan.planStats.triggers">
            {{ trigger['Trigger Name'] }}
            <br>
            <span class="text-muted">Called</span> {{ trigger['Calls'] }}<span class="text-muted">&times</span>
            <span class="float-right">
              <span :class="'p-0 px-1 alert ' + triggerDurationClass(triggerDurationPercent(trigger))" v-html="$options.filters.duration(trigger.Time)"></span>
              | {{ triggerDurationPercent(trigger) }}<span class="text-muted">%</span>
            </span>
            <br>
            <span class="text-muted" v-if="trigger.Relation">on</span>
            {{ trigger.Relation }}
            <div class="clearfix"></div>
            <hr v-if="index != plan.planStats.triggers.length - 1" class="my-2">
          </div>
        </div>
      </div>
      <button @click="showHideSource" :class="['btn btn-sm ml-auto p-0 px-2', {'text-primary': showSource}]" title="View source">
        <i class="fa fa-code p-0"></i>
      </button>
      <button v-on:click="showHideMenu" :class="['border-left btn btn-sm p-0 px-2', {'text-primary': !viewOptions.menuHidden}]">
        <i class="fa fa-cog p-0"></i>
      </button>
    </div>
    <div class="form-inline small border-bottom py-1" v-if="plan && !viewOptions.menuHidden && !showSource">
      <div class="btn-group btn-group-xs ml-auto mr-2">
        <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.FULL}" v-on:click="viewOptions.viewMode = viewModes.FULL">full</button>
        <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.COMPACT}" v-on:click="viewOptions.viewMode = viewModes.COMPACT">compact</button>
        <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.DOT}" v-on:click="viewOptions.viewMode = viewModes.DOT">dot</button>
      </div>
      <div class="btn-group btn-group-xs mr-2">
        <button class="btn btn-outline-secondary" :class="{'active': viewOptions.orientation == orientations.TWOD}" v-on:click="viewOptions.orientation = orientations.TWOD">
          <i class="fa fa-sitemap"></i>
          2D
        </button>
        <button class="btn btn-outline-secondary" :class="{'active': viewOptions.orientation == orientations.CLASSIC}" v-on:click="viewOptions.orientation = orientations.CLASSIC">
          <i class="fa fa-list"></i>
          classic
        </button>
      </div>
      <div class="form-group mr-2 pl-2 border-left">
        <label class="mr-2 text-muted">Graph metric:</label>
        <div class="btn-group btn-group-xs">
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.NONE}" v-on:click="viewOptions.highlightType = highlightTypes.NONE">none</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.DURATION}" v-on:click="viewOptions.highlightType = highlightTypes.DURATION" :disabled="!node[nodeProps.ACTUAL_DURATION]">duration</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.ROWS}" v-on:click="viewOptions.highlightType = highlightTypes.ROWS" :disabled="node[nodeProps.ACTUAL_ROWS] === undefined">rows</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.COST}" v-on:click="viewOptions.highlightType = highlightTypes.COST" :disabled="node[nodeProps.TOTAL_COST] === undefined">cost</button>
        </div>
      </div>
      <div class="form-check mr-2 pl-2 border-left">
        <input id="showCost" type="checkbox" v-model="viewOptions.showCost" class="form-check-input" :disabled="node[nodeProps.TOTAL_COST] === undefined">
        <label for="showCost" class="form-check-label">Cost</label>
      </div>
      <div class="form-check mr-2">
        <input id="showPlannerEstimate" type="checkbox" v-model="viewOptions.showPlannerEstimate" class="form-check-input">
        <label for="showPlannerEstimate" class="form-check-label">Estimations</label>
      </div>
    </div>

    <div v-if="validationMessage" class="h-100 w-100 d-flex justify-content-center">
      <div class="alert alert-danger align-self-center">{{validationMessage}}</div>
    </div>
    <div v-else-if="showSource" class="h-100 w-100 d-flex flex-column">
      <div class="h-100 w-100 d-flex flex-column">
        <ul class="nav nav-pills p-2">
          <li class="nav-item">
            <a href :class="['nav-link py-1', {'active': sourceTabActive == 'plan'}]" @click.prevent="sourceTabActive = 'plan'">Plan</a>
          </li>
          <li class="nav-item">
            <a href :class="['nav-link py-1', {'active': sourceTabActive == 'query'}]" @click.prevent="sourceTabActive = 'query'">Query</a>
          </li>
        </ul>
        <div class="flex-grow-1 flex-shrink-1 bg-dark overflow-auto tab-content px-2">
          <div :class="['tab-pane fade show', {'active': sourceTabActive == 'plan'}]">
            <pre class="small p-2 text-white mb-0"><code>{{ planSource }}</code></pre>
          </div>
          <div :class="['tab-pane fade show', {'active': sourceTabActive == 'query'}]">
            <div v-if="planQuery" class="bg-dark">
              <pre class="small p-2 text-white mb-0"><code>{{ planQuery }}</code></pre>
            </div>
            <div v-else class="text-white p-2">
              No query provided for this plan
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="overflow-auto flex-grow-1 flex-shrink-1 mt-1" v-else v-dragscroll v-on:mousedown="menuHidden = true">
      <div class="plan h-100 w-100 d-flex grab-bing">
        <ul class="node-children">
          <li>
            <plan-node :node="node" :plan="plan" :viewOptions="viewOptions" ref="root"/>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';

import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PlanNode from '@/components/PlanNode.vue';
import { HelpService, scrollChildIntoParentView } from '@/services/help-service';
import { PlanService } from '@/services/plan-service';
import { cost, duration, rows } from '@/filters';
import { HighlightType, NodeProp, Orientation, ViewMode } from '../enums';
import { IPlan } from '../iplan';

import VueDragscroll from 'vue-dragscroll';
Vue.use(VueDragscroll);

import { dragscroll } from 'vue-dragscroll';

@Component({
  name: 'plan',
  components: {
    PlanNode,
  },
  directives: {
    dragscroll,
  },
  filters: {
    cost,
    duration,
    rows,
  },
})
export default class Plan extends Vue {
  @Prop(String) private planSource!: string;
  @Prop(String) private planQuery!: string;
  private plan!: IPlan | null;
  private node!: any;
  private menuHidden: boolean = true;
  private validationMessage: string = '';
  private showTriggers: boolean = false;
  private showSource: boolean = false;
  private sourceTabActive: string = 'plan';

  private helpService = new HelpService();

  private viewOptions: any = {
    menuHidden: true,
    showHighlightBar: false,
    showPlannerEstimate: false,
    showCost: false,
    showPlanStats: true,
    highlightType: HighlightType.NONE,
    viewMode: ViewMode.FULL,
    orientation: Orientation.TWOD,
  };

  private highlightTypes = HighlightType;
  private viewModes = ViewMode;
  private orientations = Orientation;

  private planService = new PlanService();
  private nodeProps = NodeProp;

  private created(): void {
    const savedOptions = localStorage.getItem('viewOptions');
    if (savedOptions) {
      _.assignIn(this.viewOptions, JSON.parse(savedOptions));
    }
    let planJson: any;
    try {
      planJson = this.planService.fromSource(this.planSource);
      this.validationMessage = '';
    } catch (e) {
      this.validationMessage = 'Couldn\'t parse plan';
      this.plan = null;
      return;
    }
    this.node = planJson.Plan;
    this.plan = this.planService.createPlan('', planJson, this.planQuery);
    const content = this.plan.content;
    this.plan.planStats = {
      executionTime: content['Execution Time'] || content['Total Runtime'] || null,
      planningTime: content['Planning Time'] || null,
      maxRows: content.maxRows || null,
      maxCost: content.maxCost || null,
      maxDuration: content.maxDuration || null,
      triggers: content.Triggers || [],
    };

    window.setTimeout(() => {
      this.showNode(this.$refs.root as PlanNode, true, false);
    }, 200);
  }

  @Watch('viewOptions', {deep: true})
  private onViewOptionsChanged(val: any, oldVal: any) {
    localStorage.setItem('viewOptions', JSON.stringify(this.viewOptions));
  }

  private showHideMenu(): void {
    this.viewOptions.menuHidden = !this.viewOptions.menuHidden;
  }

  private showHideSource(): void {
    this.showSource = ! this.showSource;
  }

  private getHelpMessage(message: string) {
    return this.helpService.getHelpMessage(message);
  }

  private showNode(nodeCmp: PlanNode, shouldCenter: boolean, highlight: boolean) {
    const parent = document.querySelector('.plan-container .overflow-auto');
    if (!parent) {
      return;
    }
    const child = nodeCmp.$el.querySelector('.plan-node');

    if (child) {
      scrollChildIntoParentView(parent, child, shouldCenter, () => {
        if (highlight) {
          child.classList.add('highlight');
          setTimeout(() => {
            child.classList.remove('highlight');
          }, 1000);
        }
      });

    }
  }

  private get totalTriggerDurationPercent() {
    const plan = this.plan;
    const planStats = this.plan && this.plan.planStats;
    const executionTime = this.plan && this.plan.planStats.executionTime || 0;
    const totalDuration = this.triggersTotalDuration || 0;
    return _.round(totalDuration / executionTime * 100);
  }

  private triggerDurationPercent(trigger: any) {
    const plan = this.plan;
    const planStats = this.plan && this.plan.planStats;
    const executionTime = this.plan && this.plan.planStats.executionTime || 0;
    const time = trigger.Time;
    return _.round(time / executionTime * 100);
  }

  private triggerDurationClass(triggerDurationPercent: number) {
    let c;
    const i = triggerDurationPercent;
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

  private get triggersTotalDuration() {
    if (!this.plan) {
      return;
    }
    return _.sumBy(this.plan.planStats.triggers, (o) => o.Time);
  }
}
</script>

<style lang="scss">
@import '../assets/scss/plan';

</style>
