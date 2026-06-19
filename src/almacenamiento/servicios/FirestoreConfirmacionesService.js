import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import {
  CAMPOS_MODELO_FIRESTORE,
  ESTADOS_SINCRONIZACION,
  TIPOS_USUARIO,
} from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()

  if (!usuario.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) {
    return null
  }

  return usuario.id
}

function obtenerDb() {
  return firebaseBaseService.obtenerFirestoreDb()
}

function normalizarIdDocumento(valor) {
  return String(valor || '')
    .trim()
    .replace(/\//g, '-')
}

function obtenerColeccionConfirmaciones(usuarioId) {
  return collection(obtenerDb(), 'usuarios', usuarioId, 'confirmaciones')
}

function crearConfirmacionId(productoId, precioId) {
  const productoNormalizado = normalizarIdDocumento(productoId) || 'producto'
  const precioNormalizado = normalizarIdDocumento(precioId) || 'precio'
  return `${productoNormalizado}_${precioNormalizado}`
}

function obtenerReferenciaConfirmacion(usuarioId, confirmacionId) {
  return doc(obtenerColeccionConfirmaciones(usuarioId), normalizarIdDocumento(confirmacionId))
}

function seleccionarCamposPermitidos(datos, camposPermitidos) {
  return camposPermitidos.reduce((resultado, campo) => {
    if (datos[campo] !== undefined) {
      resultado[campo] = datos[campo]
    }

    return resultado
  }, {})
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function normalizarConfirmacionParaFirestore(confirmacion, usuarioId) {
  const confirmacionId =
    normalizarIdDocumento(confirmacion?.id) ||
    crearConfirmacionId(confirmacion?.productoId, confirmacion?.precioId)

  const confirmacionNormalizada = {
    id: confirmacionId,
    usuarioId,
    productoId: normalizarIdDocumento(confirmacion?.productoId) || null,
    precioId: normalizarIdDocumento(confirmacion?.precioId) || null,
    fecha: normalizarFechaIso(confirmacion?.fecha),
    origen: String(confirmacion?.origen || 'manual').trim() || 'manual',
  }

  return seleccionarCamposPermitidos(confirmacionNormalizada, CAMPOS_MODELO_FIRESTORE.confirmacion)
}

function crearResultadoOmitido() {
  return {
    exito: false,
    omitido: true,
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    mensaje: 'No hay usuario Firebase autenticado.',
  }
}

function obtenerEstadoEscrituraAceptada() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
    ? ESTADOS_SINCRONIZACION.PENDIENTE
    : ESTADOS_SINCRONIZACION.SINCRONIZADO
}

async function guardarConfirmacion(confirmacion) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const confirmacionFirestore = normalizarConfirmacionParaFirestore(confirmacion, usuarioId)
  await setDoc(
    obtenerReferenciaConfirmacion(usuarioId, confirmacionFirestore.id),
    confirmacionFirestore,
    { merge: true },
  )

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    confirmacion: confirmacionFirestore,
  }
}

async function obtenerConfirmacionesUsuario(opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return new Set()

  const snapshot = await getDocs(obtenerColeccionConfirmaciones(usuarioId))
  const precioIds = new Set()

  snapshot.docs.forEach((documento) => {
    const datos = documento.data()
    const precioId = normalizarIdDocumento(datos?.precioId)
    if (precioId) {
      precioIds.add(precioId)
    }
  })

  return precioIds
}

async function usuarioConfirmoPrecio(precioId, opciones = {}) {
  const confirmaciones = await obtenerConfirmacionesUsuario(opciones)
  return confirmaciones.has(normalizarIdDocumento(precioId))
}

async function eliminarConfirmacion(confirmacion) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const confirmacionId =
    normalizarIdDocumento(confirmacion?.id) ||
    crearConfirmacionId(confirmacion?.productoId, confirmacion?.precioId)

  await deleteDoc(obtenerReferenciaConfirmacion(usuarioId, confirmacionId))

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

async function limpiarConfirmacionesUsuario() {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const snapshot = await getDocs(obtenerColeccionConfirmaciones(usuarioId))
  const eliminaciones = snapshot.docs.map((documento) => deleteDoc(documento.ref))
  await Promise.all(eliminaciones)

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    eliminadas: snapshot.docs.length,
  }
}

export default {
  obtenerColeccionConfirmaciones,
  obtenerReferenciaConfirmacion,
  crearConfirmacionId,
  normalizarConfirmacionParaFirestore,
  guardarConfirmacion,
  obtenerConfirmacionesUsuario,
  usuarioConfirmoPrecio,
  eliminarConfirmacion,
  limpiarConfirmacionesUsuario,
}
