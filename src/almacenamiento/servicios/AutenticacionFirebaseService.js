import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import firebaseBaseService from './FirebaseBaseService.js'
import { obtenerMensajeErrorFirebaseAuth } from './MensajesErroresFirebaseAuth.js'

let credencialGooglePendiente = null

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

function crearErrorAutenticacion(error) {
  const errorNormalizado = new Error(obtenerMensajeErrorFirebaseAuth(error))
  errorNormalizado.code = error?.code || ''
  errorNormalizado.correo = error?.customData?.email || error?.email || ''
  return errorNormalizado
}

function esPlataformaNativa() {
  return Capacitor.isNativePlatform()
}

function crearCredencialGoogleDesdeResultadoNativo(resultado) {
  const idToken = resultado?.credential?.idToken

  if (!idToken) {
    const error = new Error('No se recibió una credencial de Google.')
    error.code = 'auth/google-credential-unavailable'
    throw error
  }

  return GoogleAuthProvider.credential(idToken, resultado.credential.accessToken || null)
}

async function obtenerResultadoGoogle() {
  const auth = obtenerAuth()

  if (esPlataformaNativa()) {
    const resultadoNativo = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true })
    return signInWithCredential(auth, crearCredencialGoogleDesdeResultadoNativo(resultadoNativo))
  }

  const proveedorGoogle = new GoogleAuthProvider()
  proveedorGoogle.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(auth, proveedorGoogle)
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
    throw crearErrorAutenticacion(error)
  }
}

async function iniciarSesionConCorreo({ correo, contrasena }) {
  try {
    const auth = obtenerAuth()
    const credencial = await signInWithEmailAndPassword(auth, normalizarCorreo(correo), contrasena)
    return normalizarUsuarioFirebase(credencial.user)
  } catch (error) {
    throw crearErrorAutenticacion(error)
  }
}

async function iniciarSesionConGoogle() {
  try {
    const resultado = await obtenerResultadoGoogle()
    return normalizarUsuarioFirebase(resultado.user)
  } catch (error) {
    if (error?.code === 'auth/account-exists-with-different-credential') {
      credencialGooglePendiente = GoogleAuthProvider.credentialFromError(error)
    }

    throw crearErrorAutenticacion(error)
  }
}

async function vincularGoogleConCorreo({ correo, contrasena }) {
  if (!credencialGooglePendiente) {
    const error = new Error('No hay una cuenta de Google pendiente para vincular.')
    error.code = 'auth/google-credential-unavailable'
    throw crearErrorAutenticacion(error)
  }

  try {
    const credencialCorreo = await signInWithEmailAndPassword(
      obtenerAuth(),
      normalizarCorreo(correo),
      contrasena,
    )
    const resultado = await linkWithCredential(credencialCorreo.user, credencialGooglePendiente)

    credencialGooglePendiente = null
    return normalizarUsuarioFirebase(resultado.user)
  } catch (error) {
    throw crearErrorAutenticacion(error)
  }
}

function cancelarVinculacionGoogle() {
  credencialGooglePendiente = null
}

async function cerrarSesion() {
  try {
    await signOut(obtenerAuth())
  } catch (error) {
    throw crearErrorAutenticacion(error)
  }
}

async function enviarRecuperacionContrasena(correo) {
  try {
    await sendPasswordResetEmail(obtenerAuth(), normalizarCorreo(correo))
  } catch (error) {
    throw crearErrorAutenticacion(error)
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
  iniciarSesionConGoogle,
  vincularGoogleConCorreo,
  cancelarVinculacionGoogle,
  crearErrorAutenticacion,
}
