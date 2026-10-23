import Link from 'next/link';
import { LedCross } from '@/components/brand/led-cross';

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-night px-6 text-center text-white">
      <div className="w-36">
        <LedCross lit={false} label="Cruz de farmacia apagada" />
      </div>
      <h1 className="display-2 mt-10">Esta página no existe</h1>
      <p className="mt-3 max-w-md text-white/70">Puede que el producto ya no esté publicado o que el enlace tenga un error. Buscalo en el catálogo o escribinos.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex h-12 items-center rounded-full bg-white px-6 font-semibold text-ink">
          Ir al inicio
        </Link>
        <Link href="/catalogo" className="inline-flex h-12 items-center rounded-full bg-white/10 px-6 font-semibold text-white ring-1 ring-white/20">
          Ver catálogo
        </Link>
      </div>
    </main>
  );
}
