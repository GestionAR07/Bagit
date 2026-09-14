"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Replaces the root layout. Keep this file self-contained: no Auth, DB,
 * Supabase, or app providers. Report the exception to Sentry without PII.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es-AR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#f7f6f3",
          color: "#083F66",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: "28rem",
            borderRadius: "1.75rem",
            border: "1px solid #d7eef6",
            background: "#ffffff",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#20AEE5",
            }}
          >
            Bag It
          </p>
          <h1
            style={{
              margin: "0.25rem 0 0",
              fontSize: "1.75rem",
              lineHeight: 1.15,
              fontWeight: 800,
            }}
          >
            Bag It no pudo cargar correctamente
          </h1>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.95rem" }}>
            Intentá nuevamente. Si el problema continúa, volvé a ingresar más
            tarde.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginTop: "1.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: "3rem",
                borderRadius: "999px",
                border: "1px solid rgba(8, 63, 102, 0.18)",
                background: "#20AEE5",
                color: "#083F66",
                fontWeight: 700,
                padding: "0 1.25rem",
                cursor: "pointer",
              }}
            >
              Intentar nuevamente
            </button>
            <Link
              href="/"
              style={{
                minHeight: "3rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "999px",
                border: "1px solid #b9d7e6",
                background: "#ffffff",
                color: "#083F66",
                fontWeight: 700,
                padding: "0 1.25rem",
                textDecoration: "none",
              }}
            >
              Volver a Bag It
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
