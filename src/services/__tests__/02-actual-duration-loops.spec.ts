import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

describe('PlanService', () => {
  test('Actual durations are correct', () => {
    const planService = new PlanService();
    const source = `
 Nested Loop  (cost=0.00..611.27 rows=13400 width=8) (actual time=0.025..10.198 rows=34956 loops=1)
   Join Filter: (t1.c1 > t2.c2)
   Rows Removed by Join Filter: 5244
   ->  Seq Scan on t1  (cost=0.00..6.02 rows=402 width=4) (actual time=0.013..0.058 rows=402 loops=1)
   ->  Materialize  (cost=0.00..2.50 rows=100 width=4) (actual time=0.000..0.008 rows=100 loops=402)
         ->  Seq Scan on t2  (cost=0.00..2.00 rows=100 width=4) (actual time=0.005..0.015 rows=100 loops=1)
 Planning Time: 0.083 ms
 Execution Time: 12.035 ms
`;
    const r: any = planService.fromSource(source);
    const plan: IPlan = planService.createPlan('', r, '');
    // Materialize duration: total time * loops - Seq Scan duration
    const mDuration = 0.008 * 402 - 0.015;
    expect(plan.content.Plan.Plans[1]['*Duration (exclusive)']).toBe(mDuration);

    // Nested Loop duration: total time - (Materialize duration + Seq Scan
    // duration) - Seq Scan duration
    const nlDuration = 10.198 - (mDuration + 0.015) - 0.058;
    expect(plan.content.Plan['*Duration (exclusive)']).toBe(nlDuration);
  });
});
