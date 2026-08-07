# ExtreTren

Web estática para consultar demoras, cancelaciones y tendencias de los trenes que circulan por Extremadura. Está construida con Astro y preparada para GitHub Pages, incluido el despliegue bajo una subcarpeta.

## Páginas

- **Hoy:** estado actualizado directamente desde el CSV raw público.
- **Esta semana** y **Este mes:** evolución diaria de la demora media.
- **Estadísticas:** recorridos y días con más demora.
- **Trenes** y **Estaciones:** detalle de los servicios y paradas observados.
- **Datos:** fuentes, filtrado y límites del histórico.

## Desarrollo

```sh
npm ci
npm test
npm run build
npm run dev
```

## Datos

Consulta [la guía del pipeline](docs/data-pipeline.md) para actualizar la copia reducida y conocer las fuentes. El workflow diario actualiza `src/data/renfe-extremadura.json`; el workflow de Pages publica el resultado al llegar el commit a `main`.

## Traducciones e idiomas

El español se publica en `/` y el inglés en `/en/`. Las traducciones están en `src/i18n/translations/`; toda clave nueva debe existir en ambos JSON.

## GitHub Pages

La configuración calcula la base de Astro automáticamente. Para un dominio propio o una subruta distinta, consulta `docs/github-pages.md` y ajusta `ASTRO_SITE` y `ASTRO_BASE`.
