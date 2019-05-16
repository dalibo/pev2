<template>
  <div class="container">
    <ul class="list-inline">
      <li v-for="(sample, index) in samples" class="list-inline-item">
        <a v-on:click.prevent="loadSample(sample)" href class="btn btn-outline-secondary btn-sm">
          {{ sample[0] }}
        </a>
      </li>
    </ul>
    <div class="text-muted">
      For best results, use <code>EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)</code>
      <br>
      <em>psql</em> users can export the plan to a file using <code>psql -qAt -f explain.sql > analyze.json</code>
    </div>
    <form v-on:submit.prevent="submitPlan">
      <div class="form-group">
        <label for="planInput">Plan</label>
        <textarea class="form-control" id="planInput" rows="8" v-model="planInput"></textarea>
      </div>
      <div class="form-group">
        <label for="queryInput">Query</label>
        <textarea class="form-control" id="queryInput" rows="8" v-model="queryInput"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Submit</button>
    </form>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { Component, Vue } from 'vue-property-decorator';
import router from '@/router';
import { planData } from '@/App.vue';

@Component
export default class App extends Vue {
  private samples: any[] = [
    ['Example 1 (JSON)', 'plan_1.json', 'plan_1.sql'],
    ['Example 1 (plain text)', 'plan_1.txt', 'plan_1.sql'],
    ['Example 2', 'plan_2.json', 'plan_2.sql'],
    ['Example 3', 'plan_3.json', 'plan_3.sql'],
    ['Example 4', 'plan_4.json'],
    ['Example 5', 'plan_5.json', 'plan_5.sql'],
    ['With subplan', 'plan_6.txt'],
    ['With CTE', 'plan_7.txt'],
  ];
  private planInput: string = '';
  private queryInput: string = '';

  private created(): void {
    this.loadSample(this.samples[0]);
  }

  private submitPlan(): void {
    planData[0] = this.planInput;
    planData[1] = this.queryInput;
    router.push({ path: 'plan' });
  }

  private loadSample(sample: string[]): void {
    axios.get('samples/' + sample[1]).then((response) => {
      this.planInput = response.request.responseText;
    });
    if (sample[2]) {
      axios.get('samples/' + sample[2]).then((response) => {
        this.queryInput = response.request.responseText;
      });
    } else {
      this.queryInput = '';
    }
  }
}
</script>
