export enum Metric {
  time,
  rows,
  cost,
  buffers,
  estimate_factor,
  io,
}

export enum BufferLocation {
  shared = "Shared",
  temp = "Temp",
  local = "Local",
}

export enum BufferType {
  hit = "Hit",
  read = "Read",
  written = "Written",
  dirtied = "Dirtied",
}

export enum HighlightType {
  NONE = "none",
  DURATION = "duration",
  ROWS = "rows",
  COST = "cost",
}

export enum SortDirection {
  asc = "asc",
  desc = "desc",
}

export enum EstimateDirection {
  over = 1,
  under = 2,
  none = 3,
}

export enum CenterMode {
  center,
  visible,
  none,
}

export enum BuffersProp {
  SHARED_HIT_BLOCKS = "Shared Hit Blocks",
  SHARED_READ_BLOCKS = "Shared Read Blocks",
  SHARED_DIRTIED_BLOCKS = "Shared Dirtied Blocks",
  SHARED_WRITTEN_BLOCKS = "Shared Written Blocks",
  TEMP_READ_BLOCKS = "Temp Read Blocks",
  TEMP_WRITTEN_BLOCKS = "Temp Written Blocks",
  LOCAL_HIT_BLOCKS = "Local Hit Blocks",
  LOCAL_READ_BLOCKS = "Local Read Blocks",
  LOCAL_DIRTIED_BLOCKS = "Local Dirtied Blocks",
  LOCAL_WRITTEN_BLOCKS = "Local Written Blocks",
}

export enum NodePropBase {
  // plan property keys
  NODE_TYPE = "Node Type",
  ACTUAL_ROWS = "Actual Rows",
  PLAN_ROWS = "Plan Rows",
  PLAN_WIDTH = "Plan Width",
  ROWS_REMOVED_BY_FILTER = "Rows Removed by Filter",
  ROWS_REMOVED_BY_JOIN_FILTER = "Rows Removed by Join Filter",
  ROWS_REMOVED_BY_INDEX_RECHECK = "Rows Removed by Index Recheck",
  ACTUAL_STARTUP_TIME = "Actual Startup Time",
  ACTUAL_TOTAL_TIME = "Actual Total Time",
  ACTUAL_LOOPS = "Actual Loops",
  STARTUP_COST = "Startup Cost",
  TOTAL_COST = "Total Cost",
  PLANS = "Plans",
  RELATION_NAME = "Relation Name",
  SCHEMA = "Schema",
  ALIAS = "Alias",
  GROUP_KEY = "Group Key",
  SORT_KEY = "Sort Key",
  SORT_METHOD = "Sort Method",
  SORT_SPACE_TYPE = "Sort Space Type",
  SORT_SPACE_USED = "Sort Space Used",
  JOIN_TYPE = "Join Type",
  INDEX_NAME = "Index Name",
  HASH_CONDITION = "Hash Cond",
  PARENT_RELATIONSHIP = "Parent Relationship",
  SUBPLAN_NAME = "Subplan Name",
  PARALLEL_AWARE = "Parallel Aware",
  WORKERS = "Workers",
  WORKERS_PLANNED = "Workers Planned",
  WORKERS_LAUNCHED = "Workers Launched",
  READ_BLOCKS = "*Read Blocks",
  WRITTEN_BLOCKS = "*Written Blocks",
  IO_READ_TIME = "I/O Read Time",
  IO_WRITE_TIME = "I/O Write Time",
  SHARED_IO_READ_TIME = "Shared I/O Read Time",
  SHARED_IO_WRITE_TIME = "Shared I/O Write Time",
  LOCAL_IO_READ_TIME = "Local I/O Read Time",
  LOCAL_IO_WRITE_TIME = "Local I/O Write Time",
  TEMP_IO_READ_TIME = "Temp I/O Read Time",
  TEMP_IO_WRITE_TIME = "Temp I/O Write Time",
  OUTPUT = "Output",
  HEAP_FETCHES = "Heap Fetches",
  WAL_RECORDS = "WAL Records",
  WAL_BYTES = "WAL Bytes",
  WAL_FPI = "WAL FPI",
  FULL_SORT_GROUPS = "Full-sort Groups",
  PRE_SORTED_GROUPS = "Pre-sorted Groups",
  PRESORTED_KEY = "Presorted Key",
  FILTER = "Filter",
  STRATEGY = "Strategy",
  PARTIAL_MODE = "Partial Mode",
  OPERATION = "Operation",
  RECHECK_COND = "Recheck Cond",
  SCAN_DIRECTION = "Scan Direction",

  // computed by pev
  NODE_ID = "nodeId",
  EXCLUSIVE_DURATION = "*Duration (exclusive)",
  EXCLUSIVE_COST = "*Cost (exclusive)",
  ACTUAL_ROWS_REVISED = "*Actual Rows Revised",
  ACTUAL_ROWS_FRACTIONAL = "*Actual Rows Is Fractional",
  PLAN_ROWS_REVISED = "*Plan Rows Revised",
  ROWS_REMOVED_BY_FILTER_REVISED = "*Rows Removed by Filter",
  ROWS_REMOVED_BY_JOIN_FILTER_REVISED = "*Rows Removed by Join Filter",
  ROWS_REMOVED_BY_INDEX_RECHECK_REVISED = "*Rows Removed by Index Recheck",

  PLANNER_ESTIMATE_FACTOR = "*Planner Row Estimate Factor",
  PLANNER_ESTIMATE_DIRECTION = "*Planner Row Estimate Direction",

  EXCLUSIVE_SHARED_HIT_BLOCKS = "*Shared Hit Blocks (exclusive)",
  EXCLUSIVE_SHARED_READ_BLOCKS = "*Shared Read Blocks (exclusive)",
  EXCLUSIVE_SHARED_DIRTIED_BLOCKS = "*Shared Dirtied Blocks (exclusive)",
  EXCLUSIVE_SHARED_WRITTEN_BLOCKS = "*Shared Written Blocks (exclusive)",
  EXCLUSIVE_TEMP_READ_BLOCKS = "*Temp Read Blocks (exclusive)",
  EXCLUSIVE_TEMP_WRITTEN_BLOCKS = "*Temp Written Blocks (exclusive)",
  EXCLUSIVE_LOCAL_HIT_BLOCKS = "*Local Hit Blocks (exclusive)",
  EXCLUSIVE_LOCAL_READ_BLOCKS = "*Local Read Blocks (exclusive)",
  EXCLUSIVE_LOCAL_DIRTIED_BLOCKS = "*Local Dirtied Blocks (exclusive)",
  EXCLUSIVE_LOCAL_WRITTEN_BLOCKS = "*Local Written Blocks (exclusive)",
  EXCLUSIVE_READ_BLOCKS = "*Read Blocks (exclusive)",
  EXCLUSIVE_WRITTEN_BLOCKS = "*Written Blocks (exclusive)",

  AVERAGE_IO_READ_SPEED = "*I/O Read Speed",
  AVERAGE_IO_WRITE_SPEED = "*I/O Write Speed",
  AVERAGE_SHARED_IO_READ_SPEED = "*Shared I/O Read Speed",
  AVERAGE_SHARED_IO_WRITE_SPEED = "*Shared I/O Write Speed",
  AVERAGE_LOCAL_IO_READ_SPEED = "*Local I/O Read Speed",
  AVERAGE_LOCAL_IO_WRITE_SPEED = "*Local I/O Write Speed",
  AVERAGE_TEMP_IO_READ_SPEED = "*Temp I/O Read Speed",
  AVERAGE_TEMP_IO_WRITE_SPEED = "*Temp I/O Write Speed",

  EXCLUSIVE_IO_READ_TIME = "*I/O Read Time (exclusive)",
  EXCLUSIVE_IO_WRITE_TIME = "*I/O Write Time (exclusive)",
  EXCLUSIVE_AVERAGE_IO_READ_SPEED = "*I/O Read Speed (exclusive)",
  EXCLUSIVE_AVERAGE_IO_WRITE_SPEED = "*I/O Write Speed (exclusive)",
  EXCLUSIVE_SHARED_IO_READ_TIME = "*Shared I/O Read Time (exclusive)",
  EXCLUSIVE_SHARED_IO_WRITE_TIME = "*Shared I/O Write Time (exclusive)",
  EXCLUSIVE_AVERAGE_SHARED_IO_READ_SPEED = "*Shared I/O Read Speed (exclusive)",
  EXCLUSIVE_AVERAGE_SHARED_IO_WRITE_SPEED = "*Shared I/O Write Speed (exclusive)",
  EXCLUSIVE_LOCAL_IO_READ_TIME = "*Local I/O Read Time (exclusive)",
  EXCLUSIVE_LOCAL_IO_WRITE_TIME = "*Local I/O Write Time (exclusive)",
  EXCLUSIVE_AVERAGE_LOCAL_IO_READ_SPEED = "*Local I/O Read Speed (exclusive)",
  EXCLUSIVE_AVERAGE_LOCAL_IO_WRITE_SPEED = "*Local I/O Write Speed (exclusive)",
  EXCLUSIVE_TEMP_IO_READ_TIME = "*Temp I/O Read Time (exclusive)",
  EXCLUSIVE_TEMP_IO_WRITE_TIME = "*Temp I/O Write Time (exclusive)",
  EXCLUSIVE_AVERAGE_TEMP_IO_READ_SPEED = "*Temp I/O Read Speed (exclusive)",
  EXCLUSIVE_AVERAGE_TEMP_IO_WRITE_SPEED = "*Temp I/O Write Speed (exclusive)",
  SUM_IO_READ_TIME = "*I/O Read Time (all scopes)",
  SUM_IO_WRITE_TIME = "*I/O Write Time (all scopes)",
  AVERAGE_SUM_IO_READ_SPEED = "*I/O Read Time speed (all scopes)",
  AVERAGE_SUM_IO_WRITE_SPEED = "*I/O Write Time speed (all scopes)",
  EXCLUSIVE_SUM_IO_READ_TIME = "*I/O Read Time (exclusive, all scopes)",
  EXCLUSIVE_SUM_IO_WRITE_TIME = "*I/O Write Time (exclusive, all scopes)",
  EXCLUSIVE_AVERAGE_SUM_IO_READ_SPEED = "*I/O Read Time speed (exclusive, all scopes)",
  EXCLUSIVE_AVERAGE_SUM_IO_WRITE_SPEED = "*I/O Write Time speed (exclusive, all scopes)",

  WORKERS_PLANNED_BY_GATHER = "*Workers Planned By Gather",
  WORKERS_LAUNCHED_BY_GATHER = "*Workers Launched By Gather",

  CTE_SCAN = "CTE Scan",
  CTE_NAME = "CTE Name",
  FUNCTION_NAME = "Function Name",

  ARRAY_INDEX_KEY = "arrayIndex",

  PEV_PLAN_TAG = "plan_",
  JIT = "JIT",
  SERIALIZATION = "Serialization",
}

export const NodeProp = {
  ...NodePropBase,
  ...BuffersProp,
} as const;

export type NodeProp = typeof NodeProp[keyof typeof NodeProp]

export enum PropType {
  blocks,
  boolean,
  bytes,
  cost,
  duration,
  estimateDirection,
  factor,
  increment,
  json,
  kilobytes,
  list,
  loops,
  rows,
  sortGroups,
  transferRate,
  jit,
}

export enum WorkerProp {
  // plan property keys
  WORKER_NUMBER = "Worker Number",
}

export enum SortGroupsProp {
  GROUP_COUNT = "Group Count",
  SORT_METHODS_USED = "Sort Methods Used",
  SORT_SPACE_MEMORY = "Sort Space Memory",
}

export enum SortSpaceMemoryProp {
  AVERAGE_SORT_SPACE_USED = "Average Sort Space Used",
  PEAK_SORT_SPACE_USED = "Peak Sort Space Used",
}

export enum Scope {
  SHARED = "shared",
  LOCAL = "local",
  TEMP = "temp",
}
