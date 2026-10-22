"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/features/public/brand-mark";
import { captureBrowserAnalytics } from "@/features/analytics/client-event";
import {
  authPath,
  roleMatchesAudience,
  roleMismatchMessage,
  type AuthAudience,
  type AccountRole,
} from "./audience";
export type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";

const subscribeToHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

type AuthValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  privacyAccepted: boolean;
};
const copy = {
  "sign-in": {
    title: "Wracamy do roboty.",
    description: "Zaloguj się do swojej strefy.",
    action: "Zaloguj się",
  },
  "sign-up": {
    title: "Zacznij od konkretu.",
    description:
      "Załóż konto kandydata. Bez linku aktywacyjnego — po rejestracji przejdziesz do profilu.",
    action: "Załóż konto",
  },
  "forgot-password": {
    title: "Odzyskaj dostęp.",
    description: "Wyślemy link do ustawienia nowego hasła.",
    action: "Wyślij link",
  },
  "update-password": {
    title: "Ustaw nowe hasło.",
    description: "Wybierz hasło z co najmniej 8 znakami.",
    action: "Zapisz hasło",
  },
};
export function AuthForm({
  mode,
  linkError = false,
  nextPath = "/app",
  audience = null,
  signedInRole = null,
  roleError = false,
}: {
  mode: AuthMode;
  linkError?: boolean;
  nextPath?: string;
  audience?: AuthAudience;
  signedInRole?: AccountRole | null;
  roleError?: boolean;
}) {
  const hydrated = useSyncExternalStore(subscribeToHydration, hydratedSnapshot, serverSnapshot);
  const [message, setMessage] = useState("");
  const [currentRole, setCurrentRole] = useState(signedInRole);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const wrongAccount =
    mode === "sign-in" && currentRole && !roleMatchesAudience(currentRole, audience);
  const router = useRouter();
  const schema = z
    .object({
      firstName: z.string().trim().max(80),
      lastName: z.string().trim().max(120),
      email: z.string(),
      password: z.string(),
      privacyAccepted: z.boolean(),
    })
    .superRefine((values, context) => {
      if (mode === "sign-up" && !values.firstName)
        context.addIssue({ code: "custom", path: ["firstName"], message: "Podaj imię." });
      if (mode === "sign-up" && !values.lastName)
        context.addIssue({ code: "custom", path: ["lastName"], message: "Podaj nazwisko." });
      if (mode !== "update-password" && !z.email().safeParse(values.email).success)
        context.addIssue({
          code: "custom",
          path: ["email"],
          message: "Podaj prawidłowy adres e-mail.",
        });
      if (mode !== "forgot-password" && values.password.length < (mode === "sign-in" ? 1 : 8))
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Podaj hasło — dla nowego konta co najmniej 8 znaków.",
        });
      if (mode === "sign-up" && !values.privacyAccepted)
        context.addIssue({
          code: "custom",
          path: ["privacyAccepted"],
          message: "Zaakceptuj politykę prywatności.",
        });
    });
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      privacyAccepted: false,
    },
    mode: "onBlur",
  });
  async function submit(values: AuthValues) {
    setMessage("");
    try {
      const client = browserClient();
      const callback = `${window.location.origin}/auth/callback`;
      if (mode === "sign-in") {
        const { data, error } = await client.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        if (audience) {
          const { data: profile, error: profileError } = await client
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
          if (profileError || !profile) throw new Error("Profile unavailable");
          if (!roleMatchesAudience(profile.role, audience)) {
            setCurrentRole(profile.role);
            router.refresh();
            return;
          }
        }
        router.push(nextPath);
        router.refresh();
      }
      if (mode === "sign-up") {
        if (audience === "employer") throw new Error("Employer signup is not supported");
        const onboardingPath = `/app/onboarding?next=${encodeURIComponent(nextPath)}`;
        const { data, error } = await client.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${callback}?next=${encodeURIComponent(onboardingPath)}`,
            data: {
              first_name: values.firstName.trim(),
              last_name: values.lastName.trim(),
              display_name: `${values.firstName.trim()} ${values.lastName.trim()}`,
              privacy_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          void captureBrowserAnalytics({ event: "registration_completed", properties: {} });
          router.push(onboardingPath);
          router.refresh();
          return;
        }
        setMessage(
          "Sprawdź skrzynkę. Jeśli konto wymaga potwierdzenia, znajdziesz tam link aktywacyjny.",
        );
      }
      if (mode === "forgot-password") {
        const { error } = await client.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${callback}?next=${encodeURIComponent(authPath("update-password", audience, nextPath))}`,
        });
        if (error) throw error;
        setMessage(
          "Jeśli konto istnieje, wyślemy wiadomość z linkiem do zmiany hasła. Sprawdź też spam.",
        );
      }
      if (mode === "update-password") {
        const { error } = await client.auth.updateUser({ password: values.password });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
      }
    } catch {
      setError("root", {
        message:
          mode === "sign-in"
            ? "Nie udało się zalogować. Sprawdź e-mail i hasło."
            : "Nie udało się wykonać tej operacji. Spróbuj ponownie za chwilę.",
      });
    }
  }
  async function switchAccount() {
    setSwitchingAccount(true);
    try {
      const { error } = await browserClient().auth.signOut({ scope: "local" });
      if (error) throw error;
      resetField("email");
      resetField("password");
      clearErrors();
      setCurrentRole(null);
      router.refresh();
    } catch {
      setError("root", { message: "Nie udało się wylogować. Spróbuj ponownie." });
    } finally {
      setSwitchingAccount(false);
    }
  }
  return (
    <main className="auth-layout">
      <div className="auth-aside">
        <Link href="/" className="brand">
          <BrandMark />
          DoRoboty.ai
        </Link>
        <div>
          <h2>
            Pokaż,
            <br />
            co dowozisz.
          </h2>
          <p>Liczy się doświadczenie, decyzja i wynik.</p>
        </div>
        <span>DoRoboty.ai</span>
      </div>
      <div className="auth-content">
        <Link href="/oferty" className="text-link">
          <ArrowLeft size={16} />
          Wróć do ofert
        </Link>
        <div className="auth-form">
          <h1>
            {mode === "sign-in" && audience
              ? audience === "employer"
                ? "Logowanie dla firm"
                : "Logowanie kandydata"
              : copy[mode].title}
          </h1>
          <p className="lede">
            {mode === "sign-in" && audience
              ? audience === "employer"
                ? "Zaloguj się kontem pracodawcy, aby zarządzać ofertami i kandydatami."
                : "Zaloguj się, aby uzupełnić profil i aplikować na oferty."
              : copy[mode].description}
          </p>
          {linkError && (
            <p role="alert" className="error-message mb-6">
              Ten link jest nieprawidłowy albo wygasł. Poproś o nowy lub zaloguj się.
            </p>
          )}
          {wrongAccount ? (
            <div className="form-stack">
              <p role="alert" className="error-message">
                {roleMismatchMessage(audience)}
              </p>
              {errors.root && (
                <p role="alert" className="error-message">
                  {errors.root.message}
                </p>
              )}
              <Button onClick={switchAccount} disabled={switchingAccount}>
                {switchingAccount ? "Wylogowywanie…" : "Zaloguj się na inne konto"}
              </Button>
              <Link className="text-link" href="/app">
                Wróć do mojego konta
              </Link>
            </div>
          ) : message ? (
            <div role="status" className="success-panel">
              <p>{message}</p>
              <Link className="text-link mt-5" href={authPath("sign-in", audience, nextPath)}>
                Przejdź do logowania <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form
              method="post"
              action="/auth/unavailable"
              noValidate
              onSubmit={handleSubmit(submit)}
            >
              {!hydrated && (
                <p role="status" className="text-sm text-muted-foreground">
                  Uruchamianie formularza. Jeśli pola pozostają nieaktywne, włącz JavaScript i
                  odśwież stronę.
                </p>
              )}
              <noscript>
                <p role="alert" className="error-message">
                  Logowanie wymaga JavaScriptu. Włącz go i odśwież stronę. Dane nie zostały wysłane.
                </p>
              </noscript>
              <fieldset className="form-stack min-w-0" disabled={!hydrated}>
                {roleError && !currentRole && (
                  <p role="alert" className="error-message">
                    Zaloguj się kontem odpowiednim dla tej strefy.
                  </p>
                )}
                {mode === "sign-up" && (
                  <div className="grid gap-[var(--gui-space-s)] sm:grid-cols-2">
                    <div className="field">
                      <Label htmlFor="firstName">Imię</Label>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? "first-name-error" : undefined}
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <p id="first-name-error" className="error-message">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="field">
                      <Label htmlFor="lastName">Nazwisko</Label>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? "last-name-error" : undefined}
                        {...register("lastName")}
                      />
                      {errors.lastName && (
                        <p id="last-name-error" className="error-message">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {mode !== "update-password" && (
                  <div className="field">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p id="email-error" className="error-message">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                )}
                {mode !== "forgot-password" && (
                  <div className="field">
                    <Label htmlFor="password">Hasło</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      {...register("password")}
                    />
                    {errors.password && (
                      <p id="password-error" className="error-message">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}
                {mode === "sign-up" && (
                  <div className="field">
                    <label className="flex items-start gap-[var(--gui-space-xs)] text-sm">
                      <input
                        className="mt-0.5 size-4 accent-[var(--gui-color-1)]"
                        type="checkbox"
                        aria-invalid={!!errors.privacyAccepted}
                        aria-describedby={errors.privacyAccepted ? "privacy-error" : undefined}
                        {...register("privacyAccepted")}
                      />
                      <span>
                        Akceptuję{" "}
                        <Link className="text-link" href="/polityka-prywatnosci" target="_blank">
                          politykę prywatności
                        </Link>
                        .
                      </span>
                    </label>
                    {errors.privacyAccepted && (
                      <p id="privacy-error" className="error-message">
                        {errors.privacyAccepted.message}
                      </p>
                    )}
                  </div>
                )}
                {errors.root && (
                  <p role="alert" className="error-message">
                    {errors.root.message}
                  </p>
                )}
                <Button type="submit" disabled={!hydrated || isSubmitting}>
                  {isSubmitting ? "Chwila…" : copy[mode].action}
                  <ArrowRight size={16} />
                </Button>
              </fieldset>
            </form>
          )}
          <div className="auth-links">
            {mode === "sign-in" ? (
              <>
                <Link href={authPath("forgot-password", audience, nextPath)}>
                  Nie pamiętam hasła
                </Link>
                {audience !== "employer" && (
                  <Link href={authPath("sign-up", "candidate", nextPath)}>
                    Załóż konto kandydata
                  </Link>
                )}
                <Link
                  href={authPath(
                    "sign-in",
                    audience === "employer" ? "candidate" : "employer",
                    audience === "employer" ? "/app" : "/app/oferty",
                  )}
                >
                  {audience === "employer"
                    ? "Szukasz pracy? Logowanie kandydata"
                    : "Rekrutujesz? Logowanie dla firm"}
                </Link>
              </>
            ) : (
              <Link href={authPath("sign-in", audience, nextPath)}>Mam już konto</Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
