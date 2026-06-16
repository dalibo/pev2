import _ from "lodash"
import { createApp } from "vue"
import { EstimateDirection, NodeProp } from "@/enums"
import SortGroup from "@/components/SortGroup.vue"
import JitDetails from "@/components/JitDetails.vue"
import hljs from "highlight.js/lib/core"
import pgsql from "highlight.js/lib/languages/pgsql"
hljs.registerLanguage("pgsql", pgsql)

import json from "highlight.js/lib/languages/json"
hljs.registerLanguage("json", json)

export function formatDuration(value: unknown): string {
  if (value === undefined) {
    return "-"
  }
  if (typeof value !== "number") {
    throw new Error(`Expected number, got ${typeof value}`);
  }
  if (value < 0) {
    console.error(`
      Duration is negative. This is probably a bug.
      Please report it at https://github.com/dalibo/pev2.
    `)
  }
  const result: string[] = []
  let denominator: number = 1000 * 60 * 60 * 24
  const days = Math.floor(value / denominator)
  if (days) {
    result.push(days + "d")
  }
  let remainder = value % denominator
  denominator /= 24
  const hours = Math.floor(remainder / denominator)
  if (hours) {
    result.push(hours + "h")
  }
  remainder = remainder % denominator
  denominator /= 60
  const minutes = Math.floor(remainder / denominator)
  if (minutes) {
    result.push(minutes + "m")
  }
  remainder = remainder % denominator
  denominator /= 60
  const seconds = Math.floor(remainder / denominator)
  if (seconds) {
    result.push(seconds + "s")
  }
  remainder = remainder % denominator
  const milliseconds = parseFloat(remainder.toPrecision(3))
  if (milliseconds) {
    result.push(milliseconds.toLocaleString() + "ms")
  }

  if (result.length === 0) {
    return "0ms"
  }

  return result.slice(0, 2).join(" ")
}

export function formatCost(value: unknown): string {
  if (value === undefined) {
    return "N/A"
  }
  return (value as number).toLocaleString(undefined, { minimumFractionDigits: 2 })
}

export function formatRows(value: unknown): string {
  if (value === undefined) {
    return "N/A"
  }
  return (value as number).toLocaleString()
}

export function formatLoops(value: unknown): string {
  if (value === undefined) {
    return "N/A"
  }
  return (value as number).toLocaleString()
}

export function formatFactor(value: unknown): string {
  if (value === undefined) {
    return "N/A"
  }
  const f: string = parseFloat((value as number).toPrecision(2)).toLocaleString()
  return `${f}&nbsp;&times;`
}

export function formatKilobytes(value: unknown): string {
  return formatBytes_((value as number) * 1024)
}

function formatBytes(value: unknown): string {
  return formatBytes_(value as number)
}

export function formatBytes_(value: number) {
  if (value === 0) {
    return "0 kB"
  }
  const k = 1024
  const units = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(value) / Math.log(k))
  const raw = value / Math.pow(k, i)
  const valueString = raw % 1 === 0
    ? raw.toLocaleString()
    : parseFloat(raw.toPrecision(2)).toLocaleString()
  return `${valueString} ${units[i]}`
}

export function formatBlocksAsBytes(value: number): string {
  return value ? formatBytes_(value * 8 * 1024) : ""
}

export function formatBlocks(value: unknown, asHtml = false): string {
  asHtml = !!asHtml
  if (!value) {
    return ""
  }
  let r = value.toLocaleString()
  if (asHtml) {
    r += `<br><small>${formatBlocksAsBytes(value as number)}</small>`
  }
  return r
}

export function formatBlocksHtml(value: unknown): string {
  return formatBlocks(value, true)
}

export function formatPercent(value: number): string {
  if (isNaN(value)) {
    return "-"
  }
  return _.round(value * 100) + "%"
}

export function formatList(value: unknown): string {
  if (value == undefined) {
    return ''
  }
  const lines =
    typeof value === "string"
    ? value.split(/\s*,\s*/)
    : value

  if (!Array.isArray(lines)) {
    throw new Error(`Expected string or array of strings, got ${typeof value}`);
  }

  const items = lines.map(line => `<li>${_.escape(line)}</li>`).join("")

  return `<ul class="list-unstyled mb-0">${items}</ul>`
}

function formatSortGroups(value: unknown): string {
  const app = createApp(SortGroup, { sortGroup: value }).mount(
    document.createElement("div"),
  )
  return app.$el.outerHTML
}

export function formatTransferRate(value: unknown): string {
  if (!value) {
    return ""
  }
  return formatBlocksAsBytes(value as number) + "/s"
}

function formatJit(value: unknown): string {
  const app = createApp(JitDetails, { jit: value }).mount(
    document.createElement("div"),
  )
  return app.$el.outerHTML
}

function formatBoolean(value: unknown): string {
  return (value as boolean) ? "yes" : "no"
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function formatEstimateDirection(value: unknown): string {
  switch (value) {
    case EstimateDirection.over:
      return '<i class="fa fa-arrow-up"></i> over'
    case EstimateDirection.under:
      return '<i class="fa fa-arrow-down"></i> under'
    default:
      return "-"
  }
}

type Formatter = (value: unknown) => string;

const nodePropFormatters: Partial<Record<NodeProp, Formatter>> = {
  [NodeProp.ACTUAL_ROWS]: formatRows,
  [NodeProp.ACTUAL_LOOPS]: formatLoops,
  [NodeProp.PLAN_ROWS]: formatRows,
  [NodeProp.PLAN_WIDTH]: formatBytes,
  [NodeProp.ACTUAL_ROWS_REVISED]: formatRows,
  [NodeProp.ACTUAL_ROWS_FRACTIONAL]: formatBoolean,
  [NodeProp.PLAN_ROWS_REVISED]: formatRows,
  [NodeProp.ACTUAL_TOTAL_TIME]: formatDuration,
  [NodeProp.ACTUAL_STARTUP_TIME]: formatDuration,
  [NodeProp.STARTUP_COST]: formatCost,
  [NodeProp.TOTAL_COST]: formatCost,
  [NodeProp.PARALLEL_AWARE]: formatBoolean,
  [NodeProp.WORKERS]: formatJson,
  [NodeProp.SORT_SPACE_USED]: formatKilobytes,
  [NodeProp.ROWS_REMOVED_BY_FILTER]: formatRows,
  [NodeProp.ROWS_REMOVED_BY_JOIN_FILTER]: formatRows,
  [NodeProp.ROWS_REMOVED_BY_FILTER_REVISED]: formatRows,
  [NodeProp.ROWS_REMOVED_BY_JOIN_FILTER_REVISED]: formatRows,
  [NodeProp.ROWS_REMOVED_BY_INDEX_RECHECK]: formatRows,
  [NodeProp.ROWS_REMOVED_BY_INDEX_RECHECK_REVISED]: formatRows,
  [NodeProp.HEAP_FETCHES]: formatRows,
  [NodeProp.OUTPUT]: formatList,
  [NodeProp.SORT_KEY]: formatList,
  [NodeProp.PRESORTED_KEY]: formatList,
  [NodeProp.WAL_RECORDS]: formatRows,
  [NodeProp.WAL_BYTES]: formatBytes,
  [NodeProp.WAL_FPI]: formatRows,

  [NodeProp.EXCLUSIVE_DURATION]: formatDuration,
  [NodeProp.EXCLUSIVE_COST]: formatCost,

  [NodeProp.PLANNER_ESTIMATE_FACTOR]: formatFactor,
  [NodeProp.PLANNER_ESTIMATE_DIRECTION]: formatEstimateDirection,

  [NodeProp.IO_READ_TIME]: formatDuration,
  [NodeProp.IO_WRITE_TIME]: formatDuration,
  [NodeProp.SUM_IO_READ_TIME]: formatDuration,
  [NodeProp.SUM_IO_WRITE_TIME]: formatDuration,
  [NodeProp.AVERAGE_SUM_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.AVERAGE_SUM_IO_WRITE_SPEED]: formatTransferRate,

  [NodeProp.AVERAGE_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.AVERAGE_IO_WRITE_SPEED]: formatTransferRate,
  [NodeProp.SHARED_IO_READ_TIME]: formatDuration,
  [NodeProp.SHARED_IO_WRITE_TIME]: formatDuration,
  [NodeProp.AVERAGE_SHARED_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.AVERAGE_SHARED_IO_WRITE_SPEED]: formatTransferRate,
  [NodeProp.LOCAL_IO_READ_TIME]: formatDuration,
  [NodeProp.LOCAL_IO_WRITE_TIME]: formatDuration,
  [NodeProp.AVERAGE_LOCAL_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.AVERAGE_LOCAL_IO_WRITE_SPEED]: formatTransferRate,
  [NodeProp.TEMP_IO_READ_TIME]: formatDuration,
  [NodeProp.TEMP_IO_WRITE_TIME]: formatDuration,
  [NodeProp.AVERAGE_TEMP_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.AVERAGE_TEMP_IO_WRITE_SPEED]: formatTransferRate,

  [NodeProp.EXCLUSIVE_IO_READ_TIME]: formatDuration,
  [NodeProp.EXCLUSIVE_IO_WRITE_TIME]: formatDuration,
  [NodeProp.EXCLUSIVE_AVERAGE_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.EXCLUSIVE_AVERAGE_IO_WRITE_SPEED]: formatTransferRate,
  [NodeProp.EXCLUSIVE_SHARED_IO_READ_TIME]: formatDuration,
  [NodeProp.EXCLUSIVE_SHARED_IO_WRITE_TIME]: formatDuration,
  [NodeProp.EXCLUSIVE_AVERAGE_SHARED_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.EXCLUSIVE_AVERAGE_SHARED_IO_WRITE_SPEED]: formatTransferRate,
  [NodeProp.EXCLUSIVE_LOCAL_IO_READ_TIME]: formatDuration,
  [NodeProp.EXCLUSIVE_LOCAL_IO_WRITE_TIME]: formatDuration,
  [NodeProp.EXCLUSIVE_AVERAGE_LOCAL_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.EXCLUSIVE_AVERAGE_LOCAL_IO_WRITE_SPEED]: formatTransferRate,
  [NodeProp.EXCLUSIVE_TEMP_IO_READ_TIME]: formatDuration,

  [NodeProp.EXCLUSIVE_TEMP_IO_WRITE_TIME]: formatDuration,
  [NodeProp.EXCLUSIVE_AVERAGE_TEMP_IO_READ_SPEED]: formatTransferRate,
  [NodeProp.EXCLUSIVE_AVERAGE_TEMP_IO_WRITE_SPEED]: formatTransferRate,

  [NodeProp.SHARED_HIT_BLOCKS]: formatBlocksHtml,
  [NodeProp.SHARED_READ_BLOCKS]: formatBlocksHtml,
  [NodeProp.SHARED_DIRTIED_BLOCKS]: formatBlocksHtml,
  [NodeProp.SHARED_WRITTEN_BLOCKS]: formatBlocksHtml,
  [NodeProp.TEMP_READ_BLOCKS]: formatBlocksHtml,
  [NodeProp.TEMP_WRITTEN_BLOCKS]: formatBlocksHtml,
  [NodeProp.LOCAL_HIT_BLOCKS]: formatBlocksHtml,
  [NodeProp.LOCAL_READ_BLOCKS]: formatBlocksHtml,
  [NodeProp.LOCAL_DIRTIED_BLOCKS]: formatBlocksHtml,
  [NodeProp.LOCAL_WRITTEN_BLOCKS]: formatBlocksHtml,

  [NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]: formatBlocksHtml,
  [NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]: formatBlocksHtml,

  [NodeProp.FULL_SORT_GROUPS]: formatSortGroups,
  [NodeProp.PRE_SORTED_GROUPS]: formatSortGroups,

  [NodeProp.JIT]: formatJit,
}

export function formatNodeProp(key: string, value: unknown): string {
  const formatter = nodePropFormatters[key as NodeProp];
  if (formatter) return formatter(value);
  return _.escape(value as unknown as string)
}

export function keysToString(value: string[] | string): string {
  if (!(value instanceof Array)) {
    value = [value]
  }
  value = _.map(value, (v) => _.escape(v.replace(/(^\(|\)$)/g, "")))
  return value.join(", ")
}

export function sortKeys(
  sort: string[],
  presort: string[] | undefined,
): string {
  return _.map(sort, (v) => {
    let result = _.escape(v)
    if (presort) {
      result +=
        presort.indexOf(v) !== -1
          ? '&nbsp;<span class="text-body-tertiary">(presort)</span>'
          : ""
    }
    return result
  }).join(", ")
}

export function truncate(text: string, length: number, clamp: string): string {
  clamp = clamp || "..."
  return text.length > length ? text.slice(0, length) + clamp : text
}

export function durationClass(i: number): string {
  let c
  if (i > 90) {
    c = 4
  } else if (i > 40) {
    c = 3
  } else if (i > 10) {
    c = 2
  }
  if (c) {
    return "c-" + c
  }
  return ""
}

export function pgsql_(text: string) {
  return hljs.highlight(text, { language: "pgsql" }).value
}

export function json_(text: string) {
  return hljs.highlight(text, { language: "json" }).value
}
