import _ from "lodash"
import type { IPlan, Node } from "@/interfaces"
import { Property } from "@/enums"

export function getNodeTypeDescription(nodeType: string): string | undefined {
  return NODE_DESCRIPTIONS[nodeType.toUpperCase()]
}

export function getHelpMessage(helpMessage: string): string | undefined {
  return HELP_MESSAGES[helpMessage.toUpperCase()]
}

export const NODE_DESCRIPTIONS: Record<string, string> = {
  LIMIT: "returns a specified number of rows from a record set.",
  SORT: "sorts a record set based on the specified sort key.",
  "NESTED LOOP": `merges two record sets by looping through every record in the first set and
   trying to find a match in the second set. All matching records are returned.`,
  "MERGE JOIN": `merges two record sets by first sorting them on a <strong>join key</strong>.`,
  HASH: `generates a hash table from the records in the input recordset. Hash is used by
   <strong>Hash Join</strong>.`,
  "HASH JOIN": `joins two record sets by hashing one of them (using a <strong>Hash Scan</strong>).`,
  AGGREGATE: `groups records together based on a GROUP BY or aggregate function (like <code>sum()</code>).`,
  HASHAGGREGATE: `groups records together based on a GROUP BY or aggregate function (like sum()). Hash Aggregate uses
   a hash to first organize the records by a key.`,
  "SEQ SCAN": `finds relevant records by sequentially scanning the input record set. When reading from a table,
   Seq Scans (unlike Index Scans) perform a single read operation (only the table is read).`,
  "INDEX SCAN": `finds relevant records based on an <strong>Index</strong>.
    Index Scans perform 2 read operations: one to
    read the index and another to read the actual value from the table.`,
  "INDEX ONLY SCAN": `finds relevant records based on an <strong>Index</strong>.
    Index Only Scans perform a single read operation
    from the index and do not read from the corresponding table.`,
  "BITMAP HEAP SCAN": `searches through the pages returned by the <strong>Bitmap Index Scan</strong>
    for relevant rows.`,
  "BITMAP INDEX SCAN": `uses a <strong>Bitmap Index</strong> (index which uses 1 bit per page)
    to find all relevant pages.
    Results of this node are fed to the <strong>Bitmap Heap Scan</strong>.`,
  "CTE SCAN": `performs a sequential scan of <strong>Common Table Expression (CTE) query</strong> results. Note that
    results of a CTE are materialized (calculated and temporarily stored).`,
  MEMOIZE: `is used to cache the results of the inner side of a nested loop. It avoids executing underlying nodes when the results for the current parameters are already in the cache.`,
  GATHER: `reads the results of the parallel workers, in an undefined order.`,
  "GATHER MERGE": `reads the results of the parallel workers, preserving any ordering.`,
}

export const HELP_MESSAGES: Record<string, string> = {
  "MISSING EXECUTION TIME": `Execution time (or Total runtime) not available for this plan. Make sure you
    use EXPLAIN ANALYZE.`,
  "MISSING PLANNING TIME": "Planning time not available for this plan.",
  "WORKERS PLANNED NOT LAUNCHED": `Less workers than planned were launched.
Consider modifying max_parallel_workers or max_parallel_workers_per_gather.`,
  "WORKERS DETAILED INFO MISSING": `Consider using EXPLAIN (ANALYZE, VERBOSE)`,
  "FUZZY NEEDS VERBOSE": `Information may not be accurate. Use EXPLAIN VERBOSE mode.`,
  "HINT TRACK_IO_TIMING": `HINT: activate <em><b>track_io_timing</b></em> to have details on time spent outside the PG cache.`,
  "IO TIMINGS PARALLEL": "Distributed among parallel workers",
  "MULTIPLE HASH BATCHES":
    "Several batches were required to process the hash buckets with the available memory. Spilling data to temporary disk, yet generating some operation on disk (I/O).<br/> <b>Hint</b>: consider increasing <code>work_mem</code> or decreasing <code>hash_mem_multiplier</code> so that only one batch is used to possibly improve performance.",
}

interface EaseInOutQuadOptions {
  currentTime: number
  start: number
  change: number
  duration: number
}

export function scrollChildIntoParentView(
  parent: Element,
  child: Element,
  shouldCenter: boolean,
  done?: () => void,
) {
  if (!child) {
    return
  }
  // Where is the parent on page
  const parentRect = parent.getBoundingClientRect()
  // Where is the child
  const childRect = child.getBoundingClientRect()

  let scrollLeft = parent.scrollLeft // don't move
  const isChildViewableX =
    childRect.left >= parentRect.left &&
    childRect.left <= parentRect.right &&
    childRect.right <= parentRect.right

  let scrollTop = parent.scrollTop
  const isChildViewableY =
    childRect.top >= parentRect.top &&
    childRect.top <= parentRect.bottom &&
    childRect.bottom <= parentRect.bottom

  if (shouldCenter || !isChildViewableX || !isChildViewableY) {
    // scroll by offset relative to parent
    // try to put the child in the middle of parent horizontaly
    scrollLeft =
      childRect.left +
      parent.scrollLeft -
      parentRect.left -
      parentRect.width / 2 +
      childRect.width / 2
    scrollTop =
      childRect.top +
      parent.scrollTop -
      parentRect.top -
      parentRect.height / 2 +
      childRect.height / 2
    smoothScroll({
      element: parent,
      to: { scrollTop, scrollLeft },
      duration: 400,
      done,
    })
  } else if (done) {
    done()
  }
}

const easeInOutQuad = ({
  currentTime,
  start,
  change,
  duration,
}: EaseInOutQuadOptions) => {
  let newCurrentTime = currentTime
  newCurrentTime /= duration / 2

  if (newCurrentTime < 1) {
    return (change / 2) * newCurrentTime * newCurrentTime + start
  }

  newCurrentTime -= 1
  return (-change / 2) * (newCurrentTime * (newCurrentTime - 2) - 1) + start
}

interface SmoothScrollOptions {
  duration: number
  element: Element
  to: {
    scrollTop: number
    scrollLeft: number
  }
  done?: () => void
}

export function smoothScroll({
  duration,
  element,
  to,
  done,
}: SmoothScrollOptions) {
  const startX = element.scrollTop
  const startY = element.scrollLeft
  const changeX = to.scrollTop - startX
  const changeY = to.scrollLeft - startY
  const startDate = new Date().getTime()

  const animateScroll = () => {
    const currentDate = new Date().getTime()
    const currentTime = currentDate - startDate
    element.scrollTop = easeInOutQuad({
      currentTime,
      start: startX,
      change: changeX,
      duration,
    })
    element.scrollLeft = easeInOutQuad({
      currentTime,
      start: startY,
      change: changeY,
      duration,
    })

    if (currentTime < duration) {
      requestAnimationFrame(animateScroll)
    } else {
      element.scrollTop = to.scrollTop
      element.scrollLeft = to.scrollLeft
      if (done) {
        done()
      }
    }
  }
  animateScroll()
}

/*
 * Split a string, ensuring balanced parenthesis and balanced quotes.
 */
export function splitBalanced(input: string, split: string) {
  // Build the pattern from params with defaults:
  const pattern = "([\\s\\S]*?)(e)?(?:(o)|(c)|(t)|(sp)|$)"
    .replace("sp", split)
    .replace("o", "[\\(\\{\\[]")
    .replace("c", "[\\)\\}\\]]")
    .replace("t", "['\"]")
    .replace("e", "[\\\\]")
  const r = new RegExp(pattern, "gi")
  const stack: string[] = []
  let buffer: string[] = []
  const results: string[] = []
  input.replace(r, ($0, $1, $e, $o, $c, $t, $s) => {
    if ($e) {
      // Escape
      buffer.push($1, $s || $o || $c || $t)
      return ""
    } else if ($o) {
      // Open
      stack.push($o)
    } else if ($c) {
      // Close
      stack.pop()
    } else if ($t) {
      // Toggle
      if (stack[stack.length - 1] !== $t) {
        stack.push($t)
      } else {
        stack.pop()
      }
    } else {
      // Split (if no stack) or EOF
      if ($s ? !stack.length : !$1) {
        buffer.push($1)
        results.push(buffer.join(""))
        buffer = []
        return ""
      }
    }
    buffer.push($0)
    return ""
  })
  return results
}

export function findNodeById(plan: IPlan, id: number): Node | undefined {
  let o: Node | undefined = undefined
  const root = plan.content.Plan
  if (root.nodeId == id) {
    return root
  }
  if (root && root.Plans) {
    root.Plans.some(function iter(child: Node): boolean | undefined {
      if (child.nodeId === id) {
        o = child
        return true
      }
      return child.Plans && child.Plans.some(iter)
    })
    if (!o && plan.ctes) {
      _.each(plan.ctes, (cte) => {
        if (cte.nodeId == id) {
          o = cte
          return false
        } else if (cte.Plans) {
          cte.Plans.some(function iter(child: Node): boolean | undefined {
            if (child.nodeId === id) {
              o = child
              return true
            }
            return child.Plans && child.Plans.some(iter)
          })
          if (o) {
            return false
          }
        }
      })
    }
  }
  return o
}

export function findNodeBySubplanName(
  plan: IPlan,
  subplanName: string,
): Node | undefined {
  let o: Node | undefined = undefined
  if (plan.ctes) {
    _.each(plan.ctes, (cte) => {
      if (cte[Property.SUBPLAN_NAME] == "CTE " + subplanName) {
        o = cte
        return false
      }
    })
  }
  return o
}

// Returns the list of properties that have already been displayed either in
// the main panel or in other detailed tabs.
const notMiscProperties: string[] = [
  Property.NODE_TYPE,
  Property.CTE_NAME,
  Property.EXCLUSIVE_DURATION,
  Property.EXCLUSIVE_COST,
  Property.TOTAL_COST,
  Property.PLAN_ROWS,
  Property.ACTUAL_ROWS,
  Property.ACTUAL_LOOPS,
  Property.OUTPUT,
  Property.WORKERS,
  Property.WORKERS_PLANNED,
  Property.WORKERS_LAUNCHED,
  Property.WORKERS_PLANNED_BY_GATHER,
  Property.WORKERS_LAUNCHED_BY_GATHER,
  Property.READ_BLOCKS,
  Property.WRITTEN_BLOCKS,
  Property.EXCLUSIVE_SHARED_HIT_BLOCKS,
  Property.EXCLUSIVE_SHARED_READ_BLOCKS,
  Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS,
  Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS,
  Property.EXCLUSIVE_TEMP_READ_BLOCKS,
  Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS,
  Property.EXCLUSIVE_LOCAL_HIT_BLOCKS,
  Property.EXCLUSIVE_LOCAL_READ_BLOCKS,
  Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS,
  Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS,
  Property.EXCLUSIVE_READ_BLOCKS,
  Property.EXCLUSIVE_WRITTEN_BLOCKS,
  Property.SHARED_HIT_BLOCKS,
  Property.SHARED_READ_BLOCKS,
  Property.SHARED_DIRTIED_BLOCKS,
  Property.SHARED_WRITTEN_BLOCKS,
  Property.TEMP_READ_BLOCKS,
  Property.TEMP_WRITTEN_BLOCKS,
  Property.LOCAL_HIT_BLOCKS,
  Property.LOCAL_READ_BLOCKS,
  Property.LOCAL_DIRTIED_BLOCKS,
  Property.LOCAL_WRITTEN_BLOCKS,
  Property.PLANNER_ESTIMATE_FACTOR,
  Property.PLANNER_ESTIMATE_DIRECTION,
  Property.SUBPLAN_NAME,
  Property.GROUP_KEY,
  Property.HASH_CONDITION,
  Property.JOIN_TYPE,
  Property.INDEX_NAME,
  Property.HASH_CONDITION,
  Property.EXCLUSIVE_IO_READ_TIME,
  Property.EXCLUSIVE_IO_WRITE_TIME,
  Property.EXCLUSIVE_SHARED_IO_READ_TIME,
  Property.EXCLUSIVE_SHARED_IO_WRITE_TIME,
  Property.EXCLUSIVE_LOCAL_IO_READ_TIME,
  Property.EXCLUSIVE_LOCAL_IO_WRITE_TIME,
  Property.EXCLUSIVE_TEMP_IO_READ_TIME,
  Property.EXCLUSIVE_TEMP_IO_WRITE_TIME,
  Property.EXCLUSIVE_AVERAGE_IO_READ_SPEED,
  Property.EXCLUSIVE_AVERAGE_IO_WRITE_SPEED,
  Property.EXCLUSIVE_AVERAGE_SHARED_IO_READ_SPEED,
  Property.EXCLUSIVE_AVERAGE_SHARED_IO_WRITE_SPEED,
  Property.EXCLUSIVE_AVERAGE_LOCAL_IO_READ_SPEED,
  Property.EXCLUSIVE_AVERAGE_LOCAL_IO_WRITE_SPEED,
  Property.EXCLUSIVE_AVERAGE_TEMP_IO_READ_SPEED,
  Property.EXCLUSIVE_AVERAGE_TEMP_IO_WRITE_SPEED,
  Property.EXCLUSIVE_AVERAGE_IO_READ_SPEED,
  Property.EXCLUSIVE_AVERAGE_IO_WRITE_SPEED,
  Property.EXCLUSIVE_SUM_IO_READ_TIME,
  Property.EXCLUSIVE_SUM_IO_WRITE_TIME,
  Property.EXCLUSIVE_AVERAGE_SUM_IO_READ_SPEED,
  Property.EXCLUSIVE_AVERAGE_SUM_IO_WRITE_SPEED,
  Property.AVERAGE_IO_READ_SPEED,
  Property.AVERAGE_IO_WRITE_SPEED,
  Property.AVERAGE_SHARED_IO_READ_SPEED,
  Property.AVERAGE_SHARED_IO_WRITE_SPEED,
  Property.AVERAGE_LOCAL_IO_READ_SPEED,
  Property.AVERAGE_LOCAL_IO_WRITE_SPEED,
  Property.AVERAGE_TEMP_IO_READ_SPEED,
  Property.AVERAGE_TEMP_IO_WRITE_SPEED,
  Property.IO_READ_TIME,
  Property.IO_WRITE_TIME,
  Property.SHARED_IO_READ_TIME,
  Property.SHARED_IO_WRITE_TIME,
  Property.LOCAL_IO_READ_TIME,
  Property.LOCAL_IO_WRITE_TIME,
  Property.TEMP_IO_READ_TIME,
  Property.TEMP_IO_WRITE_TIME,
  Property.SUM_IO_READ_TIME,
  Property.SUM_IO_WRITE_TIME,
  Property.AVERAGE_SUM_IO_READ_SPEED,
  Property.AVERAGE_SUM_IO_WRITE_SPEED,
  Property.HEAP_FETCHES,
  Property.WAL_RECORDS,
  Property.WAL_BYTES,
  Property.WAL_FPI,
  Property.NODE_ID,
  Property.ROWS_REMOVED_BY_FILTER,
  Property.ROWS_REMOVED_BY_JOIN_FILTER,
  Property.ROWS_REMOVED_BY_INDEX_RECHECK,
  Property.ACTUAL_ROWS_REVISED,
  Property.PLAN_ROWS_REVISED,
  Property.ROWS_REMOVED_BY_FILTER_REVISED,
  Property.ROWS_REMOVED_BY_JOIN_FILTER_REVISED,
  Property.ROWS_REMOVED_BY_INDEX_RECHECK_REVISED,
  "size", // Manually added to use FlexTree
  Property.RELATION_NAME,
  Property.ALIAS,
  Property.FUNCTION_NAME,
  Property.STRATEGY,
  Property.PARTIAL_MODE,
  Property.SCAN_DIRECTION,
  Property.ACTUAL_ROWS_FRACTIONAL,
  Property.DISABLED,
  Property.WORKER_NUMBER,
]

export function shouldShowProp(key: string, value: unknown): boolean {
  return (
    (!!value ||
      key === Property.WORKER_NUMBER ||
      key === Property.ACTUAL_ROWS) &&
    notMiscProperties.indexOf(key) === -1
  )
}
