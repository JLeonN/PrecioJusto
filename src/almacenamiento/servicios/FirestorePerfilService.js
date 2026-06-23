import { doc, getDoc, setDoc } from 'firebase/firestore'
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

function obtenerReferenciaPerfil(usuarioId) {
  return doc(obtenerDb(), 'usuarios', usuarioId, 'configuracion', 'perfil')
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
  return String(valor || '').trim()
}

function normalizarFechaNacimiento(valor) {
  const fecha = normalizarTexto(valor)
  if (!fecha) return null

  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
  return fechaValida ? fecha : null
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function normalizarPerfilParaFirestore(perfil, usuarioId) {
  const perfilNormalizado = {
    usuarioId,
    nombreUsuario: normalizarTexto(perfil?.nombreUsuario),
    fechaNacimiento: normalizarFechaNacimiento(perfil?.fechaNacimiento),
    fechaActualizacion: normalizarFechaIso(perfil?.fechaActualizacion),
  }

  return seleccionarCamposPermitidos(perfilNormalizado, CAMPOS_MODELO_FIRESTORE.perfil)
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

async function guardarPerfil(perfil) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const perfilFirestore = normalizarPerfilParaFirestore(
    {
      ...perfil,
      fechaActualizacion: new Date().toISOString(),
    },
    usuarioId,
  )
  await setDoc(obtenerReferenciaPerfil(usuarioId), perfilFirestore, { merge: true })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    perfil: perfilFirestore,
  }
}

async function obtenerPerfilUsuario(opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return null

  const snapshot = await getDoc(obtenerReferenciaPerfil(usuarioId))
  if (!snapshot.exists()) {
    return normalizarPerfilParaFirestore({}, usuarioId)
  }

  return normalizarPerfilParaFirestore(snapshot.data(), usuarioId)
}

export default {
  obtenerReferenciaPerfil,
  normalizarPerfilParaFirestore,
  guardarPerfil,
  obtenerPerfilUsuario,
}
