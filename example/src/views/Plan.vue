<template>
  <plan v-if="planSource" :plan-source="planSource" :plan-query="planQuery" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Plan from '@/components/Plan.vue';
import router from '../router';

import { planData } from '../App.vue';

@Component({
  components: {
    Plan,
  },
})
export default class App extends Vue {
  private planSource: any | any[] = planData[0];
  private planQuery: string = planData[1];

  private beforeMount() {
    if (!this.planSource) {
      router.push({ name: 'home' });
    }
  }
}
</script>
