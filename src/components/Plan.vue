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
          <span class="stat-value">
            <span :class="'mb-0 p-0 px-1 alert ' + planningTimeClass(plan.planStats.planningTime / plan.planStats.executionTime * 100)"
                   v-html="$options.filters.duration(plan.planStats.planningTime)"></span>
          </span>
        </template>
      </div>
      <div class="d-inline-block border-left px-2" v-if="plan.planStats.jitTime">
        JIT:
        <span class="stat-value">
          <span :class="'mb-0 p-0 px-1 alert ' + planningTimeClass(plan.planStats.jitTime / plan.planStats.executionTime * 100)"
                 v-html="$options.filters.duration(plan.planStats.jitTime)"></span>
        </span>
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
          <button class="bg-transparent border-0 p-0 m-0 pl-1" @click.prevent="showSlowestNode">
            <i class="fa fa-link text-muted"></i>
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
          <button class="bg-transparent border-0 p-0 m-0 pl-1" @click.prevent="showCostliestNode">
            <i class="fa fa-link text-muted"></i>
          </button>
        </template>
      </div>
      <div class="d-inline-block border-left px-2 position-relative">
        <span class="stat-label">Triggers: </span>
        <template v-if="plan.planStats.triggers.length">
          <span class="stat-value">
            <span :class="'mb-0 p-0 px-1 alert ' + durationClass(totalTriggerDurationPercent)" v-html="$options.filters.duration(triggersTotalDuration)"></span>
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
                <span :class="'p-0 px-1 alert ' + durationClass(triggerDurationPercent(trigger))" v-html="$options.filters.duration(trigger.Time)"></span>
                | {{ triggerDurationPercent(trigger) }}<span class="text-muted">%</span>
              </span>
              <br>
              <span class="text-muted" v-if="trigger.Relation">on</span>
              {{ trigger.Relation }}
              <div class="clearfix"></div>
              <hr v-if="index != plan.planStats.triggers.length - 1" class="my-2">
            </div>
          </div>
        </template>
        <span v-else class="text-muted">
          N/A
        </span>
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
      <div class="form-check mr-2 border-left pl-2">
        <input id="showDiagram" type="checkbox" v-model="viewOptions.showDiagram" class="form-check-input">
        <label for="showDiagram" class="form-check-label"><i class="fa fa-align-left"></i> Diagram</label>
      </div>
      <div class="form-group mr-2 pl-2 border-left">
        <label class="mr-2 text-muted">Graph metric:</label>
        <div class="btn-group btn-group-xs">
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.NONE}" v-on:click="viewOptions.highlightType = highlightTypes.NONE">none</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.DURATION}" v-on:click="viewOptions.highlightType = highlightTypes.DURATION" :disabled="!rootNode[nodeProps.ACTUAL_DURATION]">duration</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.ROWS}" v-on:click="viewOptions.highlightType = highlightTypes.ROWS" :disabled="rootNode[nodeProps.ACTUAL_ROWS] === undefined">rows</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.COST}" v-on:click="viewOptions.highlightType = highlightTypes.COST">cost</button>
        </div>
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
    <div v-else class="overflow-hidden flex-grow-1 flex-shrink-1 d-flex">
      <splitpanes class="default-theme" @resize="viewOptions.diagramWidth = $event[0].size">
        <pane ref="diagram"
          :size="viewOptions.diagramWidth"
          class="plan-diagram overflow-auto h-100"
          v-if="viewOptions.showDiagram"
        >
          <diagram :plan="plan" :showNode="showNode" :showCTE="showCTE"></diagram>
        </pane>
        <pane ref="plan" class="overflow-auto flex-grow-1 flex-shrink-1 p-1" v-on:mousedown="menuHidden = true">
          <div class="plan h-100 w-100 d-flex flex-column grab-bing">
            <ul class="main-plan">
              <li>
                <plan-node :node="rootNode" :plan="plan" :viewOptions="viewOptions" :showCTE="showCTE" ref="root"/>
              </li>
            </ul>
            <ul class="init-plans">
              <li v-for="node in plan.ctes">
                <plan-node :node="node" :plan="plan" :viewOptions="viewOptions" :showCTE="showCTE" ref="root"/>
              </li>
            </ul>
          </div>
        </pane>
      </splitpanes>
    </div>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import tippy from 'tippy.js';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';

import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PlanNode from '@/components/PlanNode.vue';
import Diagram from '@/components/Diagram.vue';
import { HelpService, scrollChildIntoParentView } from '@/services/help-service';
import { PlanService } from '@/services/plan-service';
import { cost, duration, durationClass, rows } from '@/filters';
import { HighlightType, NodeProp, Orientation, ViewMode } from '../enums';
import { IPlan } from '../iplan';
import Node from '../inode';

import Dragscroll from '@/dragscroll';

import VueTippy, { TippyComponent } from 'vue-tippy';
Vue.use(VueTippy);
Vue.component('tippy', TippyComponent);

@Component({
  name: 'plan',
  components: {
    PlanNode,
    Diagram,
    Splitpanes,
    Pane,
  },
  directives: {
  },
  filters: {
    cost,
    duration,
    durationClass,
    rows,
  },
})
export default class Plan extends Vue {
  public $refs!: {
    plan: InstanceType<typeof Pane>,
    root: PlanNode,
  };

  @Prop(String) private planSource!: string;
  @Prop(String) private planQuery!: string;
  private plan!: IPlan | null;
  private rootNode!: any;
  private flat: any[] = [];
  private menuHidden: boolean = true;
  private validationMessage: string = '';
  private showTriggers: boolean = false;
  private showSource: boolean = false;
  private sourceTabActive: string = 'plan';

  private helpService = new HelpService();
  private lodash = _;

  private viewOptions: any = {
    menuHidden: true,
    showHighlightBar: false,
    showPlanStats: true,
    highlightType: HighlightType.NONE,
    viewMode: ViewMode.FULL,
    orientation: Orientation.TWOD,
    showDiagram: true,
    diagramWidth: 20,
  };

  private highlightTypes = HighlightType;
  private viewModes = ViewMode;
  private orientations = Orientation;

  private planService = new PlanService();
  private nodeProps = NodeProp;

  private mounted(): void {
    this.handleScroll();
  }

  private handleScroll(): void {
    const el: Element = this.$refs.plan.$el as Element;
    const scroll = new Dragscroll(el);
  }

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
    this.rootNode = planJson.Plan;
    this.plan = this.planService.createPlan('', planJson, this.planQuery);
    const content = this.plan.content;
    this.plan.planStats = {
      executionTime: content['Execution Time'] || content['Total Runtime'] || null,
      planningTime: content['Planning Time'] || null,
      maxRows: content.maxRows || null,
      maxCost: content.maxCost || null,
      maxDuration: content.maxDuration || null,
      maxSharedBlocks: content.maxSharedBlocks || null,
      maxTempBlocks: content.maxTempBlocks || 0,
      triggers: content.Triggers || [],
      jitTime: content.JIT && content.JIT.Timing && content.JIT.Timing.Total || null,
    };

    Vue.nextTick(() => {
      this.showNode(this.rootNode, true, false);
      // build the diagram structure
      // with level and reference to PlanNode components for interaction
      if (!this.plan) {
        return;
      }
    });
  }

  @Watch('viewOptions', {deep: true})
  private onViewOptionsChanged(val: any, oldVal: any) {
    localStorage.setItem('viewOptions', JSON.stringify(this.viewOptions));
  }

  @Watch('showSource')
  private onShowSource(val: any) {
    // reactivate dragscroll when switching from source to plan
    if (!val) {
      Vue.nextTick(this.handleScroll);
    }
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

  private showSlowestNode() {
    this.showNode(this.plan!.content.slowest, true, true);
  }

  private showCostliestNode() {
    this.showNode(this.plan!.content.costliest, true, true);
  }

  private showNode(node: any, shouldCenter: boolean, highlight: boolean) {
    const cmp = _.find(this.plan!.nodeComponents, (c) => c.node === node);
    if (!cmp) {
      return;
    }
    this.highlightEl(cmp.$el.querySelector('.plan-node'), shouldCenter, highlight);
  }

  private highlightEl(el: Element | HTMLElement | null, shouldCenter: boolean, highlight: boolean) {
    if (!el) {
      return;
    }
    const parent = this.$refs.plan.$el;
    scrollChildIntoParentView(parent, el, shouldCenter, () => {
      if (highlight) {
        el.classList.add('highlight');
        setTimeout(() => {
          el.classList.remove('highlight');
        }, 1000);
      }
    });
  }

  private showCTE(cteName: string) {
    const cmp = _.find(this.plan!.nodeComponents, (c) => c.node[NodeProp.SUBPLAN_NAME] === cteName);
    if (!cmp) {
      return;
    }
    this.highlightEl(cmp.$el, false, true);
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

  private toggleDiagram(): void {
    this.viewOptions.showDiagram = !this.viewOptions.showDiagram;
  }

  private timelineTooltip(cmp: PlanNode): string {
    if (this.plan) {
      return [
        'Duration: ',
        duration(cmp.node[NodeProp.ACTUAL_DURATION], true),
        ' | ',
        cmp.executionTimePercent,
        '%',
      ].join('');
    }
    return '';
  }

  private durationClass(i: number) {
    let c;
    if (i > 90) {
      c = 4;
    } else if (i > 40) {
      c = 3;
    } else if (i > 10) {
      c = 2;
    } else {
      c = 1;
    }
    if (c) {
      return 'c-' + c;
    }
    return false;
  }

  private planningTimeClass(percent: number) {
    let c;
    if (percent > 90) {
      c = 4;
    } else if (percent > 40) {
      c = 3;
    } else if (percent > 10) {
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
@import '../assets/scss/plan-diagram';
</style>
