import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <section className="rounded-[1.75rem] border border-sky-100/80 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-bold tracking-wider text-[var(--ps-cyan,#20AEE5)] uppercase">
          Bag It
        </p>
        <h1 className="font-display mt-1 text-3xl font-extrabold text-[var(--ps-night-900)]">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-muted">
          No encontramos la página que estás buscando.
        </p>
        <Link
          href="/"
          className="pedilo-action-primary mt-7 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm"
        >
          Volver a Bag It
        </Link>
      </section>
    </main>
  );
}
