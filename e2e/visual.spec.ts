import { test, expect } from "@playwright/test"

// Sample plans for visual testing
const testPlans = [
  {
    name: "simple-join",
    plan: `Nested Loop Left Join  (cost=11.95..28.52 rows=5 width=157) (actual time=0.010..0.010 rows=0 loops=1)
  ->  Bitmap Heap Scan on public.rel_users_exams  (cost=11.80..20.27 rows=5 width=52) (actual time=0.009..0.009 rows=0 loops=1)
        Recheck Cond: (1 = rel_users_exams.exam_id)
        ->  Bitmap Index Scan on rel_users_exams_pkey  (cost=0.00..11.80 rows=5 width=0) (actual time=0.005..0.005 rows=0 loops=1)
              Index Cond: (1 = rel_users_exams.exam_id)
  ->  Materialize  (cost=0.15..8.17 rows=1 width=105) (never executed)
        ->  Index Scan using exam_pkey on public.exam exam_1  (cost=0.15..8.17 rows=1 width=105) (never executed)
              Index Cond: (exam_1.id = 1)
Planning Time: 1.110 ms
Execution Time: 0.170 ms`,
    query: "SELECT * FROM rel_users_exams LEFT JOIN exam ON exam.id = rel_users_exams.exam_id;",
  },
  {
    name: "parallel-workers",
    plan: `Finalize Aggregate  (cost=180065.72..180065.73 rows=1 width=8) (actual time=626.029..628.242 rows=1 loops=1)
  ->  Gather  (cost=180065.51..180065.72 rows=2 width=8) (actual time=625.810..628.231 rows=3 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        ->  Partial Aggregate  (cost=179065.51..179065.52 rows=1 width=8) (actual time=613.498..613.499 rows=1 loops=3)
              ->  Parallel Seq Scan on test  (cost=0.00..169331.43 rows=3893631 width=0) (actual time=0.050..379.818 rows=3333333 loops=3)
Planning Time: 0.089 ms
Execution Time: 628.290 ms`,
    query: "SELECT count(*) FROM test;",
  },
  {
    name: "cte",
    plan: `Aggregate  (cost=289.00..289.01 rows=1 width=8) (actual time=4.350..4.351 rows=1 loops=1)
  CTE agg
    ->  Aggregate  (cost=145.00..145.01 rows=1 width=8) (actual time=1.339..1.341 rows=1 loops=1)
          ->  Seq Scan on foo  (cost=0.00..120.00 rows=10000 width=4) (actual time=0.046..0.561 rows=10000 loops=1)
  ->  Append  (cost=0.00..143.99 rows=1 width=8) (actual time=0.015..3.004 rows=10001 loops=1)
        ->  CTE Scan on agg  (cost=0.00..0.02 rows=1 width=8) (actual time=1.343..1.345 rows=1 loops=1)
        ->  Seq Scan on foo foo_1  (cost=0.00..120.00 rows=10000 width=8) (actual time=0.014..0.843 rows=10000 loops=1)
Planning Time: 0.282 ms
Execution Time: 4.454 ms`,
    query: "WITH agg AS (SELECT count(*) FROM foo) SELECT * FROM agg UNION ALL SELECT i FROM foo;",
  },
  {
    name: "buffers",
    plan: `Seq Scan on foo  (cost=0.00..1834.01 rows=100001 width=4) (actual time=0.012..6.735 rows=100001 loops=1)
  Buffers: shared hit=443
Planning Time: 0.054 ms
Execution Time: 9.998 ms`,
    query: "SELECT * FROM foo;",
  },
]

// Helper to enable dark mode
async function enableDarkMode(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark")
    document.documentElement.setAttribute("data-bs-theme", "dark")
  })
  // Let styles apply
  await page.waitForTimeout(100)
}

test.describe("Visual regression tests", () => {
  test("Home page", async ({ page }) => {
    await page.goto("/")
    // Wait for the form to be ready
    await page.waitForSelector("#planInput")
    await expect(page).toHaveScreenshot("home.png")
  })

  test("Home page (dark)", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("#planInput")
    await enableDarkMode(page)
    await expect(page).toHaveScreenshot("home-dark.png")
  })

  for (const testPlan of testPlans) {
    test.describe(`Plan: ${testPlan.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/")
        // Wait for the form to be ready
        await page.waitForSelector("#planInput")

        // Load the plan via the exposed function
        await page.evaluate(
          ({ plan, query, name }) => {
            ;(window as any).setPlanData(name, plan, query)
          },
          { plan: testPlan.plan, query: testPlan.query, name: testPlan.name }
        )

        // Wait for plan view to render (has nav-link tabs)
        await page.waitForSelector(".plan-container")
        // Give time for animations to complete
        await page.waitForTimeout(500)
      })

      test("Plan tab", async ({ page }) => {
        await page.click('a[href="#plan"]')
        await page.waitForTimeout(300)
        await expect(page).toHaveScreenshot(`${testPlan.name}-plan.png`)
      })

      test("Grid tab", async ({ page }) => {
        await page.click('a[href="#grid"]')
        await page.waitForTimeout(300)
        await expect(page).toHaveScreenshot(`${testPlan.name}-grid.png`)
      })

      test("Raw tab", async ({ page }) => {
        await page.click('a[href="#raw"]')
        await page.waitForTimeout(300)
        await expect(page).toHaveScreenshot(`${testPlan.name}-raw.png`)
      })

      test("Stats tab", async ({ page }) => {
        await page.click('a[href="#stats"]')
        await page.waitForTimeout(300)
        await expect(page).toHaveScreenshot(`${testPlan.name}-stats.png`)
      })
    })
  }

  // Dark mode tests for a representative plan
  test.describe("Dark mode: simple-join", () => {
    const testPlan = testPlans[0] // simple-join

    test.beforeEach(async ({ page }) => {
      await page.goto("/")
      await page.waitForSelector("#planInput")

      await page.evaluate(
        ({ plan, query, name }) => {
          ;(window as any).setPlanData(name, plan, query)
        },
        { plan: testPlan.plan, query: testPlan.query, name: testPlan.name }
      )

      await page.waitForSelector(".plan-container")
      await page.waitForTimeout(500)
      await enableDarkMode(page)
    })

    test("Plan tab (dark)", async ({ page }) => {
      await page.click('a[href="#plan"]')
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot("simple-join-plan-dark.png")
    })

    test("Grid tab (dark)", async ({ page }) => {
      await page.click('a[href="#grid"]')
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot("simple-join-grid-dark.png")
    })

    test("Raw tab (dark)", async ({ page }) => {
      await page.click('a[href="#raw"]')
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot("simple-join-raw-dark.png")
    })

    test("Stats tab (dark)", async ({ page }) => {
      await page.click('a[href="#stats"]')
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot("simple-join-stats-dark.png")
    })
  })
})
