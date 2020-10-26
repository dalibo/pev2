<template>
  <div class="plan-container d-flex flex-column overflow-hidden flex-grow-1 bg-light">
    <div>
      <ul class="nav nav-pills">
        <li class="nav-item p-1">
          <a class="nav-link px-2 py-0" :class="{'active' : activeTab === 'plan' }" @click.prevent="setActiveTab('plan')" href>Plan</a>
        </li>
        <li class="nav-item p-1">
          <a class="nav-link px-2 py-0" :class="{'active' : activeTab === 'raw' }" @click.prevent="setActiveTab('raw')" href>Raw</a>
        </li>
        <li class="nav-item p-1">
          <a class="nav-link px-2 py-0" :class="{'active' : activeTab === 'query', 'disabled': !queryText }" @click.prevent="setActiveTab('query')" href>Query</a>
        </li>
        <li class="nav-item p-1">
          <a class="nav-link px-2 py-0" :class="{'active' : activeTab === 'stats' }" @click.prevent="setActiveTab('stats')" href>Stats</a>
        </li>
      </ul>
    </div>


    <div class="tab-content flex-grow-1 d-flex overflow-hidden">
      <div v-if="validationMessage" class="flex-grow-1 d-flex justify-content-center">
        <div class="alert alert-danger align-self-center">{{validationMessage}}</div>
      </div>
      <div class="tab-pane flex-grow-1 overflow-hidden" :class="{'show active d-flex': activeTab === 'plan' }" v-if="!validationMessage">
        <!-- Plan tab -->
        <div class="d-flex flex-column flex-grow-1 overflow-hidden"
           :class="[viewOptions.viewMode, viewOptions.orientation]">
          <div class="plan-stats flex-shrink-0 d-flex border-bottom border-top form-inline" v-if="plan">
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
            <div class="d-inline-block border-left px-2 position-relative">
              <span class="stat-label">Triggers: </span>
              <template v-if="plan.planStats.triggers.length">
                <span class="stat-value">
                  <span :class="'mb-0 p-0 px-1 alert ' + $options.filters.durationClass(totalTriggerDurationPercent)" v-html="$options.filters.duration(triggersTotalDuration)"></span>
                </span>
                <button @click.prevent="showTriggers = !showTriggers" class="bg-transparent border-0 p-0 m-0 pl-1">
                  <i class="fa fa-caret-down text-muted"></i>
                </button>
                <div class="plan-triggers-container text-left" v-if="showTriggers">
                  <button class="btn btn-close float-right" v-on:click="showTriggers = false">
                    <i class="fa fa-times"></i>
                  </button>
                  <h3>Triggers</h3>
                  <div v-for="(trigger, index) in plan.planStats.triggers">
                    {{ trigger['Trigger Name'] }}
                    <br>
                    <span class="text-muted">Called</span> {{ trigger['Calls'] }}<span class="text-muted">&times</span>
                    <span class="float-right">
                      <span :class="'p-0 px-1 alert ' + $options.filters.durationClass(triggerDurationPercent(trigger))" v-html="$options.filters.duration(trigger.Time)"></span>
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
            <div class="d-inline-block border-left px-2 position-relative" v-if="plan.planStats.settings">
              <span class="stat-label">Settings: <span class="badge badge-secondary">{{ lodash.keys(plan.planStats.settings).length }}</span></span>
              <button @click.prevent="showSettings = !showSettings" class="bg-transparent border-0 p-0 m-0 pl-1">
                <i class="fa fa-caret-down text-muted"></i>
              </button>
              <div class="plan-triggers-container text-left" v-if="showSettings">
                <button class="btn btn-close float-right" v-on:click="showSettings = false">
                  <i class="fa fa-times"></i>
                </button>
                <h3>PG Settings</h3>
                <em class="text-muted d-block pb-2">
                Configuration parameters affecting query planning with value different from the built-in default value.
                </em>
                <table class="table table-sm table-striped mb-0">
                  <tbody>
                    <tr v-for="(value, key) in plan.planStats.settings">
                      <td>{{ key }}</td>
                      <td>{{ value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <button v-on:click="showHideMenu" :class="['border-left btn btn-sm p-0 px-2 ml-auto', {'text-primary': !viewOptions.menuHidden}]">
              <i class="fa fa-cog p-0"></i> Settings
            </button>
          </div>
          <div class="flex-grow-1 d-flex overflow-hidden">
            <div class="flex-grow-1 overflow-hidden">
              <splitpanes class="default-theme" @resize="viewOptions.diagramWidth = $event[0].size">
                <pane ref="diagram"
                      :size="viewOptions.diagramWidth"
                      class="d-flex"
                      v-if="viewOptions.showDiagram"
                      >
                      <diagram
                        :plan="plan"
                        :eventBus="eventBus"
                        class="d-flex flex-column flex-grow-1 overflow-hidden plan-diagram"
                        >
                      </diagram>
                </pane>
                <pane ref="plan" class="plan d-flex flex-column flex-grow-1 grab-bing overflow-auto">
                  <ul class="main-plan p-2 mb-0">
                    <li>
                      <plan-node :node="rootNode" :plan="plan" :viewOptions="viewOptions" :eventBus="eventBus" ref="root"/>
                    </li>
                  </ul>
                  <ul class="init-plans p-2 mb-0" v-if="plan.ctes.length">
                    <li v-for="node in plan.ctes">
                      <plan-node :node="node" :plan="plan" :viewOptions="viewOptions" :eventBus="eventBus" ref="root"/>
                    </li>
                  </ul>
                </pane>
              </splitpanes>
            </div>
            <div class="small p-2 border-left" v-if="plan && !viewOptions.menuHidden">
              <div class="text-right clearfix">
                <button type="button" class="close" aria-label="Close" @click="viewOptions.menuHidden = true">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="form-check">
                <input id="showDiagram" type="checkbox" v-model="viewOptions.showDiagram" class="form-check-input">
                <label for="showDiagram" class="form-check-label"><i class="fa fa-align-left"></i> Diagram</label>
              </div>
              <hr>
              <label class="text-uppercase">Density</label>
              <div class="form-group">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.FULL}" v-on:click="viewOptions.viewMode = viewModes.FULL">full</button>
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.COMPACT}" v-on:click="viewOptions.viewMode = viewModes.COMPACT">compact</button>
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.DOT}" v-on:click="viewOptions.viewMode = viewModes.DOT">dot</button>
                </div>
              </div>
              <hr>
              <label class="text-uppercase">Orientation</label>
              <div class="form-group">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.orientation == orientations.TWOD}" v-on:click="viewOptions.orientation = orientations.TWOD">
                    <i class="fa fa-sitemap"></i>
                    2D
                  </button>
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.orientation == orientations.CLASSIC}" v-on:click="viewOptions.orientation = orientations.CLASSIC">
                    <i class="fa fa-list"></i>
                    classic
                  </button>
                </div>
              </div>
              <hr>
              <label class="text-uppercase">Graph metric</label>
              <div class="form-group">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.NONE}" v-on:click="viewOptions.highlightType = highlightTypes.NONE">none</button>
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.DURATION}" v-on:click="viewOptions.highlightType = highlightTypes.DURATION" :disabled="!rootNode[nodeProps.EXCLUSIVE_DURATION]">duration</button>
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.ROWS}" v-on:click="viewOptions.highlightType = highlightTypes.ROWS" :disabled="rootNode[nodeProps.ACTUAL_ROWS] === undefined">rows</button>
                  <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.COST}" v-on:click="viewOptions.highlightType = highlightTypes.COST">cost</button>
                </div>
              </div>
            </div>
          </div>
        <!-- end Plan tab -->
        </div>
      </div>
      <div class="tab-pane flex-grow-1 overflow-auto" :class="{'show active': activeTab === 'raw' }">
        <pre class="small p-2 mb-0"><code v-html="$options.filters.json(planSource)"></code></pre>
      </div>
      <div class="tab-pane flex-grow-1 overflow-auto" :class="{'show active': activeTab === 'query' }" v-if="queryText">
        <pre class="small p-2 mb-0"><code v-html="$options.filters.pgsql(queryText)"></code></pre>
      </div>
      <div class="tab-pane flex-grow-1 overflow-auto" :class="{'show active': activeTab === 'stats' }">
        <stats
          :plan="plan"
        >
        </stats>
      </div>
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
import Stats from '@/components/Stats.vue';
import { HelpService, scrollChildIntoParentView } from '@/services/help-service';
import { PlanService } from '@/services/plan-service';
import { cost, duration, durationClass, json, pgsql, rows } from '@/filters';
import { CenterMode, HighlightMode, HighlightType, NodeProp, Orientation, ViewMode } from '../enums';
import { IPlan } from '../iplan';
import Node from '../inode';

import Dragscroll from '@/dragscroll';

import VueTippy, { TippyComponent } from 'vue-tippy';
Vue.use(VueTippy);
Vue.component('tippy', TippyComponent);

@Component({
  name: 'plan',
  components: {
    Diagram,
    Pane,
    PlanNode,
    Splitpanes,
    Stats,
  },
  directives: {
  },
  filters: {
    cost,
    duration,
    durationClass,
    json,
    pgsql,
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
  @Prop(Number) private zoomTo!: number;
  private queryText!: string;
  private plan!: IPlan | null;
  private rootNode!: any;
  private flat: any[] = [];
  private menuHidden: boolean = true;
  private validationMessage: string = '';
  private showTriggers: boolean = false;
  private showSettings: boolean = false;
  private activeTab: string = '';
  private highlightTimeout!: number;

  private helpService = new HelpService();
  private lodash = _;

  private eventBus = new Vue();

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
    this.eventBus.$on('mouseovernode', this.onMouseOverNode);
    this.eventBus.$on('mouseoutnode', this.onMouseOutNode);
    this.eventBus.$on('clicknode', this.centerNode);
    this.eventBus.$on('clickcte', this.centerCTE);
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
      this.setActiveTab('plan');
    } catch (e) {
      this.validationMessage = 'Couldn\'t parse plan';
      this.plan = null;
      return;
    }
    this.rootNode = planJson.Plan;
    this.queryText = planJson['Query Text'] || this.planQuery;
    this.plan = this.planService.createPlan('', planJson, this.queryText);
    const content = this.plan.content;
    this.plan.planStats = {
      executionTime: content['Execution Time'] || content['Total Runtime'] || null,
      planningTime: content['Planning Time'] || null,
      maxRows: content.maxRows || null,
      maxCost: content.maxCost || null,
      maxDuration: content.maxDuration || null,
      maxBlocks: content.maxBlocks || null,
      triggers: content.Triggers || [],
      jitTime: content.JIT && content.JIT.Timing && content.JIT.Timing.Total || null,
      settings: content.Settings,
    };

    Vue.nextTick(() => {
      let node;
      let highlightMode = HighlightMode.flash;
      if (this.zoomTo) {
        const cmp = this.plan!.nodeComponents[this.zoomTo];
        node = cmp ? cmp.node : undefined;
        // tslint:disable-next-line:no-bitwise
        highlightMode = HighlightMode.highlight | HighlightMode.showdetails;
      } else {
        node = this.rootNode;
      }
      if (node) {
        this.centerNode(node, CenterMode.visible, highlightMode);
      }
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

  private showHideMenu(): void {
    this.viewOptions.menuHidden = !this.viewOptions.menuHidden;
  }

  private getHelpMessage(message: string) {
    return this.helpService.getHelpMessage(message);
  }

  private showSlowestNode() {
    this.centerNode(this.plan!.content.slowest, CenterMode.center, HighlightMode.flash);
  }

  private showCostliestNode() {
    this.centerNode(this.plan!.content.costliest, CenterMode.center, HighlightMode.flash);
  }

  private centerNode(node: any, centerMode: CenterMode, highlightMode: HighlightMode) {
    const cmp = _.find(this.plan!.nodeComponents, (c) => c.node === node);
    if (!cmp) {
      return;
    }
    this.highlightEl(cmp.$el.querySelector('.plan-node'), centerMode, highlightMode);
    // tslint:disable-next-line:no-bitwise
    if (highlightMode & HighlightMode.showdetails) {
      cmp.setShowDetails(true);
    }
  }

  private highlightEl(el: Element | HTMLElement | null, centerMode: CenterMode, highlightMode: HighlightMode) {
    if (!el) {
      return;
    }
    const parent = this.$refs.plan.$el;
    if (centerMode !== CenterMode.none) {
      scrollChildIntoParentView(parent, el, centerMode === CenterMode.center, () => {
        // tslint:disable-next-line:no-bitwise
        if (highlightMode & HighlightMode.flash) {
          el.classList.add('flash');
          setTimeout(() => {
            el.classList.remove('flash');
          }, 1000);
        }
        // tslint:disable-next-line:no-bitwise
        if (highlightMode & HighlightMode.highlight) {
          el.classList.add('highlight');
        }
      });
    }
  }

  private highlightNode(node: any, highlight: boolean) {
    const highlighted = this.$el.querySelector('.plan-node.highlight');
    if (highlighted) {
      highlighted.classList.remove('highlight');
    }

    window.clearTimeout(this.highlightTimeout);
    this.highlightTimeout = window.setTimeout((() => {
      const cmp = _.find(this.plan!.nodeComponents, (c) => c.node === node);
      if (!cmp) {
        return;
      }
      const el = cmp.$el.querySelector('.plan-node');
      el!.classList.toggle('highlight', highlight);
    }).bind(this), 50);
  }

  private centerCTE(cteName: string) {
    const cmp = _.find(this.plan!.nodeComponents, (c) => c.node[NodeProp.SUBPLAN_NAME] === cteName);
    if (!cmp) {
      return;
    }
    this.highlightEl(cmp.$el, CenterMode.visible, HighlightMode.flash);
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
        duration(cmp.node[NodeProp.EXCLUSIVE_DURATION], true),
        ' | ',
        cmp.executionTimePercent,
        '%',
      ].join('');
    }
    return '';
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

  private onMouseOverNode(node: any) {
    this.highlightNode(node, true);
  }

  private onMouseOutNode(node: any) {
    this.highlightNode(node, false);
  }

  private setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
</script>

<style lang="scss">
@import '../assets/scss/plan';
@import '../assets/scss/plan-diagram';
</style>
