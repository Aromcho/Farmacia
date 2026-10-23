import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel · Amancio Fernández' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-mist">{children}</div>;
}
