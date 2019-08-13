import { PlanService } from '@/services/plan-service';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';


// Those tests are automatically built from the files in the `from-text`
// directory.
// The xxx-plan file is parsed and the result is expected to equal the content
// of the corresponding xxx-expect file.

const dir = path.join(path.dirname(module.filename), 'from-text');
const files = fs.readdirSync(dir);
let tests = files.map((file: string) => file.replace(/-.*/, ''));
tests = _.uniq(tests);
tests.forEach((planTest: string) => {
  describe('From text: Plan ' + planTest, () => {
    test('', () => {
      const planFile = path.join(dir, planTest + '-plan');
      const planText = fs.readFileSync(planFile, {encoding: 'utf-8'});
      const planExpectFile = path.join(dir, planTest + '-expect');
      const planExpect = fs.readFileSync(planExpectFile, {encoding: 'utf-8'});

      const planService = new PlanService();
      const r = planService.fromSource(planText);
      expect(JSON.stringify(r, null, '  ')).toEqual(JSON.stringify(JSON.parse(planExpect), null, '  '));
    });
  });
});

