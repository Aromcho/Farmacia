'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Card, DeleteButton, EditorDrawer, Field, Input, LoadingBlock, PageHeader, SaveBar, Select, Switch } from '@/components/admin/ui';
import { useAdminMutation, useAdminQuery, useMe } from '@/lib/admin';
import { timeAgo } from '@/lib/format';
import type { Role, StoreInfo, User } from '@/lib/types';

type Benefit = { icon?: string; title: string; text: string };
const ICONS = [
  { value: 'credit-card', label: 'Tarjeta' },
  { value: 'banknote', label: 'Efectivo' },
  { value: 'truck', label: 'Envío' },
  { value: 'shield-check', label: 'Obra social' },
];

export default function SettingsPage() {
  const me = useMe();
  const settings = useAdminQuery<Record<string, unknown>>(['admin-settings'], '/admin/store/settings');
  const [info, setInfo] = useState<StoreInfo | null>(null);
  useEffect(() => {
    if (settings.data?.store) setInfo(settings.data.store as StoreInfo);
  }, [settings.data]);
  const dirty = useMemo(() => !!info && JSON.stringify(info) !== JSON.stringify(settings.data?.store), [info, settings.data]);
  const save = useAdminMutation({ method: 'PUT', path: '/admin/store/settings/store', body: () => ({ value: info }), invalidate: [['admin-settings']], publicTags: ['store'], success: 'Datos de la farmacia guardados' });

  if (settings.isLoading || !info) return <LoadingBlock />;
  const set = (k: keyof StoreInfo, v: unknown) => setInfo({ ...info, [k]: v });
  const benefits = (info.benefits ?? []) as Benefit[];
  const isAdmin = me.data?.role === 'ADMIN';

  return (
    <>
      <PageHeader title="Ajustes" text="Datos de contacto que se muestran en la web y usuarios del panel." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Datos de la farmacia">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" className="sm:col-span-2"><Input value={info.name} onChange={(e) => set('name', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="Frase" className="sm:col-span-2"><Input value={info.tagline} onChange={(e) => set('tagline', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="Teléfono" hint="Como se muestra: 2255 41-8960"><Input value={info.phone} onChange={(e) => set('phone', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="WhatsApp" hint="Con código de país: 5492255418960"><Input value={info.whatsapp} onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, ''))} disabled={!isAdmin} /></Field>
            <Field label="Dirección" className="sm:col-span-2"><Input value={info.address} onChange={(e) => set('address', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="Ciudad"><Input value={info.city} onChange={(e) => set('city', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="Provincia"><Input value={info.province} onChange={(e) => set('province', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="Link de Google Maps" className="sm:col-span-2"><Input value={info.mapsUrl ?? ''} onChange={(e) => set('mapsUrl', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="Instagram"><Input value={info.instagram} onChange={(e) => set('instagram', e.target.value)} disabled={!isAdmin} /></Field>
            <Field label="Link de Instagram"><Input value={info.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} disabled={!isAdmin} /></Field>
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="Beneficios" actions={isAdmin && <button type="button" onClick={() => set('benefits', [...benefits, { icon: 'shield-check', title: '', text: '' }])} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-strong"><Plus className="size-4" /> Agregar</button>}>
            <p className="mb-3 text-sm text-ink-soft">La franja que aparece debajo de la portada.</p>
            <ul className="space-y-3">
              {benefits.map((b, i) => (
                <li key={i} className="space-y-2 rounded-2xl bg-mist p-3">
                  <div className="flex gap-2">
                    <Select value={b.icon ?? 'shield-check'} onChange={(e) => set('benefits', benefits.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))} className="w-36 shrink-0" disabled={!isAdmin}>
                      {ICONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                    <Input value={b.title} placeholder="Título" onChange={(e) => set('benefits', benefits.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} disabled={!isAdmin} />
                    {isAdmin && <button type="button" onClick={() => set('benefits', benefits.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-white" aria-label="Quitar"><X className="size-4" /></button>}
                  </div>
                  <Input value={b.text} placeholder="Texto" onChange={(e) => set('benefits', benefits.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} disabled={!isAdmin} />
                </li>
              ))}
            </ul>
          </Card>
          <PasswordCard />
        </div>
      </div>
      {isAdmin && <UsersCard meId={me.data!.id} />}
      <SaveBar dirty={dirty} saving={save.isPending} onSave={() => save.mutate(undefined)} onReset={() => setInfo(settings.data!.store as StoreInfo)} />
    </>
  );
}

function PasswordCard() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const change = useAdminMutation({ method: 'POST', path: '/auth/password', body: () => ({ currentPassword: cur, newPassword: next }), success: 'Contraseña actualizada', onSuccess: () => { setCur(''); setNext(''); } });
  return (
    <Card title="Mi contraseña">
      <div className="space-y-3">
        <Field label="Contraseña actual"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></Field>
        <Field label="Nueva contraseña" hint="Mínimo 8 caracteres"><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></Field>
        <button type="button" disabled={!cur || next.length < 8 || change.isPending} onClick={() => change.mutate(undefined)} className="h-10 w-full rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-50">
          Cambiar contraseña
        </button>
      </div>
    </Card>
  );
}

function UsersCard({ meId }: { meId: string }) {
  const users = useAdminQuery<User[]>(['admin-users'], '/admin/users');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  return (
    <Card className="mt-6" title="Usuarios del panel" actions={<button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-strong"><Plus className="size-4" /> Nuevo usuario</button>}>
      <p className="mb-3 text-sm text-ink-soft">Administradores: todo. Editores: catálogo, contenidos, horarios y pedidos (no ajustes ni usuarios).</p>
      <ul className="divide-y divide-line">
        {users.data?.map((u) => (
          <li key={u.id}>
            <button type="button" onClick={() => setEditing(u)} className="flex w-full items-center justify-between gap-3 py-3 text-left">
              <span>
                <span className="block font-semibold text-ink">{u.name} {u.id === meId && <span className="text-xs font-normal text-ink-soft">(vos)</span>}</span>
                <span className="block text-sm text-ink-soft">{u.email} · {u.lastLoginAt ? `entró ${timeAgo(u.lastLoginAt)}` : 'nunca entró'}</span>
              </span>
              <span className="flex gap-1.5">
                <Badge tone={u.role === 'ADMIN' ? 'ink' : 'neutral'}>{u.role === 'ADMIN' ? 'Administrador' : 'Editor'}</Badge>
                {!u.active && <Badge tone="red">Inactivo</Badge>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {editing && <UserEditor user={editing === 'new' ? null : editing} isMe={editing !== 'new' && editing.id === meId} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function UserEditor({ user, isMe, onClose }: { user: User | null; isMe: boolean; onClose: () => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'EDITOR');
  const [active, setActive] = useState(user?.active ?? true);
  const [password, setPassword] = useState('');
  const save = useAdminMutation({
    method: user ? 'PATCH' : 'POST',
    path: user ? `/admin/users/${user.id}` : '/admin/users',
    body: () => (user ? { name, role, active, ...(password ? { password } : {}) } : { name, email, role, password }),
    invalidate: [['admin-users']], success: user ? 'Usuario actualizado' : 'Usuario creado', onSuccess: onClose,
  });
  const remove = useAdminMutation({ method: 'DELETE', path: `/admin/users/${user?.id}`, invalidate: [['admin-users']], success: 'Usuario eliminado', onSuccess: onClose });
  return (
    <EditorDrawer open onClose={onClose} title={user ? user.name : 'Nuevo usuario'} footer={
      <div className="flex justify-between">
        {user && !isMe ? <DeleteButton onConfirm={() => remove.mutate(undefined)} /> : <span />}
        <button type="button" onClick={() => save.mutate(undefined)} disabled={save.isPending || name.length < 2 || (!user && (password.length < 8 || !email))} className="h-11 rounded-full bg-teal-strong px-6 font-semibold text-white disabled:opacity-50">Guardar</button>
      </div>
    }>
      <div className="space-y-4">
        <Field label="Nombre"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} /></Field>
        <Field label="Rol">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isMe}>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </Field>
        <Field label={user ? 'Nueva contraseña (opcional)' : 'Contraseña'} hint="Mínimo 8 caracteres"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
        {user && !isMe && <Switch label="Activo" checked={active} onChange={setActive} />}
      </div>
    </EditorDrawer>
  );
}
