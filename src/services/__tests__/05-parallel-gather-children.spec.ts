import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

// In this plan, we have a Partial GroupAggregate which doesn't have
// any information on workers nor is parallel aware
// It must be considered as having workers though ie. that its loops
// are not taken into account in duration computation

describe('PlanService', () => {
  const planService = new PlanService();
  // tslint:disable:max-line-length
  const source = `
Limit  (cost=220725.07..220759.59 rows=1 width=27) (actual time=1621.743..1626.219 rows=1 loops=1)
  ->  Finalize GroupAggregate  (cost=220725.07..220966.73 rows=7 width=27) (actual time=1621.740..1621.740 rows=1 loops=1)
        Group Key: lineitem.l_shipmode
        ->  Gather Merge  (cost=220725.07..220966.55 rows=14 width=27) (actual time=1620.648..1626.206 rows=4 loops=1)
              Workers Planned: 2
              Workers Launched: 2
              ->  Partial GroupAggregate  (cost=219725.04..219964.91 rows=7 width=27) (actual time=1616.481..1617.546 rows=2 loops=3)
                    Group Key: lineitem.l_shipmode
                    ->  Sort  (cost=219725.04..219755.02 rows=11990 width=27) (actual time=1615.387..1615.753 rows=10409 loops=3)
                          Sort Key: lineitem.l_shipmode
                          Sort Method: quicksort  Memory: 1198kB
                          Worker 0:  Sort Method: quicksort  Memory: 1195kB
                          Worker 1:  Sort Method: quicksort  Memory: 1200kB
                          ->  Parallel Hash Join  (cost=177956.54..218912.75 rows=11990 width=27) (actual time=1497.271..1613.187 rows=10409 loops=3)
                                Hash Cond: (orders.o_orderkey = lineitem.l_orderkey)
                                ->  Parallel Seq Scan on orders  (cost=0.00..33875.00 rows=625000 width=20) (actual time=0.007..55.525 rows=500000 loops=3)
                                ->  Parallel Hash  (cost=177806.66..177806.66 rows=11990 width=19) (actual time=1496.967..1496.967 rows=10409 loops=3)
                                      Buckets: 32768  Batches: 1  Memory Usage: 2016kB
                                      ->  Parallel Seq Scan on lineitem  (cost=0.00..177806.66 rows=11990 width=19) (actual time=0.361..1490.221 rows=10409 loops=3)
                                            Filter: ((l_shipmode = ANY ('{MAIL,AIR}'::bpchar[])) AND (l_commitdate < l_receiptdate) AND (l_shipdate < l_commitdate) AND (l_receiptdate >= '1996-01-01'::date) AND (l_receiptdate < '1997-01-01 00:00:00'::timestamp without time zone))
                                            Rows Removed by Filter: 1989996
Planning Time: 3.634 ms
Execution Time: 1626.725 ms
`;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  it('doesn\'t not multiply by number of loops', () => {
    const aggregateNode = plan.content.Plan.Plans[0].Plans[0].Plans[0];
    expect(1.79 - aggregateNode['*Duration (exclusive)'] < 0.1).toBeTruthy();
  });
});

