<template>
  <plan v-if="planRaw" :plan-raw="planRaw" :plan-query="planQuery" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Plan from '@/components/Plan.vue';
import router from '@/router';

import { planData } from '@/App.vue';

@Component({
  components: {
    Plan,
  },
})
export default class App extends Vue {
  private planRaw: any | any[] = planData[0];
  private planQuery: string = planData[1];

  private beforeMount() {
    if (!this.planRaw) {
      router.push({ name: 'home' });
    }
  }
}
</script>
