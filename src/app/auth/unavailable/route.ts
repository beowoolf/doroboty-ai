import { NextResponse } from "next/server";

// Fail closed if a credential form is submitted before its client handler is ready.
// Never read, reflect, log or redirect with the submitted credential body.
export function POST() {
  return new NextResponse(
    '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Logowanie niedostępne</title><main><h1>Nie udało się uruchomić logowania</h1><p>Włącz JavaScript i odśwież stronę logowania. Twoje dane nie zostały użyte.</p><a href="/auth/sign-in">Wróć do logowania</a></main></html>',
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
