import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

describe('PlanService', () => {
  const planService = new PlanService();
  // tslint:disable:max-line-length
  const source = `
 Aggregate  (cost=10000023629.69..10000023629.70 rows=1 width=8) (actual time=127.447..128.719 rows=1 loops=1)
   Output: count(*)
   Buffers: shared hit=4056 read=29
   ->  Nested Loop  (cost=10000000066.12..10000023213.07 rows=166650 width=0) (actual time=4.214..114.964 rows=98000 loops=1)
         Buffers: shared hit=4056 read=29
         ->  Seq Scan on public.tenk2  (cost=10000000000.00..10000000470.00 rows=50 width=0) (actual time=0.099..2.473 rows=10 loops=1)
               Output: tenk2.unique1, tenk2.unique2, tenk2.two, tenk2.four, tenk2.ten, tenk2.twenty, tenk2.hundred, tenk2.thousand, tenk2.twothousand, tenk2.fivethous, tenk2.tenthous, tenk2.odd, tenk2.even, tenk2.stringu1, tenk2.stringu2, tenk2.string4
               Filter: (tenk2.thousand = 0)
               Rows Removed by Filter: 9990
               Buffers: shared hit=345
         ->  Gather  (cost=66.12..421.53 rows=3333 width=0) (actual time=1.995..9.108 rows=9800 loops=10)
               Workers Planned: 4
               Workers Launched: 4
               Buffers: shared hit=3711 read=29
               ->  Parallel Bitmap Heap Scan on public.tenk1  (cost=66.12..421.53 rows=833 width=0) (actual time=0.223..0.868 rows=1960 loops=50)
                     Recheck Cond: (tenk1.hundred > 1)
                     Heap Blocks: exact=1160
                     Buffers: shared hit=3711 read=29
                     Worker 0: actual time=0.032..0.390 rows=913 loops=10
                       Buffers: shared hit=322
                     Worker 1: actual time=0.033..0.174 rows=470 loops=10
                       Buffers: shared hit=166
                     Worker 2: actual time=0.040..0.815 rows=2374 loops=10
                       Buffers: shared hit=837
                     Worker 3: actual time=0.046..0.904 rows=2741 loops=10
                       Buffers: shared hit=965
                     ->  Bitmap Index Scan on tenk1_hundred  (cost=0.00..65.28 rows=3333 width=0) (actual time=0.894..0.894 rows=9800 loops=10)
                           Index Cond: (tenk1.hundred > 1)
                           Buffers: shared hit=261 read=29
 Planning Time: 0.728 ms
 Execution Time: 128.781 ms
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const gatherNode = plan.content.Plan.Plans[0].Plans[1];
  const bitmapIndexScanNode = gatherNode.Plans[0].Plans[0];
  test('Node doesn\'t contain workers', () => {
    expect(bitmapIndexScanNode['Node Type']).toEqual('Bitmap Index Scan');
    expect(bitmapIndexScanNode).not.toHaveProperty('Workers');
  });
});
