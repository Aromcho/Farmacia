# Plan de acción — web de Farmacia Amancio Fernández

1. **Relevamiento del Instagram** ✔ — 118 publicaciones, 9 historias destacadas, logo y colores (#009CAC, #54C4CF, #6CC4C0), horarios, obras sociales, beneficios, productos y precios.
2. **Arquitectura** ✔ — Next.js (sitio + panel) consume una API NestJS con PostgreSQL. Las imágenes se procesan una vez (WebP 480/960/1600 + placeholder borroso).
3. **Base de datos y carga inicial** ✔ — modelo para catálogo, historias, banners, obras sociales, horarios por temporada, feriados, pedidos, consultas y usuarios.
4. **Diseño** ✔ — concepto *la cruz encendida*: la cruz LED de farmacia como elemento propio, pino profundo + teal del logo, Young Serif para títulos y Figtree para textos. Mobile-first con barra inferior.
5. **Sitio público** ✔ — portada, catálogo, ficha, pedido por WhatsApp, la farmacia, obras sociales, búsqueda, historias.
6. **Panel** ✔ — gestión completa del contenido y de los pedidos.
7. **Fondos con Kling** ✔ — 5 imágenes + video del hero (55 créditos).
8. **Reel de lanzamiento** — 10 s, 1080p, textos agregados por código.

## Próximos pasos sugeridos
- Dominio y hosting (por ejemplo, un VPS con Node + Postgres, o Vercel para la web y Railway/Render para la API).
- Revisar precios y completar los productos sin foto.
- Sumar el link de la web a la bio de Instagram y a las historias.
- Opcional: Google Analytics / Meta Pixel, Google Business Profile apuntando a la web.
