import _ from "lodash"
import {
  BufferLocation,
  EstimateDirection,
  SortGroupsProp,
  NodeProp,
  SortSpaceMemoryProp,
  WorkerProp,
} from "@/enums"
import { splitBalanced } from "@/services/help-service"
import type {
  IBlocksStats,
  IPlan,
  IPlanContent,
  IPlanStats,
  JIT,
  SortGroups,
} from "@/interfaces"
import { Node, Worker } from "@/interfaces"

interface NodeElement {
  node: Node
  subelementType?: string
  name?: string
}

interface JitElement {
  node: object
}

export class PlanService {
  private static instance: PlanService
  private nodeId = 0

  public createPlan(
    planName: string,
    planContent: IPlanContent,
    planQuery: string
  ): IPlan {
    // remove any extra white spaces in the middle of query
    // (\S) start match after any non-whitespace character => group 1
    // (?!$) don't start match after end of line
    // (\s{2,}) group of 2 or more white spaces
    // '$1 ' reuse group 1 and and a single space
    planQuery = planQuery.replace(/(\S)(?!$)(\s{2,})/gm, "$1 ")

    if (!planContent.Plan) {
      throw new Error("Invalid plan")
    }

    const plan: IPlan = {
      id: NodeProp.PEV_PLAN_TAG + new Date().getTime().toString(),
      name: planName || "plan created on " + new Date().toDateString(),
      createdOn: new Date(),
      content: planContent,
      query: planQuery,
      planStats: {} as IPlanStats,
      ctes: [],
      isAnalyze: _.has(planContent.Plan, NodeProp.ACTUAL_ROWS),
      isVerbose: this.findOutputProperty(planContent.Plan),
    }

    this.nodeId = 1
    this.processNode(planContent.Plan, plan)
    this.calculateMaximums(plan)
    return plan
  }

  public isCTE(node: Node) {
    return (
      node[NodeProp.PARENT_RELATIONSHIP] === "InitPlan" &&
      _.startsWith(node[NodeProp.SUBPLAN_NAME], "CTE")
    )
  }

  // recursively walk down the plan to compute various metrics
  public processNode(node: Node, plan: IPlan) {
    node.nodeId = this.nodeId++
    this.calculatePlannerEstimate(node)

    _.each(node[NodeProp.PLANS], (child) => {
      // Disseminate workers planned info to parallel nodes (ie. Gather children)
      if (
        !this.isCTE(child) &&
        child[NodeProp.PARENT_RELATIONSHIP] !== "InitPlan" &&
        child[NodeProp.PARENT_RELATIONSHIP] !== "SubPlan"
      ) {
        child[NodeProp.WORKERS_PLANNED_BY_GATHER] =
          node[NodeProp.WORKERS_PLANNED] ||
          node[NodeProp.WORKERS_PLANNED_BY_GATHER]
        child[NodeProp.WORKERS_LAUNCHED_BY_GATHER] =
          node[NodeProp.WORKERS_LAUNCHED] ||
          node[NodeProp.WORKERS_LAUNCHED_BY_GATHER]
      }
      if (this.isCTE(child)) {
        plan.ctes.push(child)
      }
      this.processNode(child, plan)
    })

    _.remove(node[NodeProp.PLANS], (child) => this.isCTE(child))

    // calculate actuals after processing child nodes so that actual duration
    // takes loops into account
    this.calculateActuals(node)
    this.calculateExclusives(node)
    this.calculateIoTimingsAverage(node)
    this.convertNodeType(node)
  }

  public calculateMaximums(plan: IPlan) {
    type recurseItemType = Array<[Node, recurseItemType]>
    function recurse(nodes: Node[]): recurseItemType {
      return _.map(nodes, (node) => [node, recurse(node[NodeProp.PLANS])])
    }
    let flat: Node[] = []
    flat = flat.concat(_.flattenDeep(recurse([plan.content.Plan as Node])))
    _.each(plan.ctes, (cte) => {
      flat = flat.concat(_.flattenDeep(recurse([cte as Node])))
    })

    const largest = _.maxBy(flat, NodeProp.ACTUAL_ROWS_REVISED)
    if (largest) {
      plan.content.maxRows = largest[NodeProp.ACTUAL_ROWS_REVISED] as number
    }

    const costliest = _.maxBy(flat, NodeProp.EXCLUSIVE_COST)
    if (costliest) {
      plan.content.maxCost = costliest[NodeProp.EXCLUSIVE_COST] as number
    }

    const totalCostliest = _.maxBy(flat, NodeProp.TOTAL_COST)
    if (totalCostliest) {
      plan.content.maxTotalCost = totalCostliest[NodeProp.TOTAL_COST] as number
    }

    const slowest = _.maxBy(flat, NodeProp.EXCLUSIVE_DURATION)
    if (slowest) {
      plan.content.maxDuration = slowest[NodeProp.EXCLUSIVE_DURATION] as number
    }

    if (!plan.content.maxBlocks) {
      plan.content.maxBlocks = {} as IBlocksStats
    }

    function sumShared(o: Node): number {
      return (
        (o[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] as number) +
        (o[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] as number) +
        (o[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] as number) +
        (o[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] as number)
      )
    }
    const highestShared = _.maxBy(flat, (o) => {
      return sumShared(o)
    }) as Node
    if (highestShared && sumShared(highestShared)) {
      plan.content.maxBlocks[BufferLocation.shared] = sumShared(highestShared)
    }

    function sumTemp(o: Node): number {
      return (
        (o[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS] as number) +
        (o[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS] as number)
      )
    }
    const highestTemp = _.maxBy(flat, (o) => {
      return sumTemp(o)
    }) as Node
    if (highestTemp && sumTemp(highestTemp)) {
      plan.content.maxBlocks[BufferLocation.temp] = sumTemp(highestTemp)
    }

    function sumLocal(o: Node) {
      return (
        (o[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS] as number) +
        (o[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS] as number) +
        (o[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS] as number) +
        (o[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS] as number)
      )
    }
    const highestLocal = _.maxBy(flat, (o) => {
      return sumLocal(o)
    })
    if (highestLocal && sumLocal(highestLocal)) {
      plan.content.maxBlocks[BufferLocation.local] = sumLocal(highestLocal)
    }

    if (!plan.content.maxIo) {
      plan.content.maxIo = 0
    }
    function sumIo(o: Node) {
      return (
        (o[NodeProp.EXCLUSIVE_IO_READ_TIME] as number) +
        (o[NodeProp.EXCLUSIVE_IO_WRITE_TIME] as number)
      )
    }
    const highestIo = _.maxBy(flat, (o) => {
      return sumIo(o)
    })
    if (highestIo && sumIo(highestIo)) {
      plan.content.maxIo = sumIo(highestIo)
    }

    const highestEstimateFactor = _.max(
      _.map(flat, (node) => {
        const f = node[NodeProp.PLANNER_ESTIMATE_FACTOR]
        if (f !== Infinity) {
          return f
        }
      })
    ) as number
    plan.content.maxEstimateFactor = highestEstimateFactor * 2 || 1
  }

  // actual duration and actual cost are calculated by subtracting child values from the total
  public calculateActuals(node: Node) {
    if (!_.isUndefined(node[NodeProp.ACTUAL_TOTAL_TIME])) {
      // since time is reported for an invidual loop, actual duration must be adjusted by number of loops
      // number of workers is also taken into account
      const workers = (node[NodeProp.WORKERS_PLANNED_BY_GATHER] || 0) + 1
      node[NodeProp.ACTUAL_TOTAL_TIME] =
        ((node[NodeProp.ACTUAL_TOTAL_TIME] as number) *
          (node[NodeProp.ACTUAL_LOOPS] as number)) /
        workers
      node[NodeProp.ACTUAL_STARTUP_TIME] =
        ((node[NodeProp.ACTUAL_STARTUP_TIME] as number) *
          (node[NodeProp.ACTUAL_LOOPS] as number)) /
        workers
      node[NodeProp.EXCLUSIVE_DURATION] = node[NodeProp.ACTUAL_TOTAL_TIME]

      const duration =
        (node[NodeProp.EXCLUSIVE_DURATION] as number) -
        this.childrenDuration(node, 0)
      node[NodeProp.EXCLUSIVE_DURATION] = duration > 0 ? duration : 0
    }

    if (!_.isUndefined(node[NodeProp.TOTAL_COST])) {
      node[NodeProp.EXCLUSIVE_COST] = node[NodeProp.TOTAL_COST]
    }

    _.each(node[NodeProp.PLANS], (subPlan) => {
      if (
        subPlan[NodeProp.PARENT_RELATIONSHIP] !== "InitPlan" &&
        subPlan[NodeProp.TOTAL_COST]
      ) {
        node[NodeProp.EXCLUSIVE_COST] =
          (node[NodeProp.EXCLUSIVE_COST] as number) -
          (subPlan[NodeProp.TOTAL_COST] as number)
      }
    })

    if ((node[NodeProp.EXCLUSIVE_COST] as number) < 0) {
      node[NodeProp.EXCLUSIVE_COST] = 0
    }

    _.each(
      [
        "ACTUAL_ROWS",
        "PLAN_ROWS",
        "ROWS_REMOVED_BY_FILTER",
        "ROWS_REMOVED_BY_JOIN_FILTER",
      ],
      (prop: keyof typeof NodeProp) => {
        if (!_.isUndefined(node[NodeProp[prop]])) {
          const revisedProp = (prop + "_REVISED") as keyof typeof NodeProp
          const loops = node[NodeProp.ACTUAL_LOOPS] || 1
          const revised = <number>node[NodeProp[prop]] * loops
          node[NodeProp[revisedProp] as unknown as keyof typeof Node] = revised
        }
      }
    )
  }

  // recursive function to get the sum of actual durations of a a node children
  public childrenDuration(node: Node, duration: number) {
    _.each(node[NodeProp.PLANS], (child) => {
      // Subtract sub plans duration from this node except for InitPlans
      // (ie. CTE)
      if (child[NodeProp.PARENT_RELATIONSHIP] !== "InitPlan") {
        duration += child[NodeProp.EXCLUSIVE_DURATION] || 0 // Duration may not be set
        duration = this.childrenDuration(child, duration)
      }
    })
    return duration
  }

  // figure out order of magnitude by which the planner mis-estimated how many rows would be
  // invloved in this node
  public calculatePlannerEstimate(node: Node) {
    if (
      node[NodeProp.ACTUAL_ROWS] !== undefined &&
      node[NodeProp.PLAN_ROWS] !== undefined
    ) {
      node[NodeProp.PLANNER_ESTIMATE_FACTOR] =
        node[NodeProp.ACTUAL_ROWS] / node[NodeProp.PLAN_ROWS]
      node[NodeProp.PLANNER_ESTIMATE_DIRECTION] = EstimateDirection.none

      if (node[NodeProp.ACTUAL_ROWS] > node[NodeProp.PLAN_ROWS]) {
        node[NodeProp.PLANNER_ESTIMATE_DIRECTION] = EstimateDirection.under
      }
      if (node[NodeProp.ACTUAL_ROWS] < node[NodeProp.PLAN_ROWS]) {
        node[NodeProp.PLANNER_ESTIMATE_DIRECTION] = EstimateDirection.over
        node[NodeProp.PLANNER_ESTIMATE_FACTOR] =
          node[NodeProp.PLAN_ROWS] / node[NodeProp.ACTUAL_ROWS]
      }
    }
  }

  public cleanupSource(source: string) {
    // Remove frames around, handles |, ║,
    source = source.replace(/^(\||║|│)(.*)\1\r?\n/gm, "$2\n")
    // Remove frames at the end of line, handles |, ║,
    source = source.replace(/(.*)(\||║|│)$\r?\n/gm, "$1\n")

    // Remove separator lines from various types of borders
    source = source.replace(/^\+-+\+\r?\n/gm, "")
    source = source.replace(/^(-|─|═)\1+\r?\n/gm, "")
    source = source.replace(/^(├|╟|╠|╞)(─|═)\2*(┤|╢|╣|╡)\r?\n/gm, "")

    // Remove more horizontal lines
    source = source.replace(/^\+-+\+\r?\n/gm, "")
    source = source.replace(/^└(─)+┘\r?\n/gm, "")
    source = source.replace(/^╚(═)+╝\r?\n/gm, "")
    source = source.replace(/^┌(─)+┐\r?\n/gm, "")
    source = source.replace(/^╔(═)+╗\r?\n/gm, "")

    // Remove quotes around lines, both ' and "
    source = source.replace(/^(["'])(.*)\1\r?/gm, "$2")

    // Remove "+" line continuations
    source = source.replace(/\s*\+\r?\n/g, "\n")

    // Remove "↵" line continuations
    source = source.replace(/↵\r?/gm, "\n")

    // Remove "query plan" header
    source = source.replace(/^\s*QUERY PLAN\s*\r?\n/m, "")

    // Remove rowcount
    // example: (8 rows)
    // Note: can be translated
    // example: (8 lignes)
    source = source.replace(/^\(\d+\s+[a-z]*s?\)(\r?\n|$)/gm, "\n")

    return source
  }

  public fromSource(source: string) {
    source = this.cleanupSource(source)

    let isJson = false
    try {
      isJson = JSON.parse(source)
    } catch {
      // continue
    }

    if (isJson) {
      return this.parseJson(source)
    } else if (/^(\s*)(\[|\{)\s*\n.*?\1(\]|\})\s*/gms.exec(source)) {
      return this.fromJson(source)
    }
    return this.fromText(source)
  }

  public fromJson(source: string) {
    // We need to remove things before and/or after explain
    // To do this, first - split explain into lines...
    const sourceLines = source.split(/[\r\n]+/)

    // Now, find first line of explain, and cache it's prefix (some spaces ...)
    let prefix = ""
    let firstLineIndex = 0
    _.each(sourceLines, (l: string, index: number) => {
      const matches = /^(\s*)(\[|\{)\s*$/.exec(l)
      if (matches) {
        prefix = matches[1]
        firstLineIndex = index
        return false
      }
    })
    // now find last line
    let lastLineIndex = 0
    _.each(sourceLines, (l: string, index: number) => {
      const matches = new RegExp("^" + prefix + "(]|})s*$").exec(l)
      if (matches) {
        lastLineIndex = index
        return false
      }
    })

    const useSource: string = sourceLines
      .slice(firstLineIndex, lastLineIndex + 1)
      .join("\n")
      // Replace two double quotes (added by pgAdmin)
      .replace(/""/gm, '"')

    return this.parseJson(useSource)
  }

  // Stream parse JSON as it can contain duplicate keys (workers)
  public parseJson(source: string) {
    let root = JSON.parse(source)
    if (Array.isArray(root)) {
      root = root[0]
    }
    return root
  }

  public splitIntoLines(text: string): string[] {
    // Splits source into lines, while fixing (well, trying to fix)
    // cases where input has been force-wrapped to some length.
    const out: string[] = []
    const lines = text.split(/\r?\n/)
    const countChar = (str: string, ch: RegExp) => (str.match(ch) || []).length
    const closingFirst = (str: string) => {
      const closingParIndex = str.indexOf(")")
      const openingParIndex = str.indexOf("(")
      return closingParIndex != -1 && closingParIndex < openingParIndex
    }

    const sameIndent = (line1: string, line2: string) => {
      return line1.search(/\S/) == line2.search(/\S/)
    }

    _.each(lines, (line: string) => {
      if (countChar(line, /\)/g) > countChar(line, /\(/g)) {
        // if there more closing parenthesis this means that it's the
        // continuation of a previous line
        out[out.length - 1] += line
      } else if (
        line.match(
          /^(?:Total\s+runtime|Planning\s+time|Execution\s+time|Time|Filter|Output|JIT)/i
        )
      ) {
        out.push(line)
      } else if (
        line.match(/^\S/) || // doesn't start with a blank space (allowed only for the first node)
        line.match(/^\s*\(/) || // first non-blank character is an opening parenthesis
        closingFirst(line) // closing parenthesis before opening one
      ) {
        if (0 < out.length) {
          out[out.length - 1] += line
        } else {
          out.push(line)
        }
      } else if (
        0 < out.length &&
        out[out.length - 1].match(/^\s*Output/i) &&
        !sameIndent(out[out.length - 1], line) &&
        !line.match(/^\s*->/i)
      ) {
        // If previous line was Output and current line is not same indent
        // (which would mean a new information line)
        out[out.length - 1] += line
      } else {
        out.push(line)
      }
    })
    return out
  }

  public fromText(text: string) {
    const lines = this.splitIntoLines(text)

    const root: IPlanContent = {} as IPlanContent
    type ElementAtDepth = [number, NodeElement | JitElement]
    // Array to keep reference to previous nodes with there depth
    const elementsAtDepth: ElementAtDepth[] = []

    const indentationRegex = /^\s*/
    const emptyLineRegex = /^s*$/
    const headerRegex = /^\\s*(QUERY|---|#).*$/

    const prefixPattern = "^(\\s*->\\s*|\\s*)"
    const partialPattern = "(Finalize|Simple|Partial)*"
    const typePattern = "([^\\r\\n\\t\\f\\v\\:\\(]*?)"
    // tslint:disable-next-line:max-line-length
    const estimationPattern =
      "\\(cost=(\\d+\\.\\d+)\\.\\.(\\d+\\.\\d+)\\s+rows=(\\d+)\\s+width=(\\d+)\\)"
    const nonCapturingGroupOpen = "(?:"
    const nonCapturingGroupClose = ")"
    const openParenthesisPattern = "\\("
    const closeParenthesisPattern = "\\)"
    // tslint:disable-next-line:max-line-length
    const actualPattern =
      "(?:actual(?:\\stime=(\\d+\\.\\d+)\\.\\.(\\d+\\.\\d+))?\\srows=(\\d+(?:\\.\\d+)?)\\sloops=(\\d+)|(never\\s+executed))"
    const optionalGroup = "?"

    // tslint:disable-next-line:max-line-length
    const subRegex =
      /^(\s*)((?:Sub|Init)Plan)\s*(?:\d+\s*)?\s*(?:\(returns.*\)\s*)?$/gm

    const cteRegex = /^(\s*)CTE\s+(\S+)\s*$/g

    enum TriggerMatch {
      Name = 2,
      Time,
      Calls,
    }
    const triggerRegex =
      /^(\s*)Trigger\s+(.*):\s+time=(\d+\.\d+)\s+calls=(\d+)\s*$/g

    enum WorkerMatch {
      Number = 2,
      ActualTimeFirst,
      ActualTimeLast,
      ActualRows,
      ActualLoops,
      NeverExecuted,
      Extra,
    }
    const workerRegex = new RegExp(
      "^(\\s*)Worker\\s+(\\d+):\\s+" +
        nonCapturingGroupOpen +
        actualPattern +
        nonCapturingGroupClose +
        optionalGroup +
        "(.*)" +
        "\\s*$"
    )

    const jitRegex = /^(\s*)JIT:\s*$/
    const extraRegex = /^(\s*)(\S.*\S)\s*$/

    enum NodeMatch {
      Prefix = 1,
      PartialMode,
      Type,
      EstimatedStartupCost1,
      EstimatedTotalCost1,
      EstimatedRows,
      EstimatedRowWidth,
      ActualTimeFirst1,
      ActualTimeLast1,
      ActualRows1,
      ActualLoops1,
      NeverExecuted,
      EstimatedStartupCost2,
      EstimatedTotalCost2,
      EstimatedRows2,
      EstimatedRowWidth2,
      ActualTimeFirst2,
      ActualTimeLast2,
      ActualRows2,
      ActualLoops2,
    }
    const nodeRegex = new RegExp(
      prefixPattern +
        partialPattern +
        "\\s*" +
        typePattern +
        "\\s*" +
        nonCapturingGroupOpen +
        (nonCapturingGroupOpen +
          estimationPattern +
          "\\s+" +
          openParenthesisPattern +
          actualPattern +
          closeParenthesisPattern +
          nonCapturingGroupClose) +
        "|" +
        nonCapturingGroupOpen +
        estimationPattern +
        nonCapturingGroupClose +
        "|" +
        nonCapturingGroupOpen +
        openParenthesisPattern +
        actualPattern +
        closeParenthesisPattern +
        nonCapturingGroupClose +
        nonCapturingGroupClose +
        "\\s*$",
      "m"
    )

    _.each(lines, (line: string) => {
      // Remove any trailing "
      line = line.replace(/"\s*$/, "")
      // Remove any begining "
      line = line.replace(/^\s*"/, "")
      // Replace tabs with 4 spaces
      line = line.replace(/\t/gm, "    ")

      const match = line.match(indentationRegex)
      const depth = match ? match[0].length : 0
      // remove indentation
      line = line.replace(indentationRegex, "")

      const emptyLineMatches = emptyLineRegex.exec(line)
      const headerMatches = headerRegex.exec(line)
      const nodeMatches = nodeRegex.exec(line)
      const subMatches = subRegex.exec(line)

      const cteMatches = cteRegex.exec(line)
      const triggerMatches = triggerRegex.exec(line)
      const workerMatches = workerRegex.exec(line)
      const jitMatches = jitRegex.exec(line)

      const extraMatches = extraRegex.exec(line)

      if (emptyLineMatches || headerMatches) {
        return
      } else if (nodeMatches && !cteMatches && !subMatches) {
        //const prefix = nodeMatches[NodeMatch.Prefix]
        const neverExecuted = nodeMatches[NodeMatch.NeverExecuted]
        const newNode: Node = new Node(nodeMatches[NodeMatch.Type])
        if (
          (nodeMatches[NodeMatch.EstimatedStartupCost1] &&
            nodeMatches[NodeMatch.EstimatedTotalCost1]) ||
          (nodeMatches[NodeMatch.EstimatedStartupCost2] &&
            nodeMatches[NodeMatch.EstimatedTotalCost2])
        ) {
          newNode[NodeProp.STARTUP_COST] = parseFloat(
            nodeMatches[NodeMatch.EstimatedStartupCost1] ||
              nodeMatches[NodeMatch.EstimatedStartupCost2]
          )
          newNode[NodeProp.TOTAL_COST] = parseFloat(
            nodeMatches[NodeMatch.EstimatedTotalCost1] ||
              nodeMatches[NodeMatch.EstimatedTotalCost2]
          )
          newNode[NodeProp.PLAN_ROWS] = parseInt(
            nodeMatches[NodeMatch.EstimatedRows] ||
              nodeMatches[NodeMatch.EstimatedRows2],
            0
          )
          newNode[NodeProp.PLAN_WIDTH] = parseInt(
            nodeMatches[NodeMatch.EstimatedRowWidth] ||
              nodeMatches[NodeMatch.EstimatedRowWidth2],
            0
          )
        }
        if (
          (nodeMatches[NodeMatch.ActualTimeFirst1] &&
            nodeMatches[NodeMatch.ActualTimeLast1]) ||
          (nodeMatches[NodeMatch.ActualTimeFirst2] &&
            nodeMatches[NodeMatch.ActualTimeLast2])
        ) {
          newNode[NodeProp.ACTUAL_STARTUP_TIME] = parseFloat(
            nodeMatches[NodeMatch.ActualTimeFirst1] ||
              nodeMatches[NodeMatch.ActualTimeFirst2]
          )
          newNode[NodeProp.ACTUAL_TOTAL_TIME] = parseFloat(
            nodeMatches[NodeMatch.ActualTimeLast1] ||
              nodeMatches[NodeMatch.ActualTimeLast2]
          )
        }

        if (
          (nodeMatches[NodeMatch.ActualRows1] &&
            nodeMatches[NodeMatch.ActualLoops1]) ||
          (nodeMatches[NodeMatch.ActualRows2] &&
            nodeMatches[NodeMatch.ActualLoops2])
        ) {
          const actual_rows =
            nodeMatches[NodeMatch.ActualRows1] ||
            nodeMatches[NodeMatch.ActualRows2]
          if (actual_rows.indexOf(".") != -1) {
            newNode[NodeProp.ACTUAL_ROWS_FRACTIONAL] = true
          }
          newNode[NodeProp.ACTUAL_ROWS] = parseFloat(actual_rows)
          newNode[NodeProp.ACTUAL_LOOPS] = parseInt(
            nodeMatches[NodeMatch.ActualLoops1] ||
              nodeMatches[NodeMatch.ActualLoops2],
            0
          )
        }

        if (nodeMatches[NodeMatch.PartialMode]) {
          newNode[NodeProp.PARTIAL_MODE] = nodeMatches[NodeMatch.PartialMode]
        }

        if (neverExecuted) {
          newNode[NodeProp.ACTUAL_LOOPS] = 0
          newNode[NodeProp.ACTUAL_ROWS] = 0
          newNode[NodeProp.ACTUAL_TOTAL_TIME] = 0
        }
        const element = {
          node: newNode,
          subelementType: "subnode",
        }

        if (0 === elementsAtDepth.length) {
          elementsAtDepth.push([depth, element])
          root.Plan = newNode
          return
        }

        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => {
          return e[0] >= depth
        })

        // ! is for non-null assertion
        // Prevents the "Object is possibly 'undefined'" linting error
        const previousElement = _.last(elementsAtDepth)?.[1] as NodeElement

        if (!previousElement) {
          return
        }

        elementsAtDepth.push([depth, element])

        if (!previousElement.node[NodeProp.PLANS]) {
          previousElement.node[NodeProp.PLANS] = []
        }
        if (previousElement.subelementType === "initplan") {
          newNode[NodeProp.PARENT_RELATIONSHIP] = "InitPlan"
          newNode[NodeProp.SUBPLAN_NAME] = previousElement.name as string
        } else if (previousElement.subelementType === "subplan") {
          newNode[NodeProp.PARENT_RELATIONSHIP] = "SubPlan"
          newNode[NodeProp.SUBPLAN_NAME] = previousElement.name as string
        }
        previousElement.node.Plans?.push(newNode)
      } else if (subMatches) {
        //const prefix = subMatches[1]
        const type = subMatches[2]
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= depth)
        const previousElement = _.last(elementsAtDepth)?.[1]
        const element = {
          node: previousElement?.node as Node,
          subelementType: type.toLowerCase(),
          name: subMatches[0],
        }
        elementsAtDepth.push([depth, element])
      } else if (cteMatches) {
        //const prefix = cteMatches[1]
        const cteName = cteMatches[2]
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= depth)
        const previousElement = _.last(elementsAtDepth)?.[1]
        const element = {
          node: previousElement?.node as Node,
          subelementType: "initplan",
          name: "CTE " + cteName,
        }
        elementsAtDepth.push([depth, element])
      } else if (workerMatches) {
        //const prefix = workerMatches[1]
        const workerNumber = parseInt(workerMatches[WorkerMatch.Number], 0)
        const previousElement = _.last(elementsAtDepth)?.[1] as NodeElement
        if (!previousElement) {
          return
        }
        if (!previousElement.node[NodeProp.WORKERS]) {
          previousElement.node[NodeProp.WORKERS] = [] as Worker[]
        }
        let worker = this.getWorker(previousElement.node, workerNumber)
        if (!worker) {
          worker = new Worker(workerNumber)
          previousElement.node[NodeProp.WORKERS]?.push(worker)
        }
        if (
          workerMatches[WorkerMatch.ActualTimeFirst] &&
          workerMatches[WorkerMatch.ActualTimeLast]
        ) {
          worker[NodeProp.ACTUAL_STARTUP_TIME] = parseFloat(
            workerMatches[WorkerMatch.ActualTimeFirst]
          )
          worker[NodeProp.ACTUAL_TOTAL_TIME] = parseFloat(
            workerMatches[WorkerMatch.ActualTimeLast]
          )
          worker[NodeProp.ACTUAL_ROWS] = parseInt(
            workerMatches[WorkerMatch.ActualRows],
            0
          )
          worker[NodeProp.ACTUAL_LOOPS] = parseInt(
            workerMatches[WorkerMatch.ActualLoops],
            0
          )
        }

        if (this.parseSort(workerMatches[WorkerMatch.Extra], worker)) {
          return
        }

        // extra info
        const info = workerMatches[WorkerMatch.Extra]
          .split(/: (.+)/)
          .filter((x) => x)
        if (workerMatches[WorkerMatch.Extra]) {
          if (!info[1]) {
            return
          }
          const property = _.startCase(info[0])
          worker[property] = info[1]
        }
      } else if (triggerMatches) {
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= depth)
        root.Triggers = root.Triggers || []
        root.Triggers.push({
          "Trigger Name": triggerMatches[TriggerMatch.Name],
          Time: this.parseTime(triggerMatches[TriggerMatch.Time]),
          Calls: triggerMatches[TriggerMatch.Calls],
        })
      } else if (jitMatches) {
        let element
        if (elementsAtDepth.length === 0) {
          root.JIT = {} as JIT
          element = {
            node: root.JIT,
          }
          elementsAtDepth.push([1, element])
        } else {
          const lastElement = _.last(elementsAtDepth)?.[1] as NodeElement
          if (!lastElement) {
            return
          }
          if (_.last(lastElement.node?.[NodeProp.WORKERS])) {
            const worker: Worker = _.last(
              lastElement.node?.[NodeProp.WORKERS]
            ) as Worker
            worker.JIT = {} as JIT
            element = {
              node: worker.JIT,
            }
            elementsAtDepth.push([depth, element])
          }
        }
      } else if (extraMatches) {
        //const prefix = extraMatches[1]

        // Remove elements from elementsAtDepth for deeper levels
        // Depth == 1 is a special case here. Global info (for example
        // execution|planning time) have a depth of 1 but shouldn't be removed
        // in case first node was at depth 0.
        _.remove(elementsAtDepth, (e) => e[0] >= depth || depth == 1)

        let element
        if (elementsAtDepth.length === 0) {
          element = root
        } else {
          element = _.last(elementsAtDepth)?.[1].node as Node
        }

        // if no node have been found yet and a 'Query Text' has been found
        // there the line is the part of the query
        if (!element.Plan && element["Query Text"]) {
          element["Query Text"] += "\n" + line
          return
        }

        const info = extraMatches[2].split(/: (.+)/).filter((x) => x)
        if (!info[1]) {
          return
        }

        if (!element) {
          return
        }

        if (this.parseSort(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseBuffers(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseWAL(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseIOTimings(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseOptions(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseTiming(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseSettings(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseSortGroups(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseSortKey(extraMatches[2], element as Node)) {
          return
        }

        // remove the " ms" unit in case of time
        let value: string | number = info[1].replace(/(\s*ms)$/, "")
        // try to convert to number
        if (parseFloat(value)) {
          value = parseFloat(value)
        }

        let property = info[0]
        if (
          property.indexOf(" runtime") !== -1 ||
          property.indexOf(" time") !== -1
        ) {
          property = _.startCase(property)
        }
        element[property] = value
      }
    })
    if (root == null || !root.Plan) {
      throw new Error("Unable to parse plan")
    }
    return root
  }

  private parseSortKey(text: string, el: Node): boolean {
    const sortRegex = /^\s*((?:Sort|Presorted) Key):\s+(.*)/g
    const sortMatches = sortRegex.exec(text)
    if (sortMatches) {
      el[sortMatches[1]] = _.map(splitBalanced(sortMatches[2], ","), _.trim)
      return true
    }
    return false
  }

  private parseSort(text: string, el: Node | Worker): boolean {
    enum SortMatch {
      Method = 2,
      SpaceType,
      SpaceUsed,
    }
    const sortRegex =
      /^(\s*)Sort Method:\s+(.*)\s+(Memory|Disk):\s+(?:(\S*)kB)\s*$/g
    const sortMatches = sortRegex.exec(text)
    if (sortMatches) {
      el[NodeProp.SORT_METHOD] = sortMatches[SortMatch.Method].trim()
      el[NodeProp.SORT_SPACE_USED] = sortMatches[SortMatch.SpaceUsed]
      el[NodeProp.SORT_SPACE_TYPE] = sortMatches[SortMatch.SpaceType]
      return true
    }
    return false
  }

  private parseBuffers(text: string, el: Node): boolean {
    /*
     * Groups
     */
    const buffersRegex = /Buffers:\s+(.*)\s*$/g
    const buffersMatches = buffersRegex.exec(text)

    /*
     * Groups:
     * 1: type
     * 2: info
     */
    if (buffersMatches) {
      _.each(buffersMatches[1].split(/,\s+/), (infos) => {
        const bufferInfoRegex = /(shared|temp|local)\s+(.*)$/g
        const m = bufferInfoRegex.exec(infos)
        if (m) {
          const type = m[1]
          // Initiate with default value
          _.each(["hit", "read", "written", "dirtied"], (method) => {
            el[_.map([type, method, "blocks"], _.capitalize).join(" ")] = 0
          })
          _.each(m[2].split(/\s+/), (buffer) => {
            this.parseBuffer(buffer, type, el)
          })
        }
      })
      return true
    }
    return false
  }

  private parseBuffer(text: string, type: string, el: Node): void {
    const s = text.split(/=/)
    const method = s[0]
    const value = parseInt(s[1], 0)
    el[_.map([type, method, "blocks"], _.capitalize).join(" ")] = value
  }

  private getWorker(node: Node, workerNumber: number): Worker | undefined {
    return _.find(node[NodeProp.WORKERS], (worker) => {
      return worker[WorkerProp.WORKER_NUMBER] === workerNumber
    })
  }

  private parseWAL(text: string, el: Node): boolean {
    const WALRegex = /WAL:\s+(.*)\s*$/g
    const WALMatches = WALRegex.exec(text)

    if (WALMatches) {
      // Initiate with default value
      _.each(["Records", "Bytes", "FPI"], (type) => {
        el["WAL " + type] = 0
      })
      _.each(WALMatches[1].split(/\s+/), (t) => {
        const s = t.split(/=/)
        const type = s[0]
        const value = parseInt(s[1], 0)
        let typeCaps
        switch (type) {
          case "fpi":
            typeCaps = "FPI"
            break
          default:
            typeCaps = _.capitalize(type)
        }
        el["WAL " + typeCaps] = value
      })
      return true
    }

    return false
  }

  private parseIOTimings(text: string, el: Node): boolean {
    /*
     * Groups
     */
    const iotimingsRegex = /I\/O Timings:\s+(.*)\s*$/g
    const iotimingsMatches = iotimingsRegex.exec(text)

    /*
     * Groups:
     * 1: type
     * 2: info
     */
    if (iotimingsMatches) {
      // Initiate with default value
      el[NodeProp.IO_READ_TIME] = 0
      el[NodeProp.IO_WRITE_TIME] = 0

      _.each(iotimingsMatches[1].split(/\s+/), (timing) => {
        const s = timing.split(/=/)
        const method = s[0]
        const value = parseFloat(s[1])
        const prop = ("IO_" +
          _.upperCase(method) +
          "_TIME") as keyof typeof NodeProp
        const nodeProp = NodeProp[prop] as unknown as keyof typeof Node
        el[nodeProp] = value
      })
      return true
    }
    return false
  }

  private parseOptions(text: string, el: Node): boolean {
    // Parses an options block in JIT block
    // eg. Options: Inlining false, Optimization false, Expressions true, Deforming true

    /*
     * Groups
     */
    const optionsRegex = /^(\s*)Options:\s+(.*)$/g
    const optionsMatches = optionsRegex.exec(text)

    if (optionsMatches) {
      el.Options = {}
      const options = optionsMatches[2].split(/\s*,\s*/)
      let matches
      _.each(options, (option) => {
        const reg = /^(\S*)\s+(.*)$/g
        matches = reg.exec(option)
        if (matches && el.Options) {
          el.Options[matches[1]] = JSON.parse(matches[2])
        }
      })
      return true
    }
    return false
  }

  private parseTiming(text: string, el: Node): boolean {
    // Parses a timing block in JIT block
    // eg. Timing: Generation 0.340 ms, Inlining 0.000 ms, Optimization 0.168 ms, Emission 1.907 ms, Total 2.414 ms

    /*
     * Groups
     */
    const timingRegex = /^(\s*)Timing:\s+(.*)$/g
    const timingMatches = timingRegex.exec(text)

    if (timingMatches) {
      el.Timing = {}
      const timings = timingMatches[2].split(/\s*,\s*/)
      let matches
      _.each(timings, (option) => {
        const reg = /^(\S*)\s+(.*)$/g
        matches = reg.exec(option)
        if (matches && el.Timing) {
          el.Timing[matches[1]] = this.parseTime(matches[2])
        }
      })
      return true
    }
    return false
  }

  private parseTime(text: string): number {
    return parseFloat(text.replace(/(\s*ms)$/, ""))
  }

  private parseSettings(text: string, el: Node): boolean {
    // Parses a settings block
    // eg. Timing: Generation 0.340 ms, Inlining 0.000 ms, Optimization 0.168 ms, Emission 1.907 ms, Total 2.414 ms

    const settingsRegex = /^(\s*)Settings:\s*(.*)$/g
    const settingsMatches = settingsRegex.exec(text)

    if (settingsMatches) {
      el.Settings = {}
      const settings = splitBalanced(settingsMatches[2], ",")
      let matches
      _.each(settings, (option) => {
        const reg = /^(\S*)\s+=\s+(.*)$/g
        matches = reg.exec(_.trim(option))
        if (matches && el.Settings) {
          el.Settings[matches[1]] = matches[2].replace(/'/g, "")
        }
      })
      return true
    }
    return false
  }

  private parseSortGroups(text: string, el: Node): boolean {
    // Parses a Full-sort Groups block
    // eg. Full-sort Groups: 312500  Sort Method: quicksort  Average Memory: 26kB  Peak Memory: 26kB
    const sortGroupsRegex =
      /^\s*(Full-sort|Pre-sorted) Groups:\s+([0-9]*)\s+Sort Method[s]*:\s+(.*)\s+Average Memory:\s+(\S*)kB\s+Peak Memory:\s+(\S*)kB.*$/g
    const matches = sortGroupsRegex.exec(text)

    if (matches) {
      const groups: SortGroups = {
        [SortGroupsProp.GROUP_COUNT]: parseInt(matches[2], 0),
        [SortGroupsProp.SORT_METHODS_USED]: _.map(
          matches[3].split(","),
          _.trim
        ),
        [SortGroupsProp.SORT_SPACE_MEMORY]: {
          [SortSpaceMemoryProp.AVERAGE_SORT_SPACE_USED]: parseInt(
            matches[4],
            0
          ),
          [SortSpaceMemoryProp.PEAK_SORT_SPACE_USED]: parseInt(matches[5], 0),
        },
      }

      if (matches[1] === "Full-sort") {
        el[NodeProp.FULL_SORT_GROUPS] = groups
      } else if (matches[1] === "Pre-sorted") {
        el[NodeProp.PRE_SORTED_GROUPS] = groups
      } else {
        throw new Error("Unsupported sort groups method")
      }
      return true
    }
    return false
  }

  private calculateExclusives(node: Node) {
    // Caculate inclusive value for the current node for the given property
    const properties: Array<keyof typeof NodeProp> = [
      "SHARED_HIT_BLOCKS",
      "SHARED_READ_BLOCKS",
      "SHARED_DIRTIED_BLOCKS",
      "SHARED_WRITTEN_BLOCKS",
      "TEMP_READ_BLOCKS",
      "TEMP_WRITTEN_BLOCKS",
      "LOCAL_HIT_BLOCKS",
      "LOCAL_READ_BLOCKS",
      "LOCAL_DIRTIED_BLOCKS",
      "LOCAL_WRITTEN_BLOCKS",
      "IO_READ_TIME",
      "IO_WRITE_TIME",
    ]
    _.each(properties, (property) => {
      const sum = _.sumBy(node[NodeProp.PLANS], (child: Node) => {
        return (child[NodeProp[property]] as number) || 0
      })
      const exclusivePropertyString = ("EXCLUSIVE_" +
        property) as keyof typeof NodeProp
      const nodeProp = NodeProp[
        exclusivePropertyString
      ] as unknown as keyof typeof Node
      node[nodeProp] = (node[NodeProp[property]] as number) - sum
    })
  }

  private calculateIoTimingsAverage(node: Node) {
    const ioReadTime =
      (node[NodeProp["EXCLUSIVE_IO_READ_TIME"]] as number) || 0
    if (ioReadTime) {
      const sharedReadBlocks =
        (node[NodeProp["EXCLUSIVE_SHARED_READ_BLOCKS"]] as number) || 0
      const localReadBlocks =
        (node[NodeProp["EXCLUSIVE_LOCAL_READ_BLOCKS"]] as number) || 0
      node[NodeProp["AVERAGE_IO_READ_SPEED"]] =
        (sharedReadBlocks + localReadBlocks) / (ioReadTime / 1000)
    }

    const ioWriteTime =
      (node[NodeProp["EXCLUSIVE_IO_WRITE_TIME"]] as number) || 0
    if (ioWriteTime) {
      const sharedWriteBlocks =
        (node[NodeProp["EXCLUSIVE_SHARED_WRITTEN_BLOCKS"]] as number) || 0
      const localWriteBlocks =
        (node[NodeProp["EXCLUSIVE_LOCAL_WRITTEN_BLOCKS"]] as number) || 0
      node[NodeProp["AVERAGE_IO_WRITE_SPEED"]] =
        (sharedWriteBlocks + localWriteBlocks) / (ioWriteTime / 1000)
    }
  }

  private findOutputProperty(node: Node): boolean {
    // resursively look for an "Output" property
    const children = node.Plans
    if (!children) {
      return false
    }
    return _.some(children, (child) => {
      return _.has(child, NodeProp.OUTPUT) || this.findOutputProperty(child)
    })
  }

  private convertNodeType(node: Node): void {
    // Convert some node type (possibly from JSON source) to match the TEXT format
    if (node[NodeProp.NODE_TYPE] == "Aggregate" && node[NodeProp.STRATEGY]) {
      let prefix = ""
      switch (node[NodeProp.STRATEGY]) {
        case "Sorted":
          prefix = "Group"
          break
        case "Hashed":
          prefix = "Hash"
          break
        case "Plain":
          prefix = ""
          break
        default:
          console.error("Unsupported Aggregate Strategy")
      }
      node[NodeProp.NODE_TYPE] = prefix + "Aggregate"
    }

    if (node[NodeProp.NODE_TYPE] == "ModifyTable") {
      node[NodeProp.NODE_TYPE] = node[NodeProp.OPERATION] as string
    }
  }
}
