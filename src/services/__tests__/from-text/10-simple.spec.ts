import { PlanService } from '@/services/plan-service';

describe('PlanService', () => {
  test('Can`t parse plan with line break from text', () => {
    const planService = new PlanService();
    const planText = `
 Seq Scan on ref  (cost=0.00..14425.02 rows=1000002 width=8) (actual
`;
    expect(() => { planService.fromText(planText); }).toThrow();
  });
});
