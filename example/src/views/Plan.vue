<template>
  <main-layout>
  <plan v-if="planSource" :plan-source="planSource" :plan-query="planQuery" ref="plan"></plan>
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
}
</script>
