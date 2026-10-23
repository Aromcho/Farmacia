'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ImagesField, TagInput } from '@/components/admin/media';
import { Card, DeleteButton, Field, Input, LoadingBlock, MoneyInput, PageHeader, SaveBar, Select, Switch, Textarea } from '@/components/admin/ui';
import { useAdminMutation, useAdminQuery } from '@/lib/admin';
import { money, savingPct } from '@/lib/format';
import type { Brand, Category, Gender, Media, Product } from '@/lib/types';

interface FormState {
  name: string;
  brandId: string;
  categoryId: string;
  presentation: string;
  gender: Gender | '';
  price: number | null;
  cashPrice: number | null;
  compareAtPrice: number | null;
  showPrice: boolean;
  shortDescription: string;
  description: string;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  highlights: string[];
  tags: string[];
  attributes: [string, string][];
  featured: boolean;
  isNew: boolean;
  hasDecant: boolean;
  available: boolean;
  active: boolean;
  images: Media[];
}

const empty: FormState = {
  name: '', brandId: '', categoryId: '', presentation: '', gender: '', price: null, cashPrice: null, compareAtPrice: null, showPrice: true,
  shortDescription: '', description: '', notesTop: [], notesHeart: [], notesBase: [], highlights: [], tags: [], attributes: [],
  featured: false, isNew: true, hasDecant: false, available: true, active: true, images: [],
};

const fromProduct = (p: Product): FormState => ({
  name: p.name, brandId: p.brandId ?? '', categoryId: p.categoryId, presentation: p.presentation ?? '', gender: p.gender ?? '',
  price: p.price, cashPrice: p.cashPrice, compareAtPrice: p.compareAtPrice, showPrice: p.showPrice,
  shortDescription: p.shortDescription ?? '', description: p.description ?? '', notesTop: p.notesTop, notesHeart: p.notesHeart, notesBase: p.notesBase,
  highlights: p.highlights, tags: p.tags, attributes: Object.entries(p.attributes ?? {}),
  featured: p.featured, isNew: p.isNew, hasDecant: p.hasDecant, available: p.available, active: p.active, images: p.images.map((i) => i.media),
});

export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nuevo';
  const router = useRouter();
  const product = useAdminQuery<Product>(['admin-product', id], `/admin/products/${id}`, { enabled: !isNew });
  const cats = useAdminQuery<Category[]>(['admin-categories'], '/admin/categories');
  const brands = useAdminQuery<Brand[]>(['admin-brands'], '/admin/brands');
  const [form, setForm] = useState<FormState>(empty);
  const [initial, setInitial] = useState<FormState>(empty);
  const [newBrand, setNewBrand] = useState('');

  useEffect(() => {
    if (product.data) {
      const f = fromProduct(product.data);
      setForm(f);
      setInitial(f);
    }
  }, [product.data]);
  useEffect(() => {
    if (isNew && cats.data?.length && !form.categoryId) setForm((f) => ({ ...f, categoryId: cats.data![0].id }));
  }, [isNew, cats.data, form.categoryId]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const isPerfume = cats.data?.find((c) => c.id === form.categoryId)?.slug === 'perfumeria';

  const payload = () => ({
    name: form.name.trim(),
    brandId: form.brandId || null,
    categoryId: form.categoryId,
    presentation: form.presentation.trim() || null,
    gender: form.gender || null,
    price: form.price,
    cashPrice: form.cashPrice,
    compareAtPrice: form.compareAtPrice,
    showPrice: form.showPrice,
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim() || null,
    notesTop: form.notesTop, notesHeart: form.notesHeart, notesBase: form.notesBase,
    highlights: form.highlights, tags: form.tags,
    attributes: form.attributes.filter(([k, v]) => k.trim() && v.trim()).length ? Object.fromEntries(form.attributes.filter(([k, v]) => k.trim() && v.trim())) : null,
    featured: form.featured, isNew: form.isNew, hasDecant: form.hasDecant, available: form.available, active: form.active,
    imageIds: form.images.map((m) => m.id),
  });

  const save = useAdminMutation<unknown, Product>({
    method: isNew ? 'POST' : 'PATCH',
    path: isNew ? '/admin/products' : `/admin/products/${id}`,
    body: () => payload(),
    invalidate: [['admin-products'], ['admin-product', id], ['stats'], ['admin-categories']],
    publicTags: ['catalog', 'content'],
    success: isNew ? 'Producto creado' : 'Cambios guardados',
    onSuccess: (p) => {
      const f = fromProduct(p);
      setForm(f);
      setInitial(f);
      if (isNew) router.replace(`/admin/productos/${p.id}`);
    },
  });
  const remove = useAdminMutation({ method: 'DELETE', path: `/admin/products/${id}`, invalidate: [['admin-products'], ['stats']], publicTags: ['catalog'], success: 'Producto eliminado', onSuccess: () => router.replace('/admin/productos') });
  const createBrand = useAdminMutation<{ name: string }, Brand>({
    method: 'POST', path: '/admin/brands', invalidate: [['admin-brands']], success: 'Marca creada',
    onSuccess: (b) => { set('brandId', b.id); setNewBrand(''); },
  });

  if (!isNew && product.isLoading) return <LoadingBlock />;
  const canSave = form.name.trim().length >= 2 && !!form.categoryId;
  const off = savingPct(form.price, form.cashPrice);

  return (
    <>
      <Link href="/admin/productos" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-strong">
        <ArrowLeft className="size-4" /> Productos
      </Link>
      <PageHeader
        title={isNew ? 'Nuevo producto' : form.name || 'Producto'}
        actions={
          !isNew && product.data && (
            <a href={`/producto/${product.data.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line">
              <ExternalLink className="size-4" /> Ver en la web
            </a>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Información">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" className="sm:col-span-2">
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej.: Crystal Noir" />
              </Field>
              <Field label="Marca">
                <Select value={form.brandId} onChange={(e) => set('brandId', e.target.value)}>
                  <option value="">Sin marca</option>
                  {brands.data?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Categoría">
                <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  {cats.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="flex gap-2 sm:col-span-2">
                <Input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="¿Marca nueva? Escribila acá" />
                <button type="button" disabled={newBrand.trim().length < 1 || createBrand.isPending} onClick={() => createBrand.mutate({ name: newBrand.trim() })} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-foam px-4 text-sm font-semibold text-teal-strong disabled:opacity-50">
                  <Plus className="size-4" /> Crear
                </button>
              </div>
              <Field label="Presentación" hint="Ej.: Eau de Parfum 100 ml · x22 parches · 350 g">
                <Input value={form.presentation} onChange={(e) => set('presentation', e.target.value)} />
              </Field>
              <Field label="Para">
                <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender | '')}>
                  <option value="">—</option>
                  <option value="FEMENINO">Ella</option>
                  <option value="MASCULINO">Él</option>
                  <option value="UNISEX">Unisex</option>
                </Select>
              </Field>
              <Field label="Frase corta" className="sm:col-span-2" hint="Se ve en la ficha y en los resultados de búsqueda">
                <Input value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} maxLength={280} />
              </Field>
              <Field label="Descripción" className="sm:col-span-2">
                <Textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Fotos">
            <ImagesField value={form.images} onChange={(v) => set('images', v)} />
          </Card>

          <Card title={isPerfume ? 'Notas olfativas y palabras clave' : 'Palabras clave'}>
            <div className="space-y-4">
              {isPerfume && (
                <>
                  <Field label="Notas de salida"><TagInput value={form.notesTop} onChange={(v) => set('notesTop', v)} placeholder="Ej.: Bergamota, Mandarina" /></Field>
                  <Field label="Notas de corazón"><TagInput value={form.notesHeart} onChange={(v) => set('notesHeart', v)} placeholder="Ej.: Jazmín" /></Field>
                  <Field label="Notas de fondo"><TagInput value={form.notesBase} onChange={(v) => set('notesBase', v)} placeholder="Ej.: Vainilla, Almizcle" /></Field>
                </>
              )}
              <Field label="Palabras destacadas" hint="Se muestran grandes en la ficha: Explosiva. Femenina. Irresistible."><TagInput value={form.highlights} onChange={(v) => set('highlights', v)} /></Field>
              <Field label="Etiquetas" hint="Para filtrar y buscar: arabe, disenador, nacional, infantil, body-mist…"><TagInput value={form.tags} onChange={(v) => set('tags', v)} /></Field>
            </div>
          </Card>

          <Card title="Ficha técnica" actions={<button type="button" onClick={() => set('attributes', [...form.attributes, ['', '']])} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-strong"><Plus className="size-4" /> Agregar dato</button>}>
            {form.attributes.length === 0 ? (
              <p className="text-sm text-ink-soft">Datos como familia olfativa, concentración, origen o tipo de piel.</p>
            ) : (
              <ul className="space-y-2">
                {form.attributes.map(([k, v], i) => (
                  <li key={i} className="flex gap-2">
                    <Input value={k} placeholder="Dato" onChange={(e) => set('attributes', form.attributes.map((a, j) => (j === i ? [e.target.value, a[1]] : a)))} />
                    <Input value={v} placeholder="Valor" onChange={(e) => set('attributes', form.attributes.map((a, j) => (j === i ? [a[0], e.target.value] : a)))} />
                    <button type="button" onClick={() => set('attributes', form.attributes.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-mist" aria-label="Quitar"><X className="size-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card title="Precio">
            <div className="space-y-4">
              <Field label="Precio de lista" hint="Con tarjeta / 3 cuotas"><MoneyInput value={form.price} onChange={(v) => set('price', v)} /></Field>
              <Field label="Precio en efectivo"><MoneyInput value={form.cashPrice} onChange={(v) => set('cashPrice', v)} /></Field>
              <Field label="Precio anterior (opcional)" hint="Se muestra tachado como promo"><MoneyInput value={form.compareAtPrice} onChange={(v) => set('compareAtPrice', v)} /></Field>
              {off > 0 && <p className="rounded-xl bg-foam px-3 py-2 text-sm text-teal-deep">En efectivo ahorran {off}% ({money((form.price ?? 0) - (form.cashPrice ?? 0))}).</p>}
              <Switch label="Mostrar precio en la web" hint="Si está apagado dice “Consultá el precio”" checked={form.showPrice} onChange={(v) => set('showPrice', v)} />
            </div>
          </Card>
          <Card title="Visibilidad">
            <div className="divide-y divide-line">
              <Switch label="Visible en la web" checked={form.active} onChange={(v) => set('active', v)} />
              <Switch label="Disponible" hint="Apagado: “Consultar stock”" checked={form.available} onChange={(v) => set('available', v)} />
              <Switch label="Destacado" hint="Aparece primero en la home y el catálogo" checked={form.featured} onChange={(v) => set('featured', v)} />
              <Switch label="Nuevo ingreso" checked={form.isNew} onChange={(v) => set('isNew', v)} />
              <Switch label="Disponible en decant" checked={form.hasDecant} onChange={(v) => set('hasDecant', v)} />
            </div>
          </Card>
          {!isNew && (
            <div className="flex justify-end">
              <DeleteButton onConfirm={() => remove.mutate(undefined)} pending={remove.isPending} label="Eliminar producto" />
            </div>
          )}
        </div>
      </div>

      <SaveBar dirty={dirty || isNew} saving={save.isPending} onSave={() => canSave && save.mutate(undefined)} onReset={isNew ? undefined : () => setForm(initial)} label={isNew ? 'Crear producto' : 'Guardar cambios'} />
    </>
  );
}
