"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import {
  addExperience,
  addWorkSample,
  saveCandidateProfile,
  uploadCandidateCv,
  removeCandidateCv,
  deleteCandidateItem,
  moveCandidateItem,
  type CandidateActionState,
} from "@/features/candidates/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/form-select";

const initialState: CandidateActionState = { ok: false, message: "" };

export function CandidateCvForm({
  document,
}: {
  document?: { fileName: string; sizeBytes: number; uploadedAt: string; downloadUrl?: string };
}) {
  const [selectedFile, setSelectedFile] = useState("");
  const [uploadState, uploadAction, uploading] = useActionState(uploadCandidateCv, initialState);
  const [removeState, removeAction, removing] = useActionState(removeCandidateCv, initialState);
  const state = removeState.message ? removeState : uploadState;
  return (
    <section className="rounded-xl bg-card p-[var(--gui-space-l)] shadow-[var(--gui-shadow-m)]">
      <h2>Twoje CV</h2>
      <p className="mt-[var(--gui-space-xs)] text-sm text-muted-foreground">
        Prywatny PDF do 5 MB. Pracodawca otrzyma dostęp do wskazanej wersji dopiero po wysłaniu
        aplikacji.
      </p>
      {document ? (
        <div className="mt-[var(--gui-space-m)] rounded-lg bg-muted/50 p-[var(--gui-space-m)]">
          <strong className="block font-ui text-sm">{document.fileName}</strong>
          <span className="mt-[var(--gui-space-xxs)] block text-xs text-muted-foreground">
            {document.sizeBytes < 1024 * 1024
              ? `${Math.max(1, Math.ceil(document.sizeBytes / 1024))} KB`
              : `${(document.sizeBytes / 1024 / 1024).toFixed(2)} MB`}{" "}
            · dodano {new Intl.DateTimeFormat("pl-PL").format(new Date(document.uploadedAt))}
          </span>
          <div className="mt-[var(--gui-space-s)] flex flex-wrap gap-[var(--gui-space-s)]">
            {document.downloadUrl ? (
              <a className="text-link" href={document.downloadUrl} target="_blank" rel="noreferrer">
                Otwórz CV
              </a>
            ) : null}
            <form
              action={removeAction}
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    "Usunąć CV z profilu? Wysłane wcześniej aplikacje zachowają swoją wersję.",
                  )
                )
                  event.preventDefault();
              }}
            >
              <Button variant="ghost" size="sm" type="submit" disabled={removing}>
                Usuń
              </Button>
            </form>
          </div>
        </div>
      ) : null}
      <form action={uploadAction} className="form-stack mt-[var(--gui-space-m)]">
        <div className="field">
          <Label>{document ? "Podmień CV" : "Dodaj CV"}</Label>
          <label
            className={`${buttonVariants({ variant: "outline" })} relative w-fit cursor-pointer`}
          >
            <Upload className="size-4" /> Wybierz PDF
            <input
              className="absolute inset-0 cursor-pointer opacity-0"
              id="cv"
              name="cv"
              type="file"
              accept="application/pdf,.pdf"
              required
              onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")}
            />
          </label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {selectedFile || "Nie wybrano pliku"}
          </span>
        </div>
        <ActionMessage state={state} />
        <Button className="w-fit" type="submit" disabled={uploading}>
          {uploading ? "Wysyłam…" : document ? "Podmień plik" : "Dodaj CV"}
        </Button>
      </form>
    </section>
  );
}

export function CandidateProfileForm({ profile }: { profile: Record<string, unknown> }) {
  const [state, action, pending] = useActionState(saveCandidateProfile, initialState);
  return (
    <form
      action={action}
      className="form-stack rounded-xl bg-card p-[var(--gui-space-l)] shadow-[var(--gui-shadow-m)]"
    >
      <h2>Profil kandydata</h2>
      <div className="grid gap-[var(--gui-space-s)] sm:grid-cols-2">
        <Field
          label="Imię"
          name="firstName"
          defaultValue={String(profile.first_name ?? "")}
          required
        />
        <Field
          label="Nazwisko"
          name="lastName"
          defaultValue={String(profile.last_name ?? "")}
          required
        />
      </div>
      <Field
        label="Nagłówek"
        name="headline"
        defaultValue={String(profile.headline ?? "")}
        required
      />
      <details>
        <summary className="cursor-pointer font-medium">Preferencje pracy</summary>
        <p className="mt-[var(--gui-space-xs)] text-sm text-muted-foreground">
          Te informacje służą Tobie i nie są przekazywane pracodawcy z aplikacją.
        </p>
        <div className="mt-[var(--gui-space-m)] grid gap-[var(--gui-space-m)]">
          <fieldset className="field">
            <legend className="font-ui text-sm font-medium">Interesujące funkcje</legend>
            <CheckboxOptions
              name="preferredFunctions"
              selected={asStringArray(profile.preferred_functions)}
              options={[
                ["product", "Product"],
                ["engineering", "Engineering"],
                ["data", "Data"],
                ["design", "Design"],
                ["marketing", "Marketing"],
                ["operations", "Operations"],
              ]}
            />
          </fieldset>
          <fieldset className="field">
            <legend className="font-ui text-sm font-medium">Typ roli</legend>
            <CheckboxOptions
              name="preferredCategories"
              selected={asStringArray(profile.preferred_categories)}
              options={[
                ["build", "Build"],
                ["apply", "Apply"],
                ["lead", "Lead"],
              ]}
            />
          </fieldset>
          <fieldset className="field">
            <legend className="font-ui text-sm font-medium">Poziom</legend>
            <CheckboxOptions
              name="preferredSeniority"
              selected={asStringArray(profile.preferred_seniority)}
              options={[
                ["junior", "Junior"],
                ["mid", "Mid"],
                ["senior", "Senior"],
                ["lead", "Lead"],
              ]}
            />
          </fieldset>
          <div className="grid gap-[var(--gui-space-s)] sm:grid-cols-2">
            <fieldset className="field">
              <legend className="font-ui text-sm font-medium">Tryb pracy</legend>
              <CheckboxOptions
                name="preferredRemote"
                selected={asStringArray(profile.preferred_remote)}
                options={[
                  ["remote", "Zdalnie"],
                  ["hybrid", "Hybrydowo"],
                  ["onsite", "Stacjonarnie"],
                ]}
              />
            </fieldset>
            <fieldset className="field">
              <legend className="font-ui text-sm font-medium">Umowa</legend>
              <CheckboxOptions
                name="preferredContracts"
                selected={asStringArray(profile.preferred_contracts)}
                options={[
                  ["employment", "Umowa o pracę"],
                  ["b2b", "B2B"],
                  ["mandate", "Zlecenie"],
                ]}
              />
            </fieldset>
          </div>
          <Field
            label="Preferowane lokalizacje (po przecinku)"
            name="preferredLocations"
            defaultValue={asStringArray(profile.preferred_locations).join(", ")}
            placeholder="Warszawa, Kraków"
          />
          <div className="grid gap-[var(--gui-space-s)] sm:grid-cols-[1fr_120px]">
            <Field
              label="Minimalne oczekiwane wynagrodzenie (opcjonalnie)"
              name="salaryExpectationMin"
              type="number"
              min="1"
              defaultValue={String(profile.salary_expectation_min ?? "")}
            />
            <div className="field">
              <Label htmlFor="salaryExpectationCurrency">Waluta</Label>
              <FormSelect
                id="salaryExpectationCurrency"
                name="salaryExpectationCurrency"
                defaultValue={String(profile.salary_expectation_currency ?? "PLN")}
                options={[
                  { value: "PLN", label: "PLN" },
                  { value: "EUR", label: "EUR" },
                ]}
              />
            </div>
          </div>
        </div>
      </details>
      <TextField label="O Tobie" name="bio" defaultValue={String(profile.bio ?? "")} required />
      <div className="grid gap-[var(--gui-space-m)] sm:grid-cols-2">
        <Field label="Miasto" name="city" defaultValue={String(profile.city ?? "")} required />
        <Field
          label="Lata doświadczenia"
          name="experienceYears"
          type="number"
          min="0"
          max="60"
          defaultValue={String(profile.experience_years ?? 0)}
          required
        />
      </div>
      <Field
        label="Kontekst językowy (opcjonalnie)"
        name="languageBackground"
        defaultValue={String(profile.language_background ?? "")}
      />
      <ActionMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Zapisuję…" : "Zapisz profil"}
      </Button>
    </form>
  );
}

export function ExperienceForm({ item }: { item?: Record<string, string | null> }) {
  const [state, action, pending] = useActionState(addExperience, initialState);
  return (
    <form
      action={action}
      className="form-stack rounded-xl bg-card p-[var(--gui-space-l)] shadow-[var(--gui-shadow-m)]"
    >
      <h2>{item ? "Edytuj doświadczenie" : "Dodaj doświadczenie"}</h2>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field
        id={`experience-title-${item?.id ?? "new"}`}
        label="Rola"
        name="title"
        defaultValue={item?.title ?? ""}
        required
      />
      <Field
        id={`experience-company-${item?.id ?? "new"}`}
        label="Firma lub projekt"
        name="companyName"
        defaultValue={item?.company_name ?? ""}
        required
      />
      <TextField
        id={`experience-description-${item?.id ?? "new"}`}
        label="Co zrobiłeś / zrobiłaś"
        name="description"
        required
        defaultValue={item?.description ?? ""}
      />
      <TextField
        id={`experience-outcome-${item?.id ?? "new"}`}
        label="Mierzalny efekt (opcjonalnie)"
        name="measurableOutcome"
        defaultValue={item?.measurable_outcome ?? ""}
      />
      <ActionMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Zapisuję…" : item ? "Zapisz zmiany" : "Dodaj doświadczenie"}
      </Button>
    </form>
  );
}

export function WorkSampleForm({ item }: { item?: Record<string, string | null> }) {
  const [state, action, pending] = useActionState(addWorkSample, initialState);
  return (
    <form
      action={action}
      className="form-stack rounded-xl bg-card p-[var(--gui-space-l)] shadow-[var(--gui-shadow-m)]"
    >
      <h2>{item ? "Edytuj próbkę pracy" : "Dodaj próbkę pracy"}</h2>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field
        id={`work-sample-title-${item?.id ?? "new"}`}
        label="Tytuł"
        name="title"
        defaultValue={item?.title ?? ""}
        required
      />
      <Field
        id={`work-sample-url-${item?.id ?? "new"}`}
        label="Link HTTPS (opcjonalnie)"
        name="url"
        type="url"
        defaultValue={item?.url ?? ""}
      />
      <TextField
        id={`work-sample-context-${item?.id ?? "new"}`}
        label="Kontekst"
        name="context"
        defaultValue={item?.context ?? ""}
        required
      />
      <TextField
        id={`work-sample-outcome-${item?.id ?? "new"}`}
        label="Wynik"
        name="outcome"
        defaultValue={item?.outcome ?? ""}
        required
      />
      <ActionMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Zapisuję…" : item ? "Zapisz zmiany" : "Dodaj próbkę"}
      </Button>
    </form>
  );
}

export function CandidateItemActions({
  id,
  kind,
  first,
  last,
}: {
  id: string;
  kind: "experience" | "work_sample";
  first: boolean;
  last: boolean;
}) {
  const [state, moveAction, pending] = useActionState(moveCandidateItem, initialState);
  return (
    <div className="flex flex-wrap gap-[var(--gui-space-xs)]">
      <form action={moveAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="direction" value="up" />
        <Button
          type="submit"
          variant="outline"
          size="icon-sm"
          disabled={first || pending}
          aria-label="Przenieś wyżej"
        >
          <ArrowUp />
        </Button>
      </form>
      <form action={moveAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="direction" value="down" />
        <Button
          type="submit"
          variant="outline"
          size="icon-sm"
          disabled={last || pending}
          aria-label="Przenieś niżej"
        >
          <ArrowDown />
        </Button>
      </form>
      <ActionMessage state={state} />
      <form
        action={deleteCandidateItem}
        onSubmit={(event) => {
          if (!window.confirm("Usunąć ten element profilu? Tej operacji nie można cofnąć.")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="kind" value={kind} />
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Usuń">
          <Trash2 />
        </Button>
      </form>
    </div>
  );
}

function CheckboxOptions({
  name,
  selected,
  options,
}: {
  name: string;
  selected: string[];
  options: [string, string][];
}) {
  return (
    <div className="mt-[var(--gui-space-xs)] flex flex-wrap gap-[var(--gui-space-xs)]">
      {options.map(([value, label]) => (
        <label
          key={value}
          className="flex items-center gap-[var(--gui-space-xs)] rounded-[var(--gui-radius-s)] bg-secondary px-[var(--gui-space-s)] py-[var(--gui-space-xs)] text-sm"
        >
          <input
            type="checkbox"
            name={name}
            value={value}
            defaultChecked={selected.includes(value)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function Field({
  label,
  name,
  id = name,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="field">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} {...props} />
    </div>
  );
}

function TextField({
  label,
  name,
  id = name,
  ...props
}: React.ComponentProps<typeof Textarea> & { label: string; name: string }) {
  return (
    <div className="field">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={name} rows={5} {...props} />
    </div>
  );
}

function ActionMessage({ state }: { state: CandidateActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={state.ok ? "success-panel" : "error-message"}
    >
      {state.message}
    </p>
  );
}
