import _ from "lodash"
import { reactive } from 'vue'
import { PlanService } from "@/services/plan-service"
import type {
  Node,
  IPlan,
  IPlanContent,
  IPlanStats,
  IBlocksStats,
  Settings,
} from "@/interfaces"

type FlattenedNodeMap = Map<number, FlattenedPlanNode>;

interface Store {
  plan?: IPlan
  query?: string
  stats: IPlanStats
  parse(source: string, query: string): void
  flat: FlattenedPlanNode[][]
  nodeById?: FlattenedNodeMap
}

export interface FlattenedPlanNode {
  node: Node;

  /** Ancestry path */
  path: number[];

  /** Branch continuation flags per depth */
  branches: boolean[];

  level: number;
}

const planService = new PlanService()


function flattenPlan(root: Node, nodeById: FlattenedNodeMap): FlattenedPlanNode[] {
  const result: FlattenedPlanNode[] = [];

  const visit = (
    node: Node,
    path: number[],
    branches: boolean[],
    level: number,
  ): void => {
    const currentPath = [...path, node.nodeId];

    const flattenedNode = {
      node,
      path: currentPath,
      branches,
      level,
    }
    result.push(flattenedNode);
    nodeById.set(node.nodeId, flattenedNode)

    const children = node.Plans ?? [];
    children.forEach((child, index) => {
      const childIsLast = index === children.length - 1;

      visit(
        child,
        currentPath,
        [
          ...branches,
          !childIsLast // ← pipe continues if not last
        ],
        level + 1
      );
    });
  };

  visit(root, [], [], 0);
  return result;
}

function initStats(): IPlanStats {
  return {
    executionTime: NaN,
    planningTime:  NaN,
    maxRows:  NaN,
    maxCost:  NaN,
    maxDuration:  NaN,
    maxBlocks:  {} as IBlocksStats,
    maxIo:  NaN,
    maxEstimateFactor:  NaN,
    triggers:  [],
    jitTime:  NaN,
    settings: {} as Settings
  }
}


export const store = reactive<Store>({
  flat: [],
  stats: initStats(),
  nodeById: new Map(),
  parse(source: string, query: string) {
    store.stats = initStats()
    store.flat = []
    const nodeById = new Map();
    let planJson: IPlanContent
    try {
      planJson = planService.fromSource(source) as IPlanContent
    } catch {
      store.plan = undefined
      return
    }
    store.query = planJson["Query Text"] || query
    store.plan = planService.createPlan("", planJson, store.query)

    const content = store.plan.content
    store.stats = {
      executionTime: (content["Execution Time"] as number) || (content["Total Runtime"] as number) || NaN,
      planningTime:  (content["Planning Time"] as number) || NaN,
      maxRows:  content.maxRows || NaN,
      maxCost:  content.maxCost || NaN,
      maxDuration:  content.maxDuration || NaN,
      maxBlocks:  content.maxBlocks || ({} as IBlocksStats),
      maxIo:  content.maxIo || NaN,
      maxEstimateFactor:  content.maxEstimateFactor || NaN,
      triggers:  content.Triggers || [],
      jitTime:  (content.JIT && content.JIT.Timing && content.JIT.Timing.Total) || NaN,
      settings:  content.Settings as Settings
    }

    const flatPlans = []
    flatPlans.push(flattenPlan(store.plan.content.Plan, nodeById))
    _.each(store.plan.ctes, (cte) => {
        flatPlans.push(flattenPlan(cte, nodeById))
    })
    store.flat = flatPlans

    store.nodeById = nodeById
  }
})
