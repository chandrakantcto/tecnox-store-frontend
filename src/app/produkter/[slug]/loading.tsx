export default function ProductDetailLoading() {
  return (
    <main className="bg-[var(--color-stone)] min-h-screen animate-pulse">
      <div className="h-9 bg-[var(--dark-bg)]" />
      <div className="h-[72px] border-b border-[var(--color-divider)] bg-[var(--color-stone)]" />

      <div className="container-x py-4 mt-5">
        <div className="h-3 w-48 rounded bg-[var(--color-divider)]" />
      </div>

      <div className="container-x grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-10 pb-16">
        <aside className="hidden lg:block space-y-2">
          <div className="h-12 rounded bg-[#3eb1f0]/40" />
          <div className="h-64 rounded border border-[var(--color-divider)] bg-white" />
        </aside>

        <div className="min-w-0 grid lg:grid-cols-2 gap-10 bg-[#fbf9f7] p-5">
          <div className="aspect-[4/3] rounded bg-white border border-[var(--color-divider)]" />
          <div className="space-y-4">
            <div className="h-3 w-24 rounded bg-[var(--color-divider)]" />
            <div className="h-8 w-4/5 rounded bg-[var(--color-divider)]" />
            <div className="h-4 w-full rounded bg-[var(--color-divider)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--color-divider)]" />
            <div className="h-10 w-40 rounded bg-[var(--color-copper)]/30 mt-6" />
            <div className="h-12 w-full rounded bg-[var(--color-divider)] mt-8" />
          </div>
        </div>
      </div>
    </main>
  );
}
