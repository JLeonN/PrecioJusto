import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from './ClienteFirebase.js'

function crearReferenciaPerfil(usuarioId) {
  return doc(firestoreDb, 'users', usuarioId, 'perfil', 'principal')
}

async function obtenerPerfilUsuario(usuarioId) {
  const referenciaPerfil = crearReferenciaPerfil(usuarioId)
  const snapshotPerfil = await getDoc(referenciaPerfil)

  if (!snapshotPerfil.exists()) {
    return null
  }

  return snapshotPerfil.data()
}

async function guardarPerfilInicial(usuario) {
  const referenciaPerfil = crearReferenciaPerfil(usuario.uid)

  await setDoc(
    referenciaPerfil,
    {
      usuarioId: usuario.uid,
      tipoCuenta: usuario.isAnonymous ? 'anonima' : 'registrada',
      nombre: usuario.displayName || 'Usuario anónimo',
      email: usuario.email || null,
      foto: usuario.photoURL || null,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    },
    { merge: true },
  )
}

async function actualizarPerfilSesion(usuario) {
  const referenciaPerfil = crearReferenciaPerfil(usuario.uid)

  await setDoc(
    referenciaPerfil,
    {
      tipoCuenta: usuario.isAnonymous ? 'anonima' : 'registrada',
      nombre: usuario.displayName || 'Usuario anónimo',
      email: usuario.email || null,
      foto: usuario.photoURL || null,
      fechaActualizacion: serverTimestamp(),
    },
    { merge: true },
  )
}

export default {
  obtenerPerfilUsuario,
  guardarPerfilInicial,
  actualizarPerfilSesion,
}
