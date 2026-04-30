import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from './ClienteFirebase.js'

function crearReferenciaPerfil(usuarioId) {
  return doc(firestoreDb, 'users', usuarioId, 'perfil', 'principal')
}

function resolverDatosPerfilDesdeUsuario(usuario) {
  const proveedorPrincipal = usuario.providerData?.[0] || {}
  const nombre = usuario.displayName || proveedorPrincipal.displayName || 'Usuario anónimo'
  const email = usuario.email || proveedorPrincipal.email || null
  const foto = usuario.photoURL || proveedorPrincipal.photoURL || null

  return {
    usuarioId: usuario.uid,
    tipoCuenta: usuario.isAnonymous ? 'anonima' : 'registrada',
    nombre,
    email,
    foto,
  }
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
  const datosPerfil = resolverDatosPerfilDesdeUsuario(usuario)

  await setDoc(
    referenciaPerfil,
    {
      ...datosPerfil,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    },
    { merge: true },
  )

  return datosPerfil
}

async function actualizarPerfilSesion(usuario) {
  const referenciaPerfil = crearReferenciaPerfil(usuario.uid)
  const datosPerfil = resolverDatosPerfilDesdeUsuario(usuario)

  await setDoc(
    referenciaPerfil,
    {
      ...datosPerfil,
      fechaActualizacion: serverTimestamp(),
    },
    { merge: true },
  )

  return datosPerfil
}

export default {
  resolverDatosPerfilDesdeUsuario,
  obtenerPerfilUsuario,
  guardarPerfilInicial,
  actualizarPerfilSesion,
}
