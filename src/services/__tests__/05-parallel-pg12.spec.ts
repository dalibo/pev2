import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

// Example plans from this file are the results for the following commands:
// docker run -p 5432:5432 --rm --name explain -e POSTGRES_PASSWORD=postgres -d postgres:12
// export PGHOST=0.0.0.0 PGUSER=postgres PGPASSWORD=postgres
// psql -XqAt -f src/services/__tests__/05-parallel.sql

describe('EXPLAIN, seq scan', () => {
  const planService = new PlanService();
  const source = `
Gather Merge  (cost=648.47..749.15 rows=8624 width=8)
  Workers Planned: 2
    ->  Sort  (cost=648.44..659.22 rows=4312 width=8)
            Sort Key: two
          ->  Parallel Seq Scan on tenk1  (cost=0.00..388.12 rows=4312 width=8)
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const seqScanNode = plan.content.Plan.Plans[0].Plans[0];
  test('Node is parallel', () => {
    expect(seqScanNode['Node Type']).toEqual('Seq Scan');
    expect(seqScanNode).toHaveProperty('*Workers Planned By Gather', 2);
  });
});

describe('EXPLAIN (ANALYZE), seq scan', () => {
  const planService = new PlanService();
  const source = `
Gather Merge  (cost=648.47..749.15 rows=8624 width=8) (actual time=3.347..5.323 rows=10000 loops=1)
  Workers Planned: 2
  Workers Launched: 2
  ->  Sort  (cost=648.44..659.22 rows=4312 width=8) (actual time=1.248..1.482 rows=3333 loops=3)
        Sort Key: two
        Sort Method: quicksort  Memory: 800kB
        Worker 0:  Sort Method: quicksort  Memory: 50kB
        Worker 1:  Sort Method: quicksort  Memory: 51kB
        ->  Parallel Seq Scan on tenk1  (cost=0.00..388.12 rows=4312 width=8) (actual time=0.013..0.726 rows=3333 loops=3)
Planning Time: 0.157 ms
Execution Time: 5.844 ms
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const seqScanNode = plan.content.Plan.Plans[0].Plans[0];
  test('Node is parallel', () => {
    expect(seqScanNode['Node Type']).toEqual('Seq Scan');
    expect(seqScanNode).toHaveProperty('*Workers Planned By Gather', 2);
  });
});

describe('EXPLAIN (ANALYZE, VERBOSE), seq scan', () => {
  const planService = new PlanService();
  const source = `
Gather Merge  (cost=648.47..749.15 rows=8624 width=8) (actual time=3.377..5.461 rows=10000 loops=1)
  Output: two, four
  Workers Planned: 2
  Workers Launched: 2
  ->  Sort  (cost=648.44..659.22 rows=4312 width=8) (actual time=1.489..1.726 rows=3333 loops=3)
        Output: two, four
        Sort Key: tenk1.two
        Sort Method: quicksort  Memory: 509kB
        Worker 0:  Sort Method: quicksort  Memory: 47kB
        Worker 1:  Sort Method: quicksort  Memory: 226kB
        Worker 0: actual time=0.352..0.398 rows=488 loops=1
        Worker 1: actual time=0.894..1.054 rows=2755 loops=1
        ->  Parallel Seq Scan on public.tenk1  (cost=0.00..388.12 rows=4312 width=8) (actual time=0.008..0.829 rows=3333 loops=3)
              Output: two, four
              Worker 0: actual time=0.011..0.164 rows=488 loops=1
              Worker 1: actual time=0.007..0.482 rows=2755 loops=1
Planning Time: 0.033 ms
Execution Time: 5.941 ms
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const seqScanNode = plan.content.Plan.Plans[0].Plans[0];
  test('Node is parallel', () => {
    expect(seqScanNode['Node Type']).toEqual('Seq Scan');
    expect(seqScanNode).toHaveProperty('*Workers Planned By Gather', 2);
  });
});

describe('EXPLAIN, bitmap index scan', () => {
  const planService = new PlanService();
  const source = `
Finalize Aggregate  (cost=423.63..423.64 rows=1 width=8)
  ->  Gather  (cost=423.61..423.62 rows=4 width=8)
        Workers Planned: 4
        ->  Partial Aggregate  (cost=423.61..423.62 rows=1 width=8)
              ->  Parallel Bitmap Heap Scan on tenk1  (cost=66.12..421.53 rows=833 width=0)
                    Recheck Cond: (hundred > 1)
                    ->  Bitmap Index Scan on tenk1_hundred  (cost=0.00..65.28 rows=3333 width=0)
                          Index Cond: (hundred > 1)
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const partialAggregateNode = plan.content.Plan.Plans[0].Plans[0];
  test('Node is parallel', () => {
    expect(partialAggregateNode['Node Type']).toEqual('Partial Aggregate');
    expect(partialAggregateNode).toHaveProperty('*Workers Planned By Gather');
  });
  const bitmapIndexScanNode = plan.content.Plan.Plans[0].Plans[0].Plans[0].Plans[0];
  test('Node is parallel (not ANALYZE, not VERBOSE)', () => {
    expect(bitmapIndexScanNode['Node Type']).toEqual('Bitmap Index Scan');
    expect(bitmapIndexScanNode).toHaveProperty('*Workers Planned By Gather', 4);
  });
});

describe('EXPLAIN (ANALYZE), bitmap index scan', () => {
  const planService = new PlanService();
  const source = `
Finalize Aggregate  (cost=423.63..423.64 rows=1 width=8) (actual time=7.869..8.986 rows=1 loops=1)
  ->  Gather  (cost=423.61..423.62 rows=4 width=8) (actual time=6.201..8.973 rows=5 loops=1)
        Workers Planned: 4
        Workers Launched: 4
        ->  Partial Aggregate  (cost=423.61..423.62 rows=1 width=8) (actual time=1.204..1.204 rows=1 loops=5)
              ->  Parallel Bitmap Heap Scan on tenk1  (cost=66.12..421.53 rows=833 width=0) (actual time=0.471..0.962 rows=1960 loops=5)
                    Recheck Cond: (hundred > 1)
                    Heap Blocks: exact=345
                    ->  Bitmap Index Scan on tenk1_hundred  (cost=0.00..65.28 rows=3333 width=0) (actual time=2.105..2.106 rows=9800 loops=1)
                          Index Cond: (hundred > 1)
Planning Time: 0.297 ms
Execution Time: 9.025 ms
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const partialAggregateNode = plan.content.Plan.Plans[0].Plans[0];
  test('Node is parallel', () => {
    expect(partialAggregateNode['Node Type']).toEqual('Partial Aggregate');
    expect(partialAggregateNode).toHaveProperty('*Workers Planned By Gather');
  });
  const bitmapIndexScanNode = plan.content.Plan.Plans[0].Plans[0].Plans[0].Plans[0];
  test('Node isn\'t parallel', () => {
    expect(bitmapIndexScanNode['Node Type']).toEqual('Bitmap Index Scan');
  });
});

describe('EXPLAIN (VERBOSE), bitmap index scan', () => {
  const planService = new PlanService();
  const source = `
Finalize Aggregate  (cost=423.63..423.64 rows=1 width=8)
  Output: count(*)
  ->  Gather  (cost=423.61..423.62 rows=4 width=8)
        Output: (PARTIAL count(*))
        Workers Planned: 4
        ->  Partial Aggregate  (cost=423.61..423.62 rows=1 width=8)
              Output: PARTIAL count(*)
              ->  Parallel Bitmap Heap Scan on public.tenk1  (cost=66.12..421.53 rows=833 width=0)
                    Recheck Cond: (tenk1.hundred > 1)
                    ->  Bitmap Index Scan on tenk1_hundred  (cost=0.00..65.28 rows=3333 width=0)
                          Index Cond: (tenk1.hundred > 1)
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const partialAggregateNode = plan.content.Plan.Plans[0].Plans[0];
  test('Node is parallel', () => {
    expect(partialAggregateNode['Node Type']).toEqual('Partial Aggregate');
    expect(partialAggregateNode).toHaveProperty('*Workers Planned By Gather');
  });
  const bitmapIndexScanNode = plan.content.Plan.Plans[0].Plans[0].Plans[0].Plans[0];
  test('Node isn\'t parallel', () => {
    expect(bitmapIndexScanNode['Node Type']).toEqual('Bitmap Index Scan');
    expect(bitmapIndexScanNode).toHaveProperty('*Workers Planned By Gather', 4);
  });
});

describe('EXPLAIN (ANALYZE, VERBOSE), bitmap index scan', () => {
  const planService = new PlanService();
  const source = `
Finalize Aggregate  (cost=423.63..423.64 rows=1 width=8) (actual time=4.508..5.621 rows=1 loops=1)
  Output: count(*)
  ->  Gather  (cost=423.61..423.62 rows=4 width=8) (actual time=3.188..5.614 rows=5 loops=1)
        Output: (PARTIAL count(*))
        Workers Planned: 4
        Workers Launched: 4
        ->  Partial Aggregate  (cost=423.61..423.62 rows=1 width=8) (actual time=0.619..0.620 rows=1 loops=5)
              Output: PARTIAL count(*)
              Worker 0: actual time=0.026..0.026 rows=1 loops=1
              Worker 1: actual time=0.025..0.026 rows=1 loops=1
              Worker 2: actual time=0.025..0.026 rows=1 loops=1
              Worker 3: actual time=0.026..0.026 rows=1 loops=1
              ->  Parallel Bitmap Heap Scan on public.tenk1  (cost=66.12..421.53 rows=833 width=0) (actual time=0.171..0.494 rows=1960 loops=5)
                    Recheck Cond: (tenk1.hundred > 1)
                    Heap Blocks: exact=345
                    Worker 0: actual time=0.024..0.025 rows=0 loops=1
                    Worker 1: actual time=0.024..0.024 rows=0 loops=1
                    Worker 2: actual time=0.024..0.024 rows=0 loops=1
                    Worker 3: actual time=0.024..0.024 rows=0 loops=1
                    ->  Bitmap Index Scan on tenk1_hundred  (cost=0.00..65.28 rows=3333 width=0) (actual time=0.712..0.712 rows=9800 loops=1)
                          Index Cond: (tenk1.hundred > 1)
Planning Time: 0.057 ms
Execution Time: 5.646 ms
  `;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  const partialAggregateNode = plan.content.Plan.Plans[0].Plans[0];
  test('Node is parallel', () => {
    expect(partialAggregateNode['Node Type']).toEqual('Partial Aggregate');
    expect(partialAggregateNode).toHaveProperty('*Workers Planned By Gather');
  });
  const bitmapIndexScanNode = plan.content.Plan.Plans[0].Plans[0].Plans[0].Plans[0];
  test('Node isn\'t parallel', () => {
    expect(bitmapIndexScanNode['Node Type']).toEqual('Bitmap Index Scan');
  });
});
