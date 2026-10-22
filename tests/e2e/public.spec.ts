import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public marketplace links homepage, jobs, company, and methodology", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Praca dla ludzi, którzy dowożą z AI." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Zobacz oferty" }).click();
  await expect(page.getByRole("heading", { name: "Oferty pracy z AI" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(6);
  await page
    .getByRole("article")
    .first()
    .getByRole("link", { name: "AI Product Manager", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "AI Product Manager" })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await page.getByRole("link", { name: "BrightLabs" }).click();
  await expect(page.getByRole("heading", { name: "BrightLabs" })).toBeVisible();
});

test("URL filters are rendered in server HTML and use a native GET form", async ({
  page,
  request,
}) => {
  const response = await request.get("/oferty?category=build");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain("2 ofert");
  expect(html).toContain("Staff AI Engineer");
  await page.goto("/oferty?category=build");
  await page.getByRole("combobox", { name: "Kategoria" }).click();
  await page.getByRole("option", { name: "Lead", exact: true }).click();
  await page.getByRole("button", { name: "Filtruj" }).click();
  await expect(page).toHaveURL(/category=lead/);
  await expect(page.getByRole("status")).toHaveText("2 ofert");
});

test("public pages remain within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of [
    "/",
    "/oferty",
    "/oferty?view=map",
    "/oferty/ai-product-manager",
    "/metodologia",
  ]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test("filter controls follow clear and browser history", async ({ page }) => {
  await page.goto("/oferty?category=build");
  await expect(page.getByRole("combobox", { name: "Kategoria" })).toContainText("Build");
  await page.getByRole("link", { name: "Wyczyść", exact: true }).click();
  await expect(page).toHaveURL(/\/oferty$/);
  await expect(page.getByRole("combobox", { name: "Kategoria" })).toContainText("Wszystkie");
  await page.goBack();
  await expect(page.getByRole("combobox", { name: "Kategoria" })).toContainText("Build");
  await page.goForward();
  await expect(page.getByRole("combobox", { name: "Kategoria" })).toContainText("Wszystkie");
});

test("job map keeps an accessible result list", async ({ page }) => {
  const workerErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Worker failed to load")) {
      workerErrors.push(message.text());
    }
  });
  await page.route("https://tiles.openfreemap.org/styles/positron", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: { version: 8, sources: {}, layers: [] },
    }),
  );
  await page.goto("/oferty?view=map");
  const map = page.getByRole("region", { name: "Interaktywna mapa ofert pracy" });
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute("data-map-state", "ready");
  await expect(page.getByRole("heading", { name: "6 lokalizacji" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zobacz rolę" })).toHaveCount(6);
  await expect(page.getByRole("link", { name: "AI Product Manager", exact: true })).toHaveAttribute(
    "href",
    "/oferty/ai-product-manager",
  );
  expect(workerErrors).toEqual([]);
  await page
    .getByRole("button", { name: "AI Product Manager, BrightLabs", exact: true })
    .press("Enter");
  await expect(page.locator(".job-map-popup-title")).toHaveText("AI Product Manager");
  await page.getByRole("button", { name: "Close popup", exact: true }).click();
  await page
    .getByRole("button", { name: "AI Product Manager, BrightLabs", exact: true })
    .press("Space");
  await expect(page.locator(".job-map-popup-title")).toHaveText("AI Product Manager");
});

test("job filters keep a balanced grid at medium desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 1166, height: 800 });
  await page.goto("/oferty?view=map");

  const filterBoxes = await page.locator("[data-job-filter]").evaluateAll((filters) =>
    filters.map((filter) => {
      const box = filter.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width) };
    }),
  );
  const clearBox = await page.getByRole("link", { name: "Wyczyść" }).boundingBox();

  expect(filterBoxes).toHaveLength(5);
  expect(new Set(filterBoxes.slice(0, 3).map(({ y }) => y)).size).toBe(1);
  expect(new Set(filterBoxes.slice(3).map(({ y }) => y)).size).toBe(1);
  expect(filterBoxes[3]!.y).toBeGreaterThan(filterBoxes[0]!.y);
  expect(clearBox).not.toBeNull();
  expect(Math.round(clearBox!.y)).toBe(filterBoxes[3]!.y);
  expect(Math.max(...filterBoxes.map(({ width }) => width))).toBeLessThanOrEqual(
    Math.min(...filterBoxes.map(({ width }) => width)) + 1,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1166);
});

test("unknown jobs return the Polish not-found state", async ({ page }) => {
  const response = await page.goto("/oferty/nie-istnieje");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Nie znaleźliśmy tej strony." })).toBeVisible();
});

test("core public pages have no WCAG A/AA violations", async ({ page }) => {
  for (const path of ["/", "/oferty", "/oferty/ai-product-manager", "/metodologia"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      `${path}: ${results.violations.map((item) => item.id).join(", ")}`,
    ).toEqual([]);
  }
});

test("job browsing remains useful with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/oferty?category=build");
  await expect(page.getByRole("status")).toHaveText("2 ofert");
  await page.locator('select[name="category"]').selectOption("lead");
  await page.getByRole("button", { name: "Szukaj / Filtruj" }).click();
  await expect(page).toHaveURL(/category=lead/);
  await expect(page.getByRole("status")).toHaveText("2 ofert");
  await page.getByRole("link", { name: "Zobacz rolę" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});

test("small result sets have no pagination and unavailable pages redirect safely", async ({
  page,
}) => {
  await page.goto("/oferty?page=99");
  await expect(page).toHaveURL(/\/oferty$/);
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.getByRole("navigation", { name: "Strony ofert" })).toHaveCount(0);
  await expect(page.locator("[data-job-page-summary]")).toHaveText("Oferty 1–6 z 6");
  await page.goto("/oferty?query=nonexistent-role&page=3");
  await expect(page).toHaveURL(/\/oferty\?query=nonexistent-role$/);
  await expect(page.getByRole("heading", { name: "Brak ofert dla tych filtrów" })).toBeVisible();
  await expect(page.locator("[data-job-page-summary]")).toHaveCount(0);
});
