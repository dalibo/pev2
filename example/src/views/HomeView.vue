<script lang="ts" setup>
import { inject, ref, onMounted } from "vue"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { Tippy } from "vue-tippy"

import { time_ago } from "../utils"
import MainLayout from "../layouts/MainLayout.vue"
import Plan from "@/components/Plan.vue"
import {
  faEdit,
  faInfoCircle,
  faTrash,
} from "@fortawesome/free-solid-svg-icons"
import samples from "../samples.ts"

import idb from "../idb"

const setPlanData = inject("setPlanData")

const planInput = ref<string>("")
const queryInput = ref<string>("")
const queryName = ref<string>("")
const draggingPlan = ref<boolean>(false)
const draggingQuery = ref<boolean>(false)
const savedPlans = ref<Plan[]>()

function submitPlan() {
  const newPlan: Plan = ["", "", ""]
  newPlan[0] =
    queryName.value ||
    "New Plan - " +
      new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
      })
  newPlan[1] = planInput.value
  newPlan[2] = queryInput.value
  newPlan[3] = new Date().toISOString()
  savePlanData(newPlan)

  setPlanData(...newPlan)
}

async function savePlanData(sample: Plan) {
  await idb.savePlan(sample)
}

onMounted(() => {
  const textAreas = document.getElementsByTagName("textarea")
  Array.prototype.forEach.call(textAreas, (elem: HTMLInputElement) => {
    elem.placeholder = elem.placeholder.replace(/\\n/g, "\n")
  })
  const noHashURL = window.location.href.replace(/#.*$/, "")
  window.history.replaceState("", document.title, noHashURL)
  loadPlans()
})

async function loadPlans() {
  const plans = await idb.getPlans()
  savedPlans.value = plans.slice().reverse()
}

function loadPlan(plan?: Plan) {
  if (!plan) {
    return
  }

  queryName.value = plan[0]
  planInput.value = plan[1]
  queryInput.value = plan[2]
}

function openPlan(plan: Plan) {
  setPlanData(plan[0], plan[1], plan[2])
}

function editPlan(plan: Plan) {
  loadPlan(plan)
}

async function deletePlan(plan: Plan) {
  await idb.deletePlan(plan)
  loadPlans()
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
  <MainLayout>
    <div class="container">
      <div class="alert alert-warning">
        This is the demo application for
        <a href="https://github.com/dalibo/pev2">PEV2</a>. It is serverless and
        doesn't send your plans over the internet.
        <br />
        Please consider using
        <a href="https://explain.dalibo.com">explain.dalibo.com</a> instead if
        you want to save or share your plans.
      </div>
      <div class="row mb-3">
        <div class="col d-flex">
          <div class="text-secondary">
            For best results, use
            <code>
              EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)
            </code>
            <br />
            <em>psql</em> users can export the plan to a file using
            <code>psql -XqAt -f explain.sql > analyze.json</code>
          </div>
          <div class="dropdown ms-auto">
            <button
              class="btn btn-secondary dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
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
                v-on:click.prevent="loadPlan(sample)"
                href=""
              >
                {{ sample[0] }}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-7">
          <form v-on:submit.prevent="submitPlan">
            <div class="mb-3">
              <label for="planInput" class="form-label">
                Plan <span class="small text-secondary">(text or JSON)</span>
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
            <div class="mb-3">
              <label for="queryInput" class="form-label">
                Query <span class="small text-secondary">(optional)</span>
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
            <div class="mb-3">
              <label for="queryName" class="form-label">
                Plan Name <span class="small text-secondary">(optional)</span>
              </label>
              <input
                type="text"
                class="form-control"
                id="queryName"
                v-model="queryName"
                placeholder="Name for the plan"
              />
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
          </form>
        </div>
        <div class="col-sm-5 mb-4 mt-4 mt-md-0">
          <div class="mb-2">
            Saved Plans
            <Tippy>
              <FontAwesomeIcon
                :icon="faInfoCircle"
                class="text-body-tertiary"
              ></FontAwesomeIcon>
              <template #content
                >Plans are saved locally in your browser storage.</template
              >
            </Tippy>
          </div>
          <ul class="list-group" v-cloak>
            <li
              class="list-group-item px-2 py-1"
              v-for="plan in savedPlans"
              :key="plan.id"
            >
              <div class="row">
                <div class="col">
                  <button
                    class="btn btn-sm btn-outline-secondary py-0 ms-1 float-end"
                    title="Remove plan from list"
                    v-on:click.prevent="deletePlan(plan)"
                  >
                    <FontAwesomeIcon :icon="faTrash"></FontAwesomeIcon>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-secondary py-0 float-end"
                    title="Edit plan details"
                    v-on:click.prevent="editPlan(plan)"
                  >
                    <FontAwesomeIcon :icon="faEdit"></FontAwesomeIcon>
                  </button>
                  <a
                    v-on:click.prevent="openPlan(plan)"
                    href=""
                    title="Open the plan details"
                  >
                    {{ plan[0] }}
                  </a>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <small class="text-secondary">
                    created
                    <span :title="plan[3]?.toString()">
                      {{ time_ago(plan[3]) }}
                    </span>
                  </small>
                </div>
                <div class="col-6 text-end"></div>
              </div>
            </li>
          </ul>
          <p
            class="text-secondary text-center"
            v-if="!savedPlans?.length"
            v-cloak
          >
            <em> You haven't saved any plan yet.</em>
          </p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
