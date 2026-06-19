import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import {
  CAMPOS_MODELO_FIRESTORE,
  ESTADOS_SINCRONIZACION,
  ORIGENES_FOTO,
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

function obtenerDb() {
  return firebaseBaseService.obtenerFirestoreDb()
}

function normalizarIdDocumento(valor) {
  return String(valor || '')
    .trim()
    .replace(/\//g, '-')
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function seleccionarCamposPermitidos(datos, camposPermitidos) {
  return camposPermitidos.reduce((resultado, campo) => {
    if (datos[campo] !== undefined) {
      resultado[campo] = datos[campo]
    }

    return resultado
  }, {})
}

function obtenerColeccionMesaTrabajo(usuarioId) {
  return collection(obtenerDb(), 'usuarios', usuarioId, 'mesaTrabajoItems')
}

function obtenerReferenciaItemMesaTrabajo(usuarioId, itemId) {
  return doc(obtenerColeccionMesaTrabajo(usuarioId), normalizarIdDocumento(itemId))
}

function resolverImagenFirestore(item) {
  const imagen = String(item?.imagen || '').trim()

  if (!imagen) {
    return {
      imagenUrl: item?.imagenUrl || null,
      imagenRutaStorage: item?.imagenRutaStorage || null,
      fotoFuente: item?.fotoFuente || null,
    }
  }

  if (imagen.startsWith('data:')) {
    return {
      imagenUrl: null,
      imagenRutaStorage: item?.imagenRutaStorage || null,
      fotoFuente: item?.fotoFuente || ORIGENES_FOTO.USUARIO,
    }
  }

  if (/^https?:\/\//.test(imagen)) {
    return {
      imagenUrl: imagen,
      imagenRutaStorage: item?.imagenRutaStorage || null,
      fotoFuente: item?.fotoFuente || ORIGENES_FOTO.EXTERNA,
    }
  }

  return {
    imagenUrl: item?.imagenUrl || null,
    imagenRutaStorage: item?.imagenRutaStorage || imagen,
    fotoFuente: item?.fotoFuente || ORIGENES_FOTO.STORAGE,
  }
}

function normalizarComercio(itemComercio) {
  if (!itemComercio) return null

  return {
    id: itemComercio.id || null,
    nombre: itemComercio.nombre || '',
    direccionId: itemComercio.direccionId || null,
    direccionNombre: itemComercio.direccionNombre || '',
  }
}

function normalizarOrigenListaJusta(origenListaJusta) {
  if (!origenListaJusta) return null

  return {
    listaId: origenListaJusta.listaId || null,
    itemId: origenListaJusta.itemId || null,
  }
}

function normalizarDatosOriginales(datosOriginales) {
  if (!datosOriginales) return null

  return {
    nombre: datosOriginales.nombre || '',
    marca: datosOriginales.marca || null,
    cantidad: Number(datosOriginales.cantidad || 1),
    unidad: datosOriginales.unidad || 'unidad',
    imagen: datosOriginales.imagen || null,
    fotoFuente: datosOriginales.fotoFuente || null,
  }
}

function normalizarItemMesaTrabajoParaFirestore(item, usuarioId) {
  const ahora = new Date().toISOString()
  const id = normalizarIdDocumento(item?.id) || `escaneo_${Date.now()}`
  const imagenFirestore = resolverImagenFirestore(item)
  const itemNormalizado = {
    id,
    usuarioId,
    codigoBarras: item?.codigoBarras || null,
    nombre: String(item?.nombre || '').trim(),
    marca: item?.marca || null,
    cantidad: Number.isFinite(Number(item?.cantidad)) ? Math.max(1, Number(item.cantidad)) : 1,
    unidad: item?.unidad || 'unidad',
    imagenUrl: imagenFirestore.imagenUrl,
    imagenRutaStorage: imagenFirestore.imagenRutaStorage,
    fotoFuente: imagenFirestore.fotoFuente,
    precio: Number.isFinite(Number(item?.precio)) ? Number(item.precio) : 0,
    moneda: String(item?.moneda || 'UYU').trim().toUpperCase() || 'UYU',
    activarPreciosMayoristas: Boolean(item?.activarPreciosMayoristas),
    escalasPorCantidad: Array.isArray(item?.escalasPorCantidad) ? item.escalasPorCantidad : [],
    origenApi: Boolean(item?.origenApi),
    fuenteDato: item?.fuenteDato || null,
    sinCoincidencia: Boolean(item?.sinCoincidencia),
    productoExistenteId: item?.productoExistenteId || null,
    comercio: normalizarComercio(item?.comercio),
    origenListaJusta: normalizarOrigenListaJusta(item?.origenListaJusta),
    datosOriginales: normalizarDatosOriginales(item?.datosOriginales),
    fechaCreacion: normalizarFechaIso(item?.fechaCreacion || ahora),
    fechaActualizacion: normalizarFechaIso(item?.fechaActualizacion || ahora),
  }

  return seleccionarCamposPermitidos(itemNormalizado, CAMPOS_MODELO_FIRESTORE.itemMesaTrabajo)
}

function normalizarItemFirestoreParaApp(itemFirestore) {
  return {
    ...itemFirestore,
    comercio: normalizarComercio(itemFirestore?.comercio),
    origenListaJusta: normalizarOrigenListaJusta(itemFirestore?.origenListaJusta),
    datosOriginales: normalizarDatosOriginales(itemFirestore?.datosOriginales),
    imagen: itemFirestore?.imagen || itemFirestore?.imagenUrl || null,
  }
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

async function guardarItemMesaTrabajo(item) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const itemFirestore = normalizarItemMesaTrabajoParaFirestore(item, usuarioId)
  await setDoc(obtenerReferenciaItemMesaTrabajo(usuarioId, itemFirestore.id), itemFirestore, {
    merge: true,
  })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    item: itemFirestore,
  }
}

async function guardarItemsMesaTrabajo(items = []) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const itemsNormalizados = items.map((item) => normalizarItemMesaTrabajoParaFirestore(item, usuarioId))

  for (const itemFirestore of itemsNormalizados) {
    await setDoc(obtenerReferenciaItemMesaTrabajo(usuarioId, itemFirestore.id), itemFirestore, {
      merge: true,
    })
  }

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    cantidad: itemsNormalizados.length,
  }
}

async function eliminarItemMesaTrabajo(itemId) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  await deleteDoc(obtenerReferenciaItemMesaTrabajo(usuarioId, itemId))

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

async function limpiarMesaTrabajoUsuario() {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const snapshot = await getDocs(obtenerColeccionMesaTrabajo(usuarioId))
  const eliminaciones = snapshot.docs.map((documento) => deleteDoc(documento.ref))
  await Promise.all(eliminaciones)

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    eliminados: snapshot.docs.length,
  }
}

async function obtenerItemsMesaTrabajoUsuario(opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return []

  const cantidad = Number(opciones.limite || 300)
  const consulta = query(
    obtenerColeccionMesaTrabajo(usuarioId),
    orderBy('fechaActualizacion', 'desc'),
    limit(cantidad),
  )
  const snapshot = await getDocs(consulta)
  return snapshot.docs.map((documento) =>
    normalizarItemFirestoreParaApp({
      id: documento.id,
      ...documento.data(),
    }),
  )
}

export default {
  obtenerColeccionMesaTrabajo,
  obtenerReferenciaItemMesaTrabajo,
  normalizarItemMesaTrabajoParaFirestore,
  guardarItemMesaTrabajo,
  guardarItemsMesaTrabajo,
  eliminarItemMesaTrabajo,
  limpiarMesaTrabajoUsuario,
  obtenerItemsMesaTrabajoUsuario,
}
