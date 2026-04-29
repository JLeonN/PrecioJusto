import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth'
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

async function cerrarSesionActual() {
  await signOut(authFirebase)
}

function obtenerUsuarioActual() {
  return authFirebase.currentUser
}

export default {
  escucharCambioSesion,
  iniciarSesionAnonimaSiNoExiste,
  cerrarSesionActual,
  obtenerUsuarioActual,
}
