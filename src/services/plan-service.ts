import * as _ from 'lodash';
import {EstimateDirection, NodeProp} from '@/enums';
import { IPlan } from '@/iplan';
import moment from 'moment';

export class PlanService {

  private static instance: PlanService;


  private maxRows: number = 0;
  private maxCost: number = 0;
  private maxDuration: number = 0;

  public createPlan(planName: string, planContent: any, planQuery: string): IPlan {
    // remove any extra white spaces in the middle of query
    // (\S) start match after any non-whitespace character => group 1
    // (?!$) don't start match after end of line
    // (\s{2,}) group of 2 or more white spaces
    // '$1 ' reuse group 1 and and a single space
    planQuery = planQuery.replace(/(\S)(?!$)(\s{2,})/gm, '$1 ');

    const plan: IPlan = {
      id: NodeProp.PEV_PLAN_TAG + new Date().getTime().toString(),
      name: planName || 'plan created on ' + moment().format('LLL'),
      createdOn: new Date(),
      content: planContent,
      query: planQuery,
    };

    this.analyzePlan(plan);
    return plan;
  }

  public analyzePlan(plan: IPlan) {
    this.processNode(plan.content.Plan);
    plan.content[NodeProp.MAXIMUM_ROWS] = this.maxRows;
    plan.content[NodeProp.MAXIMUM_COSTS] = this.maxCost;
    plan.content[NodeProp.MAXIMUM_DURATION] = this.maxDuration;

    this.findOutlierNodes(plan.content.Plan);
  }

  // recursively walk down the plan to compute various metrics
  public processNode(node: any) {
    this.calculatePlannerEstimate(node);
    this.calculateActuals(node);

    _.each(node, (value, key) => {
      this.calculateMaximums(node, key, value);

      if (key === NodeProp.PLANS) {
        _.each(value, (val) => {
          this.processNode(val);
        });
      }
    });
  }

  public calculateMaximums(node: any, key: string, value: number) {
    if (key === NodeProp.ACTUAL_ROWS && this.maxRows < value) {
      this.maxRows = value;
    }
    if (key === NodeProp.ACTUAL_COST && this.maxCost < value) {
      this.maxCost = value;
    }

    if (key === NodeProp.ACTUAL_DURATION && this.maxDuration < value) {
      this.maxDuration = value;
    }
  }

  public findOutlierNodes(node: any) {
    node[NodeProp.SLOWEST_NODE] = false;
    node[NodeProp.LARGEST_NODE] = false;
    node[NodeProp.COSTLIEST_NODE] = false;

    if (node[NodeProp.ACTUAL_COST] === this.maxCost) {
      node[NodeProp.COSTLIEST_NODE] = true;
    }
    if (node[NodeProp.ACTUAL_ROWS] === this.maxRows) {
      node[NodeProp.LARGEST_NODE] = true;
    }
    if (node[NodeProp.ACTUAL_DURATION] === this.maxDuration) {
      node[NodeProp.SLOWEST_NODE] = true;
    }

    _.each(node, (value, key) => {
      if (key === NodeProp.PLANS) {
        _.each(value, (val) => {
          this.findOutlierNodes(val);
        });
      }
    });
  }

  // actual duration and actual cost are calculated by subtracting child values from the total
  public calculateActuals(node: any) {
    node[NodeProp.ACTUAL_DURATION] = node[NodeProp.ACTUAL_TOTAL_TIME];
    node[NodeProp.ACTUAL_COST] = node[NodeProp.TOTAL_COST];

    _.each(node[NodeProp.PLANS], (subPlan) => {
      // since CTE scan duration is already included in its subnodes, it should be be
      // subtracted from the duration of this node
      if (subPlan[NodeProp.NODE_TYPE] !== NodeProp.CTE_SCAN) {
        node[NodeProp.ACTUAL_DURATION] = node[NodeProp.ACTUAL_DURATION] - subPlan[NodeProp.ACTUAL_TOTAL_TIME];
        node[NodeProp.ACTUAL_COST] = node[NodeProp.ACTUAL_COST] - subPlan[NodeProp.TOTAL_COST];
      }
    });

    if (node[NodeProp.ACTUAL_COST] < 0) {
      node[NodeProp.ACTUAL_COST] = 0;
    }

    // since time is reported for an invidual loop, actual duration must be adjusted by number of loops
    node[NodeProp.ACTUAL_DURATION] = node[NodeProp.ACTUAL_DURATION] * node[NodeProp.ACTUAL_LOOPS];
  }

  // figure out order of magnitude by which the planner mis-estimated how many rows would be
  // invloved in this node
  public calculatePlannerEstimate(node: any) {
    node[NodeProp.PLANNER_ESTIMATE_FACTOR] = node[NodeProp.ACTUAL_ROWS] / node[NodeProp.PLAN_ROWS];
    node[NodeProp.PLANNER_ESIMATE_DIRECTION] = EstimateDirection.none;

    if (node[NodeProp.PLANNER_ESTIMATE_FACTOR] > 1) {
      node[NodeProp.PLANNER_ESIMATE_DIRECTION] = EstimateDirection.under;
    }
    if (node[NodeProp.PLANNER_ESTIMATE_FACTOR] < 1) {
      node[NodeProp.PLANNER_ESIMATE_DIRECTION] = EstimateDirection.over;
      node[NodeProp.PLANNER_ESTIMATE_FACTOR] = node[NodeProp.PLAN_ROWS] / node[NodeProp.ACTUAL_ROWS];
    }
  }

  public fromText(text: string) {
    const lines = text.split(/\r?\n/);

    const root = {};
    _.each(lines, (line: string) => {
      // Remove any trailing "
      line = line.replace(/"\s*$/, '');
      // Remove any begining "
      line = line.replace(/^\s*"/, '');

      /*
       * Groups
       * 1: prefix
       * 2: type
       * 3: estimated_startup_cost
       * 4: estimated_total_cost
       * 5: estimated_rows
       * 6: estimated_row_width
       * 7: actual_time_first
       * 8: actual_time_last
       * 9: actual_rows
       * 10: actual_loops
       * 11: actual_rows_
       * 12: actual_loops_
       * 13: never_executed
       */
      // tslint:disable-next-line:max-line-length
      const nodeRegex = /^(?<prefix>\s*->\s*|\s*)(?<type>\S.*?)\s+\(cost=(?<estimated_startup_cost>\d+\.\d+)\.\.(?<estimated_total_cost>\d+\.\d+)\s+rows=(?<estimated_rows>\d+)\s+width=(?<estimated_row_width>\d+)\)\s*(?:\s+\((?:actual\stime=(?<actual_time_first>\d+\.\d+)\.\.(?<actual_time_last>\d+\.\d+)\srows=(?<actual_rows>\d+)\sloops=(?<actual_loops>\d+)|actual\srows=(?<actual_rows_>\d+)\sloops=(?<actual_loops_>\d+)|(?<never_executed>never\s+executed))\))?\S*$/gm;
      const nodeMatches = nodeRegex.exec(line);

      // tslint:disable-next-line:max-line-length
      const subRegex = /^(\s*)((?:Sub|Init)Plan)\s*(?:\d+\s*)?\s*(?:\(returns.*\)\s*)?$/gm;
      const subMatches = subRegex.exec(line);

      const cteRegex = /^(\s*)CTE\s+(\S+)\s*$/g;
      const cteMatches = cteRegex.exec(line);

      const extraRegex = /^(\s*)(\S.*\S)\s*$/g;
      const extraMatches = extraRegex.exec(line);

      if (nodeMatches) {
        const prefix = nodeMatches[1];
        const neverExecuted = nodeMatches[13];
        const newNode: any = {};
        if (neverExecuted) {
          newNode[NodeProp.ACTUAL_LOOPS] = 0;
          newNode[NodeProp.NEVER_EXECUTED] = 1;
        }

        nodeMatches.forEach((match, groupIndex) => {
          // console.log(`Found match, group ${groupIndex}: ${match}`);
        });
      } else if (subMatches) {
        //
      } else if (cteMatches) {
        //
      } else if (extraMatches) {
        //
      }
    });
    throw new Error('Unable to parse plan');
  }
}
