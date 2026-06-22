import type {
  BufferLocation,
  EstimateDirection,
  HighlightType,
  SortSpaceMemoryProp,
} from "@/enums"

import { Property } from "@/enums"

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
  Serialization?: ISerialization
  "Query Text"?: string
  [k: string]:
    | Node
    | number
    | string
    | IBlocksStats
    | ITrigger[]
    | JIT
    | ISerialization
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
  serialization?: ISerialization
  settings?: Settings
}

export type IBlocksStats = {
  [key in BufferLocation]: number
}

// Class to create nodes when parsing text
export class Node {
  nodeId!: number
  size!: [number, number];
  ["Options"]?: Options;
  ["Timing"]?: Timing;
  ["Settings"]?: Settings;
  [Property.ACTUAL_LOOPS]!: number;
  [Property.ACTUAL_ROWS]!: number;
  [Property.ACTUAL_ROWS_REVISED]!: number;
  [Property.ACTUAL_STARTUP_TIME]?: number;
  [Property.ACTUAL_TOTAL_TIME]?: number;
  [Property.EXCLUSIVE_COST]!: number;
  [Property.EXCLUSIVE_DURATION]!: number;
  [Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]!: number;
  [Property.EXCLUSIVE_LOCAL_HIT_BLOCKS]!: number;
  [Property.EXCLUSIVE_LOCAL_READ_BLOCKS]!: number;
  [Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]!: number;
  [Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]!: number;
  [Property.EXCLUSIVE_SHARED_HIT_BLOCKS]!: number;
  [Property.EXCLUSIVE_SHARED_READ_BLOCKS]!: number;
  [Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]!: number;
  [Property.EXCLUSIVE_READ_BLOCKS]!: number;
  [Property.EXCLUSIVE_WRITTEN_BLOCKS]!: number;
  [Property.EXCLUSIVE_TEMP_READ_BLOCKS]!: number;
  [Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]!: number;
  [Property.FILTER]!: string;
  [Property.PLANNER_ESTIMATE_DIRECTION]?: EstimateDirection;
  [Property.PLANNER_ESTIMATE_FACTOR]?: number;
  [Property.INDEX_NAME]?: string;
  [Property.NODE_TYPE]!: string;
  [Property.PARALLEL_AWARE]: boolean = false;
  [Property.PLANS]!: Node[];
  [Property.PLAN_ROWS]!: number;
  [Property.PLAN_ROWS_REVISED]?: number;
  [Property.SUBPLAN_NAME]?: string;
  [Property.TOTAL_COST]!: number;
  [Property.WORKERS]?: Worker[];
  [Property.WORKERS_LAUNCHED]?: number;
  [Property.WORKERS_PLANNED]?: number;
  [Property.WORKERS_LAUNCHED_BY_GATHER]?: number;
  [Property.WORKERS_PLANNED_BY_GATHER]?: number;
  [Property.EXCLUSIVE_IO_READ_TIME]!: number;
  [Property.EXCLUSIVE_IO_WRITE_TIME]!: number;
  [Property.EXCLUSIVE_SHARED_IO_READ_TIME]!: number;
  [Property.EXCLUSIVE_SHARED_IO_WRITE_TIME]!: number;
  [Property.EXCLUSIVE_LOCAL_IO_READ_TIME]!: number;
  [Property.EXCLUSIVE_LOCAL_IO_WRITE_TIME]!: number;
  [Property.EXCLUSIVE_TEMP_IO_READ_TIME]!: number;
  [Property.EXCLUSIVE_TEMP_IO_WRITE_TIME]!: number;
  [Property.EXCLUSIVE_SUM_IO_READ_TIME]!: number;
  [Property.EXCLUSIVE_SUM_IO_WRITE_TIME]!: number;
  [Property.AVERAGE_IO_READ_SPEED]!: number;
  [Property.AVERAGE_IO_WRITE_SPEED]!: number;
  [Property.AVERAGE_SHARED_IO_READ_SPEED]!: number;
  [Property.AVERAGE_SHARED_IO_WRITE_SPEED]!: number;
  [Property.AVERAGE_LOCAL_IO_READ_SPEED]!: number;
  [Property.AVERAGE_LOCAL_IO_WRITE_SPEED]!: number;
  [Property.AVERAGE_TEMP_IO_READ_SPEED]!: number;
  [Property.AVERAGE_TEMP_IO_WRITE_SPEED]!: number;
  [Property.AVERAGE_SUM_IO_READ_SPEED]!: number;
  [Property.AVERAGE_SUM_IO_WRITE_SPEED]!: number;
  [Property.EXCLUSIVE_AVERAGE_SUM_IO_READ_SPEED]!: number;
  [Property.EXCLUSIVE_AVERAGE_SUM_IO_WRITE_SPEED]!: number;
  [Property.IO_READ_TIME]!: number;
  [Property.IO_WRITE_TIME]!: number;
  [Property.SHARED_IO_READ_TIME]!: number;
  [Property.SHARED_IO_WRITE_TIME]!: number;
  [Property.LOCAL_IO_READ_TIME]!: number;
  [Property.LOCAL_IO_WRITE_TIME]!: number;
  [Property.TEMP_IO_READ_TIME]!: number;
  [Property.TEMP_IO_WRITE_TIME]!: number;
  [Property.SUM_IO_READ_TIME]!: number;
  [Property.SUM_IO_WRITE_TIME]!: number;
  [Property.PARTIAL_MODE]!: string;
  [Property.SCAN_DIRECTION]!: string;
  [Property.DISABLED]: boolean = false;
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
    this[Property.NODE_TYPE] = type

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
      this[Property.NODE_TYPE] =
        scanAndOperationsRegex[ScanAndOperationMatch.NodeType]
      this[Property.RELATION_NAME] =
        scanAndOperationsRegex[ScanAndOperationMatch.RelationName]
      if (scanAndOperationsRegex[ScanAndOperationMatch.Alias]) {
        this[Property.ALIAS] =
          scanAndOperationsRegex[ScanAndOperationMatch.Alias]
      }
    } else if (bitmapRegex) {
      this[Property.NODE_TYPE] = bitmapRegex[BitmapMatch.NodeType]
      this[Property.INDEX_NAME] = bitmapRegex[BitmapMatch.IndexName]
    } else if (indexRegex) {
      this[Property.NODE_TYPE] = indexRegex[IndexMatch.NodeType]
      this[Property.INDEX_NAME] = indexRegex[IndexMatch.IndexName]
      this[Property.SCAN_DIRECTION] = indexRegex[IndexMatch.ScanDirection] ? "Backward" : "Forward"
      this[Property.RELATION_NAME] = indexRegex[IndexMatch.RelationName]
      if (indexRegex[IndexMatch.Alias]) {
        this[Property.ALIAS] = indexRegex[IndexMatch.Alias]
      }
    } else if (cteRegex) {
      this[Property.NODE_TYPE] = cteRegex[CteMatch.NodeType]
      this[Property.CTE_NAME] = cteRegex[CteMatch.CteName]
      if (cteRegex[CteMatch.Alias]) {
        this[Property.ALIAS] = cteRegex[CteMatch.Alias]
      }
    } else if (functionRegex) {
      this[Property.NODE_TYPE] = functionRegex[FunctionMatch.NodeType]
      this[Property.FUNCTION_NAME] = functionRegex[FunctionMatch.FunctionName]
      if (functionRegex[FunctionMatch.Alias]) {
        this[Property.ALIAS] = functionRegex[FunctionMatch.Alias]
      }
    } else if (subqueryRegex) {
      this[Property.NODE_TYPE] = subqueryRegex[SubqueryMatch.NodeType]
      this[Property.ALIAS] = subqueryRegex[SubqueryMatch.Alias]
    }
    enum ParallelMatch {
      NodeType = 2,
    }
    const parallelRegex = /^(Parallel\s+)(.*)/.exec(
      <string>this[Property.NODE_TYPE],
    )
    if (parallelRegex) {
      this[Property.NODE_TYPE] = parallelRegex[ParallelMatch.NodeType]
      this[Property.PARALLEL_AWARE] = true
    }

    enum JoinMatch {
      NodeType = 1,
    }
    const joinRegex = /(.*)\sJoin$/.exec(<string>this[Property.NODE_TYPE])

    enum JoinModifierMatch {
      NodeType = 1,
      JoinType,
    }
    const joinModifierRegex = /(.*)\s+(Full|Left|Right|Anti)/.exec(
      <string>this[Property.NODE_TYPE],
    )
    if (joinRegex) {
      this[Property.NODE_TYPE] = joinRegex[JoinMatch.NodeType]
      if (joinModifierRegex) {
        this[Property.NODE_TYPE] = joinModifierRegex[JoinModifierMatch.NodeType]
        this[Property.JOIN_TYPE] = joinModifierRegex[JoinModifierMatch.JoinType]
      }
      this[Property.NODE_TYPE] += " Join"
    }
  }
}

export interface Worker {
  [Property.WORKER_NUMBER]: number
  [k: string]: string | number | object
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
  [Property.SORT_METHODS_USED]: string[]
  [Property.SORT_SPACE_MEMORY]: SortSpaceMemory
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

export interface ISerialization {
  Time: number
  "Output Volume": number
  [Property.LOCAL_DIRTIED_BLOCKS]: number
  [Property.LOCAL_HIT_BLOCKS]: number
  [Property.LOCAL_READ_BLOCKS]: number
  [Property.LOCAL_WRITTEN_BLOCKS]: number
  [Property.SHARED_DIRTIED_BLOCKS]: number
  [Property.SHARED_HIT_BLOCKS]: number
  [Property.SHARED_READ_BLOCKS]: number
  [Property.SHARED_WRITTEN_BLOCKS]: number
  [Property.TEMP_READ_BLOCKS]: number
  [Property.TEMP_WRITTEN_BLOCKS]: number
}

// A plan node with id, node, isLastSibling, branches
export type Row = [number, Node, boolean, number[]]
