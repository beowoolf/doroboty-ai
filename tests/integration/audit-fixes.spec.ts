import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const api = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const password = "DoRoboty-local-only-2026!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test.beforeAll(() => {
  if (!api || !["127.0.0.1", "localhost"].includes(new URL(api).hostname)) {
    throw new Error("Audit regressions require local Supabase.");
  }
});

test("credential forms fail closed without JS or when script loading fails", async ({
  browser,
  request,
}) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled });
    const page = await context.newPage();
    if (javaScriptEnabled) await page.route("**/*.js*", (route) => route.abort());
    for (const mode of ["sign-in", "sign-up", "forgot-password", "update-password"]) {
      await page.goto(`/auth/${mode}`);
      const credentialForm = page.locator('form[action="/auth/unavailable"]');
      // The reset route can redirect unauthenticated users to sign-in.
      await expect(credentialForm).toHaveAttribute("method", "post");
      await expect(credentialForm.locator("fieldset")).toHaveAttribute("disabled", "");
      await expect(credentialForm.locator('button[type="submit"]')).toBeDisabled();
      expect(new URL(page.url()).searchParams.has("password")).toBe(false);
    }
    await context.close();
  }
  const response = await request.post("/auth/unavailable", {
    form: { email: "synthetic@example.test", password: "synthetic-never-reflected" },
  });
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.text()).not.toContain("synthetic-never-reflected");
  expect(response.headers()["location"]).toBeUndefined();
});

test("login keeps credentials out of navigation; wrong password has current recovery copy", async ({
  page,
}) => {
  const navigations: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("unknown-audit@example.test");
  await page.getByLabel("Hasło", { exact: true }).fill("synthetic-invalid-password");
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Nie udało się zalogować" }),
  ).toContainText("Sprawdź e-mail i hasło.");
  await expect(
    page.getByRole("alert").filter({ hasText: "Nie udało się zalogować" }),
  ).not.toContainText("potwierdzenie");
  expect(navigations.some((url) => /[?&](password|email)=/.test(url))).toBe(false);
  await expect(page.getByRole("link", { name: "Wróć do ofert" })).toHaveAttribute(
    "href",
    "/oferty",
  );
});

test("slow hydration keeps auth disabled until its submit handler is attached", async ({
  page,
}) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*.js*", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/auth/sign-in", { waitUntil: "commit" });
    await expect(page.getByLabel("Hasło", { exact: true })).toBeDisabled();
    await expect(page.locator("form")).toHaveAttribute("method", "post");
    release();
    await expect(page.getByRole("button", { name: "Zaloguj się", exact: true })).toBeEnabled();
    expect(new URL(page.url()).searchParams.has("password")).toBe(false);
  } finally {
    release();
  }
});

test("authenticated password-reset form is safe without JavaScript", async ({ page, browser }) => {
  await login(page, "candidate@doroboty.local");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    storageState: await page.context().storageState(),
  });
  const reset = await context.newPage();
  await reset.goto("/auth/update-password");
  await expect(reset.getByRole("heading", { name: "Ustaw nowe hasło." })).toBeVisible();
  await expect(reset.getByLabel("Hasło", { exact: true })).toBeDisabled();
  await expect(reset.locator("form")).toHaveAttribute("method", "post");
  await context.close();
});

test("invalid employer salary and duplicate slug preserve every authored field", async ({
  page,
}) => {
  await login(page, "employer@doroboty.local");
  await page.goto("/app/oferty");
  await page.getByText("Dodaj ofertę ręcznie", { exact: true }).click();
  const values = {
    title: "Audit regression role",
    slug: "ai-product-manager",
    summary: "A synthetic summary long enough for the validation contract.",
    description:
      "## Responsibilities\n\nSynthetic role description with enough context for validation.\n\n- Discovery\n- Delivery",
    sourceBrief: "Private synthetic source context retained after failed validation.",
    decisionCriteria: "Discovery\nDelivery",
    locations: "Warszawa, Kraków",
    salaryMin: "30000",
    salaryMax: "20000",
    expiryAt: "2027-12-31",
  };
  for (const [name, value] of Object.entries(values)) await page.locator(`#${name}`).fill(value);
  await page.getByRole("combobox", { name: "Kategoria", exact: true }).click();
  await page.getByRole("option", { name: "Lead", exact: true }).click();
  await page.getByRole("button", { name: "Dodaj do weryfikacji" }).click();
  await expect(page.locator("#employer-job-error")).toContainText("Maksimum");
  for (const [name, value] of Object.entries(values))
    await expect(page.locator(`#${name}`)).toHaveValue(value);
  await expect(page.locator('[name="salaryMax"]')).toBeFocused();
  await expect(page.getByRole("combobox", { name: "Kategoria", exact: true })).toContainText(
    "Lead",
  );
  await page.locator('[name="salaryMax"]').fill("40000");
  await page.getByRole("button", { name: "Dodaj do weryfikacji" }).click();
  await expect(page.locator("#employer-job-error")).toContainText("Zmień slug");
  await expect(page.locator('[name="title"]')).toHaveValue(values.title);
  await expect(page.locator('[name="sourceBrief"]')).toHaveValue(values.sourceBrief);
  await expect(page.locator('[name="slug"]')).toBeFocused();
});

test("owned role brief links, filter scope and formatted owner preview", async ({ page }) => {
  await login(page, "employer@doroboty.local");
  await page.goto("/app/oferty/20000000-0000-4000-8000-000000000001");
  await page.getByRole("link", { name: "Edytuj brief", exact: true }).click();
  await expect(page).toHaveURL(/job=20000000-0000-4000-8000-000000000001#brief-source/);
  await expect(page.getByRole("combobox", { name: "Oferta dla briefu" })).toContainText(
    "AI Product Manager",
  );
  const generator = page.getByRole("combobox", { name: "Oferta do wygenerowania" });
  if (await generator.count()) await expect(generator).toContainText("AI Product Manager");
  await expect(page.locator('[id="brief-source"]')).toHaveCount(1);
  await expect(
    page.getByLabel("Kontekst, potrzeba i oczekiwany rezultat", { exact: true }).last(),
  ).toHaveAttribute("id", "brief-source-text");
  await page.goto("/app/kandydaci");
  await page.getByRole("combobox", { name: "Filtruj po ogłoszeniu" }).click();
  await expect(page.getByRole("option", { name: /Staff AI Engineer/ })).toHaveCount(0);
  await expect(
    page.getByRole("option", { name: /AI Product Manager · ai-product-manager/ }),
  ).toBeVisible();
});

test("candidate item creation appends, atomic reordering persists and other users cannot reorder it", async () => {
  const makeAccount = async () => {
    const client = createClient(api, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signup = await client.auth.signUp({
      email: `order-audit-${crypto.randomUUID()}@example.test`,
      password,
    });
    expect(signup.error).toBeNull();
    return { client, id: signup.data.user!.id };
  };
  const a = await makeAccount();
  const b = await makeAccount();
  const ids: string[] = [];
  for (const title of ["First role", "Second role", "Third role"]) {
    const result = await a.client
      .from("candidate_experiences")
      .insert({
        user_id: a.id,
        title,
        company_name: "Synthetic Labs",
        description: "Only synthetic evidence for an isolated regression test.",
      })
      .select("id,sort_order")
      .single();
    expect(result.error).toBeNull();
    expect(result.data!.sort_order).toBe(ids.length);
    ids.push(result.data!.id);
  }
  const move = await a.client.rpc("move_candidate_item", {
    target_id: ids[0],
    item_kind: "experience",
    direction: "down",
  });
  expect(move.error).toBeNull();
  const rows = await a.client
    .from("candidate_experiences")
    .select("id,sort_order")
    .order("sort_order");
  expect(rows.data?.map((item) => item.id)).toEqual([ids[1], ids[0], ids[2]]);
  expect(rows.data?.map((item) => item.sort_order)).toEqual([0, 1, 2]);
  expect(
    (
      await b.client.rpc("move_candidate_item", {
        target_id: ids[0],
        item_kind: "experience",
        direction: "up",
      })
    ).error,
  ).not.toBeNull();
  expect((await b.client.from("candidate_experiences").select("id")).data).toEqual([]);
});

test("mobile account menu exposes working sign out", async ({ page }) => {
  await login(page, "candidate@doroboty.local");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Wyloguj się", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
  await expect(page).toHaveURL(/auth\/sign-in/);
  await page.goto("/app");
  await expect(page).toHaveURL(/auth\/sign-in/);
});
