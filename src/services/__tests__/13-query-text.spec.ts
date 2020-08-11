import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

describe('PlanService', () => {
  test('Actual durations are correct', () => {
    const planService = new PlanService();
    const source = `
  Query Text: SELECT count(*)
              FROM pg_class, pg_index
              WHERE oid = indrelid AND indisunique;
  Aggregate  (cost=16.79..16.80 rows=1 width=0) (actual time=3.626..3.627 rows=1 loops=1)
    ->  Hash Join  (cost=4.17..16.55 rows=92 width=0) (actual time=3.349..3.594 rows=92 loops=1)
          Hash Cond: (pg_class.oid = pg_index.indrelid)
          ->  Seq Scan on pg_class  (cost=0.00..9.55 rows=255 width=4) (actual time=0.016..0.140 rows=255 loops=1)
          ->  Hash  (cost=3.02..3.02 rows=92 width=4) (actual time=3.238..3.238 rows=92 loops=1)
                Buckets: 1024  Batches: 1  Memory Usage: 4kB
                ->  Seq Scan on pg_index  (cost=0.00..3.02 rows=92 width=4) (actual time=0.008..3.187 rows=92 loops=1)
                      Filter: indisunique
`;
    const r: any = planService.fromSource(source);
    expect(r['Query Text']).toContain('WHERE oid = indrelid AND indisunique');
  });

  test('Query text is not read after first node', () => {
    const planService = new PlanService();
    const source = `
        Query Text: SELECT count(*)
                   FROM pg_class;
        Aggregate  (cost=38.20..38.21 rows=1 width=8) (actual time=0.910..0.913 rows=1 loops=1)
          Output: count(*)
          Buffers: shared hit=6
          ->  Index Only Scan using pg_class_oid_index on pg_catalog.pg_class  (cost=0.28..36.21 rows=796 width=0) (actual time=0.067..0.529 rows=796 loops=1)
                Output: oid
                Heap Fetches: 0
                Buffers: shared hit=6
        Settings: work_mem = '100kB'
`;
    const r: any = planService.fromSource(source);
    expect(r['Query Text']).toContain('FROM pg_class');
    expect(r.Settings).toMatchObject({work_mem: '100kB'});
  });
});
