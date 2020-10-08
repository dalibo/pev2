import { PlanService } from '@/services/plan-service';

describe('PlanService', () => {
  test('Parses WAL info', () => {
    const planService = new PlanService();

    // tslint:disable:max-line-length
    const source = `
create table titi as select generate_series(1, 5000) as i;
SELECT 5000
explain (analyze, buffers, wal) with x1 as (update titi set i=i+1 returning i)  select * from x1 limit 10 ;
                                                     QUERY PLAN
--------------------------------------------------------------------------------------------------------------------
 Limit  (cost=96.31..96.51 rows=10 width=4) (actual time=0.059..0.086 rows=10 loops=1)
   Buffers: shared hit=21
   WAL: records=20 bytes=1320
   CTE x1
     ->  Update on titi  (cost=0.00..96.31 rows=5865 width=10) (actual time=0.056..11.377 rows=5000 loops=1)
           Buffers: shared hit=10065 read=2 dirtied=22 written=22
           WAL: records=10000 bytes=660000
           ->  Seq Scan on titi  (cost=0.00..96.31 rows=5865 width=10) (actual time=0.019..1.346 rows=5000 loops=1)
                 Buffers: shared hit=23
   ->  CTE Scan on x1  (cost=0.00..117.30 rows=5865 width=4) (actual time=0.058..0.082 rows=10 loops=1)
         Buffers: shared hit=21
         WAL: records=20 bytes=1320
 Planning:
   Buffers: shared hit=3
 Planning Time: 0.098 ms
 Execution Time: 11.797 ms
(16 rows)
`;

    const plan: any = planService.fromText(source);
    expect(plan.Plan['WAL Records']).toEqual(20);
    expect(plan.Plan['WAL Bytes']).toEqual(1320);
    expect(plan.Plan['WAL FPI']).toEqual(0);
  });

  test('Parses WAL info', () => {
    const planService = new PlanService();

    // tslint:disable:max-line-length
    const source = `
drop table if exists tutu; create table tutu (i int) WITH (autovacuum_enabled = off) ; explain (analyze,buffers,wal) insert into tutu SELECT i from generate_series (1,10000000) i;
DROP TABLE
Temps : 47,201 ms
CREATE TABLE
Temps : 1,695 ms
                                                                  QUERY PLAN
----------------------------------------------------------------------------------------------------------------------------------------------
 Insert on tutu  (cost=0.00..100000.00 rows=10000000 width=4) (actual time=11543.790..11543.791 rows=0 loops=1)
   Buffers: shared hit=10088481 read=12 dirtied=44248 written=66480, temp read=17090 written=17090
   WAL: records=10000000 fpi=1 bytes=590001027
   ->  Function Scan on generate_series i  (cost=0.00..100000.00 rows=10000000 width=4) (actual time=826.266..2089.643 rows=10000000 loops=1)
         Buffers: temp read=17090 written=17090
 Planning Time: 0.039 ms
 JIT:
   Functions: 2
   Options: Inlining false, Optimization false, Expressions true, Deforming true
   Timing: Generation 0.153 ms, Inlining 0.000 ms, Optimization 0.068 ms, Emission 0.574 ms, Total 0.795 ms
 Execution Time: 11560.132 ms
(11 lignes)
`;

    const plan: any = planService.fromText(source);
    expect(plan.Plan['WAL Records']).toEqual(10000000);
    expect(plan.Plan['WAL Bytes']).toEqual(590001027);
    expect(plan.Plan['WAL FPI']).toEqual(1);
  });
});
