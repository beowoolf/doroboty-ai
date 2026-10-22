import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
const api = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const mail = process.env.LOCAL_MAIL_URL ?? "http://127.0.0.1:54324";
const password = "Local-test-password-483!";
const localCasePassword = "DoRoboty-local-only-2026!";
const labelsForRelease = (release: string) =>
  ({
    baseline: "Baseline",
    post_one_click: "Po one-click",
    discovery: "Discovery",
    post_ai: "Po interwencji AI",
    pilot: "Pilot",
    demo_day: "Demo Day",
  })[release] ?? release;
test.beforeAll(() => {
  for (const url of [api, mail])
    if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
      throw new Error("Tests must use isolated local Supabase and mail.");
});
async function emailLink(address: string, type: "signup" | "recovery") {
  let link = "";
  await expect
    .poll(
      async () => {
        const response = await fetch(`${mail}/api/v1/messages`);
        const data = await response.json();
        for (const message of data.messages ?? []) {
          if (!message.To?.some((to: { Address: string }) => to.Address === address)) continue;
          const detail = await (await fetch(`${mail}/api/v1/message/${message.ID}`)).json();
          const links = (detail.HTML as string).match(/href="([^"]+)"/g) ?? [];
          const match = links
            .map((value) => value.slice(6, -1).replaceAll("&amp;", "&"))
            .find((value) => value.includes(`type=${type}`));
          if (match) {
            link = match;
            return true;
          }
        }
        return false;
      },
      { timeout: 20000, intervals: [250, 500, 1000] },
    )
    .toBe(true);
  return link;
}
async function confirmedAccount(prefix = "account") {
  const client = createClient(api, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `${prefix}-${crypto.randomUUID()}@example.test`;
  const registration = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "http://127.0.0.1:3107/auth/callback?next=/app",
      data: { first_name: "Test", last_name: "Candidate" },
    },
  });
  expect(registration.error).toBeNull();
  expect(registration.data.session).not.toBeNull();
  return { client, id: registration.data.user!.id };
}

async function expectNoSignupMail(address: string) {
  const response = await fetch(`${mail}/api/v1/messages`);
  const data = await response.json();
  expect(
    (data.messages ?? []).some((message: { To?: { Address: string }[] }) =>
      message.To?.some((to) => to.Address === address),
    ),
  ).toBe(false);
}

async function fixtureClient(email: string) {
  const client = createClient(api, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await client.auth.signInWithPassword({ email, password: localCasePassword });
  expect(result.error).toBeNull();
  return client;
}
test("sign-up creates an immediate session without mail; sign-in and password recovery still work", async ({
  page,
}) => {
  const email = `browser-${crypto.randomUUID()}@example.com`;
  await page.goto("/app");
  await expect(page).toHaveURL(/auth\/sign-in/);
  await page.getByRole("link", { name: "Załóż konto kandydata", exact: true }).click();
  await page.getByLabel("Imię", { exact: true }).fill("Nowy");
  await page.getByLabel("Nazwisko", { exact: true }).fill("Kandydat");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(password);
  await page.getByLabel(/Akceptuję politykę prywatności/).check();
  await page.getByRole("button", { name: "Załóż konto", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/onboarding/);
  await expectNoSignupMail(email);
  await expect(page.getByRole("heading", { name: "Przygotuj profil" })).toBeVisible();
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /Cześć/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Cześć/ })).toBeVisible();
  await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
  await expect(page).toHaveURL(/sign-in/);
  await page.goto("/app");
  await expect(page).toHaveURL(/sign-in/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
  await expect(page).toHaveURL(/sign-in/);
  await page.getByRole("link", { name: "Nie pamiętam hasła" }).click();
  await expect(page.getByRole("heading", { name: "Odzyskaj dostęp." })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Wyślij link" }).click();
  await expect(page.getByRole("status")).toContainText("Jeśli konto istnieje");
  await page.goto(await emailLink(email, "recovery"));
  await expect(page).toHaveURL(/update-password/);
  await page.getByLabel("Hasło", { exact: true }).fill(`${password}new`);
  await page.getByRole("button", { name: "Zapisz hasło" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const verifier = createClient(api, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  expect((await verifier.auth.signInWithPassword({ email, password })).error).not.toBeNull();
  expect(
    (await verifier.auth.signInWithPassword({ email, password: `${password}new` })).error,
  ).toBeNull();
});
test("sessions for two accounts remain independent", async () => {
  const a = await confirmedAccount("session");
  const b = await confirmedAccount("session");
  expect(a.id).not.toBe(b.id);
  expect((await a.client.auth.getUser()).data.user?.id).toBe(a.id);
  expect((await b.client.auth.getUser()).data.user?.id).toBe(b.id);
  expect((await a.client.auth.signOut()).error).toBeNull();
  expect((await a.client.auth.getUser()).data.user).toBeNull();
  expect((await b.client.auth.getUser()).data.user?.id).toBe(b.id);
});

test("first-time candidate returns from registration, resumes a draft, and withdraws a receipt", async ({
  page,
}) => {
  const email = `journey-${crypto.randomUUID()}@example.test`;
  await page.goto("/oferty/ai-product-manager");
  await page.getByRole("link", { name: "Zaloguj się i aplikuj", exact: true }).first().click();
  await page.getByRole("link", { name: "Załóż konto kandydata", exact: true }).click();
  await page.getByLabel("Imię", { exact: true }).fill("Nowa");
  await page.getByLabel("Nazwisko", { exact: true }).fill("Kandydatka");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(password);
  await page.getByLabel(/Akceptuję politykę prywatności/).check();
  await page.getByRole("button", { name: "Załóż konto", exact: true }).click();
  await expect(page).toHaveURL(/onboarding.*ai-product-manager/);
  await expectNoSignupMail(email);
  await page.getByRole("link", { name: "Kontynuuj konfigurację" }).click();
  await page.getByLabel("Nagłówek").fill("Product Manager");
  await page.getByLabel("O Tobie").fill("Prowadzę discovery produktów i mierzę rezultaty wdrożeń.");
  await page.getByLabel("Miasto").fill("Warszawa");
  await page.getByLabel("Lata doświadczenia").fill("4");
  await page.getByRole("button", { name: "Zapisz profil" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profil zapisany" })).toBeVisible();
  await page.getByLabel("Rola", { exact: true }).fill("Product Manager");
  await page.getByLabel("Firma lub projekt").fill("Synthetic Labs");
  await page
    .getByLabel("Co zrobiłeś / zrobiłaś")
    .fill("Przeprowadziłam discovery procesu i wdrożyłam prototyp z zespołem operacyjnym.");
  await page.getByRole("button", { name: "Dodaj doświadczenie" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Doświadczenie dodane" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "pierwsze-cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 synthetic fixture"),
  });
  await page.getByRole("button", { name: "Dodaj CV", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "CV zapisane" })).toBeVisible();
  await page.getByRole("link", { name: "Sprawdź gotowość i wróć do aplikowania" }).click();
  await page.getByRole("link", { name: "Przejdź dalej" }).click();
  await expect(page).toHaveURL(/\/aplikuj\/ai-product-manager$/);
  await page.goto("/oferty/ai-product-manager");
  await expect(page.getByRole("link", { name: "Moje konto", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zaloguj się", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Zapisz ofertę", exact: true }).click();
  await expect(page.getByRole("button", { name: "Usuń z zapisanych", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Aplikuj", exact: true }).first().click();
  await expect(page).toHaveURL(/\/aplikuj\/ai-product-manager$/);
  const answer =
    "Przeprowadziłam discovery procesu i wdrożyłam prototyp, którego wyniki omawiałam z zespołem operacyjnym.";
  await page.getByLabel("Dlaczego pasujesz do tej roli?").fill(answer);
  await expect(page.getByRole("status").filter({ hasText: "Szkic zapisany" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue(answer);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  await page.getByRole("checkbox", { name: /Sprawdziłem/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację" }).click();
  await expect(page.getByRole("heading", { name: "Aplikacja wysłana" })).toBeVisible();
  const receiptScore = await page.locator("[data-match-score-value]").innerText();
  expect(receiptScore).toContain("%");
  await page.getByRole("link", { name: "Zobacz zgłoszenie" }).click();
  await expect(page.locator("[data-match-score-value]")).toHaveText(receiptScore);
  await expect(page.getByRole("heading", { name: "Historia procesu" })).toBeVisible();
  await expect(page.getByText(answer, { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Wycofaj aplikację" }).click();
  await expect(page.getByRole("button", { name: "Wycofaj aplikację" })).toHaveCount(0);
  await expect(page.getByText("Wycofana", { exact: true })).toBeVisible();
  const exported = await page.request.get("/api/account/export");
  expect(exported.ok()).toBe(true);
  expect((await exported.json()).account.email).toBe(email);
  await page.goto("/app/settings");
  await page.getByLabel("Potwierdź hasło przed usunięciem konta").fill(password);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Poproś o usunięcie konta" }).click();
  await expect(page.getByRole("button", { name: "Anuluj usunięcie konta" })).toBeVisible();
  await page.getByRole("button", { name: "Anuluj usunięcie konta" }).click();
  await expect(page.getByRole("button", { name: "Poproś o usunięcie konta" })).toBeVisible();
});

test("RLS isolates candidate evidence and prevents role escalation", async () => {
  const a = await confirmedAccount("rls");
  const b = await confirmedAccount("rls");
  const own = await a.client.from("candidate_profiles").select("user_id").eq("user_id", a.id);
  expect(own.error).toBeNull();
  expect(own.data).toHaveLength(1);
  const foreign = await a.client.from("candidate_profiles").select("user_id").eq("user_id", b.id);
  expect(foreign.error).toBeNull();
  expect(foreign.data).toHaveLength(0);
  await a.client.from("profiles").update({ role: "operator" }).eq("id", a.id);
  const roleAfterAttempt = await a.client.from("profiles").select("role").eq("id", a.id).single();
  expect(roleAfterAttempt.error).toBeNull();
  expect(roleAfterAttempt.data?.role).toBe("candidate");
  const structuredName = await a.client
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("id", a.id)
    .single();
  expect(structuredName.data).toEqual({
    first_name: "Test",
    last_name: "Candidate",
    display_name: "Test Candidate",
  });
});

test("candidate drafts, saved jobs, and deletion requests are private", async () => {
  const owner = await confirmedAccount("candidate-private");
  const other = await confirmedAccount("candidate-private");
  const jobId = "20000000-0000-4000-8000-000000000001";
  expect(
    (
      await owner.client.from("saved_jobs").insert({
        candidate_id: owner.id,
        job_id: jobId,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.client.from("application_drafts").insert({
        candidate_id: owner.id,
        job_id: jobId,
        answer: "Prywatny szkic aplikacji",
        current_step: 2,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.client.from("account_deletion_requests").insert({
        user_id: owner.id,
      })
    ).error,
  ).toBeNull();
  expect((await other.client.from("saved_jobs").select("job_id")).data).toHaveLength(0);
  expect((await other.client.from("application_drafts").select("id")).data).toHaveLength(0);
  expect((await other.client.from("account_deletion_requests").select("id")).data).toHaveLength(0);
  expect(
    (
      await other.client.from("application_drafts").insert({
        candidate_id: owner.id,
        job_id: "20000000-0000-4000-8000-000000000002",
      })
    ).error,
  ).not.toBeNull();
});

test("candidate CV storage and metadata stay private", async () => {
  const candidate = await confirmedAccount("cv-owner");
  const other = await confirmedAccount("cv-other");
  const path = `${candidate.id}/cv.pdf`;
  const file = new TextEncoder().encode("%PDF-1.4 private fixture");
  const uploaded = await candidate.client.storage.from("candidate-cv").upload(path, file, {
    contentType: "application/pdf",
    upsert: true,
  });
  expect(uploaded.error).toBeNull();
  const metadata = await candidate.client.from("candidate_documents").upsert({
    user_id: candidate.id,
    storage_path: path,
    file_name: "cv.pdf",
    mime_type: "application/pdf",
    size_bytes: file.byteLength,
  });
  expect(metadata.error).toBeNull();
  expect((await candidate.client.from("candidate_documents").select("user_id")).data).toHaveLength(
    1,
  );
  expect((await other.client.from("candidate_documents").select("user_id")).data).toHaveLength(0);
  expect((await candidate.client.storage.from("candidate-cv").download(path)).error).toBeNull();
  expect((await other.client.storage.from("candidate-cv").download(path)).error).not.toBeNull();
});

test("an employer can open the CV only after the candidate applies to their organization", async () => {
  const candidate = await confirmedAccount("cv-applicant");
  const employer = await fixtureClient("employer@doroboty.local");
  const otherEmployer = await fixtureClient("employer-other@doroboty.local");
  const path = `${candidate.id}/cv.pdf`;
  const file = new TextEncoder().encode("%PDF-1.4 applicant fixture");
  expect(
    (
      await candidate.client.storage.from("candidate-cv").upload(path, file, {
        contentType: "application/pdf",
        upsert: true,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await candidate.client.from("candidate_documents").upsert({
        user_id: candidate.id,
        storage_path: path,
        file_name: "applicant.pdf",
        mime_type: "application/pdf",
        size_bytes: file.byteLength,
      })
    ).error,
  ).toBeNull();
  const submitted = await candidate.client.rpc("submit_application_with_evidence", {
    target_job_id: "20000000-0000-4000-8000-000000000001",
    target_variant: "long_form",
    final_answer:
      "Prowadziłem discovery produktu i wdrożenie, które przyniosło mierzalny wynik operacyjny.",
    target_generation_id: null,
    source_snapshot: { fixture: true, cv: { storagePath: path } },
    source_evidence_ids: [],
    fit_version: "text-v1",
    fit_components: { overlap: 0.5 },
    fit_score: 0.5,
  });
  expect(submitted.error).toBeNull();
  expect(
    (await employer.from("candidate_documents").select("user_id").eq("user_id", candidate.id)).data,
  ).toHaveLength(0);
  expect(
    (await otherEmployer.from("candidate_documents").select("user_id").eq("user_id", candidate.id))
      .data,
  ).toHaveLength(0);
  expect((await employer.storage.from("candidate-cv").download(path)).error).toBeNull();
  expect((await otherEmployer.storage.from("candidate-cv").download(path)).error).not.toBeNull();
  const replacement = `${candidate.id}/${crypto.randomUUID()}.pdf`;
  expect(
    (
      await candidate.client.storage
        .from("candidate-cv")
        .upload(replacement, file, { contentType: "application/pdf" })
    ).error,
  ).toBeNull();
  expect((await employer.storage.from("candidate-cv").download(replacement)).error).not.toBeNull();
  expect(
    (
      await candidate.client.storage
        .from("candidate-cv")
        .update(path, file, { contentType: "application/pdf" })
    ).error,
  ).not.toBeNull();
  await candidate.client.storage.from("candidate-cv").remove([path]);
  expect((await employer.storage.from("candidate-cv").download(path)).error).toBeNull();
});

test("employers create review jobs only for their organization", async () => {
  const employer = await fixtureClient("employer@doroboty.local");
  const otherEmployer = await fixtureClient("employer-other@doroboty.local");
  const candidate = await fixtureClient("candidate@doroboty.local");
  const slug = `self-service-${crypto.randomUUID()}`;
  const input = {
    job_slug: slug,
    job_title: "AI Delivery Lead",
    job_summary: "Poprowadź wdrożenia AI od problemu do mierzalnego wyniku biznesowego.",
    job_description:
      "Szukamy osoby, która potrafi prowadzić discovery, eksperymenty i bezpieczne wdrożenia AI w zespole produktowym.",
    job_category: "lead",
    job_function: "product",
    job_remote_status: "hybrid",
    job_locations: ["Warszawa"],
    job_seniority: "senior",
    job_contract_type: "employment",
    job_salary_min: 18000,
    job_salary_max: 24000,
    job_salary_currency: "PLN",
    job_salary_period: "month",
    job_salary_kind: "gross",
    job_expiry_at: null,
    job_map_latitude: null,
    job_map_longitude: null,
  };
  const created = await employer.rpc("create_employer_job", input);
  expect(created.error).toBeNull();
  const id = created.data as string;
  const own = await employer.from("jobs").select("publication_status, company_id").eq("id", id);
  expect(own.data).toEqual([
    { publication_status: "review", company_id: "10000000-0000-4000-8000-000000000001" },
  ]);
  expect((await otherEmployer.from("jobs").select("id").eq("id", id)).data).toHaveLength(0);
  expect(
    (await candidate.rpc("create_employer_job", { ...input, job_slug: `${slug}-candidate` })).error,
  ).not.toBeNull();
  const brief = await employer.rpc("save_employer_job_brief", {
    target_job_id: id,
    brief_source_text:
      "Potrzebujemy osoby, która poprowadzi discovery i odpowie za mierzalny wynik wdrożenia.",
    brief_decision_criteria: ["Jakość decyzji", "Mierzalny rezultat"],
  });
  expect(brief.error).toBeNull();
  expect(
    (await employer.from("employer_briefs").select("id").eq("id", brief.data)).data,
  ).toHaveLength(1);
  expect(
    (await otherEmployer.from("employer_briefs").select("id").eq("id", brief.data)).data,
  ).toHaveLength(0);
});

test("application submission is atomic, idempotent, and private", async () => {
  const candidate = await confirmedAccount("application");
  const other = await confirmedAccount("application");
  const jobId = "20000000-0000-4000-8000-000000000001";
  const input = {
    target_job_id: jobId,
    target_variant: "long_form",
    final_answer:
      "Prowadziłem discovery procesu finansowego i dowiozłem mierzalne wdrożenie z zespołem operacyjnym.",
    target_generation_id: null,
    source_snapshot: { fixture: true },
    source_evidence_ids: [],
    fit_version: "text-v1",
    fit_components: { overlap: 0.5 },
    fit_score: 0.5,
  };
  const first = await candidate.client.rpc("submit_application_with_evidence", input);
  expect(first.error).toBeNull();
  const duplicate = await candidate.client.rpc("submit_application_with_evidence", input);
  expect(duplicate.error?.code).toBe("23505");
  const own = await candidate.client.from("applications").select("id").eq("id", first.data);
  expect(own.data).toHaveLength(1);
  const foreign = await other.client.from("applications").select("id").eq("id", first.data);
  expect(foreign.data).toHaveLength(0);
  const versions = await candidate.client
    .from("application_answer_versions")
    .select("id")
    .eq("application_id", first.data);
  const scores = await candidate.client
    .from("fit_scores")
    .select("id")
    .eq("application_id", first.data);
  expect(versions.data).toHaveLength(1);
  expect(scores.data).toHaveLength(1);
  const employer = await fixtureClient("employer@doroboty.local");
  const otherEmployer = await fixtureClient("employer-other@doroboty.local");
  const anonymous = createClient(api, key, { auth: { persistSession: false } });
  expect(
    (await employer.from("fit_scores").select("score").eq("application_id", first.data)).data,
  ).toEqual([{ score: 0.5 }]);
  expect(
    (await other.client.from("fit_scores").select("id").eq("application_id", first.data)).data,
  ).toHaveLength(0);
  expect(
    (await otherEmployer.from("fit_scores").select("id").eq("application_id", first.data)).data,
  ).toHaveLength(0);
  const publicScore = await anonymous
    .from("fit_scores")
    .select("id")
    .eq("application_id", first.data);
  expect(publicScore.data ?? []).toHaveLength(0);
  expect(
    (
      await other.client.rpc("withdraw_application", {
        target_application_id: first.data,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await candidate.client.rpc("withdraw_application", {
        target_application_id: first.data,
      })
    ).error,
  ).toBeNull();
  const withdrawn = await candidate.client
    .from("applications")
    .select("status, events:application_stage_events(stage)")
    .eq("id", first.data)
    .single();
  expect(withdrawn.data?.status).toBe("withdrawn");
  expect(withdrawn.data?.events).toEqual(
    expect.arrayContaining([expect.objectContaining({ stage: "withdrawn" })]),
  );
});

test("candidate, organization, operator, anonymous, and signed-out boundaries hold", async () => {
  const candidate = await confirmedAccount("boundaries");
  const employer = await fixtureClient("employer@doroboty.local");
  const otherEmployer = await fixtureClient("employer-other@doroboty.local");
  const operator = await fixtureClient("operator@doroboty.local");
  const anonymous = createClient(api, key, { auth: { persistSession: false } });
  const input = {
    target_job_id: "20000000-0000-4000-8000-000000000001",
    target_variant: "long_form",
    final_answer:
      "Zbadałem proces operacyjny, sprawdziłem hipotezę z użytkownikami i zmierzyłem efekt wdrożenia.",
    target_generation_id: null,
    source_snapshot: { fixture: "role-boundaries" },
    source_evidence_ids: [],
    fit_version: "text-v1",
    fit_components: { overlap: 0.4 },
    fit_score: 0.4,
  };
  const submitted = await candidate.client.rpc("submit_application_with_evidence", input);
  expect(submitted.error).toBeNull();
  const applicationId = submitted.data as string;
  for (const [client, visible] of [
    [candidate.client, true],
    [employer, true],
    [otherEmployer, false],
    [operator, true],
    [anonymous, false],
  ] as const) {
    const result = await client.from("applications").select("id").eq("id", applicationId);
    expect(result.data ?? []).toHaveLength(visible ? 1 : 0);
  }
  const forbiddenStage = await otherEmployer.rpc("record_application_stage", {
    target_application_id: applicationId,
    next_stage: "reviewed",
    event_note: null,
  });
  expect(forbiddenStage.error).not.toBeNull();
  expect(
    (
      await employer.rpc("record_application_stage", {
        target_application_id: applicationId,
        next_stage: "reviewed",
        event_note: null,
      })
    ).error,
  ).toBeNull();
  await candidate.client.auth.signOut();
  const afterSignOut = await candidate.client
    .from("applications")
    .select("id")
    .eq("id", applicationId);
  expect(afterSignOut.data ?? []).toHaveLength(0);
});

test("AI provenance is private, immutable, costed, and role constrained", async () => {
  const candidate = await confirmedAccount("ai-provenance");
  const other = await confirmedAccount("ai-provenance");
  const employer = await fixtureClient("employer@doroboty.local");
  const row = {
    purpose: "candidate_answer",
    requested_by: candidate.id,
    job_id: "20000000-0000-4000-8000-000000000001",
    provider: "deterministic",
    model: "course-fixture-v1",
    prompt_version: "evidence-first-v1",
    source_payload: { fixture: true },
    output_text: "Tekst źródłowy pozostaje oddzielony od tej wygenerowanej wersji odpowiedzi.",
    latency_ms: 4,
    input_tokens: 12,
    output_tokens: 18,
    estimated_cost_usd: 0.001,
    status: "succeeded",
  } as const;
  const inserted = await candidate.client.from("ai_generations").insert(row).select("id").single();
  expect(inserted.error).toBeNull();
  const generationId = inserted.data!.id;
  expect(
    (await other.client.from("ai_generations").select("id").eq("id", generationId)).data,
  ).toHaveLength(0);
  expect(
    (await employer.from("ai_generations").select("estimated_cost_usd").eq("id", generationId))
      .data,
  ).toHaveLength(1);
  await candidate.client
    .from("ai_generations")
    .update({ output_text: "Niedozwolona zmiana" })
    .eq("id", generationId);
  const unchanged = await candidate.client
    .from("ai_generations")
    .select("output_text")
    .eq("id", generationId)
    .single();
  expect(unchanged.data?.output_text).toBe(row.output_text);
  const wrongRole = await candidate.client
    .from("ai_generations")
    .insert({ ...row, purpose: "job_draft" });
  expect(wrongRole.error).not.toBeNull();
  const forbiddenApproval = await candidate.client.rpc("approve_job_text_version", {
    target_job_id: row.job_id,
    target_generation_id: generationId,
    approved_title: "Nieautoryzowana wersja",
    approved_summary: "Ten tekst nie powinien zostać zatwierdzony przez kandydata.",
    approved_description:
      "Kandydat nie jest członkiem organizacji i nie może zatwierdzić wersji tekstu oferty.",
  });
  expect(forbiddenApproval.error).not.toBeNull();
});

test("anonymous users cannot read employer briefs", async () => {
  const anonymous = createClient(api, key, { auth: { persistSession: false } });
  const briefs = await anonymous.from("employer_briefs").select("id");
  expect(briefs.data ?? []).toHaveLength(0);
});

test("experiment assignment is stable and exposure is idempotent", async () => {
  const account = await confirmedAccount("experiment");
  const first = await account.client.rpc("assign_experiment", {
    target_surface: "application_flow",
  });
  const second = await account.client.rpc("assign_experiment", {
    target_surface: "application_flow",
  });
  expect(first.error).toBeNull();
  expect(second.error).toBeNull();
  expect(second.data.id).toBe(first.data.id);
  expect(second.data.variant).toBe(first.data.variant);
  const exposureA = await account.client.rpc("record_experiment_exposure", {
    target_assignment_id: first.data.id,
    target_application_id: null,
  });
  const exposureB = await account.client.rpc("record_experiment_exposure", {
    target_assignment_id: first.data.id,
    target_application_id: null,
  });
  expect(exposureA.error).toBeNull();
  expect(exposureB.data).toBe(exposureA.data);
});

test("future AI assignments cannot be exposed before their release", async () => {
  const candidate = await fixtureClient("candidate@doroboty.local");
  const future = await candidate
    .from("experiment_assignments")
    .select("id")
    .eq("surface", "candidate_answer")
    .eq("release_key", "post_ai")
    .single();
  expect(future.error).toBeNull();
  const exposure = await candidate.rpc("record_experiment_exposure", {
    target_assignment_id: future.data!.id,
    target_application_id: null,
  });
  expect(exposure.error).not.toBeNull();
  expect((await candidate.rpc("can_use_ai", { target_surface: "candidate_answer" })).data).toBe(
    false,
  );
});
test("invalid confirmation links do not redirect outside the application", async ({ page }) => {
  await page.goto("/auth/callback?token_hash=invalid&type=signup&next=https://example.com");
  await expect(page).toHaveURL(`${test.info().project.use.baseURL}/auth/sign-in?error=link`);
  await expect(page.locator("main").getByRole("alert")).toContainText("wygasł");
});

for (const direction of [
  {
    audience: "employer",
    wrongEmail: "candidate@doroboty.local",
    correctEmail: "employer@doroboty.local",
    next: "/app/oferty",
    title: "Logowanie dla firm",
    mismatch: "To konto kandydata.",
    destination: "Oferty firmy",
  },
  {
    audience: "candidate",
    wrongEmail: "employer@doroboty.local",
    correctEmail: "candidate@doroboty.local",
    next: "/app/profil",
    title: "Logowanie kandydata",
    mismatch: "To konto pracodawcy lub operatora.",
    destination: "Twój profil",
  },
]) {
  test(`${direction.audience} login explains wrong accounts and supports switching`, async ({
    page,
  }, testInfo) => {
    const loginPath = `/auth/sign-in?audience=${direction.audience}&next=${encodeURIComponent(direction.next)}`;
    await page.goto(loginPath);
    await expect(page.getByRole("heading", { name: direction.title, exact: true })).toBeVisible();
    if (direction.audience === "employer") {
      await expect(
        page.getByRole("link", { name: "Załóż konto kandydata", exact: true }),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByRole("link", { name: "Załóż konto kandydata", exact: true }),
      ).toHaveAttribute("href", /audience=candidate/);
    }
    await page.getByLabel("Email", { exact: true }).fill(direction.wrongEmail);
    await page.getByLabel("Hasło", { exact: true }).fill("Incorrect-password-483!");
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Nie udało się zalogować.");
    await expect(page.locator("main").getByRole("alert")).not.toContainText(direction.mismatch);
    await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText(direction.mismatch);
    await expect(page).toHaveURL(/\/auth\/sign-in\?/);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
        ).toEqual([]);
        await page.screenshot({
          path: testInfo.outputPath(`role-mismatch-${width}-${colorScheme}.png`),
          fullPage: true,
        });
      }
    }
    await page.reload();
    await expect(page.locator("main").getByRole("alert")).toContainText(direction.mismatch);
    await page.goto(direction.next);
    await expect(page.locator("main").getByRole("alert")).toContainText(direction.mismatch);
    await expect(page).toHaveURL(/error=role/);
    await page.getByRole("button", { name: "Zaloguj się na inne konto", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Hasło", { exact: true })).toHaveValue("");
    await page.getByLabel("Email", { exact: true }).fill(direction.correctEmail);
    await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: direction.destination, exact: true }),
    ).toBeVisible();
    await page.goto(loginPath);
    await expect(
      page.getByRole("heading", { name: direction.destination, exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${direction.next}$`));
  });
}

test("employer entry preserves recovery context and never creates a candidate through signup", async ({
  page,
}) => {
  await page.goto("/app/oferty");
  await expect(page).toHaveURL(/audience=employer/);
  await expect(
    page.getByRole("heading", { name: "Logowanie dla firm", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Nie pamiętam hasła", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/forgot-password\?audience=employer/);
  await expect(page.getByRole("link", { name: "Mam już konto", exact: true })).toHaveAttribute(
    "href",
    /audience=employer/,
  );
  await page.goto("/auth/sign-up?next=/app/oferty");
  await expect(
    page.getByRole("heading", { name: "Logowanie dla firm", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Załóż konto", exact: true })).toHaveCount(0);
});

test("candidate application and employer first-conversation decision work end to end", async ({
  page,
}) => {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("candidate@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/profil");
  await page.getByLabel("Imię", { exact: true }).fill("Kandydat");
  await page.getByLabel("Nazwisko", { exact: true }).fill("testowy");
  await page.getByLabel("Nagłówek").fill("AI Product Manager");
  await page
    .getByLabel("O Tobie")
    .fill("Prowadzę discovery i wdrożenia produktów AI w procesach operacyjnych.");
  await page.getByLabel("Miasto").fill("Warszawa");
  await page.getByLabel("Lata doświadczenia").fill("6");
  await page.getByRole("button", { name: "Zapisz profil" }).click();
  await expect(page.getByRole("status")).toContainText("zapisany");

  await page.getByLabel("Rola", { exact: true }).fill("Product Manager");
  await page.getByLabel("Firma lub projekt").fill("Fixture Labs");
  await page
    .getByLabel("Co zrobiłeś / zrobiłaś")
    .fill("Zmapowałem proces finansowy, przetestowałem prototyp i poprowadziłem wdrożenie.");
  await page.getByLabel("Mierzalny efekt (opcjonalnie)").fill("Czas obsługi spadł o 20 procent.");
  await page.getByRole("button", { name: "Dodaj doświadczenie" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Doświadczenie dodane." })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Próbki pracy", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Dodaj próbkę" })).toHaveCount(0);
  await page.getByRole("link", { name: "Podgląd dla pracodawcy" }).click();
  await expect(page.getByRole("heading", { name: "Podgląd profilu", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Próbki pracy", exact: true })).toHaveCount(0);

  await page.goto("/aplikuj/ai-product-manager");
  await expect(page.getByRole("heading", { name: "Pełny opis roli" })).toBeVisible();
  await expect(page.locator('input[name="selectedWorkSampleIds"]')).toHaveCount(0);
  const answer = page.getByLabel("Dlaczego pasujesz do tej roli?");
  if ((await answer.inputValue()).length < 40) {
    await answer.fill(
      "Prowadziłem discovery procesu finansowego i dowiozłem mierzalne wdrożenie z zespołem operacyjnym.",
    );
  }
  await page.getByRole("checkbox", { name: /Sprawdziłem/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację" }).click();
  await expect(page).toHaveURL(/\/app\/aplikacje\/[^/]+\/wyslano/);
  await expect(page.getByRole("heading", { name: "Aplikacja wysłana" })).toBeVisible();
  const savedScore = await page.locator("[data-match-score-value]").innerText();
  expect(savedScore).toContain("%");
  const receiptUrl = new URL(page.url());
  const applicationPath = receiptUrl.pathname.replace(/\/wyslano$/, "");
  await page.goto(applicationPath);
  await expect(page.locator("[data-match-score-value]")).toHaveText(savedScore);
  await page.goto("/app/aplikacje");
  await expect(
    page
      .getByRole("article")
      .filter({ has: page.getByRole("link", { name: "AI Product Manager", exact: true }) })
      .locator("[data-match-score-value]"),
  ).toHaveText(savedScore);

  await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("employer@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/kandydaci");
  await expect(page.getByRole("heading", { name: "Kandydat testowy" })).toBeVisible();
  const application = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Kandydat testowy" }) })
    .filter({ hasText: "AI Product Manager" });
  await expect(application.locator("[data-match-score-value]")).toHaveText(savedScore);
  await application.getByRole("button", { name: "Oznacz jako przejrzaną" }).click();
  await expect(application.getByText("W przeglądzie", { exact: true })).toBeVisible();
  await application.getByRole("button", { name: "Oznacz zaproszenie na rozmowę" }).click();
  await application.getByRole("button", { name: "Potwierdź odbytą rozmowę" }).click();
  await application.getByRole("button", { name: "Przenieś do kolejnego etapu" }).click();
  await expect(application.getByText("Kolejny etap", { exact: true })).toBeVisible();
  await application.getByRole("link", { name: "Zobacz profil i CV" }).click();
  await expect(page).toHaveURL(/\/app\/kandydaci\/[^/]+$/);
  await expect(page.locator("[data-match-score-value]")).toHaveText(savedScore);
  await expect(page.getByText("Dopasowanie kandydata do roli", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "CV", exact: true })).toBeVisible();
  await expect(page.getByText("CV-candidate.pdf", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Otwórz CV w nowej karcie" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("long-form application remains a complete browser journey", async ({ page }) => {
  const candidate = await fixtureClient("candidate-longform@doroboty.local");
  const user = (await candidate.auth.getUser()).data.user!;
  await candidate
    .from("candidate_profiles")
    .update({
      headline: "AI Engineer",
      bio: "Buduję systemy AI i ewaluacje jakości.",
      city: "Kraków",
    })
    .eq("user_id", user.id);
  await candidate.from("candidate_experiences").insert({
    user_id: user.id,
    title: "AI Engineer",
    company_name: "Fixture Labs",
    description: "Budowałem ewaluacje systemów AI w procesie regulowanym.",
  });
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("candidate-longform@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/aplikuj/staff-ai-engineer");
  await expect(page.getByRole("heading", { name: "Napisz odpowiedź" })).toBeVisible();
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue("");
  await page
    .getByLabel("Dlaczego pasujesz do tej roli?")
    .fill("Budowałem ewaluacje systemów AI i wdrożyłem nadzór człowieka w procesie regulowanym.");
  await page.getByRole("checkbox", { name: /Sprawdziłem/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację" }).click();
  await expect(page).toHaveURL(/\/app\/aplikacje\/[^/]+\/wyslano/);
});

test("candidate and employer core flows meet automated WCAG A and AA", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("candidate@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/profil");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("employer@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/kandydaci");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
});

test("a new employer can create an isolated organization through onboarding", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("employer-new@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/organizacja");
  await page.getByLabel("Nazwa firmy").fill("Rehearsal Org");
  await page.getByLabel("Slug (małe litery i myślniki)").fill("rehearsal-org");
  await page
    .getByLabel("Krótkie podsumowanie")
    .fill("Syntetyczna organizacja do próby case study.");
  await page
    .getByLabel("Opis", { exact: true })
    .fill("Izolowana organizacja używana wyłącznie do testu procesu uczestnika.");
  await page.getByLabel("Strona HTTPS").fill("https://example.com/rehearsal");
  await page.getByLabel("Lokalizacja").fill("Warszawa");
  await page.getByLabel("Wielkość, np. 11–50 osób").fill("11–50 osób");
  await page.getByRole("button", { name: "Utwórz organizację" }).click();
  await expect(page.getByRole("heading", { name: "Rehearsal Org" })).toBeVisible();
});

test("only an operator can inspect and release every case stage", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("operator@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/case?release=post_ai");
  await expect(page.getByRole("heading", { name: "Case releases" })).toBeVisible();
  await expect(page.getByText(/Materiał późniejszego etapu/)).toBeVisible();
  for (const release of [
    "baseline",
    "post_one_click",
    "discovery",
    "post_ai",
    "pilot",
    "demo_day",
  ]) {
    await page.getByRole("combobox", { name: "Aktywny etap" }).click();
    await page.getByRole("option", { name: labelsForRelease(release), exact: true }).click();
    await page.getByRole("button", { name: "Ustaw i ukryj późniejsze etapy" }).click();
    await expect(page.getByText("Potwierdzony aktywny etap:")).toContainText(
      release === "post_one_click"
        ? "Po one-click"
        : release === "post_ai"
          ? "Po interwencji AI"
          : release === "demo_day"
            ? "Demo Day"
            : release === "pilot"
              ? "Pilot"
              : release[0]!.toUpperCase() + release.slice(1),
    );
  }
});

test("candidate and employer AI drafts require approval and preserve public source truth", async ({
  page,
}) => {
  const operator = await fixtureClient("operator@doroboty.local");
  const release = await operator.rpc("release_case", { target_release: "demo_day" });
  expect(release.error).toBeNull();
  const candidate = await fixtureClient("candidate@doroboty.local");
  const candidateApplicationsBefore = await candidate
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", "20000000-0000-4000-8000-000000000004");

  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("candidate@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/aplikuj/ai-operations-specialist");
  await page.getByRole("button", { name: "Przygotuj szkic z AI" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Szkic gotowy." })).toBeVisible();
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).not.toHaveValue("");
  const candidateApplicationsAfter = await candidate
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", "20000000-0000-4000-8000-000000000004");
  expect(candidateApplicationsAfter.count).toBe(candidateApplicationsBefore.count);

  await page.goto("/app");
  await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
  const employer = await fixtureClient("employer@doroboty.local");
  const originalJob = await employer
    .from("jobs")
    .select("title")
    .eq("id", "20000000-0000-4000-8000-000000000001")
    .single();
  await page.getByLabel("Email", { exact: true }).fill("employer@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/oferty");
  await page.getByRole("combobox", { name: "Oferta do wygenerowania", exact: true }).click();
  await page.getByRole("option", { name: "AI Product Manager", exact: true }).click();
  await page.getByRole("button", { name: "Wygeneruj szkic" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Szkic gotowy" })).toBeVisible();
  await page.getByLabel("Tytuł", { exact: true }).fill("AI Product Manager — wersja prywatna");
  await page.getByRole("button", { name: "Zatwierdź wersję" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Zatwierdzono wersję" })).toBeVisible();
  await expect(page.getByLabel("Tytuł", { exact: true })).toHaveValue(
    "AI Product Manager — wersja prywatna",
  );
  await expect(page.getByRole("button", { name: "Wersja zapisana", exact: true })).toBeDisabled();
  const publicJobAfterApproval = await employer
    .from("jobs")
    .select("title")
    .eq("id", "20000000-0000-4000-8000-000000000001")
    .single();
  expect(publicJobAfterApproval.data?.title).toBe(originalJob.data?.title);
  const privateVersion = await employer
    .from("job_text_versions")
    .select("title, visibility")
    .eq("job_id", "20000000-0000-4000-8000-000000000001")
    .eq("title", "AI Product Manager — wersja prywatna")
    .single();
  expect(privateVersion.data?.visibility).toBe("private");
  await page.goto("/app/oferty/20000000-0000-4000-8000-000000000001");
  await expect(
    page.locator("summary").filter({ hasText: "AI Product Manager — wersja prywatna" }),
  ).toBeVisible();
});

test("candidate-critical screens reflow in both themes and expose accessible controls", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  const candidate = await fixtureClient("candidate@doroboty.local");
  const { data: applications } = await candidate
    .from("applications")
    .select("id")
    .order("submitted_at", { ascending: false })
    .limit(1);
  const applicationId = applications![0].id;
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("candidate@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  const routes = [
    "/app",
    "/app/onboarding",
    "/app/profil",
    "/app/profil/podglad",
    "/app/aplikacje",
    `/app/aplikacje/${applicationId}`,
    `/app/aplikacje/${applicationId}/wyslano`,
    "/app/settings",
    "/app/zapisane",
    "/aplikuj/growth-lead-ai-products",
    "/oferty/ai-product-manager",
  ];
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => localStorage.setItem("theme", value), theme);
      for (const [index, route] of routes.entries()) {
        await page.goto(route);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          `${route} ${width} ${theme}`,
        ).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
          `${route} ${width} ${theme}`,
        ).toEqual([]);
        if ([0, 2, 9].includes(index))
          await page.screenshot({
            path: testInfo.outputPath(`candidate-${index}-${width}-${theme}.png`),
            fullPage: true,
          });
      }
    }
  }
  await page.goto("/app/profil");
  await page.getByText("Preferencje pracy", { exact: true }).click();
  await page.getByRole("combobox", { name: "Waluta" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "EUR", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "EUR", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Waluta" })).toContainText("EUR");
});

test("optional marketplace volume preserves data and supports candidate applications", async ({
  page,
}) => {
  const candidate = await fixtureClient("candidate@doroboty.local");
  const existing = await candidate.from("applications").select("id");
  expect(existing.error).toBeNull();
  for (let run = 0; run < 2; run++)
    execFileSync(process.execPath, ["scripts/seed-marketplace.mjs"], { stdio: "pipe" });
  const visitor = createClient(api, key, { auth: { persistSession: false } });
  const jobs = await visitor
    .from("jobs")
    .select("id, company_id, slug, map_latitude, map_longitude")
    .like("slug", "demo-%");
  expect(jobs.error).toBeNull();
  expect(jobs.data).toHaveLength(100);
  expect(new Set(jobs.data!.map((job) => job.company_id)).size).toBe(25);
  expect(jobs.data!.every((job) => job.map_latitude !== null && job.map_longitude !== null)).toBe(
    true,
  );
  const preserved = await candidate.from("applications").select("id");
  expect(preserved.error).toBeNull();
  expect(preserved.data).toEqual(existing.data);
  const employer = await fixtureClient("employer@doroboty.local");
  const foreignBriefs = await employer
    .from("employer_briefs")
    .select("id")
    .like("title", "%brief testowy");
  expect(foreignBriefs.error).toBeNull();
  expect(foreignBriefs.data).toEqual([]);

  await page.goto("/oferty");
  await expect(page.getByRole("article")).toHaveCount(20);
  const allPublicJobs = await visitor.from("jobs").select("id, slug");
  expect(allPublicJobs.error).toBeNull();
  const total = allPublicJobs.data!.length;
  const visitedSlugs: string[] = [];
  const pages = Math.ceil(total / 20);
  for (let number = 1; number <= pages; number++) {
    await page.goto(number === 1 ? "/oferty" : `/oferty?page=${number}`);
    await expect(page.getByRole("article")).toHaveCount(Math.min(20, total - (number - 1) * 20));
    visitedSlugs.push(
      ...(await page
        .locator("article h3 a")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")!.split("/").at(-1)!),
        )),
    );
    await expect(page.locator("[data-job-page-summary]")).toHaveText(
      `Oferty ${(number - 1) * 20 + 1}–${Math.min(number * 20, total)} z ${total}`,
    );
  }
  expect(new Set(visitedSlugs)).toEqual(new Set(allPublicJobs.data!.map((job) => job.slug)));
  expect(visitedSlugs).toHaveLength(total);
  await expect(page.getByRole("button", { name: "Następna", exact: true })).toBeDisabled();
  await page.goto("/oferty?page=999");
  await expect(page).toHaveURL(new RegExp(`page=${pages}$`));

  // Native filter submission starts at page one, then page links retain all selected filters.
  await page.goto("/oferty?function=engineering");
  await page
    .getByRole("navigation", { name: "Strony ofert" })
    .getByRole("link", { name: "Następna", exact: true })
    .click();
  await expect(page).toHaveURL(/function=engineering&page=2$/);
  await page.getByRole("button", { name: "Szukaj / Filtruj" }).click();
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.getByRole("article")).toHaveCount(20);
  await page.goto("/oferty?function=engineering&page=2");
  await page.getByRole("link", { name: "Mapa", exact: true }).click();
  await expect(page).toHaveURL(/function=engineering&view=map$/);
  await expect(page.getByRole("navigation", { name: "Strony ofert" })).toHaveCount(0);
  await page.getByRole("link", { name: "Lista", exact: true }).click();
  await expect(page).toHaveURL(/function=engineering$/);

  const noJs = await page.context().browser()!.newContext({ javaScriptEnabled: false });
  const nativePage = await noJs.newPage();
  await nativePage.goto(new URL("/oferty?function=engineering", page.url()).href);
  await nativePage.getByRole("link", { name: "Następna", exact: true }).click();
  await expect(nativePage).toHaveURL(/function=engineering&page=2$/);
  await expect(nativePage.getByRole("article")).toHaveCount(1);
  await noJs.close();
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => localStorage.setItem("theme", value), theme);
      await page.goto("/oferty?page=2");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
      ).toEqual([]);
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("navigation", { name: "Strony ofert" })
    .getByRole("link", { name: "Następna", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/page=3$/);
  await page.goto("/firmy/demo-kobalt-labs");
  await expect(page.getByRole("heading", { name: "Kobalt Labs", exact: true })).toBeVisible();
  await expect(page.locator('h3 a[href^="/oferty/demo-"]')).toHaveCount(4);
  await page.goto("/auth/sign-in?audience=candidate");
  await page.getByLabel("Email", { exact: true }).fill("candidate@doroboty.local");
  await page.getByLabel("Hasło", { exact: true }).fill(localCasePassword);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/aplikuj/demo-kobalt-labs-ai-product-manager-1");
  await expect(page.getByRole("heading", { name: "Pełny opis roli" })).toBeVisible();
  await expect(
    page.locator("[data-job-description]").getByRole("heading", { name: "O firmie", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("[data-job-description]")
      .getByRole("heading", { name: "Zakres odpowiedzialności", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Dlaczego pasujesz do tej roli?")
    .fill(
      "Prowadziłem discovery produktu i wdrożyłem prototyp z zespołem. Potrafię mierzyć efekt i opisać ograniczenia rozwiązania.",
    );
  await page.getByRole("checkbox", { name: /Sprawdziłem/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację" }).click();
  await expect(page.getByRole("heading", { name: "Aplikacja wysłana" })).toBeVisible();
});
