<template>
  <div>
    <div class="plan-node">
      <header>
        <h4>
          {{ getNodeName() }}
        </h4>
        <span>
          <span class="node-duration">{{node[planService.ACTUAL_DURATION_PROP] | duration}}<span class="text-muted">{{node[planService.ACTUAL_DURATION_PROP] | durationUnit}} | </span>
          <strong>{{executionTimePercent}}</strong><span class="text-muted">%</span>
          </span>
        </span>
      </header>
    </div>
    <ul v-if="node.Plans">
      <li v-for="subnode in node.Plans">
        <PlanNode :node="subnode" :plan="plan" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PlanService } from '../plan-service';
import { duration, durationUnit } from '../filters';

@Component({
  filters: {
    duration: duration,
    durationUnit: durationUnit,
  }
})
export default class PlanNode extends Vue {
  @Prop(Object) private node!: any;
  @Prop(Object) private plan!: any;

  executionTimePercent: number
  planService = new PlanService()

  created(): void {
    this.calculateDuration()
  }

  getNodeName (): string {
    return (this.node['Node Type']).toUpperCase()
  }

  calculateDuration() {
    this.executionTimePercent = _.round((this.node[this.planService.ACTUAL_DURATION_PROP] / this.plan.planStats.executionTime) * 100)
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
</style>
