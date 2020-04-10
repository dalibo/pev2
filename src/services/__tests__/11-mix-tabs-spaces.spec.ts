import { PlanService } from '@/services/plan-service';

describe('PlanService', () => {
  test('correctly handles oneline JSON', () => {
    const planService = new PlanService();

    // In this plan there's a mix of spaces and tabs

    // tslint:disable:max-line-length
    const source = `
Hash Join  (cost=17116.79..44169.26 rows=4827 width=25)
   Hash Cond: (artist.area = country.id)
   CTE artist_count
 	->  Limit  (cost=17111.20..17111.20 rows=1 width=12)
       	->  Sort  (cost=17111.20..17111.58 rows=152 width=12)
             	Sort Key: (count(*)) DESC
             	->  Finalize GroupAggregate  (cost=17071.93..17110.44 rows=152 width=12)
                   	Group Key: artist_1.area
                   	->  Gather Merge  (cost=17071.93..17107.40 rows=304 width=12)
                         	Workers Planned: 2
                         	->  Sort  (cost=16071.91..16072.29 rows=152 width=12)
                               	Sort Key: artist_1.area
                               	->  Partial HashAggregate  (cost=16064.88..16066.40 rows=152 width=12)
                                     	Group Key: artist_1.area
                                     	->  Parallel Seq Scan on artist artist_1  (cost=0.00..15146.88 rows=183599 width=4)
                                           	Filter: (area IS NOT NULL)
   ->  Seq Scan on artist  (cost=0.00..22383.32 rows=1240532 width=18)
   ->  Hash  (cost=5.58..5.58 rows=1 width=19)
     	->  Hash Join  (cost=0.03..5.58 rows=1 width=19)
           	Hash Cond: (country.id = artist_count.area)
           	->  Seq Scan on country  (cost=0.00..4.57 rows=257 width=15)
           	->  Hash  (cost=0.02..0.02 rows=1 width=4)
                 	->  CTE Scan on artist_count  (cost=0.00..0.02 rows=1 width=4)
`;
    const plan: any = planService.fromText(source);
    expect(plan.Plan.Plans.length).toEqual(3);
    expect(plan.Plan.Plans[0]['Subplan Name']).toEqual('CTE artist_count');
  });
});
