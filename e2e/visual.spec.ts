import { test, expect, Page } from "@playwright/test"

// Sample type: [name, plan, query]
type Sample = [string, string, string]

// Extend Window interface for our custom properties
declare global {
  interface Window {
    setPlanData: (name: string, plan: string, query: string) => void
    samples: Sample[]
  }
}

// Sample names matching the order in samples.ts
const sampleTestNames = [
  "simple-join-text",
  "simple-join-json",
  "three-joins-missing-index",
  "aggregate-four-joins",
  "with-subplan",
  "with-buffers",
  "single-cte",
  "many-ctes",
  "very-large-plan",
  "delete-triggers",
  "with-many-options",
  "parallel-verbose",
  "parallel-4-workers",
  "partitions",
]

// Themes to test - add "dark", "high-contrast" when those features are merged
const themes = ["light"] as const
type Theme = (typeof themes)[number]

// Helper to set theme
async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t)
    document.documentElement.setAttribute(
      "data-bs-theme",
      t === "high-contrast" ? "dark" : t
    )
  }, theme)
  await page.waitForTimeout(100)
}

// Helper to load a sample plan by index
async function loadSampleByIndex(page: Page, index: number) {
  await page.evaluate((idx) => {
    const sample = window.samples[idx]
    window.setPlanData(sample[0], sample[1], sample[2])
  }, index)
  await page.waitForSelector(".plan-container")
  await page.waitForTimeout(500)
}

// Generate snapshot filename with theme suffix (omit suffix if only one theme)
function snapshotName(base: string, theme: Theme): string {
  return themes.length === 1 ? `${base}.png` : `${base}-${theme}.png`
}

test.describe("Visual regression tests", () => {
  // Home page tests for each theme
  for (const theme of themes) {
    test(`Home page${themes.length > 1 ? ` (${theme})` : ""}`, async ({ page }) => {
      await page.goto("/")
      await page.waitForSelector("#planInput")
      await setTheme(page, theme)
      await expect(page).toHaveScreenshot(snapshotName("home", theme))
    })
  }

  // Plan tests for all samples and themes
  for (let i = 0; i < sampleTestNames.length; i++) {
    const testName = sampleTestNames[i]

    for (const theme of themes) {
      const describeName = themes.length > 1 ? `${testName} (${theme})` : testName

      test.describe(describeName, () => {
        test.beforeEach(async ({ page }) => {
          await page.goto("/")
          await page.waitForSelector("#planInput")
          await loadSampleByIndex(page, i)
          await setTheme(page, theme)
        })

        test("Plan tab", async ({ page }) => {
          await page.click('a[href="#plan"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(snapshotName(`${testName}-plan`, theme))
        })

        test("Grid tab", async ({ page }) => {
          await page.click('a[href="#grid"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(snapshotName(`${testName}-grid`, theme))
        })

        test("Raw tab", async ({ page }) => {
          await page.click('a[href="#raw"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(snapshotName(`${testName}-raw`, theme))
        })

        test("Stats tab", async ({ page }) => {
          await page.click('a[href="#stats"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(snapshotName(`${testName}-stats`, theme))
        })
      })
    }
  }
})
