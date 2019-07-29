<template>
  <div :class="['plan-container d-flex flex-column h-100 bg-light', viewOptions.viewMode, viewOptions.orientation]">
    <div :class="['menu p-2 bg-white border rounded-left', {'menu-hidden': menuHidden}]">
      <button v-on:click="menuHidden = !menuHidden" class="btn">
        <i class="fa fa-cogs p-0"></i>
        <strong v-if="!menuHidden">
          Display Options
        </strong>
      </button>
      <div v-if="!menuHidden">
        <div class="form-group">
          <div>
            View
          </div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.FULL}" v-on:click="viewOptions.viewMode = viewModes.FULL">full</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.COMPACT}" v-on:click="viewOptions.viewMode = viewModes.COMPACT">compact</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.viewMode == viewModes.DOT}" v-on:click="viewOptions.viewMode = viewModes.DOT">dot</button>
          </div>
        </div>
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
        <div class="form-group">
          <div>Graph metric</div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.NONE}" v-on:click="viewOptions.highlightType = highlightTypes.NONE">none</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.DURATION}" v-on:click="viewOptions.highlightType = highlightTypes.DURATION" :disabled="!node[nodeProps.ACTUAL_DURATION]">duration</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.ROWS}" v-on:click="viewOptions.highlightType = highlightTypes.ROWS">rows</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.COST}" v-on:click="viewOptions.highlightType = highlightTypes.COST">cost</button>
          </div>
        </div>
        <div class="form-check">
          <input id="showPlannerEstimate" type="checkbox" v-model="viewOptions.showPlannerEstimate" class="form-check-input">
          <label for="showPlannerEstimate" class="form-check-label">Estimations</label>
        </div>
        <div class="form-check">
          <input id="showTags" type="checkbox" v-model="viewOptions.showTags" class="form-check-input">
          <label class="clickable" for="showTags"> Tags</label>
        </div>
      </div>
    </div>
    <div class="plan-stats border-bottom p-1 mb-1 align-self-center">
      <div>
        <template v-if="!plan.planStats.executionTime">
          <span class="stat-value text-muted">
            N/A
            <small><i class="fa fa-info-circle" :title="getHelpMessage('missing execution time')"></i></small>
          </span>
        </template>
        <template v-else>
          <span class="stat-value">{{plan.planStats.executionTime | duration}}<span class="text-muted">{{plan.planStats.executionTime | durationUnit}}</span></span>
        </template>
        <span class="stat-label">Execution time</span>
      </div>
      <div>
        <template v-if="!plan.planStats.planningTime">
          <span class="stat-value text-muted">
            N/A
            <small><i class="fa fa-info-circle" :title="getHelpMessage('missing planning time')"></i></small>
          </span>
        </template>
        <template v-else>
          <span class="stat-value">{{plan.planStats.planningTime}}<span class="text-muted">{{plan.planStats.planningTime | durationUnit}}</span></span>
        </template>
        <span class="stat-label">Planning time</span>
      </div>
      <button @click.prevent="showNode(plan.slowestNodeId, false, true)" :disabled="!plan.planStats.maxDuration">
        <template v-if="!plan.planStats.maxDuration">
          <span class="stat-value text-muted">
            N/A
            <small><i class="fa fa-info-circle" :title="getHelpMessage('missing slowest')"></i></small>
          </span>
        </template>
        <template v-else>
          <span class="stat-value">{{plan.planStats.maxDuration | duration}}<span class="text-muted">{{plan.planStats.maxDuration | durationUnit}}</span>
          </span>
        </template>
        <span class="stat-label">
          Slowest node
          <i class="icon-tortoise2 fa fa-fw text-muted"></i>
        </span>
        <div class="show" v-if="plan.planStats.maxDuration"><i class="fa fa-search bg-white p-1 rounded"></i></div>
      </button>
      <div>
        <template v-if="!plan.planStats.maxRows">
          <span class="stat-value text-muted">
            N/A
            <small><i class="fa fa-info-circle" :title="getHelpMessage('no rows')"></i></small>
          </span>
        </template>
        <template v-else>
          <span class="stat-value">{{plan.planStats.maxRows}} <span class="text-muted">rows</span></span>
        </template>
        <span class="stat-label">Largest node
          <i class="fa fa-bars text-muted"></i>
        </span>
      </div>
      <button @click.prevent="showNode(plan.costliestNodeId, false, true)" :disabled="!plan.planStats.maxCost" v-if="plan.planStats.maxCost">
        <span class="stat-value">{{plan.planStats.maxCost | numeral_('0.00')}}</span>
        <span class="stat-label">Costliest node
          <i class="fa fa-dollar text-muted"></i>
        </span>
        <div class="show" v-if="plan.planStats.maxCost"><i class="fa fa-search bg-white p-1 rounded"></i></div>
      </button>
    </div>

    <div v-if="validationMessage" class="h-100 w-100 d-flex justify-content-center">
      <div class="alert alert-danger align-self-center">{{validationMessage}}</div>
    </div>
    <div class="overflow-auto h-100" v-else v-dragscroll>
      <div class="plan h-100 w-100 d-flex grab-bing">
        <ul class="">
          <li>
            <plan-node :node="node" :plan="plan" :viewOptions="viewOptions"/>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PlanNode from '@/components/PlanNode.vue';
import { HelpService, scrollChildIntoParentView } from '@/services/help-service';
import { PlanService } from '@/services/plan-service';
import { duration, durationUnit, numeral_ } from '@/filters';
import { HighlightType, NodeProp, Orientation, ViewMode } from '../enums';

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
    duration,
    durationUnit,
    numeral_,
  },
})
export default class Plan extends Vue {
  @Prop(String) private planSource!: string;
  @Prop(String) private planQuery!: string;
  private plan: any;
  private node!: any;
  private menuHidden: boolean = true;
  private validationMessage: string = '';

  private helpService = new HelpService();

  private viewOptions: any = {
    showHighlightBar: false,
    showPlannerEstimate: false,
    showPlanStats: true,
    showTags: true,
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
      this.viewOptions = JSON.parse(savedOptions);
    }
    let planJson: any;
    try {
      planJson = this.planService.fromSource(this.planSource);
      this.validationMessage = '';
    } catch (e) {
      this.validationMessage = 'Couldn\'t parse plan';
      return;
    }
    this.node = planJson.Plan;
    this.plan = this.planService.createPlan('', planJson, this.planQuery);
    const content = this.plan.content;
    this.plan.planStats = {
      executionTime: content['Execution Time'] || content['Total Runtime'] || null,
      planningTime: content['Planning Time'] || null,
      maxRows: content[NodeProp.MAXIMUM_ROWS] || null,
      maxCost: content[NodeProp.MAXIMUM_COSTS] || 0,
      maxDuration: content[NodeProp.MAXIMUM_DURATION] || 0,
    };

    window.setTimeout(() => {
      this.showNode('0', true, false);
    }, 200);
  }

  @Watch('viewOptions', {deep: true})
  private onViewOptionsChanged(val: any, oldVal: any) {
    localStorage.setItem('viewOptions', JSON.stringify(this.viewOptions));
  }

  private getHelpMessage(message: string) {
    return this.helpService.getHelpMessage(message);
  }

  private showNode(nodeId: string, shouldCenter: boolean, highlight: boolean) {
    const parent = document.querySelector('.plan-container .overflow-auto');
    if (!parent) {
      return;
    }
    const child = document.getElementById('node-' + nodeId);

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
}
</script>

<style lang="scss">
@import '../assets/scss/plan';

</style>
