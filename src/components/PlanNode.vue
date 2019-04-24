<template>
  <div>
    <div class="plan-node">
      <header>
        <h4>
          {{ getNodeName() }}
        </h4>
      </header>
    </div>
    <ul v-if="node.Plans">
      <li v-for="subnode in node.Plans">
        <PlanNode :node="subnode" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class PlanNode extends Vue {
  @Prop(Object) private node!: object;

  getNodeName (): string {
    return (this.node['Node Type']).toUpperCase()
  }
}
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/plan-node';
</style>
