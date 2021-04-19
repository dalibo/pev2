import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';
import { findNodeById } from '@/services/help-service';

describe('PlanService', () => {
  test('can parse plan in json format', () => {
    const planService = new PlanService();
    const source = `
[
  {
    "Plan": {
      "Node Type": "Seq Scan",
      "Parallel Aware": false,
      "Relation Name": "users",
      "Alias": "users",
      "Startup Cost": 0.00,
      "Total Cost": 22.70,
      "Plan Rows": 1270,
      "Plan Width": 36
    }
  }
]`;
    const r: any = planService.fromSource(source);
    expect(r.Plan['Plan Rows']).toEqual(1270);
  });

  test('can parse plan in json format 2', () => {
    const planService = new PlanService();
    const source = `
{
  "Plan": {
    "Node Type": "Seq Scan",
    "Parallel Aware": false,
    "Relation Name": "users",
    "Alias": "users",
    "Startup Cost": 0.00,
    "Total Cost": 22.70,
    "Plan Rows": 1270,
    "Plan Width": 36
  }
}`;
    const r: any = planService.fromSource(source);
    expect(r.Plan['Plan Rows']).toEqual(1270);
  });

  test('can parse plan in json format with extra text', () => {
    const planService = new PlanService();
    const source = `
           QUERY PLAN
---------------------------------
 [                              +
   {                            +
     "Plan": {                  +
       "Node Type": "Seq Scan", +
       "Parallel Aware": false, +
       "Relation Name": "users",+
       "Alias": "users",        +
       "Startup Cost": 0.00,    +
       "Total Cost": 22.70,     +
       "Plan Rows": 1270,       +
       "Plan Width": 36         +
     }                          +
   }                            +
 ]
(1 row)`;
    const r: any = planService.fromSource(source);
  });

  test('can parse plan with extra text', () => {
    const planService = new PlanService();
    const planText = `
                  QUERY PLAN
-----------------------------------------------------------
 Seq Scan on tenk1  (cost=0.00..333.00 rows=10000 width=148)
(1 row)`;
    const r: any = planService.fromSource(planText);
    expect(r.Plan['Plan Rows']).toEqual(10000);
  });

  test('creates plan from text', () => {
    const planService = new PlanService();
    // tslint:disable:max-line-length
    const planText = `
Nested Loop Left Join  (cost=11.95..28.52 rows=5 width=157) (actual time=0.010..0.010 rows=0 loops=1)
  Output: rel_users_exams.user_username, rel_users_exams.exam_id, rel_users_exams.started_at, rel_users_exams.finished_at, exam_1.id, exam_1.title, exam_1.date_from, exam_1.date_to, exam_1.created, exam_1.created_by_, exam_1.duration, exam_1.success_threshold, exam_1.published
  Inner Unique: true
  Join Filter: (exam_1.id = rel_users_exams.exam_id)
  Buffers: shared hit=1
  ->  Bitmap Heap Scan on public.rel_users_exams  (cost=11.80..20.27 rows=5 width=52) (actual time=0.009..0.009 rows=0 loops=1)
        Output: rel_users_exams.user_username, rel_users_exams.exam_id, rel_users_exams.started_at, rel_users_exams.finished_at
        Recheck Cond: (1 = rel_users_exams.exam_id)
        Buffers: shared hit=1
        ->  Bitmap Index Scan on rel_users_exams_pkey  (cost=0.00..11.80 rows=5 width=0) (actual time=0.005..0.005 rows=0 loops=1)
              Index Cond: (1 = rel_users_exams.exam_id)
              Buffers: shared hit=1
  ->  Materialize  (cost=0.15..8.17 rows=1 width=105) (never executed)
        Output: exam_1.id, exam_1.title, exam_1.date_from, exam_1.date_to, exam_1.created, exam_1.created_by_, exam_1.duration, exam_1.success_threshold, exam_1.published
        ->  Index Scan using exam_pkey on public.exam exam_1  (cost=0.15..8.17 rows=1 width=105) (never executed)
              Output: exam_1.id, exam_1.title, exam_1.date_from, exam_1.date_to, exam_1.created, exam_1.created_by_, exam_1.duration, exam_1.success_threshold, exam_1.published
              Index Cond: (exam_1.id = 1)
Planning Time: 1.110 ms
Execution Time: 0.170 ms`;
    // tslint:enable:max-line-length
    const r: any = planService.fromSource(planText);
    expect(r.Plan['Plan Rows']).toEqual(5);
    expect(r['Execution Time']).toEqual(0.17);
  });

  test('creates plan from text', () => {
    const planService = new PlanService();
    // tslint:disable:max-line-length
    const planText = `
Sort  (cost=55235.15..55247.04 rows=4758 width=1128) (actual time=132.733..133.642 rows=22577 loops=1)

  Sort Key: (COALESCE(t_energy.te_source_file, t_quality.tq_source_file)), (COALESCE(t_energy.te_meter_id, t_quality.tq_meter_id)), (COALESCE(t_energy.te_frame_date, t_quality.tq_frame_date))

  Sort Method: quicksort  Memory: 7358kB

  CTE t_quality

    ->  Subquery Scan on x  (cost=26084.17..26602.15 rows=4604 width=283) (actual time=47.040..54.620 rows=12101 loops=1)

          Filter: (x.r < 2)

          Rows Removed by Filter: 29

          ->  WindowAgg  (cost=26084.17..26429.49 rows=13813 width=287) (actual time=47.037..53.332 rows=12130 loops=1)

                ->  Sort  (cost=26084.17..26118.70 rows=13813 width=279) (actual time=47.026..47.503 rows=12130 loops=1)

                      Sort Key: t.meter_id, t.frame_date, t.num_ligne DESC

                      Sort Method: quicksort  Memory: 3607kB

                      ->  Index Scan using source_file_type_ligne_201904 on kaifa_load_profiles_201904 t  (cost=0.69..25134.27 rows=13813 width=279) (actual time=1.120..18.338 rows=12130 loops=1)

                            Index Cond: ((source_file = '/srv/acquisition/LP_20190429223000_24990_0-numerote.txt'::text) AND (type_ligne = 'QUALITY'::text))

  CTE t_energy

    ->  Subquery Scan on x_1  (cost=26955.50..27490.74 rows=4758 width=382) (actual time=30.821..38.989 rows=12844 loops=1)

          Filter: (x_1.r < 2)

          Rows Removed by Filter: 16

          ->  WindowAgg  (cost=26955.50..27312.32 rows=14273 width=386) (actual time=30.820..37.670 rows=12860 loops=1)

                ->  Sort  (cost=26955.50..26991.18 rows=14273 width=378) (actual time=30.814..31.252 rows=12860 loops=1)

                      Sort Key: t_1.meter_id, t_1.frame_date, t_1.num_ligne DESC

                      Sort Method: quicksort  Memory: 2193kB

                      ->  Index Scan using source_file_type_ligne_201904 on kaifa_load_profiles_201904 t_1  (cost=0.69..25970.59 rows=14273 width=378) (actual time=0.403..6.428 rows=12860 loops=1)

                            Index Cond: ((source_file = '/srv/acquisition/LP_20190429223000_24990_0-numerote.txt'::text) AND (type_ligne = 'ENERGY'::text))

  ->  Merge Full Join  (cost=757.98..851.63 rows=4758 width=1128) (actual time=114.277..123.103 rows=22577 loops=1)

        Merge Cond: ((t_quality.tq_source_file = t_energy.te_source_file) AND (t_quality.tq_meter_id = t_energy.te_meter_id) AND (t_quality.tq_frame_date = t_energy.te_frame_date))

        ->  Sort  (cost=372.20..383.71 rows=4604 width=496) (actual time=65.897..66.323 rows=12101 loops=1)

              Sort Key: t_quality.tq_source_file, t_quality.tq_meter_id, t_quality.tq_frame_date

              Sort Method: quicksort  Memory: 3599kB

              ->  CTE Scan on t_quality  (cost=0.00..92.08 rows=4604 width=496) (actual time=47.043..61.095 rows=12101 loops=1)

        ->  Sort  (cost=385.78..397.68 rows=4758 width=496) (actual time=48.371..48.779 rows=12844 loops=1)

              Sort Key: t_energy.te_source_file, t_energy.te_meter_id, t_energy.te_frame_date

              Sort Method: quicksort  Memory: 2202kB

              ->  CTE Scan on t_energy  (cost=0.00..95.16 rows=4758 width=496) (actual time=30.824..44.152 rows=12844 loops=1)
Planning time: 2.040 ms
Execution time: 136.448 ms`;
    // tslint:enable:max-line-length
    const r: any = planService.fromSource(planText);
    expect(r['Execution Time']).toEqual(136.448);
  });

  test('can parse plan with subplan', () => {
    const planService = new PlanService();
    const source = `
Result  (cost=0.31..0.32 rows=1 width=4)
  InitPlan 1 (returns $0)
    ->  Limit  (cost=0.28..0.31 rows=1 width=4)
          ->  Index Only Scan Backward using pg_proc_oid_index on pg_proc  (cost=0.28..91.84 rows=2946 width=4)
                Index Cond: (oid IS NOT NULL)`;
    const r: any = planService.fromSource(source);
    expect(r.Plan.Plans[0]['Parent Relationship']).toEqual('InitPlan');
  });

  test('can parse plan with CTE', () => {
    const planService = new PlanService();
    const source = `
                            QUERY PLAN
------------------------------------------------------------------
 Aggregate  (cost=38.51..38.52 rows=1 width=4)
   CTE e
     ->  Seq Scan on employes  (cost=0.00..38.25 rows=11 width=8)
           Filter: (num_service = 4)
   ->  CTE Scan on e  (cost=0.00..0.25 rows=4 width=4)
         Filter: (date_embauche < '2006-01-01'::date)
(6 rows)`;
    const r: any = planService.fromSource(source);
    expect(r.Plan.Plans[0]['Parent Relationship']).toEqual('InitPlan');
    expect(r.Plan.Plans[0]['Subplan Name']).toEqual('CTE e');
  });

  test('correctly parses buffers', () => {
    const planService = new PlanService();
    const source = `
 Sort  (cost=1892901.51..1917901.71 rows=10000080 width=37) (actual time=4083.481..5153.029 rows=10000000 loops=1)
   Sort Key: c1
   Sort Method: external merge  Disk: 459976kB
   Buffers: shared hit=16230 read=67104, temp read=173492 written=173750
   ->  Seq Scan on foo  (cost=0.00..183334.80 rows=10000080 width=37) (actual time=0.179..853.428 rows=10000000 loops=1)
         Buffers: shared hit=16230 read=67104
 Planning Time: 0.104 ms
 Execution Time: 5581.481 ms
(8 rows)`;
    const r: any = planService.fromSource(source);
    expect(r.Plan['Shared Hit Blocks']).toEqual(16230);
    expect(r.Plan['Shared Read Blocks']).toEqual(67104);
    expect(r.Plan['Temp Read Blocks']).toEqual(173492);
    expect(r.Plan['Temp Written Blocks']).toEqual(173750);
    expect(r.Plan.Plans[0]['Shared Hit Blocks']).toEqual(16230);
    expect(r.Plan.Plans[0]['Shared Read Blocks']).toEqual(67104);
  });

  test('doesn\'t parse delete target tables as nodes', () => {
    const planService = new PlanService();
    const source = `
Delete on stock  (cost=1748.14..26203.41 rows=1159930 width=12) (actual time=19.228..19.228 rows=0 loops=1)
  Delete on stock_2001
  Delete on stock_2002
  ->  Merge Join  (cost=1748.14..5240.68 rows=231986 width=12) (actual time=6.337..6.337 rows=0 loops=1)
        Merge Cond: (tannee.annee = stock_2001.annee)
        ->  Sort  (cost=179.78..186.16 rows=2550 width=10) (actual time=0.032..0.032 rows=1 loops=1)
              Sort Key: tannee.annee
              Sort Method: quicksort  Memory: 25kB
              ->  Seq Scan on tannee  (cost=0.00..35.50 rows=2550 width=10) (actual time=0.020..0.021 rows=1 loops=1)
        ->  Sort  (cost=1568.36..1613.85 rows=18195 width=10) (actual time=6.301..6.301 rows=1 loops=1)
              Sort Key: stock_2001.annee
              Sort Method: quicksort  Memory: 1621kB
              ->  Seq Scan on stock_2001  (cost=0.00..280.95 rows=18195 width=10) (actual time=0.015..3.241 rows=18195 loops=1)
  ->  Merge Join  (cost=1748.14..5240.68 rows=231986 width=12) (actual time=3.002..3.003 rows=0 loops=1)
        Merge Cond: (tannee.annee = stock_2002.annee)
Planning Time: 0.550 ms
Execution Time: 19.475 ms
`;
    const r: any = planService.fromSource(source);
    expect(r.Plan.Plans[1]['Node Type']).toBe('Merge Join');
  });

  test('planned rows (revised) is correct', () => {
    const planService = new PlanService();
    const source = `
Seq Scan on foo  (cost=0.00..18334.00 rows=1000000 width=37)
`;
    const r: any = planService.fromSource(source);
    const plan: IPlan = planService.createPlan('', r, '');
    const seqscan = findNodeById(plan, 1);
    expect(seqscan['*Plan Rows Revised']).toBe(1000000);
  });
});
