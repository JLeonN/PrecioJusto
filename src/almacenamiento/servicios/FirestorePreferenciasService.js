import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  CAMPOS_MODELO_FIRESTORE,
  ESTADOS_SINCRONIZACION,
  TIPOS_USUARIO,
} from '../constantes/PreparacionFirebase.js'
import { MONEDA_DEFAULT } from '../constantes/Monedas.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

const UNIDAD_DEFAULT = 'unidad'

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

function obtenerReferenciaPreferencias(usuarioId) {
  return doc(obtenerDb(), 'usuarios', usuarioId, 'configuracion', 'preferencias')
}

function seleccionarCamposPermitidos(datos, camposPermitidos) {
  return camposPermitidos.reduce((resultado, campo) => {
    if (datos[campo] !== undefined) {
      resultado[campo] = datos[campo]
    }

    return resultado
  }, {})
}

function normalizarTexto(valor) {
  const texto = String(valor || '').trim()
  return texto || null
}

function normalizarModoMoneda(modoMoneda) {
  return modoMoneda === 'manual' ? 'manual' : 'automatica'
}

function normalizarModoTema(modoTema) {
  if (modoTema === 'claro' || modoTema === 'oscuro' || modoTema === 'sistema') {
    return modoTema
  }

  return 'sistema'
}

function normalizarMonedaManual(monedaManual) {
  const moneda = String(monedaManual || '').trim().toUpperCase()
  return moneda || MONEDA_DEFAULT
}

function normalizarUnidad(unidad) {
  const unidadNormalizada = String(unidad || '').trim()
  return unidadNormalizada || UNIDAD_DEFAULT
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function normalizarPreferenciasParaFirestore(preferencias, usuarioId) {
  const preferenciasNormalizadas = {
    usuarioId,
    modoMoneda: normalizarModoMoneda(preferencias?.modoMoneda),
    modoTema: normalizarModoTema(preferencias?.modoTema),
    monedaManual: normalizarMonedaManual(preferencias?.monedaManual),
    paisDetectado: normalizarTexto(preferencias?.paisDetectado),
    monedaDetectada: normalizarTexto(preferencias?.monedaDetectada),
    unidad: normalizarUnidad(preferencias?.unidad),
    fechaActualizacion: normalizarFechaIso(preferencias?.fechaActualizacion),
  }

  return seleccionarCamposPermitidos(preferenciasNormalizadas, CAMPOS_MODELO_FIRESTORE.preferencias)
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

async function guardarPreferencias(preferencias) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const preferenciasFirestore = normalizarPreferenciasParaFirestore(preferencias, usuarioId)
  await setDoc(obtenerReferenciaPreferencias(usuarioId), preferenciasFirestore, { merge: true })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    preferencias: preferenciasFirestore,
  }
}

async function obtenerPreferenciasUsuario(opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return null

  const snapshot = await getDoc(obtenerReferenciaPreferencias(usuarioId))
  if (!snapshot.exists()) return null

  return normalizarPreferenciasParaFirestore(snapshot.data(), usuarioId)
}

async function actualizarPreferenciasParciales(cambios) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const cambiosNormalizados = normalizarPreferenciasParaFirestore(
    {
      ...cambios,
      fechaActualizacion: new Date().toISOString(),
    },
    usuarioId,
  )
  await setDoc(obtenerReferenciaPreferencias(usuarioId), cambiosNormalizados, { merge: true })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    preferencias: cambiosNormalizados,
  }
}

export default {
  obtenerReferenciaPreferencias,
  normalizarPreferenciasParaFirestore,
  guardarPreferencias,
  obtenerPreferenciasUsuario,
  actualizarPreferenciasParciales,
}
