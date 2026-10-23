export default function Loading() {
  return (
    <div className="pt-[calc(var(--header-h)+env(safe-area-inset-top))] lg:container-x lg:pt-[calc(var(--header-h)+2.5rem)]">
      <div className="lg:grid lg:grid-cols-2 lg:gap-14">
        <div className="aspect-[4/5] animate-pulse bg-foam lg:rounded-[2rem]" />
        <div className="container-x pt-6 lg:px-0">
          <div className="h-4 w-24 animate-pulse rounded bg-foam" />
          <div className="mt-3 h-10 w-3/4 animate-pulse rounded-xl bg-foam" />
          <div className="mt-6 h-28 animate-pulse rounded-[1.4rem] bg-foam" />
        </div>
      </div>
    </div>
  );
}
