import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { authFirebase } from './ClienteFirebase.js'

function escucharCambioSesion(callback) {
  return onAuthStateChanged(authFirebase, callback)
}

async function procesarResultadoRedirectGoogle() {
  const resultado = await getRedirectResult(authFirebase)
  return resultado?.user || null
}

async function iniciarSesionAnonimaSiNoExiste() {
  if (authFirebase.currentUser) {
    return authFirebase.currentUser
  }

  const credencial = await signInAnonymously(authFirebase)
  return credencial.user
}

async function iniciarSesionConGoogle() {
  const proveedorGoogle = new GoogleAuthProvider()
  proveedorGoogle.setCustomParameters({ prompt: 'select_account' })

  const usuarioActual = authFirebase.currentUser

  if (usuarioActual?.isAnonymous) {
    try {
      const credencialVinculada = await linkWithPopup(usuarioActual, proveedorGoogle)
      return credencialVinculada.user
    } catch (error) {
      const codigoError = error?.code || ''
      if (codigoError === 'auth/popup-blocked') {
        await signInWithRedirect(authFirebase, proveedorGoogle)
        return null
      }

      const cuentaYaExiste =
        codigoError === 'auth/credential-already-in-use' ||
        codigoError === 'auth/email-already-in-use' ||
        codigoError === 'auth/account-exists-with-different-credential'

      if (cuentaYaExiste) {
        const credencialExistente = GoogleAuthProvider.credentialFromError(error)
        if (credencialExistente) {
          const resultado = await signInWithCredential(authFirebase, credencialExistente)
          return resultado.user
        }
      }

      if (!cuentaYaExiste) {
        throw error
      }
    }
  }

  try {
    const credencial = await signInWithPopup(authFirebase, proveedorGoogle)
    return credencial.user
  } catch (error) {
    if (error?.code === 'auth/popup-blocked') {
      await signInWithRedirect(authFirebase, proveedorGoogle)
      return null
    }

    throw error
  }
}

async function iniciarSesionConCorreo(email, contrasena) {
  const credencial = await signInWithEmailAndPassword(authFirebase, email, contrasena)
  return credencial.user
}

async function registrarConCorreo(email, contrasena) {
  const usuarioActual = authFirebase.currentUser

  if (usuarioActual?.isAnonymous) {
    const credencialCorreo = EmailAuthProvider.credential(email, contrasena)
    const vinculacion = await linkWithCredential(usuarioActual, credencialCorreo)
    return vinculacion.user
  }

  const credencial = await createUserWithEmailAndPassword(authFirebase, email, contrasena)
  return credencial.user
}

async function enviarRecuperacionContrasena(email) {
  await sendPasswordResetEmail(authFirebase, email)
}

async function cerrarSesionActual() {
  await signOut(authFirebase)
}

function obtenerUsuarioActual() {
  return authFirebase.currentUser
}

export default {
  escucharCambioSesion,
  procesarResultadoRedirectGoogle,
  iniciarSesionAnonimaSiNoExiste,
  iniciarSesionConGoogle,
  iniciarSesionConCorreo,
  registrarConCorreo,
  enviarRecuperacionContrasena,
  cerrarSesionActual,
  obtenerUsuarioActual,
}
