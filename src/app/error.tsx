"use client";

import { startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Route-level fallback. The root layout is still mounted, so existing Bag It
 * classes are available. The Error argument is accepted and ignored.
 */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  function handleRetry(): void {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <section className="rounded-[1.75rem] border border-sky-100/80 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-bold tracking-wider text-[var(--ps-cyan,#20AEE5)] uppercase">
          Bag It
        </p>
        <h1 className="font-display mt-1 text-3xl font-extrabold text-[var(--ps-night-900)]">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-muted">
          No pudimos completar esta pantalla. Podés intentar nuevamente.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRetry}
            className="pedilo-action-primary min-h-12 rounded-full px-5 text-sm"
          >
            Intentar nuevamente
          </button>
          <Link
            href="/"
            className="pedilo-action-secondary inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm"
          >
            Volver a Bag It
          </Link>
        </div>
      </section>
    </main>
  );
}
