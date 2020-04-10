import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

describe('PlanService', () => {
  test('Actual durations are correct', () => {
    const planService = new PlanService();
    const source = `
 Tid Scan on pg_class c  (cost=0.00..4.01 rows=1 width=373) (actual time=0.014..0.016 rows=1 loops=1)
    TID Cond: (ctid = '(1,33)'::tid)
`;
    const r: any = planService.fromSource(source);
    const plan: IPlan = planService.createPlan('', r, '');
    expect(plan.content.Plan['Node Type']).toBe('Tid Scan');
    expect(plan.content.Plan['Relation Name']).toBe('pg_class');
    expect(plan.content.Plan.Alias).toBe('c');
  });
});
