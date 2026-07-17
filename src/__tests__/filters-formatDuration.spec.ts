import { beforeEach, describe, it, expect, vi } from "vitest"
import { formatDuration } from "@/filters"

describe("formatDuration", () => {
  describe("special values", () => {
    it("returns '-' for undefined", () => {
      expect(formatDuration(undefined)).toBe("-")
    })

    it("returns '0ms' for zero", () => {
      expect(formatDuration(0)).toBe("0ms")
    })
  })

  describe("milliseconds only", () => {
    it("formats a whole number of ms", () => {
      expect(formatDuration(1)).toBe("1ms")
      expect(formatDuration(500)).toBe("500ms")
      expect(formatDuration(999)).toBe("999ms")
    })

    it("rounds ms to 3 significant figures", () => {
      expect(formatDuration(1.005)).toBe("1ms")
      expect(formatDuration(1.556)).toBe("1.56ms")
    })
  })

  describe("seconds", () => {
    it("formats whole seconds and remaining ms", () => {
      expect(formatDuration(1000)).toBe("1s")
      expect(formatDuration(1500)).toBe("1s 500ms")
      expect(formatDuration(59_999)).toBe("59s 999ms")
    })

    it("shows only 2 most significant units", () => {
      // seconds + ms → both shown
      expect(formatDuration(2500)).toBe("2s 500ms")
    })
  })

  describe("minutes", () => {
    const oneMinute = 1000 * 60

    it("formats minutes and seconds (drops ms)", () => {
      expect(formatDuration(oneMinute)).toBe("1m")
      expect(formatDuration(oneMinute + 30_000)).toBe("1m 30s")
    })

    it("formats minutes and ms when no seconds", () => {
      expect(formatDuration(oneMinute + 500)).toBe("1m 500ms")
    })
  })

  describe("hours", () => {
    const oneHour = 1000 * 60 * 60

    it("formats hours and minutes (drops seconds and ms)", () => {
      expect(formatDuration(oneHour)).toBe("1h")
      expect(formatDuration(oneHour + 30 * 60_000)).toBe("1h 30m")
    })

    it("formats hours and seconds when no minutes", () => {
      expect(formatDuration(oneHour + 45_000)).toBe("1h 45s")
    })
  })

  describe("days", () => {
    const oneDay = 1000 * 60 * 60 * 24

    it("formats days and hours (drops minutes and ms)", () => {
      expect(formatDuration(oneDay)).toBe("1d")
      expect(formatDuration(oneDay + 6 * 60 * 60_000)).toBe("1d 6h")
    })

    it("formats days and minutes when no hours", () => {
      expect(formatDuration(oneDay + 45 * 60_000)).toBe("1d 45m")
    })

    it("formats multiple days", () => {
      expect(formatDuration(3 * oneDay)).toBe("3d")
    })
  })

  describe("negative values", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {})
    })

    it("logs a console.error for negative values", () => {
      formatDuration(-1)
      expect(console.error).toHaveBeenCalledOnce()
    })

    it("still returns a value for negative input", () => {
      // The function doesn't bail out, it continues with the negative number
      expect(formatDuration(-1)).not.toBe("-")
    })
  })
})
