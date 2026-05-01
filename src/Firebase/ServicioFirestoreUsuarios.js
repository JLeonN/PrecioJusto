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
  const proveedorId = proveedorPrincipal.providerId || (usuario.isAnonymous ? 'anonymous' : 'password')

  return {
    usuarioId: usuario.uid,
    tipoCuenta: usuario.isAnonymous ? 'anonima' : 'registrada',
    nombre,
    email,
    foto,
    origenGoogle: {
      proveedorId,
      nombreOriginal: proveedorPrincipal.displayName || null,
      emailOriginal: proveedorPrincipal.email || null,
      fotoOriginal: proveedorPrincipal.photoURL || null,
    },
  }
}

function calcularEdadDesdeFecha(fechaNacimientoIso) {
  if (!fechaNacimientoIso) return null

  const fechaNacimiento = new Date(`${fechaNacimientoIso}T00:00:00`)
  if (Number.isNaN(fechaNacimiento.getTime())) return null

  const hoy = new Date()
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
  const aunNoCumplio =
    hoy.getMonth() < fechaNacimiento.getMonth() ||
    (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate())

  if (aunNoCumplio) edad -= 1
  return edad >= 0 ? edad : null
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
      perfilEditable: {
        nombre: datosPerfil.nombre,
        foto: datosPerfil.foto,
        fechaNacimiento: null,
        edad: null,
      },
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

async function guardarPerfilEditable(usuarioId, datosPerfilEditable) {
  const referenciaPerfil = crearReferenciaPerfil(usuarioId)
  const fechaNacimiento = datosPerfilEditable.fechaNacimiento || null
  const edad = calcularEdadDesdeFecha(fechaNacimiento)

  const datosNormalizados = {
    nombre: (datosPerfilEditable.nombre || '').trim(),
    foto: (datosPerfilEditable.foto || '').trim() || null,
    fechaNacimiento,
    edad,
    perfilEditable: {
      nombre: (datosPerfilEditable.nombre || '').trim(),
      foto: (datosPerfilEditable.foto || '').trim() || null,
      fechaNacimiento,
      edad,
    },
    fechaActualizacion: serverTimestamp(),
  }

  await setDoc(referenciaPerfil, datosNormalizados, { merge: true })
  return { ...datosNormalizados }
}

export default {
  resolverDatosPerfilDesdeUsuario,
  calcularEdadDesdeFecha,
  obtenerPerfilUsuario,
  guardarPerfilInicial,
  actualizarPerfilSesion,
  guardarPerfilEditable,
}
