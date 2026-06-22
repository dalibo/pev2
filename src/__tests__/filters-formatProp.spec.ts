import { describe, it, expect } from "vitest"
import { formatProp } from "@/filters"
import { Property } from "@/enums"


describe("formatProp", () => {
  describe("duration", () => {
    it("formats duration", () => {
      expect(formatProp(Property.ACTUAL_TOTAL_TIME, 1234.56)).toBe("1s 235ms");
    })
    it("returns N/A for undefined", () => {
      expect(formatProp(Property.ACTUAL_TOTAL_TIME, undefined)).toBe("-");
    })
  })

  describe("cost", () => {
    it("formats cost", () => {
      expect(formatProp(Property.TOTAL_COST, 1234.56)).toBe("1,234.56");
    })
    it("formats cost with fraction digits", () => {
      expect(formatProp(Property.TOTAL_COST, 1234)).toBe("1,234.00");
    })
    it("returns N/A for undefined", () => {
      expect(formatProp(Property.TOTAL_COST, undefined)).toBe("N/A");
    })
  })

  describe("rows", () => {
    it("formats rows", () => {
      expect(formatProp(Property.ACTUAL_ROWS, 1000)).toBe("1,000");
    })
    it("returns N/A for undefined", () => {
      expect(formatProp(Property.ACTUAL_ROWS, undefined)).toBe("N/A");
    })
  })

  describe("loops", () => {
    it("formats loops", () => {
      expect(formatProp(Property.ACTUAL_LOOPS, 1000)).toBe("1,000");
    })
    it("returns N/A for undefined", () => {
      expect(formatProp(Property.ACTUAL_LOOPS, undefined)).toBe("N/A");
    })
  })

  describe("factor", () => {
    it("formats a factor with a times symbol", () => {
      expect(formatProp(Property.PLANNER_ESTIMATE_FACTOR, 3.456)).toBe("3.5&nbsp;&times;");
    });

    it("rounds to 2 significant figures", () => {
      expect(formatProp(Property.PLANNER_ESTIMATE_FACTOR, 1234)).toBe("1,200&nbsp;&times;");
    });

    it("returns N/A for undefined", () => {
      expect(formatProp(Property.PLANNER_ESTIMATE_FACTOR, undefined)).toBe("N/A");
    });
  });

  describe("kilobytes", () => {
    it("formats kilobytes", () => {
      expect(formatProp(Property.SORT_SPACE_USED, 1151688)).toBe("1.1 GB");
    });
  });

  describe("bytes", () => {
    it("formats bytes", () => {
      expect(formatProp(Property.WAL_BYTES, 1151688)).toBe("1.1 MB");
    });
  });

  describe("boolean", () => {
    it("returns 'yes' for true", () => {
      expect(formatProp(Property.ACTUAL_ROWS_FRACTIONAL, true)).toBe("yes");
    });
  });

  it("returns 'no' for false", () => {
    expect(formatProp(Property.ACTUAL_ROWS_FRACTIONAL, false)).toBe("no");
  });

  describe("blockAsBytes", () => {
    it("formats blocks", () => {
        expect(formatProp(Property.SHARED_HIT_BLOCKS, 1234)).toBe("1,234<br><small>9.6 MB</small>");
      });
    });

  describe("no formatter provided", () => {
    it("escapes ", () => {
        expect(formatProp(Property.FILTER, "something")).toBe("something");
      });
    });
});
