import { PlanService } from '@/services/plan-service';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';


// Those tests are automatically built from the files in the `from-text`
// directory.
// The xxx-plan file is parsed and the result is expected to equal the content
// of the corresponding xxx-expect file.

const dir = path.join(path.dirname(module.filename), '11-psql-frames');
const files = fs.readdirSync(dir);
files.forEach((planTest: string) => {
  describe('From text: Plan ' + planTest, () => {
    test('', () => {
      const planFile = path.join(dir, planTest);
      const planSrc = fs.readFileSync(planFile, {encoding: 'utf-8'});
      const planService = new PlanService();
      const r = planService.fromSource(planSrc);
      // Test will fail if service is unable to parse fil
    });
  });
});


