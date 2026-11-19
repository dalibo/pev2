import { describe, expect, test } from "vitest"

import type { IPlanContent, Node } from "@/interfaces"
import { PlanService } from "@/services/plan-service"

describe("PlanService", () => {
  const planService = new PlanService()

  function parse(source: string): Node {
    const plan = planService.fromSource(source) as IPlanContent
    return plan.Plan
  }

  test("keeps closing quotes on group key, sort key and output", () => {
    const root = parse(`
Sort  (cost=1.00..2.00 rows=1 width=4)
  Output: t2.id, t2."Weird Name"
  Sort Key: x, "Col"
  ->  HashAggregate  (cost=1069.00..1694.00 rows=16667 width=14)
        Group Key: "Weird Name"
        ->  Seq Scan on "My Table"  (cost=0.00..819.00 rows=50000 width=6)
`)
    expect(root["Output"]).toEqual('t2.id, t2."Weird Name"')
    expect(root["Sort Key"]).toEqual(["x", '"Col"'])

    const aggregate = root["Plans"][0]
    expect(aggregate["Node Type"]).toEqual("Aggregate")
    expect(aggregate["Group Key"]).toEqual(['"Weird Name"'])

    const scan = aggregate["Plans"][0]
    expect(scan["Node Type"]).toEqual("Seq Scan")
    expect(scan["Relation Name"]).toEqual('"My Table"')
    expect(scan["Alias"]).toEqual('"My Table"')
  })

  test("parses a quoted relation alias that contains spaces", () => {
    const scan = parse(
      'Seq Scan on "My Table" "m t"  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(scan["Node Type"]).toEqual("Seq Scan")
    expect(scan["Relation Name"]).toEqual('"My Table"')
    expect(scan["Alias"]).toEqual('"m t"')
  })

  test("parses a schema-qualified quoted relation", () => {
    const scan = parse(
      'Seq Scan on public."My Table"  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(scan["Node Type"]).toEqual("Seq Scan")
    expect(scan["Relation Name"]).toEqual('public."My Table"')
    expect(scan["Alias"]).toEqual('public."My Table"')
  })

  test("parses a quoted index name", () => {
    const scan = parse(
      'Index Scan using "my idx" on t1  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(scan["Node Type"]).toEqual("Index Scan")
    expect(scan["Index Name"]).toEqual('"my idx"')
    expect(scan["Relation Name"]).toEqual("t1")
    expect(scan["Scan Direction"]).toEqual("Forward")
    expect(scan["Alias"]).toBeUndefined()
  })

  test("parses a quoted index, relation and alias together", () => {
    const scan = parse(
      'Index Scan Backward using "my idx" on public."My Table" "m t"  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(scan["Node Type"]).toEqual("Index Scan")
    expect(scan["Scan Direction"]).toEqual("Backward")
    expect(scan["Index Name"]).toEqual('"my idx"')
    expect(scan["Relation Name"]).toEqual('public."My Table"')
    expect(scan["Alias"]).toEqual('"m t"')
  })

  test("parses Sample Scan, Values Scan and Table Function Scan", () => {
    const sample = parse("Sample Scan on t1  (cost=0.00..10.00 rows=1 width=4)")
    expect(sample["Node Type"]).toEqual("Sample Scan")
    expect(sample["Relation Name"]).toEqual("t1")
    expect(sample["Alias"]).toEqual("t1")

    const values = parse(
      'Values Scan on "*VALUES*"  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(values["Node Type"]).toEqual("Values Scan")
    expect(values["Relation Name"]).toEqual('"*VALUES*"')
    expect(values["Alias"]).toEqual('"*VALUES*"')

    const tableFunction = parse(
      'Table Function Scan on "json_table"  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(tableFunction["Node Type"]).toEqual("Table Function Scan")
    expect(tableFunction["Relation Name"]).toEqual('"json_table"')
    expect(tableFunction["Alias"]).toEqual('"json_table"')
  })

  test("parses quoted bitmap, CTE and function names", () => {
    const bitmap = parse(
      'Bitmap Index Scan on "my idx"  (cost=0.00..10.00 rows=1 width=0)',
    )
    expect(bitmap["Node Type"]).toEqual("Bitmap Index Scan")
    expect(bitmap["Index Name"]).toEqual('"my idx"')

    const cte = parse(
      'CTE Scan on "my cte" "c t"  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(cte["Node Type"]).toEqual("CTE Scan")
    expect(cte["CTE Name"]).toEqual('"my cte"')
    expect(cte["Alias"]).toEqual('"c t"')

    const fn = parse(
      'Function Scan on "my func" "f t"  (cost=0.00..10.00 rows=1 width=4)',
    )
    expect(fn["Node Type"]).toEqual("Function Scan")
    expect(fn["Function Name"]).toEqual('"my func"')
    expect(fn["Alias"]).toEqual('"f t"')
  })

  test("keeps identifier quotes when every line is wrapped in quotes", () => {
    const root = parse(`
"HashAggregate  (cost=1069.00..1694.00 rows=16667 width=14)"
"  Group Key: "Weird Name""
"  ->  Seq Scan on "My Table" "m t"  (cost=0.00..819.00 rows=50000 width=6)"
`)
    expect(root["Node Type"]).toEqual("Aggregate")
    expect(root["Group Key"]).toEqual(['"Weird Name"'])
    const scan = root["Plans"][0]
    expect(scan["Node Type"]).toEqual("Seq Scan")
    expect(scan["Relation Name"]).toEqual('"My Table"')
    expect(scan["Alias"]).toEqual('"m t"')
  })

  test("keeps identifier quotes when every line is wrapped in single quotes", () => {
    const root = parse(`
'HashAggregate  (cost=1069.00..1694.00 rows=16667 width=14)'
'  Group Key: "Weird Name"'
'  ->  Seq Scan on "My Table"  (cost=0.00..819.00 rows=50000 width=6)'
`)
    expect(root["Group Key"]).toEqual(['"Weird Name"'])
    const scan = root["Plans"][0]
    expect(scan["Node Type"]).toEqual("Seq Scan")
    expect(scan["Relation Name"]).toEqual('"My Table"')
  })

  test("strips a dangling trailing quote without eating an identifier quote", () => {
    const root = parse(`
HashAggregate  (cost=1069.00..1694.00 rows=16667 width=14)"
  Group Key: "Weird Name""
  ->  Seq Scan on "My Table"  (cost=0.00..819.00 rows=50000 width=6)"
`)
    expect(root["Group Key"]).toEqual(['"Weird Name"'])
    const scan = root["Plans"][0]
    expect(scan["Node Type"]).toEqual("Seq Scan")
    expect(scan["Relation Name"]).toEqual('"My Table"')
    expect(scan["Alias"]).toEqual('"My Table"')
  })
})
