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

const themes = ["light", "dark"] as const

// Helper to set theme
async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t)
    document.documentElement.setAttribute("data-bs-theme", t)
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

test.describe("Visual regression tests", () => {
  // Home page tests
  for (const theme of themes) {
    test(`Home page (${theme})`, async ({ page }) => {
      await page.goto("/")
      await page.waitForSelector("#planInput")
      await setTheme(page, theme)
      await expect(page).toHaveScreenshot(`home-${theme}.png`)
    })
  }

  // Plan tests for all samples and themes
  for (let i = 0; i < sampleTestNames.length; i++) {
    const testName = sampleTestNames[i]

    for (const theme of themes) {
      test.describe(`${testName} (${theme})`, () => {
        test.beforeEach(async ({ page }) => {
          await page.goto("/")
          await page.waitForSelector("#planInput")
          await loadSampleByIndex(page, i)
          await setTheme(page, theme)
        })

        test("Plan tab", async ({ page }) => {
          await page.click('a[href="#plan"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(`${testName}-plan-${theme}.png`)
        })

        test("Grid tab", async ({ page }) => {
          await page.click('a[href="#grid"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(`${testName}-grid-${theme}.png`)
        })

        test("Raw tab", async ({ page }) => {
          await page.click('a[href="#raw"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(`${testName}-raw-${theme}.png`)
        })

        test("Stats tab", async ({ page }) => {
          await page.click('a[href="#stats"]')
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot(`${testName}-stats-${theme}.png`)
        })
      })
    }
  }
})
