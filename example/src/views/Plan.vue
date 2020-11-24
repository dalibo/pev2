<template>
  <main-layout>
  <plan v-if="planSource" :plan-source="planSource" :plan-query="planQuery" ref="plan">
    <template v-slot:nodeindex="{ node }">
      <a class="font-weight-normal small" href @click.stop.prevent="selectNode(node.nodeId)">#{{node.nodeId}}</a>
    </template>
  </plan>
  </main-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Plan from '@/components/Plan.vue';
import MainLayout from '../layouts/Main.vue';

import { planData } from '../main';

@Component({
  components: {
    MainLayout,
    Plan,
  },
})
export default class App extends Vue {
  private planSource: any | any[] = planData[0];
  private planQuery: string = planData[1];

  private mounted(): void {
    document.body.addEventListener("click", this.unselectNode);
  }

  private beforeDestroy(): void {
    document.body.removeEventListener("click", this.unselectNode);
  }

  private unselectNode() {
    this.$refs.plan.selectNode(null);
  }

  private selectNode(nodeId: number) {
    this.$refs.plan.selectNode(nodeId);
  }
}
</script>
