import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

const API_URL = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const ALLOWED = new Set(['catalog', 'content', 'store']);

/**
 * El panel llama a este endpoint después de guardar cambios para que el sitio
 * público los muestre al instante (invalida la caché de datos de Next).
 * Sólo funciona con una sesión válida del panel.
 */
export async function POST(req: NextRequest) {
  const me = await fetch(`${API_URL}/api/auth/me`, { headers: { cookie: req.headers.get('cookie') ?? '' }, cache: 'no-store' });
  if (!me.ok) return NextResponse.json({ message: 'Sesión requerida' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { tags?: string[] };
  const tags = (body.tags ?? []).filter((t) => ALLOWED.has(t));
  for (const t of tags) revalidateTag(t, { expire: 0 });
  return NextResponse.json({ revalidated: tags });
}
