"use client";

import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmployerJob,
  type EmployerJobActionState,
} from "@/features/jobs/employer-job-actions";
import {
  categoryLabels,
  contractLabels,
  functionLabels,
  remoteLabels,
  seniorityLabels,
} from "@/features/jobs/presentation";

const initialState: EmployerJobActionState = { ok: false, message: "" };
const FormState = createContext(initialState);
const options = (values: Record<string, string>) =>
  Object.entries(values).map(([value, label]) => ({ value, label }));

export function EmployerJobForm() {
  const [state, action, pending] = useActionState(createEmployerJob, initialState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.ok && state.field) {
      const field = form.current?.elements.namedItem(state.field);
      if (field instanceof HTMLElement) field.focus();
    }
  }, [state]);
  return (
    <FormState value={state}>
      <details
        className="rounded-xl bg-card shadow-[var(--gui-shadow-m)]"
        open={state.message ? !state.ok : undefined}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 font-ui text-lg font-semibold">
          Dodaj ofertę ręcznie
          <span className="grid size-9 place-items-center rounded-full bg-[var(--gui-color-1)] text-[var(--gui-accent-text-accessible)]">
            <Plus className="size-4" />
          </span>
        </summary>
        <form
          key={state.revision ?? 0}
          ref={form}
          action={action}
          className="form-stack px-6 pb-6 pt-0"
        >
          <p className="text-sm text-muted-foreground">
            Oferta zapisze się jako „do weryfikacji”. Nie opublikujemy jej automatycznie.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nazwa stanowiska" name="title" required />
            <Field label="Slug" name="slug" placeholder="np. ai-product-manager" required />
          </div>
          <TextField label="Krótkie podsumowanie" name="summary" rows={3} required />
          <TextField label="Pełny opis" name="description" rows={9} required />
          <fieldset className="grid gap-4 rounded-lg bg-secondary p-4">
            <legend className="px-1 font-ui text-sm font-semibold">
              Brief źródłowy (opcjonalnie)
            </legend>
            <p className="text-sm text-muted-foreground">
              Zachowaj kontekst, który nie powinien zginąć w ogłoszeniu. Brief pozostaje prywatny i
              może później zasilić generator szkicu.
            </p>
            <TextField
              label="Kontekst, potrzeba i oczekiwany rezultat"
              name="sourceBrief"
              rows={6}
              placeholder="Dlaczego otwieramy rolę, jaki problem ma rozwiązać i po czym poznamy sukces?"
            />
            <TextField
              label="Kryteria decyzji — jedno w wierszu"
              name="decisionCriteria"
              rows={4}
              placeholder={"Doświadczenie produkcyjne\nMierzalny efekt\nWspółpraca z biznesem"}
            />
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SelectField label="Kategoria" name="category" options={options(categoryLabels)} />
            <SelectField label="Funkcja" name="function" options={options(functionLabels)} />
            <SelectField label="Tryb pracy" name="remoteStatus" options={options(remoteLabels)} />
            <SelectField label="Poziom" name="seniority" options={options(seniorityLabels)} />
            <SelectField label="Umowa" name="contractType" options={options(contractLabels)} />
            <Field label="Lokalizacje" name="locations" placeholder="Warszawa, Kraków" required />
          </div>
          <fieldset className="grid gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-2 xl:grid-cols-5">
            <legend className="px-1 font-ui text-sm font-medium">Widełki (opcjonalnie)</legend>
            <Field label="Od" name="salaryMin" type="number" min="1" />
            <Field label="Do" name="salaryMax" type="number" min="1" />
            <SelectField
              label="Waluta"
              name="salaryCurrency"
              options={[
                { value: "PLN", label: "PLN" },
                { value: "EUR", label: "EUR" },
              ]}
            />
            <SelectField
              label="Okres"
              name="salaryPeriod"
              options={[
                { value: "month", label: "Miesiąc" },
                { value: "year", label: "Rok" },
              ]}
            />
            <SelectField
              label="Rodzaj"
              name="salaryKind"
              options={[
                { value: "gross", label: "Brutto" },
                { value: "net", label: "Netto" },
              ]}
            />
          </fieldset>
          <Field label="Ważna do (opcjonalnie)" name="expiryAt" type="date" />
          {state.message ? (
            <p
              id="employer-job-error"
              role={state.ok ? "status" : "alert"}
              className={state.ok ? "success-panel" : "error-message"}
            >
              {state.message}
            </p>
          ) : null}
          <Button className="w-fit" type="submit" disabled={pending}>
            <Plus className="size-4" /> {pending ? "Zapisuję…" : "Dodaj do weryfikacji"}
          </Button>
        </form>
      </details>
    </FormState>
  );
}

function Field({
  label,
  name,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  const state = useContext(FormState);
  return (
    <div className="field">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={state.values?.[name] ?? ""}
        aria-invalid={state.field === name}
        aria-describedby={state.field === name ? "employer-job-error" : undefined}
        {...props}
      />
    </div>
  );
}

function TextField({
  label,
  name,
  ...props
}: React.ComponentProps<typeof Textarea> & { label: string; name: string }) {
  const state = useContext(FormState);
  return (
    <div className="field">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        defaultValue={state.values?.[name] ?? ""}
        aria-invalid={state.field === name}
        aria-describedby={state.field === name ? "employer-job-error" : undefined}
        {...props}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options: selectOptions,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  const state = useContext(FormState);
  return (
    <div className="field">
      <Label htmlFor={name}>{label}</Label>
      <FormSelect
        id={name}
        name={name}
        defaultValue={state.values?.[name] ?? selectOptions[0]?.value}
        options={selectOptions}
      />
    </div>
  );
}
