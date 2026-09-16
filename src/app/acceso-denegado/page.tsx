import Link from "next/link";
import { PublicBrandWordmark } from "@/components/storefront/public-brand-wordmark";

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <Link href="/" className="mb-8 w-fit" aria-label="Volver al inicio de Bag It">
        <PublicBrandWordmark size="header" tone="plain" />
      </Link>

      <section className="rounded-[1.75rem] border border-sky-100/80 bg-white p-6 text-center shadow-soft sm:p-8">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl"
          aria-hidden="true"
        >
          !
        </div>
        <p className="mt-5 text-xs font-bold tracking-wider text-[var(--ps-cyan)] uppercase">
          Acceso restringido
        </p>
        <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-[var(--ps-navy)]">
          No tenés acceso a esta sección
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Tu sesión sigue activa, pero esta cuenta no tiene permisos para entrar
          al panel administrativo.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="grad-btn inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-extrabold shadow-glow"
          >
            Volver al inicio
          </Link>
          <Link
            href="/cuenta"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-sky-200 bg-white px-6 text-sm font-bold text-[var(--ps-navy)] transition hover:bg-sky-50"
          >
            Ir a mi cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}
