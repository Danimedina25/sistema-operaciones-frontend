export function CommissionSummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="h-4 w-24 rounded bg-slate-200" />

          <div className="mt-4 h-8 w-32 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}