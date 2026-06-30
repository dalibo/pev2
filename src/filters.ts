import _ from "lodash"
import { createApp } from "vue"
import { EstimateDirection, Property } from "@/enums"
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

export function formatNumber(value: unknown): string {
  if (value === undefined) {
    return "N/A"
  }
  return (value as number).toLocaleString()
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

const nodePropFormatters: Partial<Record<Property, Formatter>> = {
  [Property.ACTUAL_LOOPS]: formatLoops,
  [Property.ACTUAL_ROWS]: formatRows,
  [Property.ACTUAL_ROWS_FRACTIONAL]: formatBoolean,
  [Property.ACTUAL_ROWS_REVISED]: formatRows,
  [Property.ACTUAL_STARTUP_TIME]: formatDuration,
  [Property.ACTUAL_TOTAL_TIME]: formatDuration,
  [Property.AVERAGE_IO_READ_SPEED]: formatTransferRate,
  [Property.AVERAGE_IO_WRITE_SPEED]: formatTransferRate,
  [Property.AVERAGE_LOCAL_IO_READ_SPEED]: formatTransferRate,
  [Property.AVERAGE_LOCAL_IO_WRITE_SPEED]: formatTransferRate,
  [Property.AVERAGE_SHARED_IO_READ_SPEED]: formatTransferRate,
  [Property.AVERAGE_SHARED_IO_WRITE_SPEED]: formatTransferRate,
  [Property.AVERAGE_SUM_IO_READ_SPEED]: formatTransferRate,
  [Property.AVERAGE_SUM_IO_WRITE_SPEED]: formatTransferRate,
  [Property.AVERAGE_TEMP_IO_READ_SPEED]: formatTransferRate,
  [Property.AVERAGE_TEMP_IO_WRITE_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_IO_READ_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_IO_WRITE_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_LOCAL_IO_READ_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_LOCAL_IO_WRITE_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_SHARED_IO_READ_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_SHARED_IO_WRITE_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_TEMP_IO_READ_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_AVERAGE_TEMP_IO_WRITE_SPEED]: formatTransferRate,
  [Property.EXCLUSIVE_COST]: formatCost,
  [Property.EXCLUSIVE_DURATION]: formatDuration,
  [Property.EXCLUSIVE_IO_READ_TIME]: formatDuration,
  [Property.EXCLUSIVE_IO_WRITE_TIME]: formatDuration,
  [Property.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_LOCAL_HIT_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_LOCAL_IO_READ_TIME]: formatDuration,
  [Property.EXCLUSIVE_LOCAL_IO_WRITE_TIME]: formatDuration,
  [Property.EXCLUSIVE_LOCAL_READ_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_SHARED_HIT_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_SHARED_IO_READ_TIME]: formatDuration,
  [Property.EXCLUSIVE_SHARED_IO_WRITE_TIME]: formatDuration,
  [Property.EXCLUSIVE_SHARED_READ_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_TEMP_IO_READ_TIME]: formatDuration,
  [Property.EXCLUSIVE_TEMP_IO_WRITE_TIME]: formatDuration,
  [Property.EXCLUSIVE_TEMP_READ_BLOCKS]: formatBlocksHtml,
  [Property.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]: formatBlocksHtml,
  [Property.FULL_SORT_GROUPS]: formatSortGroups,
  [Property.HEAP_FETCHES]: formatRows,
  [Property.HASH_BATCHES]: formatNumber,
  [Property.HASH_BUCKETS]: formatNumber,
  [Property.IO_READ_TIME]: formatDuration,
  [Property.IO_WRITE_TIME]: formatDuration,
  [Property.JIT]: formatJit,
  [Property.LOCAL_DIRTIED_BLOCKS]: formatBlocksHtml,
  [Property.LOCAL_HIT_BLOCKS]: formatBlocksHtml,
  [Property.LOCAL_IO_READ_TIME]: formatDuration,
  [Property.LOCAL_IO_WRITE_TIME]: formatDuration,
  [Property.LOCAL_READ_BLOCKS]: formatBlocksHtml,
  [Property.LOCAL_WRITTEN_BLOCKS]: formatBlocksHtml,
  [Property.ORIGINAL_HASH_BATCHES]: formatNumber,
  [Property.ORIGINAL_HASH_BUCKETS]: formatNumber,
  [Property.OUTPUT]: formatList,
  [Property.PARALLEL_AWARE]: formatBoolean,
  [Property.PEAK_MEMORY_USAGE]: formatKilobytes,
  [Property.PLANNER_ESTIMATE_DIRECTION]: formatEstimateDirection,
  [Property.PLANNER_ESTIMATE_FACTOR]: formatFactor,
  [Property.PLAN_ROWS]: formatRows,
  [Property.PLAN_ROWS_REVISED]: formatRows,
  [Property.PLAN_WIDTH]: formatBytes,
  [Property.PRESORTED_KEY]: formatList,
  [Property.PRE_SORTED_GROUPS]: formatSortGroups,
  [Property.ROWS_REMOVED_BY_FILTER]: formatRows,
  [Property.ROWS_REMOVED_BY_FILTER_REVISED]: formatRows,
  [Property.ROWS_REMOVED_BY_INDEX_RECHECK]: formatRows,
  [Property.ROWS_REMOVED_BY_INDEX_RECHECK_REVISED]: formatRows,
  [Property.ROWS_REMOVED_BY_JOIN_FILTER]: formatRows,
  [Property.ROWS_REMOVED_BY_JOIN_FILTER_REVISED]: formatRows,
  [Property.SHARED_DIRTIED_BLOCKS]: formatBlocksHtml,
  [Property.SHARED_HIT_BLOCKS]: formatBlocksHtml,
  [Property.SHARED_IO_READ_TIME]: formatDuration,
  [Property.SHARED_IO_WRITE_TIME]: formatDuration,
  [Property.SHARED_READ_BLOCKS]: formatBlocksHtml,
  [Property.SHARED_WRITTEN_BLOCKS]: formatBlocksHtml,
  [Property.SORT_KEY]: formatList,
  [Property.SORT_SPACE_USED]: formatKilobytes,
  [Property.STARTUP_COST]: formatCost,
  [Property.SUM_IO_READ_TIME]: formatDuration,
  [Property.SUM_IO_WRITE_TIME]: formatDuration,
  [Property.TEMP_IO_READ_TIME]: formatDuration,
  [Property.TEMP_IO_WRITE_TIME]: formatDuration,
  [Property.TEMP_READ_BLOCKS]: formatBlocksHtml,
  [Property.TEMP_WRITTEN_BLOCKS]: formatBlocksHtml,
  [Property.TOTAL_COST]: formatCost,
  [Property.WAL_BYTES]: formatBytes,
  [Property.WAL_FPI]: formatRows,
  [Property.WAL_RECORDS]: formatRows,
  [Property.WORKERS]: formatJson,
}

export function formatProp(key: string, value: unknown): string {
  const formatter = nodePropFormatters[key as Property];
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
