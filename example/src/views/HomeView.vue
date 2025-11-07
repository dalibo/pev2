<script lang="ts" setup>
import { computed, inject, useTemplateRef, ref, onMounted, watch } from "vue"
import type { Ref } from "vue"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { Tippy } from "vue-tippy"
import { useDropZone } from "@vueuse/core"

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
const planName = ref<string>("")
const savedPlans = ref<Plan[]>([])
const pageSize = 11
const maxVisiblePages = 5
const currentPage = ref<number>(1)
const totalPages = computed(() => {
  return Math.ceil(savedPlans.value.length / pageSize)
})
const hovered = ref(null)
const selectionMode = ref(false)
const selection = ref<Plan[]>([])

const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return savedPlans.value.slice(start, end)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const half = Math.floor(maxVisiblePages / 2)
  let start = currentPage.value - half
  let end = currentPage.value + half

  if (start < 1) {
    start = 1
    end = Math.min(maxVisiblePages, total)
  }
  if (end > total) {
    end = total
    start = Math.max(1, total - maxVisiblePages + 1)
  }

  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const planDropZoneRef = useTemplateRef("planDropZoneRef")
const { isOverDropZone: isOverPlanDropZone } = useDropZone(
  planDropZoneRef,
  (files) => onDrop(files, planInput),
)
const queryDropZoneRef = useTemplateRef("queryDropZoneRef")
const { isOverDropZone: isOverQueryDropZone } = useDropZone(
  queryDropZoneRef,
  (files) => onDrop(files, queryInput),
)

function submitPlan() {
  const newPlan: Plan = ["", "", ""]
  newPlan[0] =
    planName.value ||
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
  savedPlans.value = plans
    .slice()
    .sort((a, b) => new Date(a[3]) - new Date(b[3]))
    .reverse()
}

function loadPlan(plan?: Plan) {
  if (!plan) {
    return
  }

  planName.value = plan[0]
  planInput.value = plan[1]
  queryInput.value = plan[2]
}

function openOrSelectPlan(plan: Plan) {
  if (!selectionMode.value) {
    openPlan(plan)
  } else {
    togglePlanSelection(plan)
  }
}

function openPlan(plan: Plan) {
  setPlanData(plan[0], plan[1], plan[2])
}

function isSelected(id: integer) {
  return selection.value.includes(id)
}

function togglePlanSelection(plan) {
  const index = selection.value.indexOf(plan.id)
  if (index === -1) {
    selection.value.push(plan.id)
  } else {
    selection.value.splice(index, 1)
  }
}

function editPlan(plan: Plan) {
  loadPlan(plan)
}

function plansFromSelection() {
  return selection.value.length > 0
    ? savedPlans.value.filter((p) => selection.value.includes(p.id))
    : savedPlans.value
}

function deletePlans() {
  if (confirm("Are you sure you want to delete plans?")) {
    const plans = plansFromSelection()
    plans.forEach(async (plan) => {
      await idb.deletePlan(plan)
    })
    loadPlans()
    selectionMode.value = false
  }
  // reset page
  currentPage.value = 1
}

async function deletePlan(plan: Plan) {
  await idb.deletePlan(plan)
  loadPlans()
}

function onDrop(files: File[] | null, input: Ref) {
  if (files) {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        return
      }
      input.value = reader.result || ""
    }
    reader.readAsText(files[0])
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}
function goToPage(page) {
  currentPage.value = page
}

watch(
  () => selectionMode.value,
  () => {
    selection.value = []
  },
)
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
      <div class="row">
        <div class="col-sm-7">
          <div class="row mb-3">
            <div class="col d-flex">
              <div class="text-secondary">
                For best results, use
                <code>
                  EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)
                </code>
                <br />
                <em>psql</em> users can export the plan to a file using
                <code class="text-nowrap"
                  >psql -XqAt -f explain.sql > analyze.json</code
                >
              </div>
            </div>
          </div>
          <form v-on:submit.prevent="submitPlan">
            <div class="mb-3">
              <div class="d-flex align-items-center mb-2">
                <label for="planInput" class="form-label">
                  Plan <span class="small text-secondary">(text or JSON)</span>
                </label>
                <div class="dropdown ms-auto">
                  <button
                    class="btn btn-secondary dropdown-toggle btn-sm"
                    type="button"
                    id="dropdownMenuButton"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Sample Plans
                  </button>
                  <div
                    class="dropdown-menu"
                    aria-labelledby="dropdownMenuButton"
                  >
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
              <textarea
                ref="planDropZoneRef"
                :class="[
                  'form-control',
                  isOverPlanDropZone ? 'dropzone-over' : '',
                ]"
                id="planInput"
                rows="8"
                v-model="planInput"
                placeholder="Paste execution plan\nOr drop a file"
              >
              </textarea>
            </div>
            <div class="mb-3">
              <label for="queryInput" class="form-label">
                Query <span class="small text-secondary">(optional)</span>
              </label>
              <textarea
                ref="queryDropZoneRef"
                :class="[
                  'form-control',
                  isOverQueryDropZone ? 'dropzone-over' : '',
                ]"
                id="queryInput"
                rows="8"
                v-model="queryInput"
                placeholder="Paste corresponding SQL query\nOr drop a file"
              >
              </textarea>
            </div>
            <div class="mb-3">
              <label for="planName" class="form-label">
                Plan Name <span class="small text-secondary">(optional)</span>
              </label>
              <input
                type="text"
                class="form-control"
                id="planName"
                v-model="planName"
                placeholder="Name for the plan"
              />
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
          </form>
        </div>
        <div class="col-sm-5">
          <div class="d-flex flex-row align-items-center mb-2">
            <div>
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
            <div class="d-flex ms-auto">
              <button
                class="btn btn-sm ms-2 btn-light"
                :class="{ active: selectionMode }"
                @click="selectionMode = !selectionMode"
              >
                Select
              </button>
            </div>
          </div>
          <nav>
            <ul class="pagination pagination-sm justify-content-end mb-2">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a
                  class="page-link"
                  href="#"
                  @click="prevPage"
                  aria-label="Previous"
                >
                  <span aria-hidden="true">&laquo;</span>
                  <span class="sr-only">Previous</span>
                </a>
              </li>
              <li
                class="page-item"
                v-if="visiblePages[0] > 1"
                @click="goToPage(1)"
              >
                <a class="page-link" href="#">1</a>
              </li>
              <li class="page-item" v-if="visiblePages[0] > 2">
                <a class="page-link"> … </a>
              </li>
              <li
                class="page-item"
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="{ active: page === currentPage }"
              >
                <a class="page-link" href="#">{{ page }}</a>
              </li>
              <li
                class="page-item"
                v-if="visiblePages[visiblePages.length - 1] < totalPages - 1"
              >
                <a class="page-link"> … </a>
              </li>
              <li
                class="page-item"
                v-if="visiblePages[visiblePages.length - 1] < totalPages"
                @click="goToPage(totalPages)"
              >
                <a class="page-link" href="#">{{ totalPages }}</a>
              </li>
              <li
                class="page-item"
                :class="{ disabled: currentPage === totalPages }"
              >
                <a
                  class="page-link"
                  href="#"
                  @click="nextPage"
                  aria-labal="Next"
                >
                  <span aria-hidden="true">&raquo;</span>
                  <span class="sr-only">Next</span>
                </a>
              </li>
            </ul>
          </nav>
          <div class="list-group" v-cloak>
            <a
              class="list-group-item list-group-item-action px-2 py-1 flex-column"
              :class="{ active: isSelected(plan.id) }"
              v-for="(plan, index) in paginatedPlans"
              :key="plan.id"
              href="#"
              @click.prevent="openOrSelectPlan(plan)"
              @mouseenter="hovered = index"
              @mouseleave="hovered = null"
            >
              <div class="d-flex w-100 align-items-center">
                <input
                  class="form-check-input me-3"
                  type="checkbox"
                  v-if="selectionMode"
                  :value="plan.id"
                  v-model="selection"
                  @click.stop
                />
                <div>
                  <p class="mb-0">
                    {{ plan[0] }}
                  </p>
                  <small
                    :class="{
                      'text-secondary': !isSelected(plan.id),
                    }"
                  >
                    created
                    <span :title="plan[3]?.toString()">
                      {{ time_ago(plan[3]) }}
                    </span>
                  </small>
                </div>
                <div
                  class="end-0 text-nowrap position-absolute z-1 bg-light p-2"
                  v-if="hovered === index && !selectionMode"
                >
                  <button
                    class="btn btn-sm btn-outline-secondary py-0 me-1"
                    title="Remove plan from list"
                    v-on:click.stop="deletePlan(plan)"
                  >
                    <FontAwesomeIcon :icon="faTrash"></FontAwesomeIcon>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-secondary py-0"
                    title="Edit plan details"
                    v-on:click.stop="editPlan(plan)"
                  >
                    <FontAwesomeIcon :icon="faEdit"></FontAwesomeIcon>
                  </button>
                </div>
              </div>
            </a>
          </div>
          <div v-if="selectionMode" class="mt-2 d-flex">
            <button class="btn btn-sm ms-auto btn-danger" @click="deletePlans">
              <FontAwesomeIcon :icon="faTrash" class="me-2"></FontAwesomeIcon>
              Delete<template v-if="selection.length < 1"> all</template
              ><template v-else> ({{ selection.length }})</template>
            </button>
          </div>
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

<style scoped>
.dropzone-over {
  box-shadow: 0 0 5px rgba(81, 203, 238, 1);
  border: 1px solid rgba(81, 203, 238, 1);
}
</style>
