import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

import { findNodeById } from '@/services/help-service';

// In this plan, we have a Bitmap Index Scan node (#12) which doesn't have
// any information on workers.
// It must be considered as having workers though.
// The number of loops as well as number of workers should be taken into
// account for the time calculation.

describe('PlanService', () => {
  const planService = new PlanService();
  // tslint:disable:max-line-length
  const source = `
Gather  (cost=1782.55..53030.40 rows=3 width=72) (actual time=70.029..383125.490 rows=367315 loops=1)
    Workers Planned: 3
    Workers Launched: 3
    Buffers: shared hit=98726455 read=6541
  ->  Nested Loop Left Join  (cost=782.55..52030.10 rows=1 width=72) (actual time=58.605..382365.760 rows=91829 loops=4)
          Buffers: shared hit=98726455 read=6541
        ->  Nested Loop Left Join  (cost=782.12..52029.37 rows=1 width=80) (actual time=58.549..381876.868 rows=91829 loops=4)
                Buffers: shared hit=97812665 read=6515
              ->  Nested Loop Left Join  (cost=781.70..52026.27 rows=1 width=87) (actual time=58.065..379978.059 rows=30628 loops=4)
                      Buffers: shared hit=93548935 read=6514
                    ->  Nested Loop  (cost=781.14..52023.56 rows=1 width=83) (actual time=58.016..378991.611 rows=30628 loops=4)
                            Buffers: shared hit=93447031 read=2149
                          ->  Nested Loop  (cost=0.85..51196.65 rows=1 width=58) (actual time=3.238..465.487 rows=20339 loops=4)
                                  Buffers: shared hit=331905 read=934
                                ->  Parallel Index Scan using bravo_papa_tango on victor_sierra  (cost=0.43..51194.00 rows=1 width=50) (actual time=3.162..122.561 rows=20339 loops=4)
                                        Index Cond: (whiskey = 'sierra_five'::date)
                                        Filter: ((hotel <> 7) AND (india = 1) AND (sierra_zulu = 1) AND ((delta_india)::integer = 1) AND ((two)::integer = 0))
                                        Rows Removed by Filter: 56141
                                        Buffers: shared hit=6215 read=840
                                ->  Index Scan using yankee on tango  (cost=0.42..2.65 rows=1 width=20) (actual time=0.013..0.013 rows=1 loops=81357)
                                        Index Cond: ((whiskey = 'sierra_five'::date) AND (hotel = victor_sierra.hotel) AND (india = 1) AND (victor_victor = victor_sierra.victor_victor))
                                        Filter: ((hotel <> 7) AND (sierra_zulu = 1))
                                        Buffers: shared hit=325690 read=94
                          ->  Bitmap Heap Scan on golf  (cost=780.29..826.90 rows=1 width=37) (actual time=17.007..18.601 rows=2 loops=81357)
                                  Recheck Cond: ((whiskey = 'sierra_five'::date) AND (india = 1) AND (sierra_zulu = 1) AND (hotel = tango.hotel) AND (hotel = ANY ('november_zulu'::integer[])))
                                  Filter: (tango.victor_victor = victor_victor)
                                  Rows Removed by Filter: 14960
                                  Heap Blocks: exact=6061175
                                  Buffers: shared hit=93115126 read=1215
                                ->  BitmapAnd  (cost=780.29..780.29 rows=1583 width=0) (actual time=15.192..15.192 rows=0 loops=81357)
                                        Buffers: shared hit=68910227 read=927
                                      ->  Bitmap Index Scan on echo  (cost=0.00..254.44 rows=15129 width=0) (actual time=1.009..1.009 rows=16719 loops=81357)
                                              Index Cond: ((whiskey = 'sierra_five'::date) AND (india = 1) AND (sierra_zulu = 1))
                                              Buffers: shared hit=5450856 read=66
                                      ->  Bitmap Index Scan on mike_uniform  (cost=0.00..523.24 rows=52187 width=0) (actual time=14.023..14.023 rows=284399 loops=81357)
                                              Index Cond: ((hotel = tango.hotel) AND (hotel = ANY ('november_zulu'::integer[])))
                                              Buffers: shared hit=63459359 read=861
                    ->  Index Scan using bravo_papa_victor on november_bravo  (cost=0.56..2.70 rows=1 width=28) (actual time=0.028..0.028 rows=0 loops=122513)
                            Index Cond: ((golf.mike_kilo = mike_kilo) AND (golf.whiskey = whiskey) AND (whiskey = 'sierra_five'::date) AND (golf.hotel = hotel) AND (golf.india = india) AND (india = 1) AND (golf.sierra_zulu = sierra_zulu) AND (sierra_zulu = 1))
                            Filter: (hotel <> 7)
                            Buffers: shared hit=101904 read=4365
              ->  Index Scan using four_three on delta_sierra  (cost=0.42..3.09 rows=1 width=29) (actual time=0.044..0.059 rows=3 loops=122513)
                      Index Cond: (victor_victor = tango.victor_victor)
                      Filter: ((hotel <> 7) AND (whiskey = 'sierra_five'::date) AND (india = 1) AND (sierra_zulu = 1) AND (whiskey = tango.whiskey) AND (india = tango.india) AND (sierra_zulu = tango.sierra_zulu) AND (hotel = tango.hotel))
                      Rows Removed by Filter: 44
                      Buffers: shared hit=4263730 read=1
        ->  Index Only Scan using delta_seven on six  (cost=0.42..0.72 rows=1 width=24) (actual time=0.004..0.004 rows=1 loops=367315)
                Index Cond: ((four_zulu = golf.four_zulu) AND (whiskey = golf.whiskey) AND (whiskey = 'sierra_five'::date) AND (hotel = golf.hotel) AND (india = golf.india) AND (india = 1) AND (sierra_zulu = golf.sierra_zulu) AND (sierra_zulu = 1))
                Filter: (hotel <> 7)
                Heap Fetches: 0
                Buffers: shared hit=913790 read=26
Planning time: 22.371 ms
Execution time: 383161.073 ms
`;
  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  it('takes workers into account', () => {
    const bitmapindexscan = findNodeById(plan, 12);
    expect(bitmapindexscan['*Duration (exclusive)']).toBe(285217.30275);
  });
});
