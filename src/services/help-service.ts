import { IPlan } from '@/iplan';

export class HelpService {
  public nodeId = 0;

  public getNodeTypeDescription(nodeType: string) {
    return NODE_DESCRIPTIONS[nodeType.toUpperCase()];
  }

  public getHelpMessage(helpMessage: string) {
    return HELP_MESSAGES[helpMessage.toUpperCase()];
  }
}

interface INodeDescription {
  [key: string]: string;
}

export const NODE_DESCRIPTIONS: INodeDescription = {
  'LIMIT': 'returns a specified number of rows from a record set.',
  'SORT': 'sorts a record set based on the specified sort key.',
  'NESTED LOOP': `merges two record sets by looping through every record in the first set and
   trying to find a match in the second set. All matching records are returned.`,
  'MERGE JOIN': `merges two record sets by first sorting them on a <strong>join key</strong>.`,
  'HASH': `generates a hash table from the records in the input recordset. Hash is used by
   <strong>Hash Join</strong>.`,
  'HASH JOIN': `joins two record sets by hashing one of them (using a <strong>Hash Scan</strong>).`,
  'AGGREGATE': `groups records together based on a GROUP BY or aggregate function (like <code>sum()</code>).`,
  'HASHAGGREGATE': `groups records together based on a GROUP BY or aggregate function (like sum()). Hash Aggregate uses
   a hash to first organize the records by a key.`,
  'SEQ SCAN': `finds relevant records by sequentially scanning the input record set. When reading from a table,
   Seq Scans (unlike Index Scans) perform a single read operation (only the table is read).`,
  'INDEX SCAN': `finds relevant records based on an <strong>Index</strong>.
    Index Scans perform 2 read operations: one to
    read the index and another to read the actual value from the table.`,
  'INDEX ONLY SCAN': `finds relevant records based on an <strong>Index</strong>.
    Index Only Scans perform a single read operation
    from the index and do not read from the corresponding table.`,
  'BITMAP HEAP SCAN': `searches through the pages returned by the <strong>Bitmap Index Scan</strong>
    for relevant rows.`,
  'BITMAP INDEX SCAN': `uses a <strong>Bitmap Index</strong> (index which uses 1 bit per page)
    to find all relevant pages.
    Results of this node are fed to the <strong>Bitmap Heap Scan</strong>.`,
    'CTE SCAN': `performs a sequential scan of <strong>Common Table Expression (CTE) query</strong> results. Note that
    results of a CTE are materialized (calculated and temporarily stored).`,
  'MEMOIZE': `is used to cache the results of the inner side of a nested loop. It avoids executing underlying nodes when the results for the current parameters are already in the cache.`,
};

interface IHelpMessage {
  [key: string]: string;
}

export const HELP_MESSAGES: IHelpMessage = {
  'MISSING EXECUTION TIME': `Execution time (or Total runtime) not available for this plan. Make sure you
    use EXPLAIN ANALYZE.`,
  'MISSING PLANNING TIME': 'Planning time not available for this plan.',
  'WORKERS PLANNED NOT LAUNCHED': `Less workers than planned were launched.
Consider modifying max_parallel_workers or max_parallel_workers_per_gather.`,
  'WORKERS DETAILED INFO MISSING': `Consider using EXPLAIN (ANALYZE, VERBOSE)`,
  'FUZZY NEEDS VERBOSE': `Information may not be accurate. Use EXPLAIN VERBOSE mode.`,
};

interface EaseInOutQuadOptions {
  currentTime: number;
  start: number;
  change: number;
  duration: number;
}

export function scrollChildIntoParentView(parent: Element, child: Element, shouldCenter: boolean, done?: () => void) {
  // Where is the parent on page
  const parentRect = parent.getBoundingClientRect();
  // Where is the child
  const childRect = child.getBoundingClientRect();

  let scrollLeft = parent.scrollLeft; // don't move
  const isChildViewableX = (childRect.left >= parentRect.left) &&
    (childRect.left <= parentRect.right) &&
    (childRect.right <= parentRect.right);

  let scrollTop = parent.scrollTop;
  const isChildViewableY = (childRect.top >= parentRect.top) &&
    (childRect.top <= parentRect.bottom) &&
    (childRect.bottom <= parentRect.bottom);

  if (shouldCenter || !isChildViewableX || !isChildViewableY) {
    // scroll by offset relative to parent
    // try to put the child in the middle of parent horizontaly
    scrollLeft = childRect.left + parent.scrollLeft - parentRect.left
      - parentRect.width / 2 + childRect.width / 2;
    scrollTop = childRect.top + parent.scrollTop - parentRect.top
      - parentRect.height / 2 + childRect.height / 2;
    smoothScroll({element: parent, to: {scrollTop, scrollLeft}, duration: 400, done});
  } else if (done) {
    done();
  }
}

const easeInOutQuad = ({
  currentTime,
  start,
  change,
  duration,
}: EaseInOutQuadOptions) => {
  let newCurrentTime = currentTime;
  newCurrentTime /= duration / 2;

  if (newCurrentTime < 1) {
    return (change / 2) * newCurrentTime * newCurrentTime + start;
  }

  newCurrentTime -= 1;
  return (-change / 2) * (newCurrentTime * (newCurrentTime - 2) - 1) + start;
};

enum ScrollDirection {
  'scrollTop',
  'scrollLeft',
}

interface SmoothScrollOptions {
  duration: number;
  element: Element;
  to: {
    scrollTop: number;
    scrollLeft: number;
  };
  done?: () => void;
}

export function smoothScroll({
  duration,
  element,
  to,
  done,
}: SmoothScrollOptions) {
  const startX = element.scrollTop;
  const startY = element.scrollLeft;
  const changeX = to.scrollTop - startX;
  const changeY = to.scrollLeft - startY;
  const startDate = new Date().getTime();

  const animateScroll = () => {
    const currentDate = new Date().getTime();
    const currentTime = currentDate - startDate;
    element.scrollTop = easeInOutQuad({
      currentTime,
      start: startX,
      change: changeX,
      duration,
    });
    element.scrollLeft = easeInOutQuad({
      currentTime,
      start: startY,
      change: changeY,
      duration,
    });

    if (currentTime < duration) {
      requestAnimationFrame(animateScroll);
    } else {
      element.scrollTop = to.scrollTop;
      element.scrollLeft = to.scrollLeft;
      if (done) {
        done();
      }
    }
  };
  animateScroll();
}

// Polyfill for Element.closest
// https://developer.mozilla.org/fr/docs/Web/API/Element/closest
if (!Element.prototype.matches) {
  // @ts-ignore
  Element.prototype.matches = Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s: string) {
    let el = this;
    if (!document.documentElement.contains(el)) {
      return null;
    }
    do {
      if (el.matches(s)) {
        return el;
      }
      el = (el.parentElement || el.parentNode) as Element;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

/*
 * Split a string, ensuring balanced parenthesis and balanced quotes.
 */
export function splitBalanced(input: string, split: string) {
  // Build the pattern from params with defaults:
  const pattern = '([\\s\\S]*?)(e)?(?:(o)|(c)|(t)|(sp)|$)'
    .replace('sp', split)
    .replace('o', '[\\(\\{\\[]')
    .replace('c', '[\\)\\}\\]]')
    .replace('t', '[\'\"]')
    .replace('e', '[\\\\]');
  const r = new RegExp(pattern, 'gi');
  const stack: any[] = [];
  let buffer: any[] = [];
  const results: string[] = [];
  input.replace(r, ($0, $1, $e, $o, $c, $t, $s, i) => {
    if ($e) { // Escape
      buffer.push($1, $s || $o || $c || $t);
      return '';
    } else if ($o) { // Open
      stack.push($o);
    } else if ($c) {// Close
      stack.pop();
    } else if ($t) { // Toggle
      if (stack[stack.length - 1] !== $t) {
        stack.push($t);
      } else {
        stack.pop();
      }
    } else { // Split (if no stack) or EOF
      if ($s ? !stack.length : !$1) {
        buffer.push($1);
        results.push(buffer.join(''));
        buffer = [];
        return '';
      }
    }
    buffer.push($0);
    return '';
  });
  return results;
}

export function findNodeById(plan: IPlan, id: number): any | null {
  let o = plan.content.Plan;
  if (o.Plans) {
    o.Plans.some(function iter(child: any): boolean | undefined {
      if (child.nodeId === id) {
        o = child;
        return true;
      }
      return child.Plans && child.Plans.some(iter);
    });
  }
  return o;
}
