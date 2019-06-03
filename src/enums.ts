export class HighlightType {
    public static NONE: string = 'none';
    public static DURATION: string = 'duration';
    public static ROWS: string = 'rows';
    public static COST: string = 'cost';
}

export enum EstimateDirection {
    over,
    under,
    none,
}

export class ViewMode {
    public static FULL: string = 'full';
    public static COMPACT: string = 'compact';
    public static DOT: string = 'dot';
}

export class Orientation {
  public static VERTICAL: string = 'vertical';
  public static HORIZONTAL: string = 'horizontal';
}

export class NodeProp {
  // plan property keys
  public static NODE_TYPE: string = 'Node Type';
  public static ACTUAL_ROWS: string = 'Actual Rows';
  public static PLAN_ROWS: string = 'Plan Rows';
  public static ACTUAL_TOTAL_TIME: string = 'Actual Total Time';
  public static ACTUAL_LOOPS: string = 'Actual Loops';
  public static TOTAL_COST: string = 'Total Cost';
  public static PLANS: string = 'Plans';
  public static RELATION_NAME: string = 'Relation Name';
  public static SCHEMA: string = 'Schema';
  public static ALIAS: string = 'Alias';
  public static GROUP_KEY: string = 'Group Key';
  public static SORT_KEY: string = 'Sort Key';
  public static JOIN_TYPE: string = 'Join Type';
  public static INDEX_NAME: string = 'Index Name';
  public static HASH_CONDITION: string = 'Hash Cond';

  // computed by pev
  public static COMPUTED_TAGS: string = '*Tags';

  public static COSTLIEST_NODE: string = '*Costiest Node (by cost)';
  public static LARGEST_NODE: string = '*Largest Node (by rows)';
  public static SLOWEST_NODE: string = '*Slowest Node (by duration)';

  public static MAXIMUM_COSTS: string = '*Most Expensive Node (cost)';
  public static MAXIMUM_ROWS: string = '*Largest Node (rows)';
  public static MAXIMUM_DURATION: string = '*Slowest Node (time)';
  public static ACTUAL_DURATION: string = '*Actual Duration';
  public static ACTUAL_COST: string = '*Actual Cost';
  public static PLANNER_ESTIMATE_FACTOR: string = '*Planner Row Estimate Factor';
  public static PLANNER_ESIMATE_DIRECTION: string = '*Planner Row Estimate Direction';

  public static CTE_SCAN = 'CTE Scan';
  public static CTE_NAME = 'CTE Name';

  public static ARRAY_INDEX_KEY: string = 'arrayIndex';

  public static PEV_PLAN_TAG: string = 'plan_';
}
