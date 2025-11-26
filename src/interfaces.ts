import type {
  BufferLocation,
  HighlightType,
  SortGroupsProp,
  SortSpaceMemoryProp,
} from "@/enums"

export interface IPlan {
  id: string
  name: string
  content: IPlanContent
  query: string
  createdOn: Date
  planStats: IPlanStats
  formattedQuery?: string
  ctes: Node[]
  isAnalyze: boolean
  isVerbose: boolean
}

export interface IPlanContent {
  Plan: Node
  maxRows?: number
  maxCost?: number
  maxTotalCost?: number
  maxDuration?: number
  maxBlocks?: IBlocksStats
  maxIo?: number
  maxEstimateFactor?: number
  Triggers?: ITrigger[]
  JIT?: JIT
  "Query Text"?: string
  [k: string]:
    | Node
    | number
    | string
    | IBlocksStats
    | ITrigger[]
    | JIT
    | undefined
}

export interface ITrigger {
  "Trigger Name": string
  Relation?: string
  Time: number
  Calls: string
}

export interface IPlanStats {
  executionTime?: number
  planningTime?: number
  maxRows: number
  maxCost: number
  maxDuration: number
  maxBlocks: IBlocksStats
  maxIo: number
  maxEstimateFactor: number
  triggers?: ITrigger[]
  jitTime?: number
  settings?: Settings
}

export type IBlocksStats = {
  [key in BufferLocation]: number
}

import { EstimateDirection, NodeProp } from "@/enums"

// Class to create nodes when parsing text
export class Node {
  nodeId!: number
  size!: [number, number];
  ["Options"]?: Options;
  ["Timing"]?: Timing;
  ["Settings"]?: Settings;
  [NodeProp.ACTUAL_LOOPS]!: number;
  [NodeProp.ACTUAL_ROWS]!: number;
  [NodeProp.ACTUAL_ROWS_REVISED]!: number;
  [NodeProp.ACTUAL_STARTUP_TIME]?: number;
  [NodeProp.ACTUAL_TOTAL_TIME]?: number;
  [NodeProp.EXCLUSIVE_COST]!: number;
  [NodeProp.EXCLUSIVE_DURATION]!: number;
  [NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_READ_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_WRITTEN_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]!: number;
  [NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]!: number;
  [NodeProp.FILTER]!: string;
  [NodeProp.PLANNER_ESTIMATE_DIRECTION]?: EstimateDirection;
  [NodeProp.PLANNER_ESTIMATE_FACTOR]?: number;
  [NodeProp.INDEX_NAME]?: string;
  [NodeProp.NODE_TYPE]!: string;
  [NodeProp.PARALLEL_AWARE]!: boolean;
  [NodeProp.PLANS]!: Node[];
  [NodeProp.PLAN_ROWS]!: number;
  [NodeProp.PLAN_ROWS_REVISED]?: number;
  [NodeProp.SUBPLAN_NAME]?: string;
  [NodeProp.TOTAL_COST]!: number;
  [NodeProp.WORKERS]?: Worker[];
  [NodeProp.WORKERS_LAUNCHED]?: number;
  [NodeProp.WORKERS_PLANNED]?: number;
  [NodeProp.WORKERS_LAUNCHED_BY_GATHER]?: number;
  [NodeProp.WORKERS_PLANNED_BY_GATHER]?: number;
  [NodeProp.EXCLUSIVE_IO_READ_TIME]!: number;
  [NodeProp.EXCLUSIVE_IO_WRITE_TIME]!: number;
  [NodeProp.EXCLUSIVE_SHARED_IO_READ_TIME]!: number;
  [NodeProp.EXCLUSIVE_SHARED_IO_WRITE_TIME]!: number;
  [NodeProp.EXCLUSIVE_LOCAL_IO_READ_TIME]!: number;
  [NodeProp.EXCLUSIVE_LOCAL_IO_WRITE_TIME]!: number;
  [NodeProp.EXCLUSIVE_TEMP_IO_READ_TIME]!: number;
  [NodeProp.EXCLUSIVE_TEMP_IO_WRITE_TIME]!: number;
  [NodeProp.EXCLUSIVE_SUM_IO_READ_TIME]!: number;
  [NodeProp.EXCLUSIVE_SUM_IO_WRITE_TIME]!: number;
  [NodeProp.AVERAGE_IO_READ_SPEED]!: number;
  [NodeProp.AVERAGE_IO_WRITE_SPEED]!: number;
  [NodeProp.AVERAGE_SHARED_IO_READ_SPEED]!: number;
  [NodeProp.AVERAGE_SHARED_IO_WRITE_SPEED]!: number;
  [NodeProp.AVERAGE_LOCAL_IO_READ_SPEED]!: number;
  [NodeProp.AVERAGE_LOCAL_IO_WRITE_SPEED]!: number;
  [NodeProp.AVERAGE_TEMP_IO_READ_SPEED]!: number;
  [NodeProp.AVERAGE_TEMP_IO_WRITE_SPEED]!: number;
  [NodeProp.AVERAGE_SUM_IO_READ_SPEED]!: number;
  [NodeProp.AVERAGE_SUM_IO_WRITE_SPEED]!: number;
  [NodeProp.EXCLUSIVE_AVERAGE_SUM_IO_READ_SPEED]!: number;
  [NodeProp.EXCLUSIVE_AVERAGE_SUM_IO_WRITE_SPEED]!: number;
  [NodeProp.IO_READ_TIME]!: number;
  [NodeProp.IO_WRITE_TIME]!: number;
  [NodeProp.SHARED_IO_READ_TIME]!: number;
  [NodeProp.SHARED_IO_WRITE_TIME]!: number;
  [NodeProp.LOCAL_IO_READ_TIME]!: number;
  [NodeProp.LOCAL_IO_WRITE_TIME]!: number;
  [NodeProp.TEMP_IO_READ_TIME]!: number;
  [NodeProp.TEMP_IO_WRITE_TIME]!: number;
  [NodeProp.SUM_IO_READ_TIME]!: number;
  [NodeProp.SUM_IO_WRITE_TIME]!: number;
  [NodeProp.PARTIAL_MODE]!: string;
  [NodeProp.SCAN_DIRECTION]!: string;
  [k: string]:
    | Node[]
    | Options
    | SortGroups
    | Timing
    | Worker[]
    | boolean
    | number
    | string
    | string[]
    | undefined
    | [number, number]
  constructor(type?: string) {
    if (!type) {
      return
    }
    this[NodeProp.NODE_TYPE] = type

    enum ScanAndOperationMatch {
      NodeType = 1,
      RelationName,
      Alias,
    }
    // tslint:disable-next-line:max-line-length
    const scanAndOperationsRegex =
      /^((?:Parallel\s+)?(?:Seq|Tid.*|Bitmap\s+Heap|WorkTable|(?:Async\s+)?Foreign)\s+Scan|Update|Insert|Delete|Merge)\son\s(\S+)(?:\s+(\S+))?$/.exec(
        type,
      )

    enum BitmapMatch {
      NodeType = 1,
      IndexName,
    }
    const bitmapRegex = /^(Bitmap\s+Index\s+Scan)\son\s(\S+)$/.exec(type)
    enum IndexMatch {
      NodeType = 1,
      ScanDirection,
      IndexName,
      RelationName,
      Alias,
    }
    // tslint:disable-next-line:max-line-length
    const indexRegex =
      /^((?:Parallel\s+)?Index(?:\sOnly)?\sScan)(\sBackward)?\susing\s(\S+)\son\s(\S+)(?:\s+(\S+))?$/.exec(
        type,
      )

    enum CteMatch {
      NodeType = 1,
      CteName,
      Alias,
    }
    const cteRegex = /^(CTE\sScan)\son\s(\S+)(?:\s+(\S+))?$/.exec(type)

    enum FunctionMatch {
      NodeType = 1,
      FunctionName,
      Alias,
    }
    const functionRegex = /^(Function\sScan)\son\s(\S+)(?:\s+(\S+))?$/.exec(
      type,
    )
    enum SubqueryMatch {
      NodeType = 1,
      Alias,
    }
    const subqueryRegex = /^(Subquery\sScan)\son\s(.+)$/.exec(type)
    if (scanAndOperationsRegex) {
      this[NodeProp.NODE_TYPE] =
        scanAndOperationsRegex[ScanAndOperationMatch.NodeType]
      this[NodeProp.RELATION_NAME] =
        scanAndOperationsRegex[ScanAndOperationMatch.RelationName]
      if (scanAndOperationsRegex[ScanAndOperationMatch.Alias]) {
        this[NodeProp.ALIAS] =
          scanAndOperationsRegex[ScanAndOperationMatch.Alias]
      }
    } else if (bitmapRegex) {
      this[NodeProp.NODE_TYPE] = bitmapRegex[BitmapMatch.NodeType]
      this[NodeProp.INDEX_NAME] = bitmapRegex[BitmapMatch.IndexName]
    } else if (indexRegex) {
      this[NodeProp.NODE_TYPE] = indexRegex[IndexMatch.NodeType]
      this[NodeProp.INDEX_NAME] = indexRegex[IndexMatch.IndexName]
      this[NodeProp.SCAN_DIRECTION] = indexRegex[IndexMatch.ScanDirection] ? "Backward" : "Forward"
      this[NodeProp.RELATION_NAME] = indexRegex[IndexMatch.RelationName]
      if (indexRegex[IndexMatch.Alias]) {
        this[NodeProp.ALIAS] = indexRegex[IndexMatch.Alias]
      }
    } else if (cteRegex) {
      this[NodeProp.NODE_TYPE] = cteRegex[CteMatch.NodeType]
      this[NodeProp.CTE_NAME] = cteRegex[CteMatch.CteName]
      if (cteRegex[CteMatch.Alias]) {
        this[NodeProp.ALIAS] = cteRegex[CteMatch.Alias]
      }
    } else if (functionRegex) {
      this[NodeProp.NODE_TYPE] = functionRegex[FunctionMatch.NodeType]
      this[NodeProp.FUNCTION_NAME] = functionRegex[FunctionMatch.FunctionName]
      if (functionRegex[FunctionMatch.Alias]) {
        this[NodeProp.ALIAS] = functionRegex[FunctionMatch.Alias]
      }
    } else if (subqueryRegex) {
      this[NodeProp.NODE_TYPE] = subqueryRegex[SubqueryMatch.NodeType]
      this[NodeProp.ALIAS] = subqueryRegex[SubqueryMatch.Alias]
    }
    enum ParallelMatch {
      NodeType = 2,
    }
    const parallelRegex = /^(Parallel\s+)(.*)/.exec(
      <string>this[NodeProp.NODE_TYPE],
    )
    if (parallelRegex) {
      this[NodeProp.NODE_TYPE] = parallelRegex[ParallelMatch.NodeType]
      this[NodeProp.PARALLEL_AWARE] = true
    }

    enum JoinMatch {
      NodeType = 1,
    }
    const joinRegex = /(.*)\sJoin$/.exec(<string>this[NodeProp.NODE_TYPE])

    enum JoinModifierMatch {
      NodeType = 1,
      JoinType,
    }
    const joinModifierRegex = /(.*)\s+(Full|Left|Right|Anti)/.exec(
      <string>this[NodeProp.NODE_TYPE],
    )
    if (joinRegex) {
      this[NodeProp.NODE_TYPE] = joinRegex[JoinMatch.NodeType]
      if (joinModifierRegex) {
        this[NodeProp.NODE_TYPE] = joinModifierRegex[JoinModifierMatch.NodeType]
        this[NodeProp.JOIN_TYPE] = joinModifierRegex[JoinModifierMatch.JoinType]
      }
      this[NodeProp.NODE_TYPE] += " Join"
    }
  }
}

import { WorkerProp } from "@/enums"
// Class to create workers when parsing text
export class Worker {
  [k: string]: string | number | object
  constructor(workerNumber: number) {
    this[WorkerProp.WORKER_NUMBER] = workerNumber
  }
}

export type Options = {
  [k: string]: string
}

export type Timing = {
  [k: string]: number
}

export type Settings = {
  [k: string]: string
}

export type SortGroups = {
  [SortGroupsProp.SORT_METHODS_USED]: string[]
  [SortGroupsProp.SORT_SPACE_MEMORY]: SortSpaceMemory
  [key: string]: number | string | string[] | SortSpaceMemory
}

export type SortSpaceMemory = {
  [key in SortSpaceMemoryProp]: number
}

export type StatsTableItemType = {
  name: string
  count: number
  time: number
  timePercent: number
  nodes: Node[]
}

export type ViewOptions = {
  showHighlightBar: boolean
  showPlanStats: boolean
  highlightType: HighlightType
  diagramWidth: number
}

export interface JIT {
  ["Timing"]: Timing
  [key: string]: number | Timing
}

// A plan node with id, node, isLastSibling, branches
export type Row = [number, Node, boolean, number[]]
