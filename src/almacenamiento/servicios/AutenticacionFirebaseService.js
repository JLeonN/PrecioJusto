import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import firebaseBaseService from './FirebaseBaseService.js'
import { obtenerMensajeErrorFirebaseAuth } from './MensajesErroresFirebaseAuth.js'

function obtenerAuth() {
  return firebaseBaseService.obtenerFirebaseAuth()
}

function normalizarCorreo(correo) {
  return String(correo || '')
    .trim()
    .toLowerCase()
}

function normalizarUsuarioFirebase(usuario) {
  if (!usuario) return null

  return {
    id: usuario.uid,
    email: usuario.email || '',
    nombre: usuario.displayName || '',
    foto: usuario.photoURL || '',
    proveedor: 'firebase',
    esLocal: false,
  }
}

function normalizarErrorAutenticacion(error) {
  return obtenerMensajeErrorFirebaseAuth(error)
}

async function registrarConCorreo({ correo, contrasena, nombre }) {
  try {
    const auth = obtenerAuth()
    const credencial = await createUserWithEmailAndPassword(
      auth,
      normalizarCorreo(correo),
      contrasena,
    )
    const nombreNormalizado = String(nombre || '').trim()

    if (nombreNormalizado) {
      await updateProfile(credencial.user, { displayName: nombreNormalizado })
    }

    return normalizarUsuarioFirebase(credencial.user)
  } catch (error) {
    throw new Error(normalizarErrorAutenticacion(error))
  }
}

async function iniciarSesionConCorreo({ correo, contrasena }) {
  try {
    const auth = obtenerAuth()
    const credencial = await signInWithEmailAndPassword(auth, normalizarCorreo(correo), contrasena)
    return normalizarUsuarioFirebase(credencial.user)
  } catch (error) {
    throw new Error(normalizarErrorAutenticacion(error))
  }
}

async function cerrarSesion() {
  try {
    await signOut(obtenerAuth())
  } catch (error) {
    throw new Error(normalizarErrorAutenticacion(error))
  }
}

async function enviarRecuperacionContrasena(correo) {
  try {
    await sendPasswordResetEmail(obtenerAuth(), normalizarCorreo(correo))
  } catch (error) {
    throw new Error(normalizarErrorAutenticacion(error))
  }
}

function observarSesion(callback) {
  return firebaseBaseService.observarUsuarioAutenticado((usuario) => {
    callback(normalizarUsuarioFirebase(usuario))
  })
}

export default {
  registrarConCorreo,
  iniciarSesionConCorreo,
  cerrarSesion,
  enviarRecuperacionContrasena,
  observarSesion,
  normalizarUsuarioFirebase,
  normalizarErrorAutenticacion,
}
