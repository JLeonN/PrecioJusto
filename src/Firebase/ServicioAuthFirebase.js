import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { authFirebase } from './ClienteFirebase.js'

function escucharCambioSesion(callback) {
  return onAuthStateChanged(authFirebase, callback)
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
    const credencialVinculada = await linkWithPopup(usuarioActual, proveedorGoogle)
    return credencialVinculada.user
  }

  const credencial = await signInWithPopup(authFirebase, proveedorGoogle)
  return credencial.user
}

async function cerrarSesionActual() {
  await signOut(authFirebase)
}

function obtenerUsuarioActual() {
  return authFirebase.currentUser
}

export default {
  escucharCambioSesion,
  iniciarSesionAnonimaSiNoExiste,
  iniciarSesionConGoogle,
  cerrarSesionActual,
  obtenerUsuarioActual,
}
