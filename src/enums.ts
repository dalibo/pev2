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

export class NodeProp {
  // plan property keys
  public static NODE_TYPE: string = 'Node Type';
  public static ACTUAL_ROWS: string = 'Actual Rows';
  public static PLAN_ROWS: string = 'Plan Rows';
  public static ROWS_REMOVED_BY_FILTER: string = 'Rows Removed by Filter';
  public static ROWS_REMOVED_BY_JOIN_FILTER: string = 'Rows Removed by Join Filter';
  public static ACTUAL_STARTUP_TIME: string = 'Actual Startup Time';
  public static ACTUAL_TOTAL_TIME: string = 'Actual Total Time';
  public static ACTUAL_LOOPS: string = 'Actual Loops';
  public static STARTUP_COST: string = 'Startup Cost';
  public static TOTAL_COST: string = 'Total Cost';
  public static PLANS: string = 'Plans';
  public static RELATION_NAME: string = 'Relation Name';
  public static SCHEMA: string = 'Schema';
  public static ALIAS: string = 'Alias';
  public static GROUP_KEY: string = 'Group Key';
  public static SORT_KEY: string = 'Sort Key';
  public static SORT_METHOD: string = 'Sort Method';
  public static SORT_SPACE_TYPE: string = 'Sort Space Type';
  public static SORT_SPACE_USED: string = 'Sort Space Used';
  public static JOIN_TYPE: string = 'Join Type';
  public static INDEX_NAME: string = 'Index Name';
  public static HASH_CONDITION: string = 'Hash Cond';
  public static PARENT_RELATIONSHIP: string = 'Parent Relationship';
  public static SUBPLAN_NAME: string = 'Subplan Name';
  public static PARALLEL_AWARE: string = 'Parallel Aware';
  public static WORKERS: string = 'Workers';
  public static WORKERS_PLANNED: string = 'Workers Planned';
  public static WORKERS_LAUNCHED: string = 'Workers Launched';
  public static SHARED_HIT_BLOCKS: string = 'Shared Hit Blocks';
  public static SHARED_READ_BLOCKS: string = 'Shared Read Blocks';
  public static SHARED_DIRTIED_BLOCKS: string = 'Shared Dirtied Blocks';
  public static SHARED_WRITTEN_BLOCKS: string = 'Shared Written Blocks';
  public static TEMP_HIT_BLOCKS: string = 'Temp Hit Blocks';
  public static TEMP_READ_BLOCKS: string = 'Temp Read Blocks';
  public static TEMP_DIRTIED_BLOCKS: string = 'Temp Dirtied Blocks';
  public static TEMP_WRITTEN_BLOCKS: string = 'Temp Written Blocks';
  public static LOCAL_HIT_BLOCKS: string = 'Local Hit Blocks';
  public static LOCAL_READ_BLOCKS: string = 'Local Read Blocks';
  public static LOCAL_DIRTIED_BLOCKS: string = 'Local Dirtied Blocks';
  public static LOCAL_WRITTEN_BLOCKS: string = 'Local Written Blocks';
  public static IO_READ_TIME: string = 'I/O Read Time';
  public static IO_WRITE_TIME: string = 'I/O Write Time';

  // computed by pev
  public static COSTLIEST_NODE: string = '*Costiest Node (by cost)';
  public static LARGEST_NODE: string = '*Largest Node (by rows)';
  public static SLOWEST_NODE: string = '*Slowest Node (by duration)';

  public static ACTUAL_DURATION: string = '*Actual Duration';
  public static ACTUAL_COST: string = '*Actual Cost';
  public static PLANNER_ESTIMATE_FACTOR: string = '*Planner Row Estimate Factor';
  public static PLANNER_ESTIMATE_DIRECTION: string = '*Planner Row Estimate Direction';

  public static CTE_SCAN: string = 'CTE Scan';
  public static CTE_NAME: string = 'CTE Name';
  public static FUNCTION_NAME: string = 'Function Name';

  public static ARRAY_INDEX_KEY: string = 'arrayIndex';

  public static PEV_PLAN_TAG: string = 'plan_';
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

nodePropTypes[NodeProp.COSTLIEST_NODE] = PropType.boolean;
nodePropTypes[NodeProp.LARGEST_NODE] = PropType.boolean;
nodePropTypes[NodeProp.SLOWEST_NODE] = PropType.boolean;

nodePropTypes[NodeProp.ACTUAL_DURATION] = PropType.duration;
nodePropTypes[NodeProp.ACTUAL_COST] = PropType.cost;
nodePropTypes[NodeProp.PLANNER_ESTIMATE_FACTOR] = PropType.factor;
nodePropTypes[NodeProp.PLANNER_ESTIMATE_DIRECTION] = PropType.estimateDirection;

nodePropTypes[NodeProp.IO_READ_TIME] = PropType.duration;
nodePropTypes[NodeProp.IO_WRITE_TIME] = PropType.duration;

export class WorkerProp {
  // plan property keys
  public static WORKER_NUMBER: string = 'Worker Number';
}

nodePropTypes[WorkerProp.WORKER_NUMBER] = PropType.increment;
