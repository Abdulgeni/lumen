export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-secondary" />
      <div className="grid gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-3xl bg-secondary/60" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-secondary/40" />
    </div>
  );
}
