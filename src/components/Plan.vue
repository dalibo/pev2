<script lang="ts" setup>
import * as _ from "lodash"
import {
  ref,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  reactive,
  watch,
} from "vue"
import { directive as vTippy } from "vue-tippy"
import { Splitpanes, Pane } from "splitpanes"

import type { IPlan, IPlanContent } from "@/interfaces"
import PlanNode from "@/components/PlanNode.vue"
import { scrollChildIntoParentView } from "@/services/help-service"
import { PlanService } from "@/services/plan-service"
import {
  CenterMode,
  HighlightMode,
  HighlightType,
  NodeProp,
  Orientation,
  ViewMode,
} from "@/enums"
import { cost, duration, durationClass, json_, pgsql_, rows } from "@/filters"

interface Props {
  planSource: string
  planQuery: string
}
const props = defineProps<Props>()

const activeTab = ref("")
const queryText: string = ref(null)
const validationMessage = ref("")
const plan = ref<IPlan>(null)
const planEl = ref(null)
const planStats = ref({})
const rootNode = ref<Node>(null)
const zoomTo = ref<Node>(null)

const viewOptions = reactive({
  menuHidden: true,
  showHighlightBar: false,
  showPlanStats: true,
  highlightType: HighlightType.NONE,
  viewMode: ViewMode.FULL,
  orientation: Orientation.TWOD,
  showDiagram: true,
  diagramWidth: 20,
})

const planService = new PlanService()

onBeforeMount(() => {
  const savedOptions = localStorage.getItem("viewOptions")
  if (savedOptions) {
    _.assignIn(viewOptions, JSON.parse(savedOptions))
  }
  let planJson: IPlanContent
  try {
    planJson = planService.fromSource(props.planSource)
    validationMessage.value = ""
    setActiveTab("plan")
  } catch (e) {
    validationMessage.value = "Couldn't parse plan"
    plan.value = null
    return
  }
  rootNode.value = planJson.Plan
  queryText.value = planJson["Query Text"] || props.planQuery
  plan.value = planService.createPlan("", planJson, queryText.value)
  const content = plan.value.content
  planStats.value = {
    executionTime:
      content["Execution Time"] || content["Total Runtime"] || null,
    planningTime: content["Planning Time"] || null,
    maxRows: content.maxRows || null,
    maxCost: content.maxCost || null,
    maxDuration: content.maxDuration || null,
    maxBlocks: content.maxBlocks || null,
    triggers: content.Triggers || [],
    jitTime:
      (content.JIT && content.JIT.Timing && content.JIT.Timing.Total) || null,
    settings: content.Settings,
  }

  nextTick(() => {
    let node = 1
    let highlightMode = HighlightMode.flash
    if (zoomTo.value) {
      node = zoomTo.value
      // tslint:disable-next-line:no-bitwise
      highlightMode = HighlightMode.highlight | HighlightMode.showdetails
    }
    centerNode(node, CenterMode.visible, highlightMode)
    // build the diagram structure
    // with level and reference to PlanNode components for interaction
    if (!plan.value) {
      return
    }
    onHashChange()
  })
  window.addEventListener("hashchange", onHashChange)
})

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onHashChange)
})

watch(viewOptions, onViewOptionsChanged)

function onViewOptionsChanged() {
  localStorage.setItem("viewOptions", JSON.stringify(viewOptions))
}

function onHashChange(): void {
  const reg = /#([a-zA-Z]*)(\/node\/([0-9]*))*/
  const matches = reg.exec(window.location.hash)
  if (matches) {
    const tab = matches[1] || "plan"
    setActiveTab(tab)
    const nodeId = matches[3]
    if (nodeId !== undefined) {
      // Delayed to make sure the tab has changed before recentering
      setTimeout(() => {
        this.selectNode(parseInt(nodeId, 0))
      }, 1)
    }
  }
}

function centerNode(
  nodeId: number,
  centerMode: CenterMode,
  highlightMode: HighlightMode
): void {
  const cmp = findPlanNode((o: PlanNode) => o.node.nodeId === nodeId)
  if (cmp) {
    highlightEl(cmp.$el.querySelector(".plan-node"), centerMode, highlightMode)
    // tslint:disable-next-line:no-bitwise
    if (highlightMode & HighlightMode.showdetails) {
      cmp.setShowDetails(true)
    }
  }
}

function findPlanNode(predicate: (o: PlanNode) => boolean): PlanNode | null {
  let found = null
  /*
  planEl.value.children.some(function iter(child): boolean | undefined {
    if (child instanceof PlanNode) {
      if (predicate(child)) {
        found = child
        return true
      }
      return child.children.some(iter)
    }
  })
  */
  return found
}

function highlightEl(
  el: Element | HTMLElement | null,
  centerMode: CenterMode,
  highlightMode: HighlightMode
) {
  if (!el) {
    return
  }
  const parent = planEl.value.$el
  if (centerMode !== CenterMode.none) {
    scrollChildIntoParentView(
      parent,
      el,
      centerMode === CenterMode.center,
      () => {
        // tslint:disable-next-line:no-bitwise
        if (highlightMode & HighlightMode.flash) {
          el.classList.add("flash")
          setTimeout(() => {
            el.classList.remove("flash")
          }, 1000)
        }
        // tslint:disable-next-line:no-bitwise
        if (highlightMode & HighlightMode.highlight) {
          el.classList.add("highlight")
        }
      }
    )
  }
}

const setActiveTab = (tab: string) => {
  activeTab.value = tab
}

const planningTimeClass = (percent: number) => {
  let c
  if (percent > 90) {
    c = 4
  } else if (percent > 40) {
    c = 3
  } else if (percent > 10) {
    c = 2
  }
  if (c) {
    return "c-" + c
  }
  return false
}
</script>

<template>
  <div
    class="plan-container d-flex flex-column overflow-hidden flex-grow-1 bg-light"
  >
    <div>
      <ul class="nav nav-pills">
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'plan' }"
            href="#plan"
            >Plan</a
          >
        </li>
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'raw' }"
            href="#raw"
            >Raw</a
          >
        </li>
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'query', disabled: !queryText }"
            href="#query"
            >Query</a
          >
        </li>
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'stats' }"
            href="#stats"
            >Stats</a
          >
        </li>
      </ul>
    </div>
    <div class="tab-content flex-grow-1 d-flex overflow-hidden">
      <div
        v-if="validationMessage"
        class="flex-grow-1 d-flex justify-content-center"
      >
        <div class="alert alert-danger align-self-center">
          {{ validationMessage }}
        </div>
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-hidden"
        :class="{ 'show active d-flex': activeTab === 'plan' }"
        v-if="!validationMessage"
      >
        <!-- Plan tab -->
        <div
          class="d-flex flex-column flex-grow-1 overflow-hidden"
          :class="[viewOptions.viewMode, viewOptions.orientation]"
        >
          <div
            class="plan-stats flex-shrink-0 d-flex border-bottom border-top form-inline"
            v-if="plan"
          >
            <div class="d-inline-block px-2">
              Execution time:
              <template v-if="!planStats.executionTime">
                <span class="text-muted">
                  N/A
                  <i
                    class="fa fa-info-circle cursor-help"
                    :content="getHelpMessage('missing execution time')"
                    v-tippy
                  ></i>
                </span>
              </template>
              <template v-else>
                <span
                  class="stat-value"
                  v-html="duration(planStats.executionTime)"
                ></span>
              </template>
            </div>
            <div class="d-inline-block border-left px-2">
              Planning time:
              <template v-if="!planStats.planningTime">
                <span class="text-muted">
                  N/A
                  <i
                    class="fa fa-info-circle cursor-help"
                    :content="getHelpMessage('missing planning time')"
                    v-tippy
                  ></i>
                </span>
              </template>
              <template v-else>
                <span class="stat-value">
                  <span
                    :class="
                      'mb-0 p-0 px-1 alert ' +
                      planningTimeClass(
                        (planStats.planningTime / planStats.executionTime) *
                          100
                      )
                    "
                    v-html="duration(planStats.planningTime)"
                  ></span>
                </span>
              </template>
            </div>
            <div
              class="d-inline-block border-left px-2"
              v-if="planStats.jitTime"
            >
              JIT:
              <span class="stat-value">
                <span
                  :class="
                    'mb-0 p-0 px-1 alert ' +
                    planningTimeClass(
                      (planStats.jitTime / planStats.executionTime) * 100
                    )
                  "
                  v-html="duration(planStats.jitTime)"
                ></span>
              </span>
            </div>
            <div class="d-inline-block border-left px-2 position-relative">
              <span class="stat-label">Triggers: </span>
              <template v-if="planStats.triggers.length">
                <span class="stat-value">
                  <span
                    :class="
                      'mb-0 p-0 px-1 alert ' +
                      durationClass(totalTriggerDurationPercent)
                    "
                    v-html="duration(triggersTotalDuration)"
                  ></span>
                </span>
                <button
                  @click.prevent="showTriggers = !showTriggers"
                  class="bg-transparent border-0 p-0 m-0 pl-1"
                >
                  <i class="fa fa-caret-down text-muted"></i>
                </button>
                <div
                  class="stat-dropdown-container text-left"
                  v-if="showTriggers"
                >
                  <button
                    class="btn btn-close float-right"
                    v-on:click="showTriggers = false"
                  >
                    <i class="fa fa-times"></i>
                  </button>
                  <h3>Triggers</h3>
                  <div
                    v-for="(trigger, index) in planStats.triggers"
                    :key="index"
                  >
                    {{ trigger["Trigger Name"] }}
                    <br />
                    <span class="text-muted">Called</span> {{ trigger["Calls"]
                    }}<span class="text-muted">&times;</span>
                    <span class="float-right">
                      <span
                        :class="
                          'p-0 px-1 alert ' +
                          $options.filters.durationClass(
                            triggerDurationPercent(trigger)
                          )
                        "
                        v-html="$options.filters.duration(trigger.Time)"
                      ></span>
                      | {{ triggerDurationPercent(trigger)
                      }}<span class="text-muted">%</span>
                    </span>
                    <br />
                    <span class="text-muted" v-if="trigger.Relation">on</span>
                    {{ trigger.Relation }}
                    <div class="clearfix"></div>
                    <hr
                      v-if="index != planStats.triggers.length - 1"
                      class="my-2"
                    />
                  </div>
                </div>
              </template>
              <span v-else class="text-muted"> N/A </span>
            </div>
            <div
              class="d-inline-block border-left px-2 position-relative"
              v-if="planStats.settings"
            >
              <span class="stat-label"
                >Settings:
                <span class="badge badge-secondary">{{
                  lodash.keys(planStats.settings).length
                }}</span></span
              >
              <button
                @click.prevent="showSettings = !showSettings"
                class="bg-transparent border-0 p-0 m-0 pl-1"
              >
                <i class="fa fa-caret-down text-muted"></i>
              </button>
              <div
                class="stat-dropdown-container text-left"
                v-if="showSettings"
              >
                <button
                  class="btn btn-close float-right"
                  v-on:click="showSettings = false"
                >
                  <i class="fa fa-times"></i>
                </button>
                <h3>PG Settings</h3>
                <em class="text-muted d-block pb-2">
                  Configuration parameters affecting query planning with value
                  different from the built-in default value.
                </em>
                <table class="table table-sm table-striped mb-0">
                  <tbody>
                    <tr v-for="(value, key) in planStats.settings" :key="key">
                      <td>{{ key }}</td>
                      <td>{{ value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <button
              v-on:click="showHideMenu"
              :class="[
                'border-left btn btn-sm p-0 px-2 ml-auto',
                { 'text-primary': !viewOptions.menuHidden },
              ]"
            >
              <i class="fa fa-cog p-0"></i> Settings
            </button>
          </div>
          <div class="flex-grow-1 d-flex overflow-hidden">
            <div class="flex-grow-1 overflow-hidden">
              <splitpanes
                class="default-theme"
                @resize="viewOptions.diagramWidth = $event[0].size"
              >
                <pane
                  :size="viewOptions.diagramWidth"
                  class="d-flex"
                  v-if="viewOptions.showDiagram"
                >
                  <!--
                  <diagram
                    ref="diagram"
                    :plan="plan"
                    :eventBus="eventBus"
                    class="d-flex flex-column flex-grow-1 overflow-hidden plan-diagram"
                  >
                    <template v-slot:nodeindex="{ node }">
                      <slot name="nodeindex" v-bind:node="node"></slot>
                    </template>
                  </diagram>
                -->
                </pane>
                <pane
                  ref="planEl"
                  class="plan d-flex flex-column flex-grow-1 grab-bing overflow-auto"
                >
                  <ul class="main-plan p-2 mb-0">
                    <li>
                      <!--
                      <plan-node
                        :node="rootNode"
                        :plan="plan"
                        :viewOptions="viewOptions"
                        :eventBus="eventBus"
                        ref="root"
                      >
                        <template v-slot:nodeindex="{ node }">
                          <slot name="nodeindex" v-bind:node="node"></slot>
                        </template>
                      </plan-node>
                      -->
                    </li>
                  </ul>
                  <ul
                    class="init-plans p-2 mb-0"
                    v-if="plan && plan.ctes && plan.ctes.length"
                  >
                    <li v-for="node in plan.ctes" :key="node.nodeId">
                      <!--
                      <plan-node
                        :node="node"
                        :plan="plan"
                        :viewOptions="viewOptions"
                        :eventBus="eventBus"
                        ref="root"
                      >
                        <template v-slot:nodeindex="{ node }">
                          <slot name="nodeindex" v-bind:node="node"></slot>
                        </template>
                      </plan-node>
                      -->
                    </li>
                  </ul>
                </pane>
              </splitpanes>
            </div>
            <div
              class="small p-2 border-left"
              v-if="plan && !viewOptions.menuHidden"
            >
              <div class="text-right clearfix">
                <button
                  type="button"
                  class="close"
                  aria-label="Close"
                  @click="viewOptions.menuHidden = true"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="form-check">
                <input
                  id="showDiagram"
                  type="checkbox"
                  v-model="viewOptions.showDiagram"
                  class="form-check-input"
                />
                <label for="showDiagram" class="form-check-label"
                  ><i class="fa fa-align-left"></i> Diagram</label
                >
              </div>
              <hr />
              <label class="text-uppercase">Density</label>
              <div class="form-group">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-secondary"
                    :class="{ active: viewOptions.viewMode == viewModes.FULL }"
                    v-on:click="viewOptions.viewMode = viewModes.FULL"
                  >
                    full
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active: viewOptions.viewMode == viewModes.COMPACT,
                    }"
                    v-on:click="viewOptions.viewMode = viewModes.COMPACT"
                  >
                    compact
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{ active: viewOptions.viewMode == viewModes.DOT }"
                    v-on:click="viewOptions.viewMode = viewModes.DOT"
                  >
                    dot
                  </button>
                </div>
              </div>
              <hr />
              <label class="text-uppercase">Orientation</label>
              <div class="form-group">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active: viewOptions.orientation == orientations.TWOD,
                    }"
                    v-on:click="viewOptions.orientation = orientations.TWOD"
                  >
                    <i class="fa fa-sitemap"></i>
                    2D
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active: viewOptions.orientation == orientations.CLASSIC,
                    }"
                    v-on:click="viewOptions.orientation = orientations.CLASSIC"
                  >
                    <i class="fa fa-list"></i>
                    classic
                  </button>
                </div>
              </div>
              <hr />
              <label class="text-uppercase">Graph metric</label>
              <div class="form-group">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active:
                        viewOptions.highlightType === highlightTypes.NONE,
                    }"
                    v-on:click="
                      viewOptions.highlightType = highlightTypes.NONE
                    "
                  >
                    none
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active:
                        viewOptions.highlightType === highlightTypes.DURATION,
                    }"
                    v-on:click="
                      viewOptions.highlightType = highlightTypes.DURATION
                    "
                    :disabled="!plan.isAnalyze"
                  >
                    duration
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active:
                        viewOptions.highlightType === highlightTypes.ROWS,
                    }"
                    v-on:click="
                      viewOptions.highlightType = highlightTypes.ROWS
                    "
                    :disabled="rootNode[nodeProps.ACTUAL_ROWS] === undefined"
                  >
                    rows
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active:
                        viewOptions.highlightType === highlightTypes.COST,
                    }"
                    v-on:click="
                      viewOptions.highlightType = highlightTypes.COST
                    "
                  >
                    cost
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- end Plan tab -->
        </div>
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-hidden position-relative"
        :class="{ 'show active': activeTab === 'raw' }"
      >
        <div class="overflow-hidden d-flex w-100 h-100">
          <div class="overflow-auto flex-grow-1">
            <pre
              class="small p-2 mb-0"
            ><code v-html="json_(planSource)"></code></pre>
          </div>
          <!--<copy :content="planSource" />-->
        </div>
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-hidden position-relative"
        :class="{ 'show active': activeTab === 'query' }"
        v-if="queryText"
      >
        <div class="overflow-hidden d-flex w-100 h-100">
          <div class="overflow-auto flex-grow-1">
            <pre
              class="small p-2 mb-0"
            ><code v-html="pgsql_(queryText)"></code></pre>
          </div>
        </div>
        <!--<copy :content="queryText" />-->
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-auto"
        :class="{ 'show active': activeTab === 'stats' }"
      >
        <!--<stats :plan="plan"> </stats>-->
      </div>
    </div>
  </div>
</template>
