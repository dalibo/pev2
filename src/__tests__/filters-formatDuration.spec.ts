import { beforeEach, describe, it, expect, vi } from "vitest"
import { duration } from "@/filters"


describe("duration", () => {
  describe("special values", () => {
    it("returns '-' for undefined", () => {
      expect(duration(undefined)).toBe("-")
    })

    it("returns '0ms' for zero", () => {
      expect(duration(0)).toBe("0ms")
    })
  })

  describe("milliseconds only", () => {
    it("formats a whole number of ms", () => {
      expect(duration(1)).toBe("1ms")
      expect(duration(500)).toBe("500ms")
      expect(duration(999)).toBe("999ms")
    })

    it("rounds ms to 3 significant figures", () => {
      expect(duration(1.005)).toBe("1ms")
      expect(duration(1.556)).toBe("1.56ms")
    })
  })

  describe("seconds", () => {
    it("formats whole seconds and remaining ms", () => {
      expect(duration(1000)).toBe("1s")
      expect(duration(1500)).toBe("1s 500ms")
      expect(duration(59_999)).toBe("59s 999ms")
    })

    it("shows only 2 most significant units", () => {
      // seconds + ms → both shown
      expect(duration(2500)).toBe("2s 500ms")
    })
  })

  describe("minutes", () => {
    const oneMinute = 1000 * 60

    it("formats minutes and seconds (drops ms)", () => {
      expect(duration(oneMinute)).toBe("1m")
      expect(duration(oneMinute + 30_000)).toBe("1m 30s")
    })

    it("formats minutes and ms when no seconds", () => {
      expect(duration(oneMinute + 500)).toBe("1m 500ms")
    })
  })

  describe("hours", () => {
    const oneHour = 1000 * 60 * 60

    it("formats hours and minutes (drops seconds and ms)", () => {
      expect(duration(oneHour)).toBe("1h")
      expect(duration(oneHour + 30 * 60_000)).toBe("1h 30m")
    })

    it("formats hours and seconds when no minutes", () => {
      expect(duration(oneHour + 45_000)).toBe("1h 45s")
    })
  })

  describe("days", () => {
    const oneDay = 1000 * 60 * 60 * 24

    it("formats days and hours (drops minutes and ms)", () => {
      expect(duration(oneDay)).toBe("1d")
      expect(duration(oneDay + 6 * 60 * 60_000)).toBe("1d 6h")
    })

    it("formats days and minutes when no hours", () => {
      expect(duration(oneDay + 45 * 60_000)).toBe("1d 45m")
    })

    it("formats multiple days", () => {
      expect(duration(3 * oneDay)).toBe("3d")
    })
  })

  describe("negative values", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {})
    })

    it("logs a console.error for negative values", () => {
      duration(-1)
      expect(console.error).toHaveBeenCalledOnce()
    })

    it("still returns a value for negative input", () => {
      // The function doesn't bail out, it continues with the negative number
      expect(duration(-1)).not.toBe("-")
    })
  })
})
