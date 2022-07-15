<script lang="ts" setup>
import { inject, ref, onMounted } from "vue"
import MainLayout from "../layouts/MainLayout.vue"
import {
  plan1_source,
  plan1_source_json,
  plan1_query,
  plan2_source,
  plan2_query,
  plan3_source,
  plan3_query,
  plan4_source,
  plan5_source,
  plan5_query,
  plan6_source,
  plan7_source,
  plan7_query,
  plan8_source,
  plan9_source,
  plan9_query,
  plan_parallel_source,
  plan_parallel_2_source,
  plan_parallel_2_query,
  plan_trigger_source,
  plan_trigger_query,
  plan_trigger_2_source,
  plan_trigger_2_query,
} from "../samples.ts"

const setPlanData = inject("setPlanData")

const planInput = ref<string>("")
const queryInput = ref<string>("")
const draggingPlan = ref<boolean>(false)
const draggingQuery = ref<boolean>(false)

interface Sample extends Array<string> {
  0: string
  1: string
  2: string
}

const samples = ref<Sample[]>([
  ["Example 1 TEXT", plan1_source, plan1_query],
  ["Example 1 JSON", plan1_source_json, plan1_query],
  ["Example 2", plan2_source, plan2_query],
  ["Example 3", plan3_source, plan3_query],
  ["Example 5", plan5_source, plan5_query],
  ["With subplan", plan6_source, ""],
  ["With Buffers", plan7_source, plan7_query],
  ["With CTE", plan9_source, plan9_query],
  ["With CTEs", plan4_source, ""],
  ["Very large plan", plan8_source, ""],
  ["With trigger", plan_trigger_2_source, plan_trigger_2_query],
  ["With trigger (plain text)", plan_trigger_source, plan_trigger_query],
  ["Parallel (verbose)", plan_parallel_source, ""],
  ["Parallel (4 workers)", plan_parallel_2_source, plan_parallel_2_query],
])

function submitPlan() {
  setPlanData(planInput.value, queryInput.value)
}

onMounted(() => {
  const textAreas = document.getElementsByTagName("textarea")
  Array.prototype.forEach.call(textAreas, (elem: HTMLInputElement) => {
    elem.placeholder = elem.placeholder.replace(/\\n/g, "\n")
  })
  const noHashURL = window.location.href.replace(/#.*$/, "")
  window.history.replaceState("", document.title, noHashURL)
})

function loadSample(sample: Sample) {
  planInput.value = sample[1]
  queryInput.value = sample[2]
}

function handleDrop(event: DragEvent) {
  const input = event.srcElement
  if (!(input instanceof HTMLTextAreaElement)) {
    return
  }
  draggingPlan.value = false
  draggingQuery.value = false
  if (!event.dataTransfer) {
    return
  }
  const file = event.dataTransfer.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    if (reader.result instanceof ArrayBuffer) {
      return
    }
    input.value = reader.result || ""
    input.dispatchEvent(new Event("input"))
  }
  reader.readAsText(file)
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
            <code>
              EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)
            </code>
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
