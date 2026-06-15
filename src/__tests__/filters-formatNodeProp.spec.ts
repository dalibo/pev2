import { describe, it, expect } from "vitest"
import { formatNodeProp } from "@/filters"
import { NodeProp } from "@/enums"


describe("formatNodeProp", () => {
  describe("duration", () => {
    it("formats duration", () => {
      expect(formatNodeProp(NodeProp.ACTUAL_TOTAL_TIME, 1234.56)).toBe("1s 235ms");
    })
    it("returns N/A for undefined", () => {
      expect(formatNodeProp(NodeProp.ACTUAL_TOTAL_TIME, undefined)).toBe("-");
    })
  })

  describe("cost", () => {
    it("formats cost", () => {
      expect(formatNodeProp(NodeProp.TOTAL_COST, 1234.56)).toBe("1,234.56");
    })
    it("formats cost with fraction digits", () => {
      expect(formatNodeProp(NodeProp.TOTAL_COST, 1234)).toBe("1,234.00");
    })
    it("returns N/A for undefined", () => {
      expect(formatNodeProp(NodeProp.TOTAL_COST, undefined)).toBe("N/A");
    })
  })

  describe("rows", () => {
    it("formats rows", () => {
      expect(formatNodeProp(NodeProp.ACTUAL_ROWS, 1000)).toBe("1,000");
    })
    it("returns N/A for undefined", () => {
      expect(formatNodeProp(NodeProp.ACTUAL_ROWS, undefined)).toBe("N/A");
    })
  })

  describe("loops", () => {
    it("formats loops", () => {
      expect(formatNodeProp(NodeProp.ACTUAL_LOOPS, 1000)).toBe("1,000");
    })
    it("returns N/A for undefined", () => {
      expect(formatNodeProp(NodeProp.ACTUAL_LOOPS, undefined)).toBe("N/A");
    })
  })

  describe("factor", () => {
    it("formats a factor with a times symbol", () => {
      expect(formatNodeProp(NodeProp.PLANNER_ESTIMATE_FACTOR, 3.456)).toBe("3.5&nbsp;&times;");
    });

    it("rounds to 2 significant figures", () => {
      expect(formatNodeProp(NodeProp.PLANNER_ESTIMATE_FACTOR, 1234)).toBe("1,200&nbsp;&times;");
    });

    it("returns N/A for undefined", () => {
      expect(formatNodeProp(NodeProp.PLANNER_ESTIMATE_FACTOR, undefined)).toBe("N/A");
    });
  });

  describe("kilobytes", () => {
    it("formats kilobytes", () => {
      expect(formatNodeProp(NodeProp.SORT_SPACE_USED, 1151688)).toBe("1.1 GB");
    });
  });

  describe("bytes", () => {
    it("formats bytes", () => {
      expect(formatNodeProp(NodeProp.WAL_BYTES, 1151688)).toBe("1.1 MB");
    });
  });

  describe("boolean", () => {
    it("returns 'yes' for true", () => {
      expect(formatNodeProp(NodeProp.ACTUAL_ROWS_FRACTIONAL, true)).toBe("yes");
    });
  });

  it("returns 'no' for false", () => {
    expect(formatNodeProp(NodeProp.ACTUAL_ROWS_FRACTIONAL, false)).toBe("no");
  });

  describe("blockAsBytes", () => {
    it("formats blocks", () => {
        expect(formatNodeProp(NodeProp.SHARED_HIT_BLOCKS, 1234)).toBe("1,234<br><small>9.6 MB</small>");
      });
    });
});
