import _ from "lodash"

import { Property } from "@/enums"
import type { IPlanStats, Node } from "@/interfaces"

/**
 * Minimum share of the execution time that must be spent outside of the plan
 * nodes before it is worth reporting.
 */
export const UNACCOUNTED_TIME_MIN_PERCENT = 25

/** Minimum duration (in milliseconds) worth reporting. */
export const UNACCOUNTED_TIME_MIN_DURATION = 10

export interface IUnaccountedTime {
  /** Time (ms) spent outside of the plan nodes */
  time: number
  /** Share of the execution time (0-100) */
  percent: number
}

/**
 * Returns the part of the execution time which is not explained by the plan
 * itself, when it is large enough to be worth a hint. Such a gap can be caused
 * by lock waits, for example.
 *
 * Time spent in triggers, serialization and JIT is reported separately, so it
 * is not considered as unaccounted.
 */
export function getUnaccountedTime(
  stats: IPlanStats,
  root?: Node,
): IUnaccountedTime | undefined {
  const executionTime = stats.executionTime
  const rootTime = root?.[Property.ACTUAL_TOTAL_TIME]
  if (!root || !executionTime || typeof rootTime !== "number") {
    return undefined
  }
  const loops = root[Property.ACTUAL_LOOPS] || 1
  const knownTimes =
    _.sumBy(stats.triggers, (t) => t.Time || 0) +
    (stats.serialization?.Time || 0) +
    (stats.jitTime || 0)
  const time = executionTime - rootTime * loops - knownTimes
  const percent = (time / executionTime) * 100
  if (
    !(time >= UNACCOUNTED_TIME_MIN_DURATION) ||
    percent < UNACCOUNTED_TIME_MIN_PERCENT
  ) {
    return undefined
  }
  return { time, percent }
}
