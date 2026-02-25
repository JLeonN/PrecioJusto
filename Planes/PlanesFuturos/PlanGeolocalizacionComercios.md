# Plan Futuro: Geolocalización para Autocompletar Comercios

**Fecha de exploración:** Febrero 2026
**Estado:** Prototipo explorado — pendiente de implementar en versión futura

---

## Idea Original

Facilitar al usuario la carga de la dirección de un comercio eliminando la escritura manual. Dos escenarios de uso:

1. **En el comercio (tiempo real):** El usuario está en el súper comprando. Al guardar un producto, la app detecta su ubicación GPS y sugiere automáticamente en qué comercio está.
2. **En casa (registro diferido):** El usuario llega a casa y quiere registrar los precios. La app le permite buscar el comercio por nombre y la dirección se completa sola.

---

## Tecnologías Evaluadas

### Nominatim (OpenStreetMap)
- **URL:** `https://nominatim.openstreetmap.org/search`
- **Costo:** Gratuito, sin API key
- **Pros:** Datos OSM completos, búsqueda por texto libre
- **Contras:** Bloquea requests desde `http://localhost` por CORS + rate limit (1 req/seg). En producción (HTTPS + dominio real) podría funcionar, pero para app móvil no es recomendable por los límites de uso.

### Photon (Komoot)
- **URL:** `https://photon.komoot.io/api/`
- **Costo:** Gratuito, sin API key
- **Pros:** CORS correcto desde cualquier origen, datos OSM, respuesta rápida
- **Contras:** No filtra por país (solo sesga por lat/lon), cobertura variable en zonas no urbanas
- **Resultado en prueba:** Funcionó correctamente desde la app móvil. Devuelve nombre, calle, número y ciudad.
- **Parámetros útiles:**
  ```
  q=Tata&limit=8&lat=-34.9011&lon=-56.1645
  ```
  Centrar en Montevideo mejora la relevancia de resultados para Uruguay.

### Overpass API (OpenStreetMap)
- **URL:** `https://overpass-api.de/api/interpreter`
- **Costo:** Gratuito, sin API key
- **Pros:** CORS correcto, permite buscar POIs por radio GPS, filtra por nombre y tipo de comercio
- **Contras:** Cobertura depende de lo que la comunidad OSM haya mapeado. Lento en radios grandes (>10km).
- **Resultado en prueba:** No llegó a probarse en Android por el problema de permisos GPS (ver abajo).
- **Query de ejemplo (Overpass QL):**
  ```
  [out:json][timeout:15];
  (
    node["shop"]["name"~"Tata",i](around:20000,-34.9011,-56.1645);
    node["amenity"~"pharmacy|supermarket"]["name"~"Tata",i](around:20000,-34.9011,-56.1645);
  );
  out body;
  ```

---

## Problema Crítico Encontrado: GPS en Android

El prototipo usó `navigator.geolocation` (API web estándar). En Android con Capacitor esto **no funciona** directamente:

- Error obtenido: `User denied Geolocation (código 1)`
- Causa: La WebView de Android requiere permisos explícitos que `navigator.geolocation` no gestiona bien en Capacitor.

**Solución correcta para la implementación real:**
Usar el plugin oficial de Capacitor:

```bash
npm install @capacitor/geolocation
npx cap sync android
```

```javascript
import { Geolocation } from '@capacitor/geolocation'

const obtenerUbicacion = async () => {
  // Pide permisos automáticamente en Android/iOS
  const permiso = await Geolocation.requestPermissions()
  if (permiso.location !== 'granted') return null

  const posicion = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true, // Usa GPS chip, no solo WiFi/IP
    timeout: 10000,
  })
  return {
    lat: posicion.coords.latitude,
    lon: posicion.coords.longitude,
    precision: posicion.coords.accuracy, // en metros
  }
}
```

Con `enableHighAccuracy: true` la precisión en Android es de 3-10 metros (GPS real), muy superior a la geolocalización por IP usada en el navegador desktop (que puede errar varios km).

---

## Flujo Propuesto para Implementación Real

### Escenario A — Guardar precio en el comercio (tiempo real)

```
Usuario abre formulario de nuevo precio
      ↓
App obtiene GPS automáticamente (@capacitor/geolocation)
      ↓
Consulta Overpass API: comercios en radio de 200m
      ↓
Si encuentra 1 resultado claro → lo sugiere al usuario
Si encuentra varios → muestra lista para elegir
Si no encuentra nada → muestra buscador manual (Photon)
      ↓
Usuario confirma o corrige → se completa nombre y dirección
```

### Escenario B — Registrar en casa (diferido)

```
Usuario abre formulario de nuevo precio
      ↓
Escribe nombre del comercio en buscador (Photon)
      ↓
Resultados filtrados por proximidad a Montevideo
      ↓
Selecciona → se completa nombre y dirección
```

---

## Consideraciones para Integración con Firestore

Cuando la app tenga base de datos en la nube (Firebase/Firestore), este sistema podría enriquecerse:

- **Guardar coordenadas en cada comercio:** Al crear un comercio vía geolocalización, guardar `lat` y `lon`. Permitiría en el futuro mostrar un mapa con todos los comercios del usuario.
- **Validación contra base de datos propia:** Antes de consultar Overpass/Photon, verificar si ya existe un comercio cercano en la base de datos del usuario (evita duplicados).
- **Datos compartidos entre usuarios:** Si la app escala a múltiples usuarios, los comercios verificados podrían compartirse (similar a Google Maps Places pero propio).
- **Historial de ubicaciones:** Guardar las últimas N ubicaciones GPS del usuario con timestamp. Al abrir el formulario, sugerir el comercio visitado más recientemente.

---

## Archivos del Prototipo (a eliminar)

Los siguientes archivos fueron creados para la exploración y deben eliminarse cuando se retome el trabajo real:

- `src/pages/PruebaMapasPage.vue` — página de prueba completa
- Entrada en `src/router/routes.js` — ruta `/prueba-mapas`
- Entrada en `src/layouts/MainLayout.vue` — botón DEV en el drawer

---

## Resumen Ejecutivo

| Aspecto | Estado |
|---|---|
| Búsqueda por texto (Photon) | Funcionó correctamente |
| Búsqueda por cercanía (Overpass) | API funciona, falta resolver permisos GPS en Android |
| GPS en Android | Requiere `@capacitor/geolocation`, no `navigator.geolocation` |
| Costo de APIs | $0 — todo gratuito y sin API key |
| Cobertura en Uruguay | Buena para cadenas grandes (Tata, Disco, Tienda Inglesa). Variable para comercios pequeños. |
| Complejidad de implementación | Media — 1 o 2 días de trabajo para integrar correctamente |

**Recomendación:** Implementar cuando la app tenga Firestore, para poder guardar coordenadas junto a cada comercio y construir la base de datos propia progresivamente.
