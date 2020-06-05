import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

describe('PlanService', () => {
  const planService = new PlanService();
  // tslint:disable:max-line-length
  const source = `
[
  {
    "Plan": {
      "Node Type": "Gather Merge",
      "Parallel Aware": false,
      "Startup Cost": 735306.27,
      "Total Cost": 1707599.95,
      "Plan Rows": 8333364,
      "Plan Width": 17,
      "Actual Startup Time": 1592.880,
      "Actual Total Time": 3805.404,
      "Actual Rows": 10000000,
      "Actual Loops": 1,
      "Workers Planned": 2,
      "Workers Launched": 2,
      "Plans": [
        {
          "Node Type": "Sort",
          "Parent Relationship": "Outer",
          "Parallel Aware": false,
          "Startup Cost": 734306.25,
          "Total Cost": 744722.95,
          "Plan Rows": 4166682,
          "Plan Width": 17,
          "Actual Startup Time": 1517.978,
          "Actual Total Time": 2020.558,
          "Actual Rows": 3333333,
          "Actual Loops": 3,
          "Sort Key": ["c1"],
          "Sort Method": "external merge",
          "Sort Space Used": 123600,
          "Sort Space Type": "Disk",
          "Workers": [
            {
              "Worker Number": 0,
              "Sort Method": "external merge",
              "Sort Space Used": 73744,
              "Sort Space Type": "Disk"
            },
            {
              "Worker Number": 1,
              "Sort Method": "external merge",
              "Sort Space Used": 75672,
              "Sort Space Type": "Disk"
            }
          ],
          "Plans": [
            {
              "Node Type": "Seq Scan",
              "Parent Relationship": "Outer",
              "Parallel Aware": true,
              "Relation Name": "t1",
              "Alias": "t1",
              "Startup Cost": 0.00,
              "Total Cost": 105264.82,
              "Plan Rows": 4166682,
              "Plan Width": 17,
              "Actual Startup Time": 0.214,
              "Actual Total Time": 400.681,
              "Actual Rows": 3333333,
              "Actual Loops": 3
            }
          ]
        }
      ]
    },
    "Planning Time": 0.158,
    "Triggers": [
    ],
    "Execution Time": 4225.445
  }
]
`;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  it('doesn\'t not multiply by number of loops', () => {
    expect(plan.content.Plan.Plans[0].Plans[0]['*Duration (exclusive)']).toEqual(400.681);
    expect(plan.content.Plan.Plans[0]['*Duration (exclusive)']).toEqual(2020.558 - 400.681);
  });
});

