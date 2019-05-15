<template>
  <div id="app" class="d-flex flex-column vh-100">
    <div class="navbar container">
      <button v-on:click="planJson = null" class="btn btn-primary ml-auto">
        New Plan
      </button>
    </div>
    <div class="container" v-if="!planJson">
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
          <p v-if="validationMessage" class="alert alert-danger">{{validationMessage}}</p>
          <textarea class="form-control" id="planInput" rows="8" v-model="planInput"></textarea>
        </div>
        <div class="form-group">
          <label for="queryInput">Query</label>
          <textarea class="form-control" id="queryInput" rows="8" v-model="queryInput"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
    <template v-else>
      <plan :plan-json="planJson" :plan-query="planQuery" />
    </template>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { Component, Vue } from 'vue-property-decorator';
import Plan from './components/Plan.vue';

@Component({
  components: {
    Plan,
  },
})
export default class App extends Vue {
  private planJson: any | any[] = null;
  private planQuery: string = '';
  private samples: any[] = [
    ['Example 1 (JSON)', 'plan_1.json', 'plan_1.sql'],
    ['Example 1 (plain text)', 'plan_1.txt', 'plan_1.sql'],
    ['Example 2', 'plan_2.json', 'plan_2.sql'],
    ['Example 3', 'plan_3.json', 'plan_3.sql'],
    ['Example 4', 'plan_4.json'],
    ['Example 5', 'plan_5.json', 'plan_5.sql'],
  ];
  private planInput: string = '';
  private queryInput: string = '';
  private validationMessage: string = '';

  private created(): void {
    this.loadSample(this.samples[0]);
  }

  private submitPlan(): void {
    try {
      this.planJson = JSON.parse(this.planInput);
      this.validationMessage = '';
    } catch (e) {
      this.validationMessage = 'The string you submitted is not valid JSON';
      return;
    }

    this.planQuery = this.queryInput;
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
