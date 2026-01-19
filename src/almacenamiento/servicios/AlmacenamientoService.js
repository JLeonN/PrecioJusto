/**
 * 🧠 SERVICIO CENTRAL DE ALMACENAMIENTO
 *
 * Este archivo es el CEREBRO del sistema. Aquí seleccionas qué adaptador usar.
 *
 * 📌 CAMBIAR DE ALMACENAMIENTO:
 * Solo cambia la variable ADAPTADOR_ACTIVO más abajo.
 */

import LocalStorageAdapter from '../adaptadores/LocalStorageAdapter.js'
import CapacitorAdapter from '../adaptadores/CapacitorAdapter.js'
// import FirestoreAdapter from '../adaptadores/FirestoreAdapter.js' // 🔥 Descomentar cuando crees FirestoreAdapter

/**
 * ⚙️ CONFIGURACIÓN DEL ADAPTADOR ACTIVO
 *
 * Opciones disponibles:
 * - 'local'      → localStorage (web, testing rápido)
 * - 'capacitor'  → Capacitor Storage (móvil, SQLite nativo)
 * - 'firestore'  → Firestore (nube colaborativa) 🔥 FUTURO
 *
 * 🚨 RECORDATORIO PARA FIRESTORE:
 * Antes de cambiar a 'firestore', asegurate de:
 * 1. Instalar Firebase SDK: npm install firebase
 * 2. Configurar Firebase en tu proyecto (firebaseConfig)
 * 3. Inicializar autenticación (necesitás usuarioId real)
 * 4. Crear índices en Firestore para queries rápidas
 * 5. Configurar reglas de seguridad en Firebase Console
 */
const ADAPTADOR_ACTIVO = 'capacitor' // 👈 CAMBIAR AQUÍ

// Mapa de adaptadores disponibles
const adaptadores = {
  local: new LocalStorageAdapter(),
  capacitor: new CapacitorAdapter(),
  // firestore: new FirestoreAdapter(), // 🔥 Descomentar cuando esté listo
}

// Validar que el adaptador exista
if (!adaptadores[ADAPTADOR_ACTIVO]) {
  throw new Error(
    `❌ Adaptador "${ADAPTADOR_ACTIVO}" no existe. ` +
      `Opciones válidas: ${Object.keys(adaptadores).join(', ')}`,
  )
}

/**
 * 📦 ADAPTADOR ACTUAL
 * Este es el adaptador que usarán todos los servicios de la app
 */
export const adaptadorActual = adaptadores[ADAPTADOR_ACTIVO]

/**
 * 📊 INFO DEL ADAPTADOR ACTIVO (útil para debugging)
 */
export const infoAdaptador = {
  nombre: ADAPTADOR_ACTIVO,
  tipo: adaptadorActual.constructor.name,
  soportaColaboracion: ADAPTADOR_ACTIVO === 'firestore',
  soportaTiempoReal: ADAPTADOR_ACTIVO === 'firestore',
}

/**
 * 🔍 FUNCIÓN HELPER PARA LOGGING (opcional)
 */
export const logAdaptador = () => {
  console.log('🔧 Adaptador de almacenamiento activo:', infoAdaptador)
}

// 🔥 NOTAS PARA MIGRACIÓN A FIRESTORE:
//
// 1. ESTRUCTURA DE COLECCIONES RECOMENDADA:
//    /usuarios/{usuarioId}/productos/{productoId}
//    /productos_publicos/{productoId}
//    /comercios/{comercioId}
//    /precios/{precioId}
//
// 2. ÍNDICES NECESARIOS:
//    - productos: (usuarioId, fechaCreacion)
//    - precios: (productoId, fecha DESC)
//    - precios: (comercio, fecha DESC)
//
// 3. AUTENTICACIÓN:
//    Necesitás implementar Firebase Auth (Google, Email, Anónimo)
//    para que cada usuario tenga su usuarioId único.
//
// 4. LISTENERS EN TIEMPO REAL:
//    Firestore permite onSnapshot() para actualizar UI automáticamente
//    cuando otros usuarios agreguen precios. Implementar en FirestoreAdapter.
//
// 5. REGLAS DE SEGURIDAD BÁSICAS:
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /usuarios/{userId}/productos/{productId} {
//          allow read, write: if request.auth.uid == userId;
//        }
//        match /productos_publicos/{productId} {
//          allow read: if true;
//          allow write: if request.auth != null;
//        }
//      }
//    }
