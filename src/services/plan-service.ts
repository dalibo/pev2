import * as _ from 'lodash';
import {EstimateDirection, NodeProp, WorkerProp} from '@/enums';
import { IPlan } from '@/iplan';
import Node from '@/inode';
import Worker from '@/iworker';
import moment from 'moment';
import clarinet from 'clarinet';

export class PlanService {

  private static instance: PlanService;

  public createPlan(planName: string, planContent: any, planQuery: string): IPlan {
    // remove any extra white spaces in the middle of query
    // (\S) start match after any non-whitespace character => group 1
    // (?!$) don't start match after end of line
    // (\s{2,}) group of 2 or more white spaces
    // '$1 ' reuse group 1 and and a single space
    planQuery = planQuery.replace(/(\S)(?!$)(\s{2,})/gm, '$1 ');

    const plan: IPlan = {
      id: NodeProp.PEV_PLAN_TAG + new Date().getTime().toString(),
      name: planName || 'plan created on ' + moment().format('LLL'),
      createdOn: new Date(),
      content: planContent,
      query: planQuery,
      planStats: {},
      nodeComponents: [],
      ctes: [],
    };

    this.analyzePlan(plan);
    return plan;
  }

  public analyzePlan(plan: IPlan) {
    this.processNode(plan.content.Plan, plan);

    this.calculateMaximums(plan.content);
  }

  public isCTE(node: any) {
    return node[NodeProp.PARENT_RELATIONSHIP] === 'InitPlan' &&
      _.startsWith(node[NodeProp.SUBPLAN_NAME], 'CTE');
  }

  // recursively walk down the plan to compute various metrics
  public processNode(node: any, plan: any) {
    this.calculatePlannerEstimate(node);

    _.each(node[NodeProp.PLANS], (child) => {
      // All children of Gather node will be considered parallel
      // Pass the number of workers launched to children
      if (!child[NodeProp.WORKERS]) {
        let workersLaunched;
        if (node[NodeProp.WORKERS_PLANNED]) {
          // Launched workers info may not be available (ie. no analyze)
          workersLaunched = node[NodeProp.WORKERS_LAUNCHED] || node[NodeProp.WORKERS_PLANNED];
        }
        child[NodeProp.WORKERS] = workersLaunched || node[NodeProp.WORKERS];
      }
      if (this.isCTE(child)) {
        plan.ctes.push(child);
      }
      this.processNode(child, plan);
    });

    _.remove(node[NodeProp.PLANS], (child: any) => this.isCTE(child));

    // calculate actuals after processing child nodes so that actual duration
    // takes loops into account
    this.calculateActuals(node);

  }

  public calculateMaximums(content: any) {
    function recurse(nodes: any[]): any[] {
      return _.map(nodes, (node) => [node, recurse(node[NodeProp.PLANS])]);
    }
    const flat = _.flattenDeep(recurse([content.Plan as IPlan]));

    const largest = _.maxBy(flat, NodeProp.ACTUAL_ROWS);
    if (largest) {
      content.maxRows = largest[NodeProp.ACTUAL_ROWS];
    }

    const costliest = _.maxBy(flat, NodeProp.ACTUAL_COST);
    if (costliest) {
      costliest[NodeProp.COSTLIEST_NODE] = true;
      content.maxCost = costliest[NodeProp.ACTUAL_COST];
      content.costliest = costliest;
    }

    const slowest = _.maxBy(flat, NodeProp.ACTUAL_DURATION);
    if (slowest) {
      slowest[NodeProp.SLOWEST_NODE] = true;
      content.maxDuration = slowest[NodeProp.ACTUAL_DURATION];
      content.slowest = slowest;
    }

    function sumShared(o: Node) {
      return o[NodeProp.SHARED_HIT_BLOCKS] +
        o[NodeProp.SHARED_READ_BLOCKS] +
        o[NodeProp.SHARED_DIRTIED_BLOCKS] +
        o[NodeProp.SHARED_WRITTEN_BLOCKS];
    }
    const highestShared = _.maxBy(flat, (o) => {
      return sumShared(o);
    });
    if (highestShared) {
      content.maxSharedBlocks = sumShared(highestShared);
    }

    function sumTemp(o: Node) {
      return o[NodeProp.TEMP_HIT_BLOCKS] +
        o[NodeProp.TEMP_READ_BLOCKS] +
        o[NodeProp.TEMP_DIRTIED_BLOCKS] +
        o[NodeProp.TEMP_WRITTEN_BLOCKS];
    }
    const highestTemp = _.maxBy(flat, (o) => {
      return sumTemp(o);
    });
    if (highestTemp) {
      content.maxTempBlocks = sumTemp(highestTemp);
    }

    function sumLocal(o: Node) {
      return o[NodeProp.LOCAL_HIT_BLOCKS] +
        o[NodeProp.LOCAL_READ_BLOCKS] +
        o[NodeProp.LOCAL_DIRTIED_BLOCKS] +
        o[NodeProp.LOCAL_WRITTEN_BLOCKS];
    }
    const highestLocal = _.maxBy(flat, (o) => {
      return sumLocal(o);
    });
    if (highestLocal) {
      content.maxLocalBlocks = sumLocal(highestLocal);
    }
  }

  // actual duration and actual cost are calculated by subtracting child values from the total
  public calculateActuals(node: any) {
    if (!_.isUndefined(node[NodeProp.ACTUAL_TOTAL_TIME])) {
      node[NodeProp.ACTUAL_DURATION] = node[NodeProp.ACTUAL_TOTAL_TIME];
      // since time is reported for an invidual loop, actual duration must be adjusted by number of loops
      // unless the current node is a child of a gather node
      if (!node[NodeProp.WORKERS]) {
        node[NodeProp.ACTUAL_DURATION] = node[NodeProp.ACTUAL_DURATION] * node[NodeProp.ACTUAL_LOOPS];
      }

      const duration = node[NodeProp.ACTUAL_DURATION] - this.childrenDuration(node, 0);
      node[NodeProp.ACTUAL_DURATION] = duration > 0 ? duration : 0;
    }

    if (node[NodeProp.TOTAL_COST]) {
      node[NodeProp.ACTUAL_COST] = node[NodeProp.TOTAL_COST];
    }


    _.each(node[NodeProp.PLANS], (subPlan) => {
      if (subPlan[NodeProp.PARENT_RELATIONSHIP] !== 'InitPlan' && subPlan[NodeProp.TOTAL_COST]) {
        node[NodeProp.ACTUAL_COST] = node[NodeProp.ACTUAL_COST] - subPlan[NodeProp.TOTAL_COST];
      }
    });

    if (node[NodeProp.ACTUAL_COST] < 0) {
      node[NodeProp.ACTUAL_COST] = 0;
    }
  }

  // recursive function to get the sum of actual durations of a a node children
  public childrenDuration(node: Node, duration: number) {
    _.each(node[NodeProp.PLANS], (subPlan) => {
      // Subtract sub plans duration from this node except for InitPlans
      // (ie. CTE)
      if (subPlan[NodeProp.PARENT_RELATIONSHIP] !== 'InitPlan') {
        duration += subPlan[NodeProp.ACTUAL_DURATION] || 0; // Duration may not be set
        duration = this.childrenDuration(subPlan, duration);
      }
    });
    return duration;
  }

  // figure out order of magnitude by which the planner mis-estimated how many rows would be
  // invloved in this node
  public calculatePlannerEstimate(node: any) {
    if (!node[NodeProp.ACTUAL_ROWS]) {
      return;
    }
    node[NodeProp.PLANNER_ESTIMATE_FACTOR] = node[NodeProp.ACTUAL_ROWS] / node[NodeProp.PLAN_ROWS];
    node[NodeProp.PLANNER_ESTIMATE_DIRECTION] = EstimateDirection.none;

    if (node[NodeProp.PLANNER_ESTIMATE_FACTOR] > 1) {
      node[NodeProp.PLANNER_ESTIMATE_DIRECTION] = EstimateDirection.under;
    }
    if (node[NodeProp.PLANNER_ESTIMATE_FACTOR] < 1) {
      node[NodeProp.PLANNER_ESTIMATE_DIRECTION] = EstimateDirection.over;
      node[NodeProp.PLANNER_ESTIMATE_FACTOR] = node[NodeProp.PLAN_ROWS] / node[NodeProp.ACTUAL_ROWS];
    }
  }

  public cleanupSource(source: string) {
    // Remove frames around, handles |, ║,
    source = source.replace(/^(\||║|│)(.*)\1\r?\n/gm, '$2\n');

    // Remove separator lines from various types of borders
    source = source.replace(/^\+-+\+\r?\n/gm, '');
    source = source.replace(/^(-|─|═)\1+\r?\n/gm, '');
    source = source.replace(/^(├|╟|╠|╞)(─|═)\2*(┤|╢|╣|╡)\r?\n/gm, '');

    // Remove more horizontal lines
    source = source.replace(/^\+-+\+\r?\n/gm, '');
    source = source.replace(/^└(─)+┘\r?\n/gm, '');
    source = source.replace(/^╚(═)+╝\r?\n/gm, '');
    source = source.replace(/^┌(─)+┐\r?\n/gm, '');
    source = source.replace(/^╔(═)+╗\r?\n/gm, '');

    // Remove quotes around lines, both ' and "
    source = source.replace(/^(["'])(.*)\1\r?\n/gm, '$2\n');

    // Remove "+" line continuations
    source = source.replace(/\s*\+\r?\n/g, '\n');

    // Remove "↵" line continuations
    source = source.replace(/↵\r?/gm, '\n');

    // Remove "query plan" header
    source = source.replace(/^\s*QUERY PLAN\s*\r?\n/m, '');

    // Remove rowcount
    source = source.replace(/^\(\d+ rows?\)(\r?\n|$)/gm, '\n');

    return source;
  }

  public fromSource(source: string) {
    source = this.cleanupSource(source);

    let isJson = false;
    try {
      isJson =  JSON.parse(source);
    } catch (error) {
      // continue
    }

    if (isJson) {
      return this.parseJson(source);
    } else if (/^(\s*)(\[|\{)\s*\n.*?\1(\]|\})\s*/gms.exec(source)) {
      return this.fromJson(source);
    }
    return this.fromText(source);
  }

  public fromJson(source: string) {
    // We need to remove things before and/or after explain
    // To do this, first - split explain into lines...
    const sourceLines = source.split(/[\r\n]+/);

    // Now, find first line of explain, and cache it's prefix (some spaces ...)
    let prefix = '';
    let firstLineIndex = 0;
    _.each(sourceLines, (l: string, index: number) => {
      const matches = /^(\s*)(\[|\{)\s*$/.exec(l);
      if (matches) {
        prefix = matches[1];
        firstLineIndex = index;
        return false;
      }
    });
    // now find last line
    let lastLineIndex = 0;
    _.each(sourceLines, (l: string, index: number) => {
      const matches = new RegExp('^' + prefix + '(\]|\})\s*$').exec(l);
      if (matches) {
        lastLineIndex = index;
        return false;
      }
    });

    const useSource: string = sourceLines.slice(firstLineIndex, lastLineIndex + 1).join('\n');

    return this.parseJson(useSource);
  }

  // Stream parse JSON as it can contain duplicate keys (workers)
  public parseJson(source: string) {
    const parser = clarinet.parser();
    const elements: any[] = [];
    let root: any = null;
    // Store the level and duplicated object|array
    let duplicated: [number, any] | null = null;
    parser.onvalue = (v: any) => {
      const current = elements[elements.length - 1];
      if (_.isArray(current)) {
        current.push(v);
      } else {
        const keys = Object.keys(current);
        const lastKey = keys[keys.length - 1];
        current[lastKey] = v;
      }
    };
    parser.onopenobject = (key: any) => {
      const o: {[key: string]: any} = {};
      o[key] = null;
      elements.push(o);
    };
    parser.onkey = (key: any) => {
      const current = elements[elements.length - 1];
      const keys = Object.keys(current);
      if (keys.indexOf(key) !== -1) {
        duplicated = [elements.length - 1, current[key]];
      } else {
        current[key] = null;
      }
    };
    parser.onopenarray = () => {
      elements.push([]);
    };
    parser.oncloseobject = parser.onclosearray = () => {
      const popped = elements.pop();

      if (!elements.length) {
        root = popped;
      } else {
        const current = elements[elements.length - 1];

        if (duplicated && duplicated[0] === elements.length - 1) {
          _.merge(duplicated[1], popped);
          duplicated = null;
        } else {
          if (_.isArray(current)) {
            current.push(popped);
          } else {
            const keys = Object.keys(current);
            const lastKey = keys[keys.length - 1];
            current[lastKey] = popped;
          }
        }
      }
    };
    parser.write(source).close();
    if (root instanceof Array) {
      root = root[0];
    }
    return root;
  }

  public fromText(text: string) {

    const lines = text.split(/\r?\n/);

    const root: any = {};
    root.Plan = null;
    type ElementAtDepth = [number, any];
    // Array to keep reference to previous nodes with there depth
    const elementsAtDepth: ElementAtDepth[] = [];

    _.each(lines, (line: string) => {
      // Remove any trailing "
      line = line.replace(/"\s*$/, '');
      // Remove any begining "
      line = line.replace(/^\s*"/, '');
      // Replace tabs with 4 spaces
      line = line.replace(/\t/gm, '    ');

      const emptyLineRegex = '^\s*$';
      const headerRegex = '^\\s*(QUERY|---|#).*$';
      const prefixRegex = '^(\\s*->\\s*|\\s*)';
      const typeRegex = '([^\\r\\n\\t\\f\\v\\:\\(]*?)';
      // tslint:disable-next-line:max-line-length
      const estimationRegex = '\\(cost=(\\d+\\.\\d+)\\.\\.(\\d+\\.\\d+)\\s+rows=(\\d+)\\s+width=(\\d+)\\)';
      const nonCapturingGroupOpen = '(?:';
      const nonCapturingGroupClose = ')';
      const openParenthesisRegex = '\\(';
      const closeParenthesisRegex = '\\)';
      // tslint:disable-next-line:max-line-length
      const actualRegex = '(?:actual\\stime=(\\d+\\.\\d+)\\.\\.(\\d+\\.\\d+)\\srows=(\\d+)\\sloops=(\\d+)|actual\\srows=(\\d+)\\sloops=(\\d+)|(never\\s+executed))';
      const optionalGroup = '?';

      const emptyLineMatches = new RegExp(emptyLineRegex).exec(line);
      const headerMatches = new RegExp(headerRegex).exec(line);

      /*
       * Groups
       * 1: prefix
       * 2: type
       * 3: estimated_startup_cost
       * 4: estimated_total_cost
       * 5: estimated_rows
       * 6: estimated_row_width
       * 7: actual_time_first
       * 8: actual_time_last
       * 9: actual_rows
       * 10: actual_loops
       * 11: actual_rows_
       * 12: actual_loops_
       * 13: never_executed
       * 14: estimated_startup_cost
       * 15: estimated_total_cost
       * 16: estimated_rows
       * 17: estimated_row_width
       * 18: actual_time_first
       * 19: actual_time_last
       * 20: actual_rows
       * 21: actual_loops
       */
      const nodeRegex = new RegExp(
        prefixRegex +
        typeRegex +
        '\\s*' +
        nonCapturingGroupOpen +
          (nonCapturingGroupOpen + estimationRegex + '\\s+' +
           openParenthesisRegex + actualRegex + closeParenthesisRegex +
           nonCapturingGroupClose) +
          '|' +
          nonCapturingGroupOpen + estimationRegex + nonCapturingGroupClose +
          '|' +
          nonCapturingGroupOpen + openParenthesisRegex + actualRegex + closeParenthesisRegex + nonCapturingGroupClose +
        nonCapturingGroupClose + '*' +
        '\\s*$',
        'gm',
      );
      const nodeMatches = nodeRegex.exec(line);

      // tslint:disable-next-line:max-line-length
      const subRegex = /^(\s*)((?:Sub|Init)Plan)\s*(?:\d+\s*)?\s*(?:\(returns.*\)\s*)?$/gm;
      const subMatches = subRegex.exec(line);

      const cteRegex = /^(\s*)CTE\s+(\S+)\s*$/g;
      const cteMatches = cteRegex.exec(line);

      /*
       * Groups
       * 2: trigger name
       * 3: time
       * 4: calls
       */
      const triggerRegex = /^(\s*)Trigger\s+(.*):\s+time=(\d+\.\d+)\s+calls=(\d+)\s*$/g;
      const triggerMatches = triggerRegex.exec(line);

      /*
       * Groups
       * 2: Worker number
       * 3: actual_time_first
       * 4: actual_time_last
       * 5: actual_rows
       * 6: actual_loops
       * 7: actual_rows_
       * 8: actual_loops_
       * 9: never_executed
       * 10: extra
       */
      const workerRegex = new RegExp(
        /^(\s*)Worker\s+(\d+):\s+/.source +
        nonCapturingGroupOpen +
        actualRegex +
        nonCapturingGroupClose +
        optionalGroup +
        '(.*)' +
        '\\s*$',
        'g',
      );
      const workerMatches = workerRegex.exec(line);

      const jitRegex = /^(\s*)JIT:\s*$/g;
      const jitMatches = jitRegex.exec(line);

      const extraRegex = /^(\s*)(\S.*\S)\s*$/g;
      const extraMatches = extraRegex.exec(line);

      if (emptyLineMatches || headerMatches) {
        return;
      } else if (nodeMatches && !cteMatches && !subMatches) {
        const prefix = nodeMatches[1];
        const neverExecuted = nodeMatches[13];
        const newNode: Node = new Node(nodeMatches[2]);
        if (nodeMatches[3] && nodeMatches[4] || nodeMatches[14] && nodeMatches[15]) {
          newNode[NodeProp.STARTUP_COST] = parseFloat(nodeMatches[3] || nodeMatches[14]);
          newNode[NodeProp.TOTAL_COST] = parseFloat(nodeMatches[4] || nodeMatches[15]);
          newNode[NodeProp.PLAN_ROWS] = parseInt(nodeMatches[5] || nodeMatches[16], 0);
        }
        if (nodeMatches[7] && nodeMatches[8] || nodeMatches[18] && nodeMatches[19]) {
          newNode[NodeProp.ACTUAL_STARTUP_TIME] = parseFloat(nodeMatches[7] || nodeMatches[18]);
          newNode[NodeProp.ACTUAL_TOTAL_TIME] = parseFloat(nodeMatches[8] || nodeMatches[19]);
        }

        if (nodeMatches[9] && nodeMatches[10] || nodeMatches[11] && nodeMatches[12] ||
            nodeMatches[20] && nodeMatches[21]) {
          newNode[NodeProp.ACTUAL_ROWS] = parseInt(nodeMatches[9] || nodeMatches[11] || nodeMatches[20], 0);
          newNode[NodeProp.ACTUAL_LOOPS] = parseInt(nodeMatches[10] || nodeMatches[12] || nodeMatches[21], 0);
        }

        if (neverExecuted) {
          newNode[NodeProp.ACTUAL_LOOPS] = 0;
          newNode[NodeProp.ACTUAL_ROWS] = 0;
          newNode[NodeProp.ACTUAL_TOTAL_TIME] = 0;
        }
        const element = {
          node: newNode,
          subelementType: 'subnode',
        };
        const prefixLength = prefix.split('->')[0].length;

        if (0 === elementsAtDepth.length) {
          elementsAtDepth.push([prefixLength, element]);
          root.Plan = newNode;
          return;
        }

        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => {
          return e[0] >= prefixLength;
        });

        // ! is for non-null assertion
        // Prevents the "Object is possibly 'undefined'" linting error
        const previousElement = _.last(elementsAtDepth)![1];

        elementsAtDepth.push([prefixLength, element]);

        if (!previousElement.node[NodeProp.PLANS]) {
          previousElement.node[NodeProp.PLANS] = [];
        }
        if (previousElement.subelementType === 'initplan' ) {
          newNode[NodeProp.PARENT_RELATIONSHIP] = 'InitPlan';
          newNode[NodeProp.SUBPLAN_NAME] = previousElement.name;
        } else if (previousElement.subelementType === 'subplan' ) {
          newNode[NodeProp.PARENT_RELATIONSHIP] = 'SubPlan';
          newNode[NodeProp.SUBPLAN_NAME] = previousElement.name;
        }
        previousElement.node.Plans.push(newNode);

      } else if (subMatches) {
        const prefix = subMatches[1];
        const type = subMatches[2];
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= prefix.length);
        const previousElement = _.last(elementsAtDepth)![1];
        const element = {
          node: previousElement.node,
          subelementType: type.toLowerCase(),
          name: subMatches[0],
        };
        const prefixLength = prefix.length;
        elementsAtDepth.push([prefixLength, element]);
      } else if (cteMatches) {
        const prefix = cteMatches[1];
        const cteName = cteMatches[2];
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= prefix.length);
        const previousElement = _.last(elementsAtDepth)![1];
        const element = {
          node: previousElement.node,
          subelementType: 'initplan',
          name: 'CTE ' + cteName,
        };
        const prefixLength = prefix.length;
        elementsAtDepth.push([prefixLength, element]);
      } else if (workerMatches) {
        const prefix = workerMatches[1];
        const workerNumber = parseInt(workerMatches[2], 0);
        const previousElement = _.last(elementsAtDepth)![1];
        if (!previousElement.node[NodeProp.WORKERS]) {
          previousElement.node[NodeProp.WORKERS] = [];
        }
        let worker = this.getWorker(previousElement.node, workerNumber);
        if (!worker) {
          worker = new Worker(workerNumber);
          previousElement.node[NodeProp.WORKERS].push(worker);
        }
        if (workerMatches[3] && workerMatches[4]) {
          worker[NodeProp.ACTUAL_STARTUP_TIME] = parseFloat(workerMatches[3]);
          worker[NodeProp.ACTUAL_TOTAL_TIME] = parseFloat(workerMatches[4]);
          worker[NodeProp.ACTUAL_ROWS] = parseInt(workerMatches[5], 0);
          worker[NodeProp.ACTUAL_LOOPS] = parseInt(workerMatches[6], 0);
        }

        if (this.parseSort(workerMatches[10], worker)) {
          return;
        }

        // extra info
        const info = workerMatches[10].split(/: (.+)/).filter((x) => x);
        if (workerMatches[10]) {
          if (!info[1]) {
            return;
          }
          const property = _.startCase(info[0]);
          worker[property] = info[1];
        }
      } else if (triggerMatches) {
        const prefix = triggerMatches[1];
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= prefix.length);
        root.Triggers = root.Triggers || [];
        root.Triggers.push({
          'Trigger Name': triggerMatches[2],
          'Time': this.parseTime(triggerMatches[3]),
          'Calls': triggerMatches[4],
        });
      } else if (jitMatches) {
        root.JIT = {};
        const element = {
          node: root.JIT,
        };
        elementsAtDepth.push([1, element]);
      } else if (extraMatches) {
        const prefix = extraMatches[1];

        const info = extraMatches[2].split(/: (.+)/).filter((x) => x);
        if (!info[1]) {
          return;
        }

        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= prefix.length);

        let element;
        if (elementsAtDepth.length === 0) {
          element = root;
        } else {
          element = _.last(elementsAtDepth)![1].node;
        }

        if (this.parseSort(extraMatches[2], element)) {
          return;
        }

        if (this.parseBuffers(extraMatches[2], element)) {
          return;
        }

        if (this.parseIOTimings(extraMatches[2], element)) {
          return;
        }

        if (this.parseOptions(extraMatches[2], element)) {
          return;
        }

        if (this.parseTiming(extraMatches[2], element)) {
          return;
        }

        // remove the " ms" unit in case of time
        let value: string | number = info[1].replace(/(\s*ms)$/, '');
        // try to convert to number
        if (parseFloat(value)) {
          value = parseFloat(value);
        }

        let property = info[0];
        if (property.indexOf(' runtime') !== -1 || property.indexOf(' time') !== -1) {
          property = _.startCase(property);
        }
        element[property] = value;
      }
    });
    if (!root.Plan) {
      throw new Error('Unable to parse plan');
    }
    return root;
  }

  private parseSort(text: string, el: Node | Worker): boolean {
    /*
     * Groups
     * 2: Sort Method
     * 3: Sort Space Type
     * 4: Sort Space Used
     */
    const sortRegex = /^(\s*)Sort Method:\s+(.*)\s+(Memory|Disk):\s+(?:(\S*)kB)\s*$/g;
    const sortMatches = sortRegex.exec(text);
    if (sortMatches) {
      el[NodeProp.SORT_METHOD] = sortMatches[2].trim();
      el[NodeProp.SORT_SPACE_USED] = sortMatches[4];
      el[NodeProp.SORT_SPACE_TYPE] = sortMatches[3];
      return true;
    }
    return false;
  }

  private parseBuffers(text: string, el: Node | Worker): boolean {
    /*
     * Groups
     */
    const buffersRegex = /Buffers:\s+(.*)\s*$/g;
    const buffersMatches = buffersRegex.exec(text);

    /*
     * Groups:
     * 1: type
     * 2: info
     */
    if (buffersMatches) {
      _.each(buffersMatches[1].split(/,\s+/), (infos) => {
        const bufferInfoRegex = /(shared|temp|local)\s+(.*)$/g;
        const m = bufferInfoRegex.exec(infos);
        if (m) {
          const type = m[1];
          // Initiate with default value
          _.each(['hit', 'read', 'written', 'dirtied'], (method) => {
            el[_.map([type, method, 'blocks'], _.capitalize).join(' ')] = 0;
          });
          _.each(m[2].split(/\s+/), (buffer) => {
            this.parseBuffer(buffer, type, el);
          });
        }
      });
      return true;
    }
    return false;
  }

  private parseBuffer(text: string, type: string, el: Node|Worker): void {
    const s = text.split(/=/);
    const method = s[0];
    const value = parseInt(s[1], 0);
    el[_.map([type, method, 'blocks'], _.capitalize).join(' ')] = value;
  }

  private getWorker(node: Node, workerNumber: number): Worker|null {
    return _.find(node[NodeProp.WORKERS], (worker) => {
      return worker[WorkerProp.WORKER_NUMBER] === workerNumber;
    });
  }

  private parseIOTimings(text: string, el: Node): boolean {
    /*
     * Groups
     */
    const iotimingsRegex = /I\/O Timings:\s+(.*)\s*$/g;
    const iotimingsMatches = iotimingsRegex.exec(text);

    /*
     * Groups:
     * 1: type
     * 2: info
     */
    if (iotimingsMatches) {
      // Initiate with default value
      el[NodeProp.IO_READ_TIME] = 0;
      el[NodeProp.IO_WRITE_TIME] = 0;

      _.each(iotimingsMatches[1].split(/\s+/), (timing) => {
        const s = timing.split(/=/);
        const method = s[0];
        const value = parseFloat(s[1]);
        const prop = ['I/O', _.capitalize(method), 'Time'].join(' ');
        el[prop] = value;
      });
      return true;
    }
    return false;
  }

  private parseOptions(text: string, el: Node): boolean {
    // Parses an options block in JIT block
    // eg. Options: Inlining false, Optimization false, Expressions true, Deforming true

    /*
     * Groups
     */
    const optionsRegex = /^(\s*)Options:\s+(.*)$/g;
    const optionsMatches = optionsRegex.exec(text);

    if (optionsMatches) {
      el.Options = {};
      const options = optionsMatches[2].split(/\s*,\s*/);
      let matches;
      _.each(options, (option) => {
        const reg = /^(\S*)\s+(.*)$/g;
        matches = reg.exec(option);
        el.Options[matches![1]] = JSON.parse(matches![2]);
      });
      return true;
    }
    return false;
  }

  private parseTiming(text: string, el: Node): boolean {
    // Parses a timing block in JIT block
    // eg. Timing: Generation 0.340 ms, Inlining 0.000 ms, Optimization 0.168 ms, Emission 1.907 ms, Total 2.414 ms

    /*
     * Groups
     */
    const timingRegex = /^(\s*)Timing:\s+(.*)$/g;
    const timingMatches = timingRegex.exec(text);

    if (timingMatches) {
      el.Timing = {};
      const timings = timingMatches[2].split(/\s*,\s*/);
      let matches;
      _.each(timings, (option) => {
        const reg = /^(\S*)\s+(.*)$/g;
        matches = reg.exec(option);
        el.Timing[matches![1]] = this.parseTime(matches![2]);
      });
      return true;
    }
    return false;
  }

  private parseTime(text: string): number {
    return parseFloat(text.replace(/(\s*ms)$/, ''));
  }
}
