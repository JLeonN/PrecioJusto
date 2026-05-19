import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import firebaseBaseService from './FirebaseBaseService.js'

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
  const mensajesPorCodigo = {
    'auth/email-already-in-use': 'Ese correo ya está registrado. Iniciá sesión o recuperá tu contraseña.',
    'auth/invalid-email': 'Ingresá un correo válido.',
    'auth/missing-email': 'Ingresá un correo válido.',
    'auth/missing-password': 'Ingresá una contraseña.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Hubo demasiados intentos. Esperá unos minutos y probá de nuevo.',
    'auth/network-request-failed': 'No hay conexión suficiente para autenticarte.',
    'auth/operation-not-allowed': 'El acceso por correo y contraseña no está habilitado en Firebase.',
  }

  return mensajesPorCodigo[error?.code] || 'No se pudo completar la autenticación. Probá de nuevo.'
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
