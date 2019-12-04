<template>
  <div class="container">
    <div class="alert alert-warning">
      This is the demo application for <a href="https://github.com/dalibo/pev2">PEV2</a>. It is serverless and doesn't store your plans.
      <br>
      Please consider using <a href="https://explain.dalibo.com">explain.dalibo.com</a> instead if you want to save or share your plans.
    </div>
    <div class="row">
      <div class="col d-flex">
        <div class="text-muted">
          For best results, use <code>EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)</code>
          <br>
          <em>psql</em> users can export the plan to a file using <code>psql -qAt -f explain.sql > analyze.json</code>
        </div>
        <div class="dropdown ml-auto">
          <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Sample Plans
          </button>
          <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <a v-for="(sample, index) in samples" class="dropdown-item" v-on:click.prevent="loadSample(sample)" href>
              {{ sample[0] }}
            </a>
          </div>
        </div>
      </div>
    </div>
    <form v-on:submit.prevent="submitPlan">
      <div class="form-group">
        <label for="planInput">Plan <span class="small text-muted">(text or JSON)</span></label>
        <textarea :class="['form-control', draggingPlan ? 'dropzone-over' : '']" id="planInput" rows="8" v-model="planInput" @dragenter="draggingPlan = true" @dragleave="draggingPlan = false" @drop.prevent="handleDrop" placeholder="Paste execution plan\nOr drop a file"></textarea>
      </div>
      <div class="form-group">
        <label for="queryInput">Query <span class="small text-muted">(optional)</span></label>
        <textarea :class="['form-control', draggingQuery ? 'dropzone-over' : '']" id="queryInput" rows="8" v-model="queryInput" @dragenter="draggingQuery = true" @dragleave="draggingQuery = false" @drop.prevent="handleDrop" placeholder="Paste corresponding SQL query\nOr drop a file"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Submit</button>
    </form>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { Component, Vue } from 'vue-property-decorator';
import router from '../router';
import { planData } from '../App.vue';

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
    ['Very large plan', 'plan_8.json'],
    ['With trigger', 'plan_trigger.json', 'plan_trigger.sql'],
    ['With trigger (plain text)', 'plan_trigger.txt', 'plan_trigger_2.sql'],
    ['Parallel (verbose)', 'plan_parallel.json'],
    ['Parallel (4 workers)', 'plan_parallel2.txt', 'plan_parallel2.sql'],
  ];
  private planInput: string = '';
  private queryInput: string = '';
  private draggingPlan: boolean = false;
  private draggingQuery: boolean = false;

  private mounted() {
    const textAreas = document.getElementsByTagName('textarea');
    Array.prototype.forEach.call(textAreas, (elem: HTMLInputElement) => {
        elem.placeholder = elem.placeholder.replace(/\\n/g, '\n');
    });
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

  private handleDrop(event: DragEvent) {
    const input = event.srcElement;
    if (!(input instanceof HTMLTextAreaElement)) {
      return;
    }
    this.draggingPlan = false;
    this.draggingQuery = false;
    if (!event.dataTransfer) {
      return;
    }
    const file = event.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (e: Event) => {
      if (reader.result instanceof ArrayBuffer) {
        return;
      }
      input.value = reader.result || '';
      input.dispatchEvent(new Event('input'));
    };
    reader.readAsText(file);
  }
}
</script>

<style>
.dropzone-over {
  box-shadow: 0 0 5px rgba(81, 203, 238, 1);
  border: 1px solid rgba(81, 203, 238, 1);
}
</style>
