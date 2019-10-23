import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

describe('PlanService', () => {
  test('Maximums are correct', () => {
    const planService = new PlanService();
    const source = `
Seq Scan on pg_class (actual time=0.013..0.181 rows=645 loops=1)
`;
    const r: any = planService.fromSource(source);
    const plan: IPlan = planService.createPlan('', r, '');
    expect(plan.content.maxDuration).toBe(0.181);
    expect(plan.content.maxCost).toBe(undefined);
  });
});

