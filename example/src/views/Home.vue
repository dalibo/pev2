<template>
  <main-layout>
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
          <em>psql</em> users can export the plan to a file using <code>psql -XqAt -f explain.sql > analyze.json</code>
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
  </main-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MainLayout from '../layouts/Main.vue';
import { setPlanData } from '../main.ts';

@Component({
  components: {
    MainLayout,
  }
})
export default class Home extends Vue {
  private planInput: string = '';
  private queryInput: string = '';
  private draggingPlan: boolean = false;
  private draggingQuery: boolean = false;

  private mounted() {
    const textAreas = document.getElementsByTagName('textarea');
    Array.prototype.forEach.call(textAreas, (elem: HTMLInputElement) => {
        elem.placeholder = elem.placeholder.replace(/\\n/g, '\n');
    });
    const noHashURL = window.location.href.replace(/#.*$/, '');
    window.history.replaceState('', document.title, noHashURL)
  }

  private submitPlan(): void {
    setPlanData(this.planInput, this.queryInput);
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
