"use server";

import { revalidatePath } from "next/cache";
import {
  candidateProfileSchema,
  candidateCvSchema,
  experienceSchema,
  workSampleSchema,
  candidateItemActionSchema,
  accountIdentitySchema,
} from "@/features/candidates/schema";
import { requireProfile } from "@/features/auth/session";
import { captureAnalytics } from "@/features/analytics/server";

export type CandidateActionState = { ok: boolean; message: string };

export async function saveCandidateProfile(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const { client, user } = await requireProfile(["candidate"]);
  const parsed = candidateProfileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    headline: formData.get("headline"),
    bio: formData.get("bio"),
    city: formData.get("city"),
    experienceYears: formData.get("experienceYears"),
    languageBackground: formData.get("languageBackground") || undefined,
    preferredFunctions: formData.getAll("preferredFunctions"),
    preferredCategories: formData.getAll("preferredCategories"),
    preferredSeniority: formData.getAll("preferredSeniority"),
    preferredLocations: String(formData.get("preferredLocations") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    preferredRemote: formData.getAll("preferredRemote"),
    preferredContracts: formData.getAll("preferredContracts"),
    salaryExpectationMin: formData.get("salaryExpectationMin") || "",
    salaryExpectationCurrency: formData.get("salaryExpectationCurrency") || undefined,
  });
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Sprawdź formularz." };

  const profileResult = await client
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: `${parsed.data.firstName} ${parsed.data.lastName}`,
    })
    .eq("id", user.id);
  if (profileResult.error) return { ok: false, message: "Nie udało się zapisać nazwy profilu." };
  const { error } = await client.from("candidate_profiles").upsert({
    user_id: user.id,
    headline: parsed.data.headline,
    bio: parsed.data.bio,
    city: parsed.data.city,
    experience_years: parsed.data.experienceYears,
    language_background: parsed.data.languageBackground || null,
    preferred_functions: parsed.data.preferredFunctions,
    preferred_categories: parsed.data.preferredCategories,
    preferred_seniority: parsed.data.preferredSeniority,
    preferred_locations: parsed.data.preferredLocations,
    preferred_remote: parsed.data.preferredRemote,
    preferred_contracts: parsed.data.preferredContracts,
    salary_expectation_min: parsed.data.salaryExpectationMin || null,
    salary_expectation_currency: parsed.data.salaryExpectationMin
      ? (parsed.data.salaryExpectationCurrency ?? "PLN")
      : null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: "Nie udało się zapisać profilu." };
  revalidatePath("/app/profil");
  await captureAnalytics(user.id, {
    event: "candidate_profile_updated",
    properties: { section: "profile" },
  });
  return { ok: true, message: "Profil zapisany." };
}

export async function addExperience(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const { client, user } = await requireProfile(["candidate"]);
  const parsed = experienceSchema.safeParse({
    id: formData.get("id") || "",
    title: formData.get("title"),
    companyName: formData.get("companyName"),
    description: formData.get("description"),
    measurableOutcome: formData.get("measurableOutcome") || undefined,
  });
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Sprawdź doświadczenie." };
  const values = {
    title: parsed.data.title,
    company_name: parsed.data.companyName,
    description: parsed.data.description,
    measurable_outcome: parsed.data.measurableOutcome || null,
    updated_at: new Date().toISOString(),
  };
  const query = parsed.data.id
    ? client
        .from("candidate_experiences")
        .update(values)
        .eq("id", parsed.data.id)
        .eq("user_id", user.id)
    : client.from("candidate_experiences").insert({ ...values, user_id: user.id });
  const { error } = await query;
  if (error) return { ok: false, message: "Nie udało się dodać doświadczenia." };
  revalidatePath("/app/profil");
  await captureAnalytics(user.id, {
    event: "candidate_profile_updated",
    properties: { section: "experience" },
  });
  return {
    ok: true,
    message: parsed.data.id ? "Doświadczenie zapisane." : "Doświadczenie dodane.",
  };
}

export async function addWorkSample(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const { client, user } = await requireProfile(["candidate"]);
  const parsed = workSampleSchema.safeParse({
    id: formData.get("id") || "",
    title: formData.get("title"),
    url: formData.get("url"),
    context: formData.get("context"),
    outcome: formData.get("outcome"),
  });
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Sprawdź próbkę pracy." };
  const values = {
    title: parsed.data.title,
    url: parsed.data.url || null,
    context: parsed.data.context,
    outcome: parsed.data.outcome,
    updated_at: new Date().toISOString(),
  };
  const query = parsed.data.id
    ? client
        .from("candidate_work_samples")
        .update(values)
        .eq("id", parsed.data.id)
        .eq("user_id", user.id)
    : client.from("candidate_work_samples").insert({ ...values, user_id: user.id });
  const { error } = await query;
  if (error) return { ok: false, message: "Nie udało się dodać próbki pracy." };
  revalidatePath("/app/profil");
  await captureAnalytics(user.id, {
    event: "candidate_profile_updated",
    properties: { section: "work_sample" },
  });
  return { ok: true, message: parsed.data.id ? "Próbka pracy zapisana." : "Próbka pracy dodana." };
}

export async function deleteCandidateItem(formData: FormData) {
  const { client, user } = await requireProfile(["candidate"]);
  const parsed = candidateItemActionSchema.safeParse({
    id: formData.get("id"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) return;
  const table =
    parsed.data.kind === "experience" ? "candidate_experiences" : "candidate_work_samples";
  await client.from(table).delete().eq("id", parsed.data.id).eq("user_id", user.id);
  revalidatePath("/app/profil");
  await captureAnalytics(user.id, {
    event: "candidate_profile_updated",
    properties: { section: parsed.data.kind === "experience" ? "experience" : "work_sample" },
  });
}

export async function moveCandidateItem(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const { client } = await requireProfile(["candidate"]);
  const parsed = candidateItemActionSchema.safeParse({
    id: formData.get("id"),
    kind: formData.get("kind"),
    direction: formData.get("direction"),
  });
  if (!parsed.success || !parsed.data.direction)
    return { ok: false, message: "Nieprawidłowa zmiana kolejności." };
  const { error } = await client.rpc("move_candidate_item", {
    target_id: parsed.data.id,
    item_kind: parsed.data.kind,
    direction: parsed.data.direction,
  });
  if (error) return { ok: false, message: "Nie udało się zmienić kolejności. Spróbuj ponownie." };
  revalidatePath("/app/profil");
  return { ok: true, message: "Kolejność zapisana." };
}

export async function uploadCandidateCv(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const { client, user } = await requireProfile(["candidate"]);
  const parsed = candidateCvSchema.safeParse({ cv: formData.get("cv") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Sprawdź plik." };
  }
  const file = parsed.data.cv;
  const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (header !== "%PDF-") return { ok: false, message: "Plik nie jest poprawnym dokumentem PDF." };
  const { data: previousDocument } = await client
    .from("candidate_documents")
    .select("storage_path")
    .eq("user_id", user.id)
    .maybeSingle();
  const storagePath = `${user.id}/${crypto.randomUUID()}.pdf`;
  const upload = await client.storage.from("candidate-cv").upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
    cacheControl: "3600",
  });
  if (upload.error) return { ok: false, message: "Nie udało się bezpiecznie zapisać CV." };

  const metadata = await client.from("candidate_documents").upsert({
    user_id: user.id,
    storage_path: storagePath,
    file_name: file.name.slice(0, 180),
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_at: new Date().toISOString(),
  });
  if (metadata.error) {
    await client.storage.from("candidate-cv").remove([storagePath]);
    return { ok: false, message: "Nie udało się zapisać informacji o CV." };
  }
  if (previousDocument)
    await client.storage.from("candidate-cv").remove([previousDocument.storage_path]);
  revalidatePath("/app/profil");
  await captureAnalytics(user.id, {
    event: "candidate_profile_updated",
    properties: { section: "cv" },
  });
  return { ok: true, message: "CV zapisane. Możesz je w każdej chwili podmienić." };
}

export async function removeCandidateCv(
  _previous: CandidateActionState,
  _formData: FormData,
): Promise<CandidateActionState> {
  void _previous;
  void _formData;
  const { client, user } = await requireProfile(["candidate"]);
  const { data } = await client
    .from("candidate_documents")
    .select("storage_path")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return { ok: true, message: "Nie masz zapisanego CV." };

  const removed = await client.storage.from("candidate-cv").remove([data.storage_path]);
  if (removed.error) return { ok: false, message: "Nie udało się usunąć pliku CV." };
  const deleted = await client.from("candidate_documents").delete().eq("user_id", user.id);
  if (deleted.error)
    return { ok: false, message: "Plik usunięto, ale metadane wymagają odświeżenia." };
  revalidatePath("/app/profil");
  await captureAnalytics(user.id, {
    event: "candidate_profile_updated",
    properties: { section: "cv" },
  });
  return { ok: true, message: "CV usunięte." };
}

export async function requestAccountDeletion(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const { client, user } = await requireProfile(["candidate"]);
  const parsed = accountIdentitySchema.safeParse({ password: formData.get("password") });
  if (!parsed.success || !user.email) return { ok: false, message: "Potwierdź aktualne hasło." };
  const verified = await client.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });
  if (verified.error) return { ok: false, message: "Nie udało się potwierdzić hasła." };
  const { error } = await client.from("account_deletion_requests").upsert({
    user_id: user.id,
    status: "pending",
    requested_at: new Date().toISOString(),
    cancelled_at: null,
  });
  if (error) return { ok: false, message: "Nie udało się zapisać prośby o usunięcie konta." };
  revalidatePath("/app/settings");
  return { ok: true, message: "Prośba zapisana. Możesz ją anulować do czasu realizacji." };
}

export async function changeCandidateEmail(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const { client, user } = await requireProfile(["candidate"]);
  const parsed = accountIdentitySchema.safeParse({
    password: formData.get("password"),
    email: formData.get("email"),
  });
  if (!parsed.success || !parsed.data.email || !user.email)
    return { ok: false, message: "Sprawdź adres e-mail i aktualne hasło." };
  const verified = await client.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });
  if (verified.error) return { ok: false, message: "Nie udało się potwierdzić hasła." };
  const updated = await client.auth.updateUser({ email: parsed.data.email });
  return updated.error
    ? { ok: false, message: "Nie udało się zmienić adresu. Spróbuj ponownie." }
    : {
        ok: true,
        message: "Sprawdź obie skrzynki i potwierdź zmianę adresu zgodnie z wiadomością.",
      };
}

export async function cancelAccountDeletion(
  _previous: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  void formData;
  const { client, user } = await requireProfile(["candidate"]);
  const { error } = await client
    .from("account_deletion_requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "pending");
  if (error) return { ok: false, message: "Nie udało się anulować prośby." };
  revalidatePath("/app/settings");
  return { ok: true, message: "Prośba o usunięcie konta została anulowana." };
}
