const CLAVE_PAUSA_FIRESTORE = 'precioJustoFirestorePausa'
const DURACION_PAUSA_CUOTA_MS = 10 * 60 * 1000
const DURACION_PAUSA_ERROR_MS = 10 * 60 * 1000
const TIEMPO_MAXIMO_OPERACION_MS = 8000

function leerPausaGuardada() {
  if (typeof localStorage === 'undefined') return null

  try {
    const pausa = JSON.parse(localStorage.getItem(CLAVE_PAUSA_FIRESTORE) || 'null')
    if (!pausa?.hasta || Number(pausa.hasta) <= Date.now()) {
      localStorage.removeItem(CLAVE_PAUSA_FIRESTORE)
      return null
    }
    return pausa
  } catch {
    localStorage.removeItem(CLAVE_PAUSA_FIRESTORE)
    return null
  }
}

function guardarPausaFirestore(motivo, duracionMs) {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem(
    CLAVE_PAUSA_FIRESTORE,
    JSON.stringify({
      motivo,
      hasta: Date.now() + duracionMs,
      fecha: new Date().toISOString(),
    }),
  )
}

function estaFirestoreEnPausa() {
  return Boolean(leerPausaGuardada())
}

function crearErrorFirestorePausado() {
  const pausa = leerPausaGuardada()
  const error = new Error('Firestore pausado temporalmente. La app usa datos locales.')
  error.code = 'firestore/pausado'
  error.motivo = pausa?.motivo || 'desconocido'
  error.hasta = pausa?.hasta || null
  return error
}

function esErrorCuotaFirestore(error) {
  const codigo = String(error?.code || '').toLowerCase()
  const mensaje = String(error?.message || '').toLowerCase()
  return codigo.includes('resource-exhausted') || mensaje.includes('quota exceeded')
}

function esErrorTemporalFirestore(error) {
  const codigo = String(error?.code || '').toLowerCase()
  const mensaje = String(error?.message || '').toLowerCase()
  return (
    codigo.includes('unavailable') ||
    codigo.includes('deadline-exceeded') ||
    codigo.includes('network') ||
    mensaje.includes('timeout') ||
    mensaje.includes('failed to fetch') ||
    mensaje.includes('offline')
  )
}

function registrarFalloFirestore(error) {
  if (esErrorCuotaFirestore(error)) {
    guardarPausaFirestore('cuota_excedida', DURACION_PAUSA_CUOTA_MS)
    return
  }

  if (esErrorTemporalFirestore(error)) {
    guardarPausaFirestore('error_temporal', DURACION_PAUSA_ERROR_MS)
  }
}

async function ejecutarConTimeoutFirestore(
  promesa,
  mensaje = 'Tiempo de espera agotado en Firestore',
  tiempoMaximoMs = TIEMPO_MAXIMO_OPERACION_MS,
) {
  let timeoutId = null
  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(mensaje)), tiempoMaximoMs)
    })
    return await Promise.race([promesa, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function ejecutarOperacionFirestore(operacion, mensajeTimeout, tiempoMaximoMs) {
  if (estaFirestoreEnPausa()) {
    throw crearErrorFirestorePausado()
  }

  try {
    return await ejecutarConTimeoutFirestore(operacion(), mensajeTimeout, tiempoMaximoMs)
  } catch (error) {
    registrarFalloFirestore(error)
    throw error
  }
}

function limpiarPausaFirestore() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CLAVE_PAUSA_FIRESTORE)
  }
}

export default {
  estaFirestoreEnPausa,
  esErrorCuotaFirestore,
  esErrorTemporalFirestore,
  registrarFalloFirestore,
  ejecutarOperacionFirestore,
  limpiarPausaFirestore,
}
