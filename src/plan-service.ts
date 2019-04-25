import * as _ from 'lodash';
import {EstimateDirection} from './enums';
import { IPlan } from './iplan';
import * as moment from 'moment';

export class PlanService {
  // plan property keys
  public NODE_TYPE_PROP: string = 'Node Type';
  public ACTUAL_ROWS_PROP: string = 'Actual Rows';
  public PLAN_ROWS_PROP: string = 'Plan Rows';
  public ACTUAL_TOTAL_TIME_PROP: string = 'Actual Total Time';
  public ACTUAL_LOOPS_PROP: string = 'Actual Loops';
  public TOTAL_COST_PROP: string = 'Total Cost';
  public PLANS_PROP: string = 'Plans';
  public RELATION_NAME_PROP: string = 'Relation Name';
  public SCHEMA_PROP: string = 'Schema';
  public ALIAS_PROP: string = 'Alias';
  public GROUP_KEY_PROP: string = 'Group Key';
  public SORT_KEY_PROP: string = 'Sort Key';
  public JOIN_TYPE_PROP: string = 'Join Type';
  public INDEX_NAME_PROP: string = 'Index Name';
  public HASH_CONDITION_PROP: string = 'Hash Cond';

  // computed by pev
  public COMPUTED_TAGS_PROP: string = '*Tags';

  public COSTLIEST_NODE_PROP: string = '*Costiest Node (by cost)';
  public LARGEST_NODE_PROP: string = '*Largest Node (by rows)';
  public SLOWEST_NODE_PROP: string = '*Slowest Node (by duration)';

  public MAXIMUM_COSTS_PROP: string = '*Most Expensive Node (cost)';
  public MAXIMUM_ROWS_PROP: string = '*Largest Node (rows)';
  public MAXIMUM_DURATION_PROP: string = '*Slowest Node (time)';
  public ACTUAL_DURATION_PROP: string = '*Actual Duration';
  public ACTUAL_COST_PROP: string = '*Actual Cost';
  public PLANNER_ESTIMATE_FACTOR: string = '*Planner Row Estimate Factor';
  public PLANNER_ESIMATE_DIRECTION: string = '*Planner Row Estimate Direction';

  public CTE_SCAN_PROP = 'CTE Scan';
  public CTE_NAME_PROP = 'CTE Name';

  public ARRAY_INDEX_KEY: string = 'arrayIndex';

  public PEV_PLAN_TAG: string = 'plan_';

  private maxRows: number = 0;
  private maxCost: number = 0;
  private maxDuration: number = 0;

  private static instance: PlanService;

  // Make this class a singleton
  constructor() {
    if (PlanService.instance) {
      return PlanService.instance
    }

    PlanService.instance = this
  }

  /*
  getPlans(): Array<IPlan> {
    var plans: Array<IPlan> = [];

    for (var i in localStorage) {
      if (startsWith(i, this.PEV_PLAN_TAG)) {
        plans.push(JSON.parse(localStorage[i]));
      }
    }

    return chain(plans)
    .sortBy('createdOn')
    .reverse()
    .value();
  }

  getPlan(id: string): IPlan {
    return JSON.parse(localStorage.getItem(id));
  }
  */

  public createPlan(planName: string, planContent: any, planQuery: string): IPlan {
    let plan: IPlan = {
      id: this.PEV_PLAN_TAG + new Date().getTime().toString(),
      name: planName || 'plan created on ' + moment().format('LLL'),
      createdOn: new Date(),
      content: planContent[0],
      query: planQuery
    };

    this.analyzePlan(plan);
    return plan;
  }

  /*
  isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  */

  public analyzePlan(plan: IPlan) {
    this.processNode(plan.content.Plan);
    plan.content[this.MAXIMUM_ROWS_PROP] = this.maxRows;
    plan.content[this.MAXIMUM_COSTS_PROP] = this.maxCost;
    plan.content[this.MAXIMUM_DURATION_PROP] = this.maxDuration;

    this.findOutlierNodes(plan.content.Plan);

    // localStorage.setItem(plan.id, JSON.stringify(plan));
  }

  /*
  deletePlan(plan: IPlan) {
    localStorage.removeItem(plan.id);
  }

  deleteAllPlans() {
    localStorage.clear();
  }
  */

  // recursively walk down the plan to compute various metrics
  public processNode(node: any) {
    this.calculatePlannerEstimate(node);
    this.calculateActuals(node);

    _.each(node, (value, key) => {
      this.calculateMaximums(node, key, value);

      if (key === this.PLANS_PROP) {
        _.each(value, (val) => {
          this.processNode(val);
        });
      }
    });
  }

  public calculateMaximums(node: any, key: string, value: number) {
    if (key === this.ACTUAL_ROWS_PROP && this.maxRows < value) {
      this.maxRows = value;
    }
    if (key === this.ACTUAL_COST_PROP && this.maxCost < value) {
      this.maxCost = value;
    }

    if (key === this.ACTUAL_DURATION_PROP && this.maxDuration < value) {
      this.maxDuration = value;
    }
  }

  public findOutlierNodes(node: any) {
    node[this.SLOWEST_NODE_PROP] = false;
    node[this.LARGEST_NODE_PROP] = false;
    node[this.COSTLIEST_NODE_PROP] = false;

    if (node[this.ACTUAL_COST_PROP] === this.maxCost) {
      node[this.COSTLIEST_NODE_PROP] = true;
    }
    if (node[this.ACTUAL_ROWS_PROP] === this.maxRows) {
      node[this.LARGEST_NODE_PROP] = true;
    }
    if (node[this.ACTUAL_DURATION_PROP] === this.maxDuration) {
      node[this.SLOWEST_NODE_PROP] = true;
    }

    _.each(node, (value, key) => {
      if (key === this.PLANS_PROP) {
        _.each(value, (val) => {
          this.findOutlierNodes(val);
        });
      }
    });
  }

  // actual duration and actual cost are calculated by subtracting child values from the total
  public calculateActuals(node: any) {
    node[this.ACTUAL_DURATION_PROP] = node[this.ACTUAL_TOTAL_TIME_PROP];
    node[this.ACTUAL_COST_PROP] = node[this.TOTAL_COST_PROP];

    _.each(node.Plans, (subPlan) => {
      // since CTE scan duration is already included in its subnodes, it should be be
      // subtracted from the duration of this node
      if (subPlan[this.NODE_TYPE_PROP] !== this.CTE_SCAN_PROP) {
        node[this.ACTUAL_DURATION_PROP] = node[this.ACTUAL_DURATION_PROP] - subPlan[this.ACTUAL_TOTAL_TIME_PROP];
        node[this.ACTUAL_COST_PROP] = node[this.ACTUAL_COST_PROP] - subPlan[this.TOTAL_COST_PROP];
      }
    });

    if (node[this.ACTUAL_COST_PROP] < 0) {
      node[this.ACTUAL_COST_PROP] = 0;
    }

    // since time is reported for an invidual loop, actual duration must be adjusted by number of loops
    node[this.ACTUAL_DURATION_PROP] = node[this.ACTUAL_DURATION_PROP] * node[this.ACTUAL_LOOPS_PROP];
  }

  // figure out order of magnitude by which the planner mis-estimated how many rows would be
  // invloved in this node
  public calculatePlannerEstimate(node: any) {
    node[this.PLANNER_ESTIMATE_FACTOR] = node[this.ACTUAL_ROWS_PROP] / node[this.PLAN_ROWS_PROP];
    node[this.PLANNER_ESIMATE_DIRECTION] = EstimateDirection.under;

    if (node[this.PLANNER_ESTIMATE_FACTOR] < 1) {
      node[this.PLANNER_ESIMATE_DIRECTION] = EstimateDirection.over;
      node[this.PLANNER_ESTIMATE_FACTOR] = node[this.PLAN_ROWS_PROP] / node[this.ACTUAL_ROWS_PROP];
    }
  }
}
