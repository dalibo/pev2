import { Page } from '@playwright/test';

export async function loadPlan(page: Page, planName: string) {
  await page.goto("http://localhost:5173/")
  await page.getByRole("button", { name: "Sample Plans" }).click()
  await page.getByRole("link", { name: planName }).click()
  await page.getByRole("button", { name: "Submit" }).click()
}