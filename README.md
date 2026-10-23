# Farmacia Amancio Fernández — sitio web + panel

Sitio público (Next.js 16), API (NestJS 11) y base de datos PostgreSQL, con todo el contenido relevado del Instagram **@farmacia.amancio.fernandez**: 106 productos con sus fotos reales, 9 categorías, 11 historias destacadas, 92 publicaciones, 27 obras sociales y los horarios de verano y del resto del año.

```
apps/
  api/   NestJS + Drizzle ORM (PostgreSQL) · imágenes optimizadas con sharp · Swagger en /api/docs
    seed/  catalog.json, content.json e imágenes recortadas del Instagram (lo carga "npm run setup")
  web/   Next.js (App Router) · Tailwind 4 · Motion · sitio público + panel en /admin
```

## Cómo levantarlo en Windows (o Mac / Linux)

Necesitás:
- **Node.js 20 o superior**: https://nodejs.org (versión LTS)
- **Docker Desktop**: https://www.docker.com/products/docker-desktop (sólo para la base de datos). Si ya tenés PostgreSQL instalado, podés usarlo: cambiá `DATABASE_URL` en `apps/api/.env`.

En una terminal (PowerShell) dentro de esta carpeta:

```bash
npm install        # instala todo (la primera vez tarda unos minutos)
npm run setup      # crea los .env, levanta Postgres, crea las tablas y carga el contenido (≈3 min: optimiza ~300 fotos)
npm run dev        # API en http://localhost:4000 y sitio en http://localhost:3000
```

- Sitio: **http://localhost:3000**
- Panel: **http://localhost:3000/admin** — usuario `admin@farmaciaamanciofernandez.com.ar`, contraseña `Amancio2026!` (cambiala desde *Ajustes* apenas entres; también se define en `apps/api/.env`)
- Documentación de la API: http://localhost:4000/api/docs

Para volver a cargar el contenido original desde cero: `npm run seed:reset`.

## Qué tiene

**Sitio (pensado primero para el celular)**
- Portada con la *cruz LED* de farmacia dibujada con la geometría del logo (tritono + sonrisa): se enciende cuando la farmacia está abierta y queda en penumbra cuando cierra, según los horarios cargados. Responde al dedo.
- Video de fondo generado con Kling (luz en el agua), con **parallax** en tres planos; también parallax en médanos (Visitanos), hojas (obras sociales), decants y fotos de la farmacia.
- Historias destacadas como en Instagram: visor a pantalla completa, tocar para avanzar, mantener para pausar, deslizar para cambiar o cerrar; cada historia puede llevar al producto.
- Perfumería con pestañas (para ella, para él, árabes, decants), pirámide olfativa en cada perfume, precio de lista y en efectivo, cuotas.
- Catálogo con filtros (marca, para quién, decant, promo, nuevos), orden y búsqueda sin acentos (⌘K / tocar *Buscar*).
- **Pedido por WhatsApp**: el carrito arma el mensaje, guarda el pedido en el panel y abre WhatsApp al 2255 41-8960. Retiro o envío sin cargo, forma de pago y obra social.
- Horarios con estado *Abierto ahora / Cierra pronto / Cerrado*, temporada de verano automática (15/12 al 15/03), feriados, mapa, obras sociales con buscador.
- SEO: metadatos, Open Graph, datos estructurados (Pharmacy y Product), sitemap, robots, manifest e íconos.

**Panel (/admin)**
- Inicio con pedidos nuevos, actividad de 30 días y lo más visto.
- Pedidos: estados, notas internas y botón para responder por WhatsApp; consultas.
- Productos: alta/edición con fotos (subir, elegir de la biblioteca, ordenar arrastrando), precios, notas olfativas, ficha técnica, destacado/nuevo/decant/visible; acciones masivas.
- Categorías (ordenar arrastrando), marcas, historias destacadas (con vista previa), banners programables, Instagram (mostrar/ocultar/destacar), biblioteca de medios.
- Horarios por temporada con franjas, feriados, obras sociales, datos de contacto, beneficios, usuarios (administrador / editor) y cambio de contraseña.
- Los cambios se ven en la web al instante.

## Notas del contenido

- Precios: los publicados en las historias de Instagram (abril–octubre 2026). Revisalos desde el panel; los que no tenían precio dicen *Consultá el precio*.
- No se publicaron fotos de clientes (sorteos y promo de la pelota quedaron ocultos en Instagram del panel).
- Faltan imágenes de: Afnan Turathi Electric, 9pm Rebel, Turathi Blue, Maison Alhambra Léonie, Natier aceite de orégano, Vitatech Maca, Kakaziyan y el set Caro Cuore lata (sus historias no se pudieron capturar). Se cargan desde *Productos → Nuevo producto*.

## Producción

```bash
npm run build
npm run start      # API :4000 + sitio :3000
```
Variables importantes: `JWT_SECRET` (largo y aleatorio), `COOKIE_SECURE=true` con HTTPS, `CORS_ORIGINS` y `NEXT_PUBLIC_SITE_URL` con el dominio real, `API_URL` (URL interna de la API para Next). Las imágenes subidas quedan en `apps/api/uploads` (hacer backup junto con la base).
