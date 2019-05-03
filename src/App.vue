<template>
  <div id="app">
    <div class="navbar container">
      <button v-on:click="planJson = null" class="btn btn-primary ml-auto">
        New Plan
      </button>
    </div>
    <div class="container" v-if="!planJson">
      <ul class="list-inline">
        <li v-for="(sample, index) in samples" class="list-inline-item">
          <a v-on:click.prevent="loadSample(sample)" href>
            Example {{ index }}
          </a>
        </li>
      </ul>
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
      <p v-if="validationMessage" class="alert alert-danger">{{validationMessage}}</p>
    </div>
    <template v-else>
      <Plan :plan-json="planJson" :plan-query="planQuery" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Plan from './components/Plan.vue';
import {SAMPLES} from './samples';

@Component({
  components: {
    Plan,
  },
})
export default class App extends Vue {
  private planJson: any = null;
  private planQuery: string = '';
  private samples: any[] = SAMPLES;
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

  private loadSample(sample: any[]): void {
    this.planInput = JSON.stringify(sample[0], null, '  ');
    this.queryInput = sample[1];
  }
}
</script>
