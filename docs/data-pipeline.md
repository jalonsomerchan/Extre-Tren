# Datos ferroviarios

ExtreTren no usa backend. Los datos se incluyen en el build estático y la página de Hoy consulta el CSV publicado por la fuente en el navegador.

## Fuentes

- Horarios y paradas: [GTFS de Renfe](https://ssl.renfe.com/gtransit/Fichero_AV_LD/google_transit.zip). La URL histórica terminada en `.zi` devuelve 404; se usa el archivo ZIP público equivalente.
- Demoras y cancelaciones: [josernalist/renfe-gtfsrt](https://github.com/josernalist/renfe-gtfsrt), que archiva el feed GTFS-Realtime de Renfe.

## Copia reducida

`scripts/update-extremadura-data.mjs` descarga ambos recursos y crea `src/data/renfe-extremadura.json`. Conserva solo trenes que pasan por las estaciones de Extremadura indicadas en el script. Cada viaje se resume con:

- recorrido, salida y paradas extremeñas;
- demora máxima y última demora;
- número de muestras y marca temporal;
- todas las observaciones intradía (hora UTC y demora), en formato compacto.

Las filas cuyo estado es `CANCELED` se descartan antes de agrupar: no se guardan en el JSON ni se muestran en las páginas estáticas o en los datos directos de Hoy.

Las páginas `/viaje/{tren}/dia/{fecha}/` muestran ese histórico intradía del servicio seleccionado. Las tablas diarias enlazan directamente a ellas y conservan un enlace separado al histórico completo del número comercial.

El archivo generado conserva los días, servicios y observaciones en orden ascendente de fecha y hora. La interfaz permite reordenar las columnas de las tablas de servicios sin volver a descargar datos.

Cuando un viaje tiene dos o más coordenadas, su página usa Leaflet con una capa base de CARTO y OpenStreetMap. El trazado une las paradas en su orden programado; no pretende representar la geometría exacta de las vías.

Ejecuta manualmente `npm run data:sync` para importar ayer, `npm run data:sync -- --date YYYY-MM-DD` para una fecha concreta o `npm run data:sync:all` para importar todas las fechas publicadas por el histórico. Esta última opción descarga el GTFS una sola vez y después procesa los CSV diarios uno a uno.

El workflow `data-refresh.yml` lo ejecuta cada día a las 01:20 UTC, hace commit solo si cambia el archivo generado y, en ese caso, reconstruye y despliega Pages.

Para días cerrados, el GTFS vigente puede no incluir el `trip_id` de la fecha pasada. En ese caso se asocia por número comercial de tren para conservar el recorrido, que puede reflejar el horario vigente y no el histórico exacto.

## Datos de Hoy

La página de inicio construye la URL raw de la fecha actual en horario peninsular y descarga ese CSV directamente desde GitHub. Repite la consulta cada cinco minutos mientras permanece abierta e incorpora los trenes publicados durante el día usando el último recorrido conocido de la copia estática. Si falla la petición o aún no hay publicaciones, muestra la última copia estática disponible.
