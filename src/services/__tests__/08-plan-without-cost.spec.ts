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


describe('PlanService', () => {
  test('Cannot parse plan without analyze nor costs', () => {
    const planService = new PlanService();
    const source = `
Bitmap Heap Scan on a
   Recheck Cond: ((id = 42) OR (id = 4711))
   ->  BitmapOr
         ->  Bitmap Index Scan on a_pkey
               Index Cond: (id = 42)
         ->  Bitmap Index Scan on a_pkey
               Index Cond: (id = 4711)
`;
    expect(() => { planService.fromText(source); }).toThrow();
  });
});
