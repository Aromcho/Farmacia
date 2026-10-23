import { Clapperboard } from 'lucide-react';
import { ExternalButton } from '@/components/ui/button';
import { InstagramIcon } from '@/components/ui/icons';
import { Img } from '@/components/ui/img';
import { SectionHeading } from '@/components/ui/section-heading';
import type { InstagramPost } from '@/lib/types';

export function InstagramGrid({ posts, url }: { posts: InstagramPost[]; url?: string }) {
  if (!posts.length) return null;
  return (
    <section className="py-16 lg:py-24" aria-labelledby="ig-title">
      <div className="container-x">
        <SectionHeading id="ig-title" title="Lo último en Instagram" text="Nuevos ingresos, promos de la semana y consejos de nuestro equipo." />
        <ul className="mt-8 grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-6">
          {posts.slice(0, 12).map((p, i) => (
            <li key={p.id} className={i >= 9 ? 'hidden lg:block' : undefined}>
              <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-xl sm:rounded-2xl" aria-label={p.caption?.slice(0, 90) ?? 'Publicación de Instagram'}>
                <Img media={p.cover} alt="" ratio="4/5" sizes="(min-width: 1024px) 16vw, 33vw" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                {p.type === 'REEL' && <Clapperboard className="absolute right-2 top-2 size-4 text-white drop-shadow" aria-hidden="true" />}
                <span className="absolute inset-0 bg-night/0 transition-colors group-hover:bg-night/20" />
              </a>
            </li>
          ))}
        </ul>
        {url && (
          <div className="mt-8 flex justify-center">
            <ExternalButton href={url} variant="secondary" icon={<InstagramIcon className="size-5" />}>
              Seguinos en @farmacia.amancio.fernandez
            </ExternalButton>
          </div>
        )}
      </div>
    </section>
  );
}
