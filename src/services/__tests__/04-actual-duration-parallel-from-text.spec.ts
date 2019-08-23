import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

describe('PlanService', () => {
  const planService = new PlanService();
  // tslint:disable:max-line-length
  const source = `
 Gather Merge  (cost=735306.27..1707599.95 rows=8333364 width=17) (actual time=1560.468..3749.583 rows=10000000 loops=1)
   Output: c1, c2
   Workers Planned: 2
   Workers Launched: 2
   ->  Sort  (cost=734306.25..744722.95 rows=4166682 width=17) (actual time=1474.182..1967.788 rows=3333333 loops=3)
         Output: c1, c2
         Sort Key: t1.c1
         Sort Method: external merge  Disk: 125168kB
         Worker 0:  Sort Method: external merge  Disk: 73768kB
         Worker 1:  Sort Method: external merge  Disk: 74088kB
         Worker 0: actual time=1431.136..1883.370 rows=2700666 loops=1
         Worker 1: actual time=1431.175..1891.630 rows=2712505 loops=1
         ->  Parallel Seq Scan on public.t1  (cost=0.00..105264.82 rows=4166682 width=17) (actual time=0.214..386.014 rows=3333333 loops=3)
               Output: c1, c2
               Worker 0: actual time=0.027..382.325 rows=2700666 loops=1
               Worker 1: actual time=0.038..384.951 rows=2712505 loops=1
 Planning Time: 0.180 ms
 Execution Time: 4166.867 ms
(18 rows)
`;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  it('correctly parses workers', () => {
    expect(plan.content.Plan.Plans[0].Workers.length).toEqual(2);
    expect(plan.content.Plan.Plans[0].Workers[0]['Actual Startup Time']).toEqual(1431.136);
    expect(plan.content.Plan.Plans[0].Workers[0]['Sort Method']).toBeDefined();
  });
});
