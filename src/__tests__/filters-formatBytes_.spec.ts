import { describe, it, expect } from "vitest"
import { formatBytes_ } from "@/filters"

describe("formatBytes_", () => {
  it("returns '0 kB' for zero", () => {
    expect(formatBytes_(0)).toBe("0 kB")
  })

  it("formats bytes (< 1024)", () => {
    expect(formatBytes_(1)).toBe("1 B")
    expect(formatBytes_(512)).toBe("512 B")
    expect(formatBytes_(1023)).toBe("1,023 B")
  })

  it("formats kilobytes", () => {
    expect(formatBytes_(1024)).toBe("1 kB")
    expect(formatBytes_(2048)).toBe("2 kB")
    expect(formatBytes_(1536)).toBe("1.5 kB")
  })

  it("formats megabytes", () => {
    expect(formatBytes_(1024 ** 2)).toBe("1 MB")
    expect(formatBytes_(1024 ** 2 * 1.5)).toBe("1.5 MB")
  })

  it("formats gigabytes", () => {
    expect(formatBytes_(1024 ** 3)).toBe("1 GB")
    expect(formatBytes_(1024 ** 3 * 2)).toBe("2 GB")
  })

  it("formats terabytes", () => {
    expect(formatBytes_(1024 ** 4)).toBe("1 TB")
    expect(formatBytes_(1024 ** 4 * 1.2)).toBe("1.2 TB")
  })

  it("formats petabytes", () => {
    expect(formatBytes_(1024 ** 5)).toBe("1 PB")
    expect(formatBytes_(1024 ** 5 * 1.4)).toBe("1.4 PB")
  })

  it("rounds to 2 significant figures", () => {
    // 1234 bytes = 1.205... kB → toPrecision(2) = "1.2" → 1.2 kB
    expect(formatBytes_(1234)).toBe("1.2 kB")
    // 1_000_000 bytes = 976.5625 kB → toPrecision(2) = "980" → 980 kB
    expect(formatBytes_(1_000_000)).toBe("980 kB")
  })
})
