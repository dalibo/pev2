import _ from "lodash"
import { createApp } from "vue"
import { EstimateDirection, nodePropTypes, PropType } from "@/enums"
import type { JIT } from "@/interfaces"
import SortGroup from "@/components/SortGroup.vue"
import JitDetails from "@/components/JitDetails.vue"
import hljs from "highlight.js/lib/core"
import pgsql from "highlight.js/lib/languages/pgsql"
hljs.registerLanguage("pgsql", pgsql)

import json from "highlight.js/lib/languages/json"
hljs.registerLanguage("json", json)

export function formatDuration(value: number | undefined): string {
  if (value === undefined) {
    return "-"
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

export function formatCost(value: number | undefined): string {
  if (value === undefined) {
    return "N/A"
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2 })
}

export function formatRows(value: number | undefined): string {
  if (value === undefined) {
    return "N/A"
  }
  return value.toLocaleString()
}

export function formatLoops(value: number | undefined): string {
  if (value === undefined) {
    return "N/A"
  }
  return value.toLocaleString()
}

export function formatFactor(value: number | undefined): string {
  if (value === undefined) {
    return "N/A"
  }
  const f: string = parseFloat(value.toPrecision(2)).toLocaleString()
  return `${f}&nbsp;&times;`
}

export function formatKilobytes(value: number): string {
  return formatBytes_(value * 1024)
}

function formatBytes(value: number): string {
  return formatBytes_(value)
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

export function formatBlocks(value: number, asHtml = false): string {
  asHtml = !!asHtml
  if (!value) {
    return ""
  }
  let r = value.toLocaleString()
  if (asHtml) {
    r += `<br><small>${formatBlocksAsBytes(value)}</small>`
  }
  return r
}

export function formatPercent(value: number): string {
  if (isNaN(value)) {
    return "-"
  }
  return _.round(value * 100) + "%"
}

export function formatList(value: string[] | string): string {
  if (value == undefined) {
    return ''
  }
  const lines =
    typeof value === "string"
    ? value.split(/\s*,\s*/)
    : value

  const items = lines.map(line => `<li>${_.escape(line)}</li>`).join("")

  return `<ul class="list-unstyled mb-0">${items}</ul>`
}

function formatSortGroups(value: string): string {
  const app = createApp(SortGroup, { sortGroup: value }).mount(
    document.createElement("div"),
  )
  return app.$el.outerHTML
}

export function formatTransferRate(value: number): string {
  if (!value) {
    return ""
  }
  return formatBlocksAsBytes(value) + "/s"
}

function formatJit(value: JIT): string {
  const app = createApp(JitDetails, { jit: value }).mount(
    document.createElement("div"),
  )
  return app.$el.outerHTML
}

function formatBoolean(value: boolean): string {
  return value ? "yes" : "no"
}

export function formatNodeProp(key: string, value: unknown): string {
  switch (nodePropTypes[key]) {
    case PropType.duration:
      return formatDuration(value as number)
    case PropType.boolean:
      return formatBoolean(value as boolean)
    case PropType.cost:
      return formatCost(value as number)
    case PropType.rows:
      return formatRows(value as number)
    case PropType.loops:
      return formatLoops(value as number)
    case PropType.factor:
      return formatFactor(value as number)
    case PropType.estimateDirection:
      switch (value) {
        case EstimateDirection.over:
          return '<i class="fa fa-arrow-up"></i> over'
        case EstimateDirection.under:
          return '<i class="fa fa-arrow-down"></i> under'
        default:
          return "-"
      }
    case PropType.json:
      return JSON.stringify(value, null, 2)
    case PropType.bytes:
      return formatBytes(value as number)
    case PropType.kilobytes:
      return formatKilobytes(value as number)
    case PropType.blocks:
      return formatBlocks(value as number, true)
    case PropType.list:
      return formatList(value as string[])
    case PropType.sortGroups:
      return formatSortGroups(value as string)
    case PropType.transferRate:
      return formatTransferRate(value as number)
    case PropType.jit:
      return formatJit(value as JIT)
    default:
      return _.escape(value as unknown as string)
  }
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
