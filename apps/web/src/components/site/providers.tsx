'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { CartProvider } from '@/components/cart/cart-provider';
import { StoreProvider } from './store-provider';
import { SmoothScroll } from './smooth-scroll';
import { UIProvider } from './ui-provider';
import type { PublicStore } from '@/lib/types';

export function Providers({ store, children }: { store: PublicStore | null; children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <StoreProvider initial={store}>
        <CartProvider>
          <UIProvider>
            <SmoothScroll />
            {children}
          </UIProvider>
          <Toaster
            position="top-center"
            offset={16}
            mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
            toastOptions={{
              classNames: {
                toast: 'rounded-2xl! border-line! shadow-lift! font-sans!',
                title: 'text-ink! font-semibold!',
                description: 'text-ink-soft!',
                actionButton: 'bg-teal-strong! text-white! rounded-full! font-semibold!',
              },
            }}
          />
        </CartProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}
