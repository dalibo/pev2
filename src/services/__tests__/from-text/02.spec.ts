import { PlanService } from '@/services/plan-service';

describe('PlanService', () => {
  test('', () => {
    const planService = new PlanService();
    const planText = `
Seq Scan on test  (cost=0.00..34.00 rows=2400 width=4) (actual time=0.052..2.183 rows=1000 loops=1)
`;

    const r = planService.fromText(planText);
    expect(r.Plan['Startup Cost']).toEqual(0);
    expect(r.Plan['Total Cost']).toEqual(34);
    expect(r.Plan['Plan Rows']).toEqual(2400);
    expect(r.Plan['Actual Rows']).toEqual(1000);
    expect(r.Plan['Actual Loops']).toEqual(1);
    expect(r.Plan['Actual Startup Time']).toEqual(0.052);
    expect(r.Plan['Actual Total Time']).toEqual(2.183);
    expect(r.Plan['Node Type']).toEqual('Seq Scan');
  });
});
