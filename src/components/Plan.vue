<template>
  <div :class="['plan-container overflow-auto h-100 bg-light', viewOptions.viewMode, viewOptions.orientation]" v-dragscroll>
    <div :class="['menu p-2 bg-white border', {'rounded-right border-left-0': viewOptions.orientation == orientations.VERTICAL, 'rounded-left border-right-0': viewOptions.orientation == orientations.HORIZONTAL, 'menu-hidden': menuHidden}]">
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
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.orientation == orientations.VERTICAL}" v-on:click="viewOptions.orientation = orientations.VERTICAL">
              <i class="fa fa-sitemap"></i>
              vertical
            </button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.orientation == orientations.HORIZONTAL}" v-on:click="viewOptions.orientation = orientations.HORIZONTAL">
              <i class="fa fa-indent"></i>
              horizontal
            </button>
          </div>
        </div>
        <div class="form-group">
          <div>Graph metric</div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.NONE}" v-on:click="viewOptions.highlightType = highlightTypes.NONE">none</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.DURATION}" v-on:click="viewOptions.highlightType = highlightTypes.DURATION" :disabled="!node[nodeProps.ACTUAL_DURATION]">duration</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.ROWS}" v-on:click="viewOptions.highlightType = highlightTypes.ROWS" :disabled="!node[nodeProps.ACTUAL_ROWS]">rows</button>
            <button class="btn btn-outline-secondary" :class="{'active': viewOptions.highlightType === highlightTypes.COST}" v-on:click="viewOptions.highlightType = highlightTypes.COST">cost</button>
          </div>
        </div>
        <div class="form-check">
          <input id="showPlannerEstimate" type="checkbox" v-model="viewOptions.showPlannerEstimate" class="form-check-input" :disabled="!node[nodeProps.ACTUAL_ROWS]">
          <label for="showPlannerEstimate" class="form-check-label">Estimations</label>
        </div>
        <div class="form-check">
          <input id="showTags" type="checkbox" v-model="viewOptions.showTags" class="form-check-input">
          <label class="clickable" for="showTags"> Tags</label>
        </div>
      </div>
    </div>

    <div v-if="validationMessage" class="h-100 w-100 d-flex justify-content-center">
      <div class="alert alert-danger align-self-center">{{validationMessage}}</div>
    </div>
    <div class="plan grab-bing h-100 w-100 d-flex" v-else>
      <ul class="">
        <li>
          <plan-node :node="node" :plan="plan" :viewOptions="viewOptions"/>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PlanNode from '@/components/PlanNode.vue';
import { PlanService } from '@/services/plan-service';
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
})
export default class Plan extends Vue {
  @Prop(String) private planRaw!: string;
  @Prop(String) private planQuery!: string;
  private plan: any;
  private node!: any;
  private menuHidden: boolean = true;
  private validationMessage: string = '';

  private viewOptions: any = {
    showHighlightBar: false,
    showPlannerEstimate: false,
    showTags: true,
    highlightType: HighlightType.NONE,
    viewMode: ViewMode.FULL,
    orientation: Orientation.VERTICAL,
  };

  private highlightTypes = HighlightType;
  private viewModes = ViewMode;
  private orientations = Orientation;

  private planService = new PlanService();
  private nodeProps = NodeProp;

  private created(): void {
    let planJson: any | any[] = {};
    try {
      planJson = JSON.parse(this.planRaw);
      this.validationMessage = '';
    } catch (e) {
      try {
        planJson = this.planService.fromText(this.planRaw);
      } catch (e) {
        this.validationMessage = 'Couldn\'t parse plan';
        return;
      }
    }

    if (planJson instanceof Array) {
      planJson = planJson[0];
    }
    this.node = planJson.Plan;
    this.plan = this.planService.createPlan('', planJson, this.planQuery);
    const content = this.plan.content;
    this.plan.planStats = {
      executionTime: content['Execution Time'] || content['Total Runtime'],
      planningTime: content['Planning Time'] || 0,
      maxRows: content[NodeProp.MAXIMUM_ROWS] || 0,
      maxCost: content[NodeProp.MAXIMUM_COSTS] || 0,
      maxDuration: content[NodeProp.MAXIMUM_DURATION] || 0,
    };
  }
}
</script>

<style lang="scss">
@import '../assets/scss/plan';

</style>
