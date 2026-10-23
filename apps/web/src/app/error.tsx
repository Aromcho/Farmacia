'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <h1 className="display-2 text-ink">Algo no cargó bien</h1>
      <p className="mt-3 max-w-md text-ink-soft">Puede ser la conexión o un problema momentáneo del servidor. Probá de nuevo en unos segundos.</p>
      <button type="button" onClick={reset} className="mt-8 inline-flex h-12 items-center rounded-full bg-teal-strong px-6 font-semibold text-white">
        Reintentar
      </button>
    </main>
  );
}
