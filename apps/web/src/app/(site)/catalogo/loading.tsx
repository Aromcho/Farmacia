export default function Loading() {
  return (
    <div className="container-x pb-20 pt-[calc(var(--header-h)+2.5rem)]">
      <div className="h-12 w-64 animate-pulse rounded-2xl bg-foam" />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse rounded-[1.4rem] bg-foam" />
            <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-foam" />
            <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-foam" />
          </div>
        ))}
      </div>
    </div>
  );
}
