import { doc, setDoc } from 'firebase/firestore'
import { ESTADOS_SINCRONIZACION, TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

function normalizarContador(valor) {
  const numero = Number.parseInt(valor ?? 0, 10)
  return Number.isNaN(numero) || numero < 0 ? 0 : numero
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()

  if (!usuario.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) {
    return null
  }

  return usuario.id
}

function obtenerReferenciaApoyosApp(usuarioId) {
  return doc(firebaseBaseService.obtenerFirestoreDb(), 'usuarios', usuarioId, 'configuracion', 'apoyosApp')
}

function normalizarApoyosParaFirestore(apoyos, usuarioId) {
  return {
    usuarioId,
    graciasVideo: normalizarContador(apoyos?.graciasVideo),
    compartidosIniciados: normalizarContador(apoyos?.compartidosIniciados),
    fechaActualizacion: normalizarFechaIso(apoyos?.fechaActualizacion),
  }
}

function crearResultadoOmitido() {
  return {
    exito: false,
    omitido: true,
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    mensaje: 'No hay usuario Firebase autenticado.',
  }
}

async function guardarApoyosApp(apoyos) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const apoyosFirestore = normalizarApoyosParaFirestore(apoyos, usuarioId)
  await setDoc(obtenerReferenciaApoyosApp(usuarioId), apoyosFirestore, { merge: true })

  return {
    exito: true,
    estado:
      typeof navigator !== 'undefined' && navigator.onLine === false
        ? ESTADOS_SINCRONIZACION.PENDIENTE
        : ESTADOS_SINCRONIZACION.SINCRONIZADO,
    apoyos: apoyosFirestore,
  }
}

export default {
  obtenerReferenciaApoyosApp,
  normalizarApoyosParaFirestore,
  guardarApoyosApp,
}
