'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * La cruz encendida.
 * La cruz LED de las farmacias argentinas, dibujada con la geometría del logo:
 * brazo superior aqua, brazo derecho menta, el resto teal, y la sonrisa debajo.
 *
 * - Abierta: enciende desde el centro, respira con un brillo diagonal, cada tanto
 *   lanza una onda y la sonrisa se "dibuja" de izquierda a derecha.
 * - Cerrada: queda en penumbra, apenas latiendo.
 * - Responde al dedo / puntero: ilumina los LEDs cercanos y un toque lanza una onda.
 */

type Region = 'top' | 'right' | 'main' | 'smile';
interface Led {
  x: number;
  y: number;
  region: Region;
  d: number;
  k: number; // índice dentro de la sonrisa (0..1)
  seed: number;
}

const COLS = 13;
const CENTER = 6;
const SMILE_ROWS = 17.4;

const COLORS: Record<Region, string> = {
  top: '#54c4cf',
  right: '#6cc4c0',
  main: '#009cac',
  smile: '#009cac',
};
/** Versiones "emitidas" para fondo oscuro: mismo matiz, más luz, y bien diferenciadas como en el logo */
const GLOW: Record<Region, string> = {
  top: '#8fe3ec',
  right: '#86e0c9',
  main: '#08aebf',
  smile: '#08aebf',
};

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function buildLeds(withSmile: boolean): Led[] {
  const leds: Led[] = [];
  for (let y = 0; y < COLS; y++) {
    for (let x = 0; x < COLS; x++) {
      const inV = x >= 4 && x <= 8;
      const inH = y >= 4 && y <= 8;
      if (!inV && !inH) continue;
      const region: Region = y < 4 ? 'top' : x > 8 ? 'right' : 'main';
      leds.push({ x, y, region, d: Math.hypot(x - CENTER, y - CENTER), k: 0, seed: hash(leds.length + 1) });
    }
  }
  if (withSmile) {
    // Bézier cúbica de la sonrisa, muestreada por longitud de arco
    const P = [
      [0.25, 12.4],
      [1.5, 17.0],
      [10.5, 17.0],
      [11.75, 12.4],
    ];
    const pt = (t: number) => {
      const u = 1 - t;
      const a = u * u * u,
        b = 3 * u * u * t,
        c = 3 * u * t * t,
        d = t * t * t;
      return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
    };
    const samples: { p: number[]; len: number }[] = [];
    let len = 0;
    let prev = pt(0);
    for (let i = 0; i <= 400; i++) {
      const p = pt(i / 400);
      len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      samples.push({ p, len });
      prev = p;
    }
    const N = 15;
    for (let i = 0; i < N; i++) {
      const target = (len * i) / (N - 1);
      const s = samples.find((q) => q.len >= target) ?? samples[samples.length - 1];
      leds.push({ x: s.p[0], y: s.p[1], region: 'smile', d: Math.hypot(s.p[0] - CENTER, s.p[1] - CENTER), k: i / (N - 1), seed: hash(500 + i) });
    }
  }
  return leds;
}

/** Sprite de un LED con halo, pre-renderizado una vez por color */
function makeSprite(color: string, cell: number, dpr: number, glow: boolean) {
  const size = Math.ceil(cell * (glow ? 2.6 : 1.1) * dpr);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = size / 2;
  const core = cell * 0.36 * dpr;
  if (glow) {
    const halo = g.createRadialGradient(r, r, core * 0.6, r, r, r);
    halo.addColorStop(0, hexA(color, 0.42));
    halo.addColorStop(0.35, hexA(color, 0.12));
    halo.addColorStop(1, hexA(color, 0));
    g.fillStyle = halo;
    g.fillRect(0, 0, size, size);
  }
  const body = g.createRadialGradient(r - core * 0.25, r - core * 0.25, 0, r, r, core);
  body.addColorStop(0, glow ? mix(color, '#ffffff', 0.55) : mix(color, '#ffffff', 0.25));
  body.addColorStop(0.5, glow ? mix(color, '#ffffff', 0.12) : color);
  body.addColorStop(1, color);
  g.fillStyle = body;
  g.beginPath();
  g.arc(r, r, core, 0, Math.PI * 2);
  g.fill();
  return c;
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export interface LedCrossProps {
  /** Encendida (abierto) o en penumbra (cerrado) */
  lit?: boolean;
  /** "dark": brilla sobre fondo oscuro · "light": puntos sólidos sobre fondo claro */
  theme?: 'dark' | 'light';
  smile?: boolean;
  interactive?: boolean;
  className?: string;
  label?: string;
}

export function LedCross({ lit = true, theme = 'dark', smile = true, interactive = true, className, label }: LedCrossProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const litRef = useRef(lit);
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    litRef.current = lit;
    redrawRef.current?.();
  }, [lit]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glow = theme === 'dark';
    const leds = buildLeds(smile);
    const rows = smile ? SMILE_ROWS : COLS;

    let cell = 10;
    let dpr = 1;
    let sprites: Record<Region, HTMLCanvasElement> = {} as never;
    let white: HTMLCanvasElement | null = null;
    let off: HTMLCanvasElement | null = null;
    let raf = 0;
    let running = false;
    let visible = true;
    const start = performance.now();
    let litT = litRef.current ? 1 : 0; // transición suave encendido/apagado
    const pointer = { x: -99, y: -99, active: false };
    const ripples: { x: number; y: number; t0: number }[] = [];

    const resize = () => {
      const w = wrap.clientWidth;
      if (!w) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cell = w / COLS;
      const h = cell * rows;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      const pal = glow ? GLOW : COLORS;
      sprites = {
        top: makeSprite(pal.top, cell, dpr, glow),
        right: makeSprite(pal.right, cell, dpr, glow),
        main: makeSprite(pal.main, cell, dpr, glow),
        smile: makeSprite(pal.smile, cell, dpr, glow),
      };
      white = makeSprite('#e9fffd', cell, dpr, glow);
      off = makeSprite(glow ? '#1d4e53' : '#d3e9e9', cell, dpr, false);
      draw(performance.now());
    };

    const brightness = (led: Led, t: number, isLit: number) => {
      // encendido inicial: desde el centro hacia afuera
      const boot = reduced ? 1 : smooth(0, 1.4, (t - 0.15) * 11 - led.d);
      // brillo diagonal que recorre la cruz
      const shimmer = 0.5 + 0.5 * Math.sin((led.x + led.y) * 0.5 - t * 1.7);
      let b = (0.8 + 0.2 * shimmer) * boot;
      let flash = 0;

      if (!reduced) {
        // onda cada 8 s
        const cycle = (t - 2.2) % 8;
        if (t > 2.2 && cycle < 1.6) {
          const front = (cycle / 1.6) * 12;
          flash += Math.exp(-((led.d - front) ** 2) / 1.1) * 0.55 * (1 - cycle / 1.6);
        }
        // la sonrisa se dibuja de izquierda a derecha cada 6 s
        if (led.region === 'smile') {
          const sc = (t - 1.2) % 6;
          if (t > 1.2 && sc < 1.4) {
            const head = sc / 1.1;
            flash += Math.exp(-((led.k - head) ** 2) / 0.012) * 0.6;
          }
        }
        // destellos aleatorios
        const tick = Math.floor(t * 2.5);
        if (hash(led.seed * 1000 + tick) > 0.988) flash += 0.45 * (1 - ((t * 2.5) % 1));
        // puntero
        if (pointer.active) {
          const pd = Math.hypot(led.x - pointer.x, led.y - pointer.y);
          if (pd < 2.8) flash += (1 - pd / 2.8) * 0.5;
        }
        for (const r of ripples) {
          const age = t - r.t0;
          const front = age * 14;
          const pd = Math.hypot(led.x - r.x, led.y - r.y);
          flash += Math.exp(-((pd - front) ** 2) / 1.4) * 0.8 * Math.max(0, 1 - age / 1.1);
        }
      }

      // cerrado: penumbra que late lento
      const dim = 0.1 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.3 - led.d * 0.45));
      const dimSmile = 0.05;
      const closed = led.region === 'smile' ? dimSmile : dim;
      b = closed + (b - closed) * isLit;
      flash *= 0.35 + 0.65 * isLit;
      return { b: clamp(b), flash: clamp(flash, 0, 1) };
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const target = litRef.current ? 1 : 0;
      litT += (target - litT) * 0.06;
      if (Math.abs(target - litT) < 0.002) litT = target;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const S = sprites.main?.width ?? 0;
      const So = off?.width ?? 0;
      for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > 1.2) ripples.splice(i, 1);

      for (const led of leds) {
        const cx = (led.x + 0.5) * cell * dpr;
        const cy = (led.y + 0.5) * cell * dpr;
        if (off) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = glow ? 0.9 : 1;
          ctx.drawImage(off, cx - So / 2, cy - So / 2);
        }
        const { b, flash } = brightness(led, t, litT);
        if (b > 0.01) {
          ctx.globalCompositeOperation = glow ? 'lighter' : 'source-over';
          ctx.globalAlpha = b;
          ctx.drawImage(sprites[led.region], cx - S / 2, cy - S / 2);
        }
        if (flash > 0.02 && white) {
          ctx.globalCompositeOperation = glow ? 'lighter' : 'source-over';
          ctx.globalAlpha = flash * (glow ? 0.75 : 0.5);
          ctx.drawImage(white, cx - S / 2, cy - S / 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // con "reducir movimiento" no hay bucle: se redibuja sólo cuando cambia el estado
    redrawRef.current = reduced
      ? () => {
          litT = litRef.current ? 1 : 0;
          draw(performance.now());
        }
      : null;

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else pause();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener('visibilitychange', onVis);

    const toGrid = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (e.clientX - rect.left) / cell - 0.5, y: (e.clientY - rect.top) / cell - 0.5 };
    };
    const onMove = (e: PointerEvent) => {
      const p = toGrid(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    const onDown = (e: PointerEvent) => {
      const p = toGrid(e);
      ripples.push({ x: p.x, y: p.y, t0: (performance.now() - start) / 1000 });
      if (navigator.vibrate) navigator.vibrate(8);
    };
    if (interactive && !reduced) {
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerleave', onLeave);
      canvas.addEventListener('pointerdown', onDown);
    }
    play();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
    };
  }, [theme, smile, interactive]);

  return (
    <div
      ref={wrapRef}
      className={cn('relative w-full select-none', className)}
      role="img"
      aria-label={label ?? (lit ? 'Cruz de farmacia encendida: estamos abiertos' : 'Cruz de farmacia apagada: ahora estamos cerrados')}
    >
      <canvas ref={canvasRef} className="block w-full touch-manipulation" />
    </div>
  );
}
