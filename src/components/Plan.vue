<script lang="ts" setup>
import _ from "lodash"
import {
  computed,
  reactive,
  ref,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  provide,
  watch,
} from "vue"
import { directive as vTippy } from "vue-tippy"
import { Splitpanes, Pane } from "splitpanes"

import type {
  IBlocksStats,
  IPlan,
  IPlanContent,
  IPlanStats,
  ITrigger,
  Node,
  Settings,
} from "@/interfaces"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import Copy from "@/components/Copy.vue"
import Diagram from "@/components/Diagram.vue"
import PlanNode from "@/components/PlanNode.vue"
import Stats from "@/components/Stats.vue"
import { PlanService } from "@/services/plan-service"
import { HelpService, findNodeById } from "@/services/help-service"
import { HighlightType, NodeProp } from "@/enums"
import { duration, durationClass, json_, pgsql_ } from "@/filters"

import "tippy.js/dist/tippy.css"

import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from "@fortawesome/free-solid-svg-icons"
import { far } from "@fortawesome/free-regular-svg-icons"
import { fab } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import * as d3 from "d3"
import {
  flextree,
  type FlexHierarchyPointLink,
  type FlexHierarchyPointNode,
} from "d3-flextree"

// Add all icons to the library
library.add(fas, far, fab)

interface Props {
  planSource: string
  planQuery: string
}
const props = defineProps<Props>()

const version = __APP_VERSION__ // eslint-disable-line no-undef

const rootEl = ref(null) // The root Element of this instance
const activeTab = ref<string>("")
const queryText = ref<string>("")
const validationMessage = ref<string>("")
const plan = ref<IPlan>()
const planEl = ref()
let planStats = reactive<IPlanStats>({} as IPlanStats)
const rootNode = ref<Node>()
const showSettings = ref<boolean>(false)
const showTriggers = ref<boolean>(false)
const selectedNodeId = ref<number>(NaN)
const selectedNode = ref<Node | undefined>(undefined)
const highlightedNodeId = ref<number>(NaN)

const viewOptions = reactive({
  menuHidden: true,
  showHighlightBar: false,
  showPlanStats: true,
  highlightType: HighlightType.NONE,
  diagramWidth: 20,
})

const planService = new PlanService()

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage

// Vertical padding between 2 nodes in the tree layout
const padding = 40
const transform = ref("")
const scale = ref(1)
const edgeWeight = computed(() => {
  return d3
    .scaleLinear()
    .domain([0, planStats.maxRows])
    .range([1, padding / 1.5])
})
const minScale = 0.2
const zoomListener = d3
  .zoom()
  .scaleExtent([minScale, 3])
  .on("zoom", function (e) {
    transform.value = e.transform
    scale.value = e.transform.k
  })
const layoutRootNode = ref<null | FlexHierarchyPointNode<Node>>(null)
const ctes = ref<FlexHierarchyPointNode<Node>[]>([])
const toCteLinks = ref<FlexHierarchyPointLink<Node>[]>([])

const layout = flextree({
  nodeSize: (node: FlexHierarchyPointNode<Node>) => {
    if (node.data.size) {
      return [node.data.size[0], node.data.size[1] + padding]
    }
    return [0, 0]
  },
  spacing: (
    nodeA: FlexHierarchyPointNode<Node>,
    nodeB: FlexHierarchyPointNode<Node>
  ) => Math.pow(nodeA.path(nodeB).length, 1.5),
})

const tree = ref(layout.hierarchy({}))

onBeforeMount(() => {
  const savedOptions = localStorage.getItem("viewOptions")
  if (savedOptions) {
    _.assignIn(viewOptions, JSON.parse(savedOptions))
  }
  let planJson: IPlanContent
  try {
    planJson = planService.fromSource(props.planSource) as IPlanContent
    validationMessage.value = ""
    setActiveTab("plan")
  } catch (e) {
    validationMessage.value = "Couldn't parse plan"
    plan.value = undefined
    return
  }
  rootNode.value = planJson.Plan
  queryText.value = planJson["Query Text"] || props.planQuery
  plan.value = planService.createPlan("", planJson, queryText.value)
  const content = plan.value.content
  planStats.executionTime =
    (content["Execution Time"] as number) ||
    (content["Total Runtime"] as number) ||
    NaN
  planStats.planningTime = (content["Planning Time"] as number) || NaN
  planStats.maxRows = content.maxRows || NaN
  planStats.maxCost = content.maxCost || NaN
  planStats.maxDuration = content.maxDuration || NaN
  planStats.maxBlocks = content.maxBlocks || ({} as IBlocksStats)
  planStats.triggers = content.Triggers || []
  planStats.jitTime =
    (content.JIT && content.JIT.Timing && content.JIT.Timing.Total) || NaN
  planStats.settings = content.Settings as Settings
  plan.value.planStats = planStats

  nextTick(() => {
    onHashChange()
  })
  window.addEventListener("hashchange", onHashChange)
  tree.value = layout.hierarchy(rootNode.value, (v: Node) => v.Plans)
  ctes.value = []
  _.each(plan.value?.ctes, (cte) => {
    const tree = layout.hierarchy(cte, (v: Node) => v.Plans)
    ctes.value.push(tree)
  })
  doLayout()
})

function doLayout() {
  layoutRootNode.value = layout(tree.value)

  const mainLayoutExtent = getLayoutExtent(layoutRootNode.value)
  const offset: [number, number] = [
    mainLayoutExtent[0],
    mainLayoutExtent[3] + padding,
  ]
  _.each(ctes.value, (tree) => {
    const cteRootNode = layout(tree)
    const currentCteExtent = getLayoutExtent(cteRootNode)
    const currentWidth = currentCteExtent[1] - currentCteExtent[0]
    cteRootNode.each((node) => {
      node.x += offset[0] - currentCteExtent[0]
      node.y += offset[1]
    })
    offset[0] += currentWidth + padding * 2
  })

  // compute links from node to CTE
  toCteLinks.value = []
  _.each(layoutRootNode.value.descendants(), (source) => {
    if (_.has(source.data, NodeProp.CTE_NAME)) {
      const cte = _.find(ctes.value, (cteNode) => {
        return (
          cteNode.data[NodeProp.SUBPLAN_NAME] ==
          "CTE " + source.data[NodeProp.CTE_NAME]
        )
      })
      if (cte) {
        toCteLinks.value.push({
          source: source,
          target: cte,
        })
      }
    }
  })

  // compute links from node in CTE to other CTE
  _.each(ctes.value, (cte) => {
    _.each(cte.descendants(), (sourceCte) => {
      if (_.has(sourceCte.data, NodeProp.CTE_NAME)) {
        const targetCte = _.find(ctes.value, (cteNode) => {
          return (
            cteNode.data[NodeProp.SUBPLAN_NAME] ==
            "CTE " + sourceCte.data[NodeProp.CTE_NAME]
          )
        })
        if (targetCte) {
          toCteLinks.value.push({
            source: sourceCte,
            target: targetCte,
          })
        }
      }
    })
  })
}

onMounted(() => {
  d3.select(planEl.value.$el).call(zoomListener)
  nextTick(() => {
    if (layoutRootNode.value) {
      const extent = getLayoutExtent(layoutRootNode.value)
      const x0 = extent[0]
      const y0 = extent[2]
      const x1 = extent[1]
      const y1 = extent[3]
      const rect = planEl.value.$el.getBoundingClientRect()

      d3.select(planEl.value.$el)
        .transition()
        .call(
          zoomListener.transform,
          d3.zoomIdentity
            .translate(rect.width / 2, 10)
            .scale(
              Math.min(
                1,
                Math.max(
                  minScale,
                  0.8 /
                    Math.max((x1 - x0) / rect.width, (y1 - y0) / rect.height)
                )
              )
            )
            .translate(-(x0 + x1) / 2, 10)
        )
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onHashChange)
})

watch(viewOptions, onViewOptionsChanged)

function onViewOptionsChanged() {
  localStorage.setItem("viewOptions", JSON.stringify(viewOptions))
}

watch(selectedNodeId, onSelectedNode)

function onSelectedNode(v: number) {
  window.location.hash = v ? "plan/node/" + v : ""
  if (plan.value && v) {
    selectedNode.value = findNodeById(plan.value, v)
  }
}

const lineGen = computed(() => {
  return function (link: FlexHierarchyPointLink<object>) {
    const source = link.source
    const target = link.target
    const k = Math.abs(target.y - (source.y + source.ySize) - padding)
    const path = d3.path()
    path.moveTo(source.x, source.y)
    path.lineTo(source.x, source.y + source.ySize - padding)
    path.bezierCurveTo(
      source.x,
      source.y + source.ySize - padding + k / 2,
      target.x,
      target.y - k / 2,
      target.x,
      target.y
    )
    return path.toString()
  }
})

function onHashChange(): void {
  const reg = /#([a-zA-Z]*)(\/node\/([0-9]*))*/
  const matches = reg.exec(window.location.hash)
  if (matches) {
    const tab = matches[1] || "plan"
    setActiveTab(tab)
    const nodeId = parseInt(matches[3], 0)
    if (
      tab == "plan" &&
      nodeId !== undefined &&
      nodeId != selectedNodeId.value
    ) {
      // Delayed to make sure the tab has changed before recentering
      setTimeout(() => {
        selectNode(nodeId, true)
      }, 1)
    }
  }
}

provide(SelectedNodeIdKey, selectedNodeId)
provide(HighlightedNodeIdKey, highlightedNodeId)
provide("updateNodeSize", updateNodeSize)

function selectNode(nodeId: number, center: boolean): void {
  center = !!center
  selectedNodeId.value = nodeId
  if (center) {
    centerNode(nodeId)
  }
}
provide(SelectNodeKey, selectNode)
provide(ViewOptionsKey, viewOptions)
provide(PlanKey, plan)

function centerNode(nodeId: number): void {
  const rect = planEl.value.$el.getBoundingClientRect()
  const treeNode = findTreeNode(nodeId)
  if (!treeNode) {
    return
  }
  let x = -treeNode["x"]
  let y = -treeNode["y"]
  let k = scale.value
  x = x * k + rect.width / 2
  y = y * k + rect.height / 2
  d3.select(planEl.value.$el)
    .transition()
    .duration(500)
    .call(zoomListener.transform, d3.zoomIdentity.translate(x, y).scale(k))
}

function findTreeNode(nodeId: number) {
  const trees = [layoutRootNode.value].concat(ctes.value)
  let found: undefined | FlexHierarchyPointNode<Node> = undefined
  _.each(trees, (tree) => {
    found = _.find(tree?.descendants(), (o) => o.data.nodeId == nodeId)
    return !found
  })
  return found
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

const totalTriggerDurationPercent = computed(() => {
  const executionTime = planStats.executionTime || 0
  const totalDuration = triggersTotalDuration.value || 0
  return _.round((totalDuration / executionTime) * 100)
})

function triggerDurationPercent(trigger: ITrigger) {
  const executionTime = planStats.executionTime || 0
  const time = trigger.Time
  return _.round((time / executionTime) * 100)
}

const triggersTotalDuration = computed(() => {
  return _.sumBy(planStats.triggers, (o) => o.Time)
})

function getLayoutExtent(
  layoutRootNode: FlexHierarchyPointNode<Node>
): [number, number, number, number] {
  const minX =
    _.min(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.x - childNode.xSize / 2
      })
    ) || 0

  const maxX =
    _.max(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.x + childNode.xSize / 2
      })
    ) || 0

  const minY =
    _.min(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.y
      })
    ) || 0

  const maxY =
    _.max(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.y + childNode.ySize
      })
    ) || 0
  return [minX, maxX, minY, maxY]
}

function isNeverExecuted(node: Node): boolean {
  return !!planStats.executionTime && !node[NodeProp.ACTUAL_LOOPS]
}

watch(
  () => {
    const data: [number, number][] = []
    data.concat(
      tree.value
        .descendants()
        .map((item: FlexHierarchyPointNode<Node>) => item.data.size)
    )
    _.each(ctes.value, (tree) => {
      data.concat(
        tree
          .descendants()
          .map((item: FlexHierarchyPointNode<Node>) => item.data.size)
      )
    })
    return data
  },
  () => {
    doLayout()
  }
)

function updateNodeSize(node: Node, size: [number, number]) {
  node.size = [size[0] / scale.value, size[1] / scale.value]
}
</script>

<template>
  <div
    class="plan-container d-flex flex-column overflow-hidden flex-grow-1 bg-light"
    ref="rootEl"
  >
    <div class="d-flex align-items-center">
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
      <div class="ml-auto mr-2 small">
        <a href="https://github.com/dalibo/pev2" target="_blank">
          <img
            src="data:image/png;base64,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"
            alt="PEV2"
            style="width: 20px; height: 20px"
          />
          {{ version }}
        </a>
      </div>
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
        <div class="d-flex flex-column flex-grow-1 overflow-hidden">
          <div
            class="plan-stats flex-shrink-0 d-flex border-bottom border-top form-inline"
            v-if="plan"
          >
            <div class="d-inline-block px-2">
              Execution time:
              <template v-if="!planStats.executionTime">
                <span class="text-muted">
                  N/A
                  <font-awesome-icon
                    icon="info-circle"
                    class="cursor-help"
                    v-tippy="getHelpMessage('missing execution time')"
                  ></font-awesome-icon>
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
                  <font-awesome-icon
                    icon="info-circle"
                    class="cursor-help"
                    v-tippy="getHelpMessage('missing planning time')"
                  ></font-awesome-icon>
                </span>
              </template>
              <template v-else>
                <span class="stat-value">
                  <span
                    :class="
                      'mb-0 p-0 px-1 alert ' +
                      planningTimeClass(
                        (planStats.planningTime / (planStats.executionTime as number)) *
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
              v-if="planStats.jitTime && planStats.executionTime"
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
              <template v-if="planStats.triggers && planStats.triggers.length">
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
                  <font-awesome-icon
                    icon="caret-down"
                    class="text-muted"
                  ></font-awesome-icon>
                </button>
                <div
                  class="stat-dropdown-container text-left"
                  v-if="showTriggers"
                >
                  <button
                    class="btn btn-close float-right"
                    v-on:click="showTriggers = false"
                  >
                    <font-awesome-icon icon="times"></font-awesome-icon>
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
                          durationClass(triggerDurationPercent(trigger))
                        "
                        v-html="duration(trigger.Time)"
                      ></span>
                      | {{ triggerDurationPercent(trigger)
                      }}<span class="text-muted">%</span>
                    </span>
                    <br />
                    <span class="text-muted" v-if="trigger.Relation">on</span>
                    {{ trigger.Relation }}
                    <div class="clearfix"></div>
                    <hr
                      v-if="
                        planStats.triggers &&
                        index != planStats.triggers.length - 1
                      "
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
                  _.keys(planStats.settings).length
                }}</span></span
              >
              <button
                @click.prevent="showSettings = !showSettings"
                class="bg-transparent border-0 p-0 m-0 pl-1"
              >
                <font-awesome-icon
                  icon="caret-down"
                  class="text-muted"
                ></font-awesome-icon>
              </button>
              <div
                class="stat-dropdown-container text-left"
                v-if="showSettings"
              >
                <button
                  class="btn btn-close float-right"
                  v-on:click="showSettings = false"
                >
                  <font-awesome-icon icon="times"></font-awesome-icon>
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
              v-on:click="viewOptions.menuHidden = !viewOptions.menuHidden"
              :class="[
                'border-left btn btn-sm p-0 px-2 ml-auto',
                { 'text-primary': !viewOptions.menuHidden },
              ]"
            >
              <font-awesome-icon icon="cog" class="p-0"></font-awesome-icon>
              Settings
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
                  class="d-flex flex-column"
                  v-if="plan"
                >
                  <diagram
                    ref="diagram"
                    class="d-flex flex-column flex-grow-1 overflow-hidden plan-diagram"
                  >
                  </diagram>
                </pane>
                <pane ref="planEl" class="plan grab-bing position-relative">
                  <svg width="100%" height="100%">
                    <g :transform="transform">
                      <!-- Links -->
                      <path
                        v-for="(link, index) in toCteLinks"
                        :key="`linkcte${index}`"
                        :d="lineGen(link)"
                        stroke="#B3D7D7"
                        :stroke-width="
                          edgeWeight(
                            link.target.data[NodeProp.ACTUAL_ROWS_REVISED]
                          )
                        "
                        fill="none"
                      />
                      <path
                        v-for="(link, index) in layoutRootNode?.links()"
                        :key="`link${index}`"
                        :d="lineGen(link)"
                        :class="{
                          'never-executed': isNeverExecuted(link.target.data),
                        }"
                        stroke="grey"
                        :stroke-width="
                          edgeWeight(
                            link.target.data[NodeProp.ACTUAL_ROWS_REVISED]
                          )
                        "
                        stroke-linecap="square"
                        fill="none"
                      />
                      <foreignObject
                        v-for="(item, index) in layoutRootNode?.descendants()"
                        :key="index"
                        :x="item.x - item.xSize / 2"
                        :y="item.y"
                        :width="item.xSize"
                        height="1"
                        ref="root"
                      >
                        <plan-node
                          :node="item.data"
                          class="d-flex justify-content-center position-fixed"
                        />
                      </foreignObject>
                      <g v-for="cte in ctes" :key="cte.data.nodeId">
                        <rect
                          :x="getLayoutExtent(cte)[0] - padding / 4"
                          :y="getLayoutExtent(cte)[2] - padding / 2"
                          :width="
                            getLayoutExtent(cte)[1] -
                            getLayoutExtent(cte)[0] +
                            padding / 2
                          "
                          :height="
                            getLayoutExtent(cte)[3] - getLayoutExtent(cte)[2]
                          "
                          stroke="#cfcfcf"
                          stroke-width="2"
                          fill="#cfcfcf"
                          fill-opacity="10%"
                          rx="5"
                          ry="5"
                        ></rect>
                        <path
                          v-for="(link, index) in cte.links()"
                          :key="`link${index}`"
                          :d="lineGen(link)"
                          stroke="grey"
                          :stroke-width="
                            edgeWeight(
                              link.target.data[NodeProp.ACTUAL_ROWS_REVISED]
                            )
                          "
                          stroke-linecap="square"
                          fill="none"
                        />
                        <foreignObject
                          v-for="(item, index) in cte.descendants()"
                          :key="index"
                          :x="item.x - item.xSize / 2"
                          :y="item.y"
                          :width="item.xSize"
                          height="1"
                          ref="root"
                        >
                          <plan-node
                            :node="item.data"
                            class="d-flex justify-content-center position-fixed"
                          />
                        </foreignObject>
                      </g>
                    </g>
                  </svg>
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
              <label class="text-uppercase">Graph metric</label>
              <div class="form-group">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active: viewOptions.highlightType === HighlightType.NONE,
                    }"
                    v-on:click="viewOptions.highlightType = HighlightType.NONE"
                  >
                    none
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active:
                        viewOptions.highlightType === HighlightType.DURATION,
                    }"
                    v-on:click="
                      viewOptions.highlightType = HighlightType.DURATION
                    "
                    :disabled="!plan.isAnalyze"
                  >
                    duration
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active: viewOptions.highlightType === HighlightType.ROWS,
                    }"
                    v-on:click="viewOptions.highlightType = HighlightType.ROWS"
                    :disabled="
                      !rootNode || rootNode[NodeProp.ACTUAL_ROWS] === undefined
                    "
                  >
                    rows
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    :class="{
                      active: viewOptions.highlightType === HighlightType.COST,
                    }"
                    v-on:click="viewOptions.highlightType = HighlightType.COST"
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
          <copy :content="planSource" />
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
        <copy :content="queryText" />
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-auto"
        :class="{ 'show active': activeTab === 'stats' }"
      >
        <stats v-if="plan"></stats>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "../assets/scss/variables";
@import "../assets/scss/pev2";
@import "splitpanes/dist/splitpanes.css";
@import "highlight.js/scss/stackoverflow-light.scss";

path {
  stroke-linecap: butt;
  &.never-executed {
    stroke-dasharray: 0.5em;
    stroke-opacity: 0.5;
  }
}
</style>
