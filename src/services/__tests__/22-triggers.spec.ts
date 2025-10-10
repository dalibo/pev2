import { describe, expect, test } from "vitest"
import { PlanService } from "@/services/plan-service"
import type { IPlan, IPlanContent } from "@/interfaces"

describe("PlanService", () => {
  test("Triggers are correctly parsed", () => {
    const planService = new PlanService()
    const source = `
      Insert on foo  (cost=0.00..0.01 rows=1 width=24) (actual time=0.504..0.505 rows=0 loops=1)
        ->  Result  (cost=0.00..0.01 rows=1 width=24) (actual time=0.019..0.020 rows=1 loops=1)
      Planning Time: 0.072 ms
      Trigger foo_system_time_generated_always: time=0.401 calls=1
      Trigger foo_system_time_write_history: time=0.260 calls=1
      Execution Time: 0.842 ms
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content["Triggers"]?.length).toEqual(2)
  })

  test("Triggers are correctly parsed", () => {
    const planService = new PlanService()
    const source = `
Insert on foo  (cost=0.00..0.01 rows=1 width=24) (actual time=0.504..0.505 rows=0 loops=1)
  ->  Result  (cost=0.00..0.01 rows=1 width=24) (actual time=0.019..0.020 rows=1 loops=1)
Planning Time: 0.072 ms
Trigger foo_system_time_generated_always: time=0.401 calls=1
Trigger foo_system_time_write_history: time=0.260 calls=1
Execution Time: 0.842 ms
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content["Triggers"]?.length).toEqual(2)
  })

  test("Triggers are correctly parsed", () => {
    const planService = new PlanService()
    const source = `
       Delete on emailmessages  (cost=224.85..38989.92 rows=5000 width=34) (actual time=217158.570..217158.570 rows=0 loops=1)
          Buffers: shared hit=2579331 read=506594 dirtied=503671
       ->  Nested Loop  (cost=224.85..38989.92 rows=5000 width=34) (actual time=7.105..4576.019 rows=5000 loops=1)
                Buffers: shared hit=20223 read=395
             ->  HashAggregate  (cost=224.42..274.42 rows=5000 width=32) (actual time=7.072..23.891 rows=5000 loops=1)
                            Group Key: "ANY_subquery".emailmessageid
                   Buffers: shared hit=583
                   ->  Subquery Scan on "ANY_subquery"  (cost=0.43..211.92 rows=5000 width=32) (actual time=0.064..3.892 rows=5000 loops=1)
                                        Buffers: shared hit=583
                         ->  Limit  (cost=0.43..161.92 rows=5000 width=4) (actual time=0.053..2.808 rows=5000 loops=1)
                                                    Buffers: shared hit=583
                               ->  Index Only Scan using emailmessages_pkey on emailmessages emailmessages_1  (cost=0.43..89834.20 rows=2781465 width=4) (actual time=0.051..2.260 rows=5000 loops=1)
                                                                Heap Fetches: 609
                                     Buffers: shared hit=583
             ->  Index Scan using emailmessages_pkey on emailmessages  (cost=0.43..7.73 rows=1 width=10) (actual time=0.903..0.905 rows=1 loops=5000)
                            Index Cond: (emailmessageid = "ANY_subquery".emailmessageid)
                                           Buffers: shared hit=19640 read=395
     Planning time: 2.482 ms
     Trigger for constraint headeremessageref: time=4038.247 calls=5000
     Trigger for constraint formdataemessageref: time=81.415 calls=5000
     Trigger for constraint attachemessageref: time=158945.774 calls=5000
     Trigger for constraint outgoingemessageref: time=332.316 calls=5000
     Trigger for constraint incomingemessageref: time=125.492 calls=5000
     Trigger for constraint eventemessageref: time=251.365 calls=5000
     Trigger for constraint filteredemessageref: time=125.894 calls=5000
     Execution time: 381072.164 ms
    `
    const r = planService.fromSource(source) as IPlanContent
    const plan: IPlan = planService.createPlan("", r, "")
    expect(plan.content["Triggers"]?.length).toEqual(7)
  })
})
