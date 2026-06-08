export function CommissionOperationsTableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="animate-pulse p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="mb-3 h-16 rounded-xl bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}