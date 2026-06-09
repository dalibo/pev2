import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173/")
  await page.getByRole("button", { name: "Sample Plans" }).click()
  await page.getByRole("link", { name: "Simple join (JSON format)" }).click()
  await page.getByRole("button", { name: "Submit" }).click()
})

test.describe("navbar", () => {
  test("navigates to home page", async ({ page }) => {
    await page.getByText("New Plan").click()
    await expect(page).toHaveURL("http://localhost:5173/")
    await expect(page).toHaveScreenshot("home.png")
  })

  test("switches to dark mode", async ({ page }) => {
    await page.getByTitle("Switch to dark mode").click()
    await expect(page).toHaveScreenshot("darkMode.png")
  })

  test("navigates to about page", async ({ page }) => {
    await page.getByText("About").click()
    await expect(page).toHaveScreenshot("about.png")
  })
})

test.describe("node", () => {
  test("node box toggle shows and hides tabs", async ({ page }) => {
    const node = page.locator(".plan-node", { hasText: "Nested Loop" })

    const toggle = node.getByRole("heading", { name: "Nested Loop" })
    const tabs = node.locator("li.nav-item a")

    //open
    await toggle.click()
    await expect(node).toHaveClass(/detailed/)
    await expect(tabs).toContainText([
      "General",
      "IO & Buffers",
      "Output",
      "Workers",
      "Misc",
    ])
    await expect(node.getByRole("link", { name: "General" })).toHaveClass(
      /active/,
    )
    await expect(node.getByRole("link", { name: "IO & Buffers" })).toHaveClass(
      /disabled/,
    )
    await expect(node).toHaveScreenshot("node_open.png")

    //close
    await toggle.click()
    await expect(node).not.toHaveClass("detailed")
    await expect(node).toHaveScreenshot("node_closed.png")
  })
})

test.describe("plan style", () => {
  let rightPanel

  test.beforeEach(async ({ page }) => {
    rightPanel = page.locator(".splitpanes__pane.plan")
  })

  test("displays plan", async () => {
    const noneButton = rightPanel.getByRole("button", { name: "none" })

    await expect(noneButton).toHaveClass(/active/)
    await expect(rightPanel).toHaveScreenshot("plan_style_none.png")
  })

  test("displays plan with duration", async () => {
    const durationButton = rightPanel.getByRole("button", { name: "duration" })
    await durationButton.click()

    await expect(durationButton).toHaveClass(/active/)
    await expect(rightPanel).toHaveScreenshot("plan_style_duration.png")
  })

  test("displays plan with rows", async () => {
    const rowsButton = rightPanel.getByRole("button", { name: "rows" })
    await rowsButton.click()

    await expect(rowsButton).toHaveClass(/active/)
    await expect(rightPanel).toHaveScreenshot("plan_style_rows.png")
  })

  test("displays plan with cost", async () => {
    const costButton = rightPanel.getByRole("button", { name: "cost" })
    await costButton.click()

    await expect(costButton).toHaveClass(/active/)
    await expect(rightPanel).toHaveScreenshot("plan_style_cost.png")
  })
})

test.describe("diagram view", () => {
  let leftPanel

  test.beforeEach(async ({ page }) => {
    leftPanel = page.locator(".diagram")
  })

  test("selects node", async ({ page }) => {
    const row = leftPanel.getByRole("row", { name: /Nested Loop/ })
    const node = page.locator(".plan-node", { hasText: "Nested Loop" })
    await row.click()

    await expect(row).toHaveClass(/selected/)
    await expect(node).toHaveClass(/detailed/)
    await expect(node).toHaveClass(/selected/)
    await expect(page).toHaveScreenshot("plan_diagram.png")
  })

  test("selects buffers button in diagram option", async ({ page }) => {
    const bufferButton = leftPanel.getByRole("button", { name: "buffers" })
    await bufferButton.click()

    await expect(bufferButton).toHaveClass(/active/)
    await expect(page).toHaveScreenshot("plan_buffers_diagram.png")
  })
})

test.describe("plan tabs", () => {
  let navPills

  test.beforeEach(async ({ page }) => {
    navPills = page.locator(".nav.nav-pills")
  })

  test("redirects to Grid view", async ({ page }) => {
    const gridLink = navPills.getByRole("link", { name: "Grid" })

    await gridLink.click()
    await expect(gridLink).toHaveClass(/active/)
    await expect(page).toHaveURL((url) => url.hash === "#grid")
    await expect(page).toHaveScreenshot("plan_gridView.png")
  })

  test("redirects to Raw view", async ({ page }) => {
    const rawLink = navPills.getByRole("link", { name: "Raw" })

    await rawLink.click()
    await expect(rawLink).toHaveClass(/active/)
    await expect(page).toHaveURL((url) => url.hash === "#raw")
    await expect(page).toHaveScreenshot("plan_rawView.png")
  })

  test("redirects to Query view", async ({ page }) => {
    const queryLink = navPills.getByRole("link", { name: "Query" })

    await queryLink.click()
    await expect(queryLink).toHaveClass(/active/)
    await expect(page).toHaveURL((url) => url.hash === "#query")
    await expect(page).toHaveScreenshot("plan_queryView.png")
  })

  test("redirects to Stats view", async ({ page }) => {
    const statsLink = navPills.getByRole("link", { name: "Stats" })

    await statsLink.click()
    await expect(statsLink).toHaveClass(/active/)
    await expect(page).toHaveURL((url) => url.hash === "#stats")
    await expect(page).toHaveScreenshot("plan_statsView.png")
  })
})
