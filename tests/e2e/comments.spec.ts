import { expect, test } from "@playwright/test"

test("stores and displays plan comments", async ({ page }) => {
  const comment =
    "Production uses a lower work_mem setting.\nRecheck after tuning."

  await page.goto("http://localhost:5173/")
  await page.getByRole("button", { name: "Sample Plans" }).click()
  await page.getByRole("link", { name: "Simple join (JSON format)" }).click()
  await page.getByLabel("Comments").fill(comment)
  await page.getByRole("button", { name: "Submit" }).click()

  await page.getByRole("link", { name: "Query" }).click()
  await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible()
  await expect(page.getByText(comment, { exact: true })).toBeVisible()

  await page.getByText("New Plan").click()
  await page
    .getByRole("link", { name: /Simple join \(JSON format\).*created/ })
    .click()
  await page.getByRole("link", { name: "Query" }).click()
  await expect(page.getByText(comment, { exact: true })).toBeVisible()
})

test("shows comments when a plan has no query", async ({ page }) => {
  const comment = "This plan was captured without its SQL query."

  await page.goto("http://localhost:5173/")
  await page.getByRole("button", { name: "Sample Plans" }).click()
  await page.getByRole("link", { name: "With subplan" }).click()
  await page.getByLabel("Comments").fill(comment)
  await page.getByRole("button", { name: "Submit" }).click()

  const queryLink = page.getByRole("link", { name: "Query" })
  await expect(queryLink).not.toHaveClass(/disabled/)
  await queryLink.click()
  await expect(page.getByText(comment, { exact: true })).toBeVisible()
})
