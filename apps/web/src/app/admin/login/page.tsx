'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { LedCross } from '@/components/brand/led-cross';
import { Logo } from '@/components/brand/logo';
import { HttpError, post } from '@/lib/client-api';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await post('/auth/login', { email, password });
      const next = params.get('next');
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'No pudimos conectar con el servidor.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <Logo />
      <h1 className="mt-10 font-serif text-3xl text-ink">Panel de la farmacia</h1>
      <p className="mt-2 text-ink-soft">Ingresá para cargar productos, historias, horarios y ver los pedidos.</p>
      <label className="mt-8 block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" className="h-12 w-full rounded-2xl bg-white px-4 outline-none ring-1 ring-line focus:ring-2 focus:ring-teal-strong" />
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Contraseña</span>
        <span className="relative block">
          <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="h-12 w-full rounded-2xl bg-white px-4 pr-12 outline-none ring-1 ring-line focus:ring-2 focus:ring-teal-strong" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:bg-mist" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </span>
      </label>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl bg-[#fde8e6] px-3.5 py-2.5 text-sm font-medium text-[#912018]">
          {error}
        </motion.p>
      )}
      <button type="submit" disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-teal-strong font-semibold text-white transition hover:bg-teal-deep disabled:opacity-60">
        {loading && <Loader2 className="size-4 animate-spin" />}
        Ingresar
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex items-center justify-center bg-white px-6 py-16">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-night lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/hero-mist.webp" alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="relative w-64">
          <LedCross />
        </div>
      </div>
    </main>
  );
}
