import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import {
  CAMPOS_MODELO_FIRESTORE,
  ESTADOS_SINCRONIZACION,
  LIMITES_MODELO_FIRESTORE,
  TIPOS_USUARIO,
} from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()

  if (!usuario.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) {
    return null
  }

  return usuario.id
}

function normalizarIdDocumento(valor) {
  return String(valor || '')
    .trim()
    .replace(/\//g, '-')
}

function obtenerDb() {
  return firebaseBaseService.obtenerFirestoreDb()
}

function obtenerColeccionComercios(usuarioId) {
  return collection(obtenerDb(), 'usuarios', usuarioId, 'comercios')
}

function obtenerReferenciaComercio(usuarioId, comercioId) {
  return doc(obtenerColeccionComercios(usuarioId), normalizarIdDocumento(comercioId))
}

function normalizarTextoBusqueda(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function seleccionarCamposPermitidos(datos, camposPermitidos) {
  return camposPermitidos.reduce((resultado, campo) => {
    if (datos[campo] !== undefined) {
      resultado[campo] = datos[campo]
    }

    return resultado
  }, {})
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function resolverFotoFirestore(entidad) {
  const foto = String(entidad?.foto || '').trim()

  if (!foto) {
    return {
      fotoUrl: entidad?.fotoUrl || null,
      fotoRutaStorage: entidad?.fotoRutaStorage || null,
      fotoFuente: entidad?.fotoFuente || null,
    }
  }

  if (foto.startsWith('data:')) {
    return {
      fotoUrl: null,
      fotoRutaStorage: entidad?.fotoRutaStorage || null,
      fotoFuente: entidad?.fotoFuente || null,
    }
  }

  if (/^https?:\/\//.test(foto)) {
    return {
      fotoUrl: foto,
      fotoRutaStorage: entidad?.fotoRutaStorage || null,
      fotoFuente: entidad?.fotoFuente || 'externa',
    }
  }

  return {
    fotoUrl: entidad?.fotoUrl || null,
    fotoRutaStorage: entidad?.fotoRutaStorage || foto,
    fotoFuente: entidad?.fotoFuente || 'storage',
  }
}

function normalizarDireccionParaFirestore(direccion, comercio, ahora) {
  const direccionId = normalizarIdDocumento(direccion?.id) || `direccion-${Date.now()}`
  const fotoFirestore = resolverFotoFirestore(direccion)
  const calle = String(direccion?.calle || '').trim()
  const nombreComercio = String(comercio?.nombre || '').trim()

  const direccionNormalizada = {
    ...direccion,
    ...fotoFirestore,
    id: direccionId,
    calle,
    barrio: direccion?.barrio || '',
    ciudad: direccion?.ciudad || '',
    nombreCompleto:
      direccion?.nombreCompleto || (calle ? `${nombreComercio} - ${calle}` : nombreComercio),
    fechaCreacion: normalizarFechaIso(direccion?.fechaCreacion || ahora),
    fechaActualizacion: normalizarFechaIso(direccion?.fechaActualizacion || ahora),
    fechaUltimoUso: normalizarFechaIso(direccion?.fechaUltimoUso || ahora),
    eliminado: Boolean(direccion?.eliminado),
  }

  return seleccionarCamposPermitidos(direccionNormalizada, CAMPOS_MODELO_FIRESTORE.direccion)
}

function normalizarComercioParaFirestore(comercio, usuarioId) {
  const ahora = new Date().toISOString()
  const comercioId = normalizarIdDocumento(comercio?.id) || `comercio-${Date.now()}`
  const fotoFirestore = resolverFotoFirestore(comercio)
  const direcciones = Array.isArray(comercio?.direcciones)
    ? comercio.direcciones
        .slice(0, LIMITES_MODELO_FIRESTORE.direccionesComercioEmbebidasMaximo)
        .map((direccion) => normalizarDireccionParaFirestore(direccion, comercio, ahora))
    : []

  const comercioNormalizado = {
    ...comercio,
    ...fotoFirestore,
    id: comercioId,
    usuarioId,
    nombre: String(comercio?.nombre || '').trim(),
    nombreNormalizado: normalizarTextoBusqueda(comercio?.nombre),
    tipo: comercio?.tipo || 'Otro',
    direcciones,
    fechaCreacion: normalizarFechaIso(comercio?.fechaCreacion || ahora),
    fechaActualizacion: normalizarFechaIso(comercio?.fechaActualizacion || ahora),
    fechaUltimoUso: normalizarFechaIso(comercio?.fechaUltimoUso || comercio?.fechaCreacion || ahora),
    cantidadUsos: Number(comercio?.cantidadUsos || 0),
    eliminado: Boolean(comercio?.eliminado),
  }

  return seleccionarCamposPermitidos(comercioNormalizado, CAMPOS_MODELO_FIRESTORE.comercio)
}

function crearResultadoOmitido() {
  return {
    exito: false,
    omitido: true,
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    mensaje: 'No hay usuario Firebase autenticado.',
  }
}

function obtenerEstadoEscrituraAceptada() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
    ? ESTADOS_SINCRONIZACION.PENDIENTE
    : ESTADOS_SINCRONIZACION.SINCRONIZADO
}

async function guardarComercio(comercio) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const comercioFirestore = normalizarComercioParaFirestore(comercio, usuarioId)
  await setDoc(obtenerReferenciaComercio(usuarioId, comercioFirestore.id), comercioFirestore, {
    merge: true,
  })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    comercio: comercioFirestore,
  }
}

async function obtenerComercioPorId(comercioId, opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return null

  const snapshot = await getDoc(obtenerReferenciaComercio(usuarioId, comercioId))
  if (!snapshot.exists()) return null

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

async function obtenerComerciosUsuario(opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return []

  const cantidad = Number(opciones.limite || LIMITES_MODELO_FIRESTORE.comerciosPorPagina)
  const consulta = query(
    obtenerColeccionComercios(usuarioId),
    orderBy('fechaUltimoUso', 'desc'),
    limit(cantidad),
  )
  const snapshot = await getDocs(consulta)
  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }))
}

async function actualizarComercio(comercioId, cambios) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const cambiosNormalizados = seleccionarCamposPermitidos(
    {
      ...cambios,
      id: normalizarIdDocumento(comercioId),
      usuarioId,
      fechaActualizacion: new Date().toISOString(),
    },
    CAMPOS_MODELO_FIRESTORE.comercio,
  )

  await setDoc(obtenerReferenciaComercio(usuarioId, comercioId), cambiosNormalizados, {
    merge: true,
  })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

async function actualizarDirecciones(comercioId, direcciones, comercio = {}) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const ahora = new Date().toISOString()
  const direccionesNormalizadas = Array.isArray(direcciones)
    ? direcciones
        .slice(0, LIMITES_MODELO_FIRESTORE.direccionesComercioEmbebidasMaximo)
        .map((direccion) => normalizarDireccionParaFirestore(direccion, comercio, ahora))
    : []

  await setDoc(
    obtenerReferenciaComercio(usuarioId, comercioId),
    {
      id: normalizarIdDocumento(comercioId),
      usuarioId,
      direcciones: direccionesNormalizadas,
      fechaActualizacion: ahora,
    },
    { merge: true },
  )

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

async function registrarUsoComercio(comercioId, comercio) {
  return guardarComercio({
    ...comercio,
    id: comercioId,
    fechaActualizacion: new Date().toISOString(),
  })
}

async function eliminarComercio(comercioId) {
  return actualizarComercio(comercioId, {
    eliminado: true,
  })
}

export default {
  obtenerColeccionComercios,
  obtenerReferenciaComercio,
  normalizarComercioParaFirestore,
  guardarComercio,
  obtenerComercioPorId,
  obtenerComerciosUsuario,
  actualizarComercio,
  actualizarDirecciones,
  registrarUsoComercio,
  eliminarComercio,
}
