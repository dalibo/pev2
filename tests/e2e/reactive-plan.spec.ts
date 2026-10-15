import { expect, test } from "@playwright/test"

test("fits a replacement plan when returning from a hidden tree", async ({
  page,
}) => {
  await page.goto("http://localhost:5173/tests/e2e/fixtures/reactive-plan.html")
  await expect(page.getByRole("heading", { name: "Result" })).toBeInViewport()
  await page.getByRole("link", { name: "Raw", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "Raw", exact: true }),
  ).toHaveClass(/active/)
  await page.getByRole("button", { name: "Replace plan" }).click()
  await expect(page.locator(".plan-node")).toContainText("synthetic_data")
  await page.getByRole("link", { name: "Plan", exact: true }).click()
  const heading = page.getByRole("heading", { name: "Seq Scan", exact: true })
  await expect(heading).toBeInViewport({ ratio: 1 })
  await heading.click()
  await expect(page.locator(".plan-node")).toHaveClass(/detailed/)

  const tree = page.locator(".plan > svg > g")
  const transform = await tree.getAttribute("transform")
  await page.getByRole("link", { name: "Raw", exact: true }).click()
  await page.getByRole("link", { name: "Plan", exact: true }).click()
  await expect(tree).toHaveAttribute("transform", transform!)
})
