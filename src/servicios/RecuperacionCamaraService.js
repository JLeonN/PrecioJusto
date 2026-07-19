const CLAVE_CAPTURA_PENDIENTE = 'precioJustoCapturaCamaraPendiente'

let fotoRestaurada = null

function obtenerAlmacenamientoLocal() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function guardarCapturaPendiente(contexto) {
  const almacenamientoLocal = obtenerAlmacenamientoLocal()
  if (!almacenamientoLocal || !contexto?.clave || !contexto?.rutaRetorno) return false

  almacenamientoLocal.setItem(CLAVE_CAPTURA_PENDIENTE, JSON.stringify(contexto))
  return true
}

function obtenerCapturaPendiente() {
  const almacenamientoLocal = obtenerAlmacenamientoLocal()
  if (!almacenamientoLocal) return null

  try {
    const contextoSerializado = almacenamientoLocal.getItem(CLAVE_CAPTURA_PENDIENTE)
    return contextoSerializado ? JSON.parse(contextoSerializado) : null
  } catch {
    limpiarCapturaPendiente()
    return null
  }
}

function limpiarCapturaPendiente() {
  obtenerAlmacenamientoLocal()?.removeItem(CLAVE_CAPTURA_PENDIENTE)
}

function registrarFotoRestaurada(contexto, imagen) {
  if (!contexto?.clave || !imagen) return false

  fotoRestaurada = { contexto, imagen }
  limpiarCapturaPendiente()
  return true
}

function consumirFotoRestaurada(clave) {
  const recuperacion = consumirCapturaRestaurada(clave)
  return recuperacion?.imagen || null
}

function consumirCapturaRestaurada(clave) {
  if (!fotoRestaurada || fotoRestaurada.contexto.clave !== clave) return null

  const recuperacion = fotoRestaurada
  fotoRestaurada = null
  return recuperacion
}

export default {
  guardarCapturaPendiente,
  obtenerCapturaPendiente,
  limpiarCapturaPendiente,
  registrarFotoRestaurada,
  consumirFotoRestaurada,
  consumirCapturaRestaurada,
}
