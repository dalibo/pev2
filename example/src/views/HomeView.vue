<script lang="ts" setup>
import { inject, ref, onMounted } from "vue"
import MainLayout from "../layouts/MainLayout.vue"
import { plan1_source, plan1_source_json, plan1_query } from "../samples.ts"

const setPlanData = inject("setPlanData")

const planInput = ref<string>("")
const queryInput = ref<string>("")

interface Sample extends Array<string> {
  0: string
  1: string
  2: string
}

const samples = ref<Sample[]>([
  ["Example 1 TEXT", plan1_source, plan1_query],
  ["Example 1 JSON", plan1_source_json, plan1_query],
])

function submitPlan() {
  setPlanData(planInput, queryInput)
}

onMounted(() => {
  const textAreas = document.getElementsByTagName("textarea")
  Array.prototype.forEach.call(textAreas, (elem: HTMLInputElement) => {
    elem.placeholder = elem.placeholder.replace(/\\n/g, "\n")
  })
})

function loadSample(sample: Sample) {
  planInput.value = sample[1]
  queryInput.value = sample[2]
}
</script>

<template>
  <main-layout>
    <div class="container">
      <div class="alert alert-warning">
        This is the demo application for
        <a href="https://github.com/dalibo/pev2">PEV2</a>. It is serverless and
        doesn't store your plans.
        <br />
        Please consider using
        <a href="https://explain.dalibo.com">explain.dalibo.com</a> instead if
        you want to save or share your plans.
      </div>
      <div class="row">
        <div class="col d-flex">
          <div class="text-muted">
            For best results, use
            <code>EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)</code>
            <br />
            <em>psql</em> users can export the plan to a file using
            <code>psql -XqAt -f explain.sql > analyze.json</code>
          </div>
          <div class="dropdown ml-auto">
            <button
              class="btn btn-secondary dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Sample Plans
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a
                v-for="(sample, index) in samples"
                :key="index"
                class="dropdown-item"
                v-on:click.prevent="loadSample(sample)"
                href
              >
                {{ sample[0] }}
              </a>
            </div>
          </div>
        </div>
      </div>
      <form v-on:submit.prevent="submitPlan">
        <div class="form-group">
          <label for="planInput">
            Plan <span class="small text-muted">(text or JSON)</span>
          </label>
          <textarea
            :class="['form-control', draggingPlan ? 'dropzone-over' : '']"
            id="planInput"
            rows="8"
            v-model="planInput"
            @dragenter="draggingPlan = true"
            @dragleave="draggingPlan = false"
            @drop.prevent="handleDrop"
            placeholder="Paste execution plan\nOr drop a file"
          >
          </textarea>
        </div>
        <div class="form-group">
          <label for="queryInput">
            Query <span class="small text-muted">(optional)</span>
          </label>
          <textarea
            :class="['form-control', draggingQuery ? 'dropzone-over' : '']"
            id="queryInput"
            rows="8"
            v-model="queryInput"
            @dragenter="draggingQuery = true"
            @dragleave="draggingQuery = false"
            @drop.prevent="handleDrop"
            placeholder="Paste corresponding SQL query\nOr drop a file"
          >
          </textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
  </main-layout>
</template>
