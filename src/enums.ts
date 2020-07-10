export enum Metric {
  time,
  rows,
  cost,
  buffers,
  estimate_factor,
}

export enum BuffersMetric {
  shared,
  temp,
  local,
}

export enum BufferLocation {
  shared = 'Shared',
  temp = 'Temp',
  local = 'Local',
}

export enum BufferType {
  hit = 'Hit',
  read = 'Read',
  written = 'Written',
  dirtied = 'Dirtied',
}

export class HighlightType {
    public static NONE: string = 'none';
    public static DURATION: string = 'duration';
    public static ROWS: string = 'rows';
    public static COST: string = 'cost';
}

export enum EstimateDirection {
  over = 1,
  under = 2,
  none = 3,
}

export class ViewMode {
    public static FULL: string = 'full';
    public static COMPACT: string = 'compact';
    public static DOT: string = 'dot';
}

export class Orientation {
  public static TWOD: string = 'twod';
  public static CLASSIC: string = 'classic';
}

export enum CenterMode {
  center,
  visible,
  none,
}

export enum HighlightMode {
  flash,
  highlight,
}

export enum NodeProp {
  // plan property keys
  NODE_TYPE = 'Node Type',
  ACTUAL_ROWS = 'Actual Rows',
  PLAN_ROWS = 'Plan Rows',
  ROWS_REMOVED_BY_FILTER = 'Rows Removed by Filter',
  ROWS_REMOVED_BY_JOIN_FILTER = 'Rows Removed by Join Filter',
  ACTUAL_STARTUP_TIME = 'Actual Startup Time',
  ACTUAL_TOTAL_TIME = 'Actual Total Time',
  ACTUAL_LOOPS = 'Actual Loops',
  STARTUP_COST = 'Startup Cost',
  TOTAL_COST = 'Total Cost',
  PLANS = 'Plans',
  RELATION_NAME = 'Relation Name',
  SCHEMA = 'Schema',
  ALIAS = 'Alias',
  GROUP_KEY = 'Group Key',
  SORT_KEY = 'Sort Key',
  SORT_METHOD = 'Sort Method',
  SORT_SPACE_TYPE = 'Sort Space Type',
  SORT_SPACE_USED = 'Sort Space Used',
  JOIN_TYPE = 'Join Type',
  INDEX_NAME = 'Index Name',
  HASH_CONDITION = 'Hash Cond',
  PARENT_RELATIONSHIP = 'Parent Relationship',
  SUBPLAN_NAME = 'Subplan Name',
  PARALLEL_AWARE = 'Parallel Aware',
  WORKERS = 'Workers',
  WORKERS_PLANNED = 'Workers Planned',
  WORKERS_LAUNCHED = 'Workers Launched',
  SHARED_HIT_BLOCKS = 'Shared Hit Blocks',
  SHARED_READ_BLOCKS = 'Shared Read Blocks',
  SHARED_DIRTIED_BLOCKS = 'Shared Dirtied Blocks',
  SHARED_WRITTEN_BLOCKS = 'Shared Written Blocks',
  TEMP_HIT_BLOCKS = 'Temp Hit Blocks',
  TEMP_READ_BLOCKS = 'Temp Read Blocks',
  TEMP_DIRTIED_BLOCKS = 'Temp Dirtied Blocks',
  TEMP_WRITTEN_BLOCKS = 'Temp Written Blocks',
  LOCAL_HIT_BLOCKS = 'Local Hit Blocks',
  LOCAL_READ_BLOCKS = 'Local Read Blocks',
  LOCAL_DIRTIED_BLOCKS = 'Local Dirtied Blocks',
  LOCAL_WRITTEN_BLOCKS = 'Local Written Blocks',
  IO_READ_TIME = 'I/O Read Time',
  IO_WRITE_TIME = 'I/O Write Time',
  OUTPUT = 'Output',

  // computed by pev
  EXCLUSIVE_DURATION = '*Duration (exclusive)',
  EXCLUSIVE_COST = '*Cost (exclusive)',

  PLANNER_ESTIMATE_FACTOR = '*Planner Row Estimate Factor',
  PLANNER_ESTIMATE_DIRECTION = '*Planner Row Estimate Direction',

  EXCLUSIVE_SHARED_HIT_BLOCKS = '*Shared Hit Blocks (exclusive)',
  EXCLUSIVE_SHARED_READ_BLOCKS = '*Shared Read Blocks (exclusive)',
  EXCLUSIVE_SHARED_DIRTIED_BLOCKS = '*Shared Dirtied Blocks (exclusive)',
  EXCLUSIVE_SHARED_WRITTEN_BLOCKS = '*Shared Written Blocks (exclusive)',
  EXCLUSIVE_TEMP_HIT_BLOCKS = '*Temp Hit Blocks (exclusive)',
  EXCLUSIVE_TEMP_READ_BLOCKS = '*Temp Read Blocks (exclusive)',
  EXCLUSIVE_TEMP_DIRTIED_BLOCKS = '*Temp Dirtied Blocks (exclusive)',
  EXCLUSIVE_TEMP_WRITTEN_BLOCKS = '*Temp Written Blocks (exclusive)',
  EXCLUSIVE_LOCAL_HIT_BLOCKS = '*Local Hit Blocks (exclusive)',
  EXCLUSIVE_LOCAL_READ_BLOCKS = '*Local Read Blocks (exclusive)',
  EXCLUSIVE_LOCAL_DIRTIED_BLOCKS = '*Local Dirtied Blocks (exclusive)',
  EXCLUSIVE_LOCAL_WRITTEN_BLOCKS = '*Local Written Blocks (exclusive)',

  EXCLUSIVE_IO_READ_TIME = '*I/O Read Time (exclusive)',
  EXCLUSIVE_IO_WRITE_TIME = '*I/O Write Time (exclusive)',

  CTE_SCAN = 'CTE Scan',
  CTE_NAME = 'CTE Name',
  FUNCTION_NAME = 'Function Name',

  ARRAY_INDEX_KEY = 'arrayIndex',

  PEV_PLAN_TAG = 'plan_',
}

export enum PropType {
  duration,
  boolean,
  rows,
  cost,
  factor,
  estimateDirection,
  json,
  space,
  increment,
  blocks,
}

export const nodePropTypes: any = {};

nodePropTypes[NodeProp.ACTUAL_ROWS] = PropType.rows;
nodePropTypes[NodeProp.PLAN_ROWS] = PropType.rows;
nodePropTypes[NodeProp.ACTUAL_TOTAL_TIME] = PropType.duration;
nodePropTypes[NodeProp.ACTUAL_STARTUP_TIME] = PropType.duration;
nodePropTypes[NodeProp.STARTUP_COST] = PropType.cost;
nodePropTypes[NodeProp.TOTAL_COST] = PropType.cost;
nodePropTypes[NodeProp.PARALLEL_AWARE] = PropType.boolean;
nodePropTypes[NodeProp.WORKERS] = PropType.json;
nodePropTypes[NodeProp.SORT_SPACE_USED] = PropType.space;
nodePropTypes[NodeProp.ROWS_REMOVED_BY_FILTER] = PropType.rows;
nodePropTypes[NodeProp.ROWS_REMOVED_BY_JOIN_FILTER] = PropType.rows;

nodePropTypes[NodeProp.EXCLUSIVE_DURATION] = PropType.duration;
nodePropTypes[NodeProp.EXCLUSIVE_COST] = PropType.cost;

nodePropTypes[NodeProp.PLANNER_ESTIMATE_FACTOR] = PropType.factor;
nodePropTypes[NodeProp.PLANNER_ESTIMATE_DIRECTION] = PropType.estimateDirection;

nodePropTypes[NodeProp.IO_READ_TIME] = PropType.duration;
nodePropTypes[NodeProp.IO_WRITE_TIME] = PropType.duration;

nodePropTypes[NodeProp.EXCLUSIVE_IO_READ_TIME] = PropType.duration;
nodePropTypes[NodeProp.EXCLUSIVE_IO_WRITE_TIME] = PropType.duration;

nodePropTypes[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_TEMP_HIT_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_TEMP_DIRTIED_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS] = PropType.blocks;
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS] = PropType.blocks;

export class WorkerProp {
  // plan property keys
  public static WORKER_NUMBER: string = 'Worker Number';
}

nodePropTypes[WorkerProp.WORKER_NUMBER] = PropType.increment;
