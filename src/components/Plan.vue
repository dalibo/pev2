<script lang="ts" setup>
import _ from "lodash"
import {
  computed,
  reactive,
  ref,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  watch,
} from "vue"
import { Splitpanes, Pane } from "splitpanes"

import type {
  IBlocksStats,
  IPlan,
  IPlanContent,
  IPlanStats,
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
import Grid from "@/components/Grid.vue"
import LogoImage from "@/components/LogoImage.vue"
import PlanNode from "@/components/PlanNode.vue"
import PlanStats from "@/components/PlanStats.vue"
import Stats from "@/components/Stats.vue"
import AnimatedEdge from "@/components/AnimatedEdge.vue"
import { PlanService } from "@/services/plan-service"
import { findNodeById } from "@/services/help-service"
import { HighlightType, NodeProp } from "@/enums"
import { json_, pgsql_ } from "@/filters"
import { setDefaultProps } from "vue-tippy"

setDefaultProps({ theme: "light" })

import "tippy.js/dist/tippy.css"
import "tippy.js/themes/light.css"
import * as d3 from "d3"
import {
  flextree,
  type FlexHierarchyPointLink,
  type FlexHierarchyPointNode,
} from "d3-flextree"

interface Props {
  planSource: string
  planQuery: string
}
const props = defineProps<Props>()

const version = __APP_VERSION__

const rootEl = ref(null) // The root Element of this instance
const activeTab = ref<string>("")
const queryText = ref<string>("")
const plan = ref<IPlan>()
const planEl = ref()
const planStats = reactive<IPlanStats>({} as IPlanStats)
const rootNode = computed(() => plan.value && plan.value.content.Plan)
const selectedNodeId = ref<number>(NaN)
const selectedNode = ref<Node | undefined>(undefined)
const highlightedNodeId = ref<number>(NaN)
const gridIsNotNew = localStorage.getItem("gridIsNotNew")
const ready = ref(false)

const viewOptions = reactive({
  showHighlightBar: false,
  showPlanStats: true,
  highlightType: HighlightType.NONE,
  diagramWidth: 20,
})

const planService = new PlanService()

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
    nodeB: FlexHierarchyPointNode<Node>,
  ) => Math.pow(nodeA.path(nodeB).length, 1.5),
})

const tree = ref(layout.hierarchy({}))

onMounted(() => {
  watch(() => [props.planSource, props.planQuery], parseAndShow, {
    immediate: true,
  })
})

function parseAndShow() {
  ready.value = false
  const savedOptions = localStorage.getItem("viewOptions")
  if (savedOptions) {
    _.assignIn(viewOptions, JSON.parse(savedOptions))
  }
  let planJson: IPlanContent
  try {
    planJson = planService.fromSource(props.planSource) as IPlanContent
    setActiveTab("plan")
  } catch {
    plan.value = undefined
    return
  }
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
  planStats.maxIo = content.maxIo || NaN
  planStats.maxEstimateFactor = content.maxEstimateFactor || NaN
  planStats.triggers = content.Triggers || []
  planStats.jitTime =
    (content.JIT && content.JIT.Timing && content.JIT.Timing.Total) || NaN
  planStats.settings = content.Settings as Settings
  plan.value.planStats = planStats

  nextTick(() => {
    onHashChange()
  })
  window.addEventListener("hashchange", onHashChange)
  if (rootNode.value) {
    tree.value = layout.hierarchy(rootNode.value, (v: Node) => v.Plans)
  }
  ctes.value = []
  _.each(plan.value?.ctes, (cte) => {
    const tree = layout.hierarchy(cte, (v: Node) => v.Plans)
    ctes.value.push(tree)
  })
  nextTick(() => {
    initZoom()
    ready.value = true
  })
}

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

function initZoom() {
  if (!planEl.value) {
    return
  }
  d3.select(planEl.value.$el).call(zoomListener)
  nextTick(() => {
    if (layoutRootNode.value) {
      const extent = getLayoutExtent(layoutRootNode.value)
      const x0 = extent[0]
      const y0 = extent[2]
      const x1 = extent[1]
      const y1 = extent[3]
      const rect = planEl.value.$el.getBoundingClientRect()

      d3.select(planEl.value.$el).call(
        zoomListener.transform,
        d3.zoomIdentity
          .translate(rect.width / 2, 10)
          .scale(
            Math.min(
              1,
              Math.max(
                minScale,
                0.8 / Math.max((x1 - x0) / rect.width, (y1 - y0) / rect.height),
              ),
            ),
          )
          .translate(-(x0 + x1) / 2, 10),
      )
    }
  })
}

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

function lineGen(link: FlexHierarchyPointLink<object>) {
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
    target.y,
  )
  return path.toString()
}

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
  const k = scale.value
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

function getLayoutExtent(
  layoutRootNode: FlexHierarchyPointNode<Node>,
): [number, number, number, number] {
  const minX =
    _.min(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.x - childNode.xSize / 2
      }),
    ) || 0

  const maxX =
    _.max(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.x + childNode.xSize / 2
      }),
    ) || 0

  const minY =
    _.min(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.y
      }),
    ) || 0

  const maxY =
    _.max(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.y + childNode.ySize
      }),
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
        .map((item: FlexHierarchyPointNode<Node>) => item.data.size),
    )
    _.each(ctes.value, (tree) => {
      data.concat(
        tree
          .descendants()
          .map((item: FlexHierarchyPointNode<Node>) => item.data.size),
      )
    })
    return data
  },
  () => {
    doLayout()
  },
)

function updateNodeSize(node: Node, size: [number, number]) {
  node.size = [size[0] / scale.value, size[1] / scale.value]
}
</script>

<template>
  <div v-if="!plan" class="flex-grow-1 d-flex justify-content-center">
    <div class="card align-self-center border-danger w-50">
      <div class="card-body">
        <h5 class="card-title text-danger">Couldn't parse plan</h5>
        <h6 class="card-subtitle mb-2 text-body-secondary">
          An error occured while parsing the plan
        </h6>
        <div class="overflow-hidden d-flex w-100 h-100 position-relative mb-3">
          <div class="overflow-auto flex-grow-1">
            <pre
              class="small p-2 mb-0"
              style="max-height: 200px"
            ><code v-html="planSource"></code></pre>
          </div>
          <Copy :content="planSource" />
        </div>
        <p class="card-text text-body-dark">
          The plan you submited couldn't be parsed. This may be a bug. You can
          help us fix it by opening a new issue.
        </p>
        <div class="d-flex align-items-center">
          <span class="text-secondary">
            <LogoImage />
            PEV2 <i>version {{ version }}</i>
          </span>
          <a
            href="https://github.com/dalibo/pev2/issues/new?template=parsing_error.md&labels=parsing&title=Failed+to+parse+plan"
            target="_blank"
            class="btn btn-primary ms-auto"
            >Open an issue on Github</a
          >
        </div>
      </div>
    </div>
  </div>
  <div
    class="plan-container d-flex flex-column overflow-hidden flex-grow-1 bg-light"
    v-else
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
            class="nav-link px-2 py-0 position-relative"
            :class="{ active: activeTab === 'grid' }"
            href="#grid"
            >Grid
            <span
              class="badge bg-info"
              style="font-size: 0.6em"
              v-if="!gridIsNotNew"
            >
              new
            </span>
          </a>
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
      <div class="ms-auto me-2 small">
        <a href="https://github.com/dalibo/pev2" target="_blank">
          <LogoImage />
          {{ version }}
        </a>
      </div>
    </div>
    <div class="tab-content flex-grow-1 d-flex overflow-hidden">
      <div
        class="tab-pane flex-grow-1 overflow-hidden"
        :class="{ 'show active d-flex': activeTab === 'plan' }"
      >
        <!-- Plan tab -->
        <div class="d-flex flex-column flex-grow-1 overflow-hidden">
          <PlanStats
            :planStats="planStats"
            :rootNode="rootNode!"
            :jitDetails="plan.content.JIT"
          />
          <div class="flex-grow-1 d-flex overflow-hidden">
            <div class="flex-grow-1 overflow-hidden">
              <Splitpanes
                class="default-theme"
                @resize="viewOptions.diagramWidth = $event[0].size"
              >
                <Pane
                  :size="viewOptions.diagramWidth"
                  class="d-flex flex-column"
                  v-if="plan"
                >
                  <Diagram
                    ref="diagram"
                    class="d-flex flex-column flex-grow-1 overflow-hidden plan-diagram"
                    :ctes="plan.ctes"
                    :planStats="planStats"
                    :rootNode="rootNode!"
                  />
                </Pane>
                <Pane ref="planEl" class="plan grab-bing position-relative">
                  <div
                    class="position-absolute m-1 p-1 bottom-0 end-0 rounded bg-white d-flex"
                    v-if="plan"
                  >
                    <div class="btn-group btn-group-xs">
                      <button
                        class="btn btn-outline-secondary"
                        :class="{
                          active:
                            viewOptions.highlightType === HighlightType.NONE,
                        }"
                        v-on:click="
                          viewOptions.highlightType = HighlightType.NONE
                        "
                      >
                        none
                      </button>
                      <button
                        class="btn btn-outline-secondary"
                        :class="{
                          active:
                            viewOptions.highlightType ===
                            HighlightType.DURATION,
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
                          active:
                            viewOptions.highlightType === HighlightType.ROWS,
                        }"
                        v-on:click="
                          viewOptions.highlightType = HighlightType.ROWS
                        "
                        :disabled="
                          !rootNode ||
                          rootNode[NodeProp.ACTUAL_ROWS] === undefined
                        "
                      >
                        rows
                      </button>
                      <button
                        class="btn btn-outline-secondary"
                        :class="{
                          active:
                            viewOptions.highlightType === HighlightType.COST,
                        }"
                        v-on:click="
                          viewOptions.highlightType = HighlightType.COST
                        "
                      >
                        cost
                      </button>
                    </div>
                  </div>
                  <svg width="100%" height="100%" :class="{ ready }">
                    <g :transform="transform">
                      <!-- Links -->
                      <AnimatedEdge
                        v-for="(link, index) in toCteLinks"
                        :key="`${plan.id}_linkcte${index}`"
                        :d="lineGen(link)"
                        stroke-color="#B3D7D7"
                        :stroke-width="
                          edgeWeight(
                            link.target.data[NodeProp.ACTUAL_ROWS_REVISED],
                          )
                        "
                      />
                      <AnimatedEdge
                        v-for="(link, index) in layoutRootNode?.links()"
                        :key="`${plan.id}_link${index}`"
                        :d="lineGen(link)"
                        :class="{
                          'never-executed': isNeverExecuted(link.target.data),
                        }"
                        stroke-color="grey"
                        :stroke-width="
                          edgeWeight(
                            link.target.data[NodeProp.ACTUAL_ROWS_REVISED],
                          )
                        "
                      />
                      <foreignObject
                        v-for="(item, index) in layoutRootNode?.descendants()"
                        :key="`${plan.id}_${index}`"
                        :x="item.x - item.xSize / 2"
                        :y="item.y"
                        :width="item.xSize"
                        height="1"
                        ref="root"
                      >
                        <PlanNode
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
                        <AnimatedEdge
                          v-for="(link, index) in cte.links()"
                          :key="`${plan.id}_link${index}`"
                          :d="lineGen(link)"
                          stroke-color="grey"
                          :stroke-width="
                            edgeWeight(
                              link.target.data[NodeProp.ACTUAL_ROWS_REVISED],
                            )
                          "
                        />
                        <foreignObject
                          v-for="(item, index) in cte.descendants()"
                          :key="`${plan.id}_${index}`"
                          :x="item.x - item.xSize / 2"
                          :y="item.y"
                          :width="item.xSize"
                          height="1"
                          ref="root"
                        >
                          <PlanNode
                            :node="item.data"
                            class="d-flex justify-content-center position-fixed"
                          />
                        </foreignObject>
                      </g>
                    </g>
                  </svg>
                </Pane>
              </Splitpanes>
            </div>
          </div>
          <!-- end Plan tab -->
        </div>
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-hidden position-relative"
        :class="{ 'show active': activeTab === 'grid' }"
        v-if="activeTab === 'grid'"
      >
        <div class="overflow-hidden d-flex w-100 h-100 flex-column">
          <PlanStats
            :planStats="planStats"
            :rootNode="rootNode!"
            :jitDetails="plan.content.JIT"
          />
          <Grid
            class="flex-grow-1 overflow-auto plan-grid"
            :ctes="plan.ctes"
            :rootNode="rootNode!"
          />
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
          <Copy :content="planSource" />
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
        <Copy :content="queryText" />
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-auto"
        :class="{ 'show active': activeTab === 'stats' }"
      >
        <Stats
          v-if="plan"
          :ctes="plan.ctes"
          :planStats="planStats"
          :rootNode="rootNode"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "../assets/scss/variables";
@import "../assets/scss/pev2";
@import "splitpanes/dist/splitpanes.css";
@import "highlight.js/scss/stackoverflow-light.scss";

.ready {
  rect,
  foreignObject {
    transition: all 0.2s ease-in-out;
  }
}
</style>
