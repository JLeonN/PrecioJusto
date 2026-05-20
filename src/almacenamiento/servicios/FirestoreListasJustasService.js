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

function obtenerColeccionListasJustas(usuarioId) {
  return collection(obtenerDb(), 'usuarios', usuarioId, 'listasJustas')
}

function obtenerReferenciaListaJusta(usuarioId, listaId) {
  return doc(obtenerColeccionListasJustas(usuarioId), normalizarIdDocumento(listaId))
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

function resolverImagenItemFirestore(item) {
  const imagen = String(item?.imagen || '').trim()

  if (!imagen) {
    return {
      imagenUrl: item?.imagenUrl || null,
      imagenRutaStorage: item?.imagenRutaStorage || null,
    }
  }

  if (imagen.startsWith('data:')) {
    return {
      imagenUrl: null,
      imagenRutaStorage: item?.imagenRutaStorage || null,
    }
  }

  if (/^https?:\/\//.test(imagen)) {
    return {
      imagenUrl: imagen,
      imagenRutaStorage: item?.imagenRutaStorage || null,
    }
  }

  return {
    imagenUrl: item?.imagenUrl || null,
    imagenRutaStorage: item?.imagenRutaStorage || imagen,
  }
}

function normalizarComercioLista(comercio) {
  if (!comercio) return null

  return {
    id: comercio.id || null,
    nombre: comercio.nombre || '',
    direccionId: comercio.direccionId || null,
    direccionNombre: comercio.direccionNombre || '',
  }
}

function normalizarConfiguracionInteligente(configuracion) {
  if (!configuracion) {
    return {
      comercioBase: null,
      comerciosComparacion: [],
      heredarComercioActual: true,
    }
  }

  return {
    comercioBase: normalizarComercioLista(configuracion.comercioBase),
    comerciosComparacion: Array.isArray(configuracion.comerciosComparacion)
      ? configuracion.comerciosComparacion
        .map((comercio) => normalizarComercioLista(comercio))
        .filter(Boolean)
      : [],
    heredarComercioActual: configuracion.heredarComercioActual !== false,
  }
}

function normalizarItemParaFirestore(item) {
  const imagenFirestore = resolverImagenItemFirestore(item)
  const itemNormalizado = {
    ...item,
    ...imagenFirestore,
    id: normalizarIdDocumento(item?.id) || `itemLista-${Date.now()}`,
    productoId: item?.productoId || null,
    origen: item?.origen || 'manual',
    nombre: String(item?.nombre || '').trim(),
    cantidad: Number.isFinite(Number(item?.cantidad)) ? Math.max(1, Number(item.cantidad)) : 1,
    precioManual:
      Number.isFinite(Number(item?.precioManual)) && Number(item.precioManual) > 0
        ? Number(item.precioManual)
        : null,
    moneda: String(item?.moneda || 'UYU').trim().toUpperCase() || 'UYU',
    comprado: Boolean(item?.comprado),
    codigoBarras: item?.codigoBarras || null,
    marca: item?.marca || null,
    categoria: item?.categoria || null,
    gramosOLitros: item?.gramosOLitros || null,
    comercio: item?.comercio || null,
    unidad: item?.unidad || 'unidad',
    fotoFuente: item?.fotoFuente || null,
    usaPreciosLocales: Boolean(item?.usaPreciosLocales),
    activarPreciosMayoristas: Boolean(item?.activarPreciosMayoristas),
    escalasPorCantidad: Array.isArray(item?.escalasPorCantidad) ? item.escalasPorCantidad : [],
    estadoDerivacion: item?.estadoDerivacion || 'ninguno',
    mesaTrabajoItemId: item?.mesaTrabajoItemId || null,
    origenEscaneo: item?.origenEscaneo || null,
    advertencias: item?.advertencias || null,
    creadoEn: normalizarFechaIso(item?.creadoEn),
    actualizadoEn: normalizarFechaIso(item?.actualizadoEn),
  }

  return seleccionarCamposPermitidos(itemNormalizado, CAMPOS_MODELO_FIRESTORE.itemListaJusta)
}

function normalizarListaParaFirestore(lista, usuarioId) {
  const ahora = new Date().toISOString()
  const listaId = normalizarIdDocumento(lista?.id) || `listaJusta-${Date.now()}`
  const items = Array.isArray(lista?.items)
    ? lista.items
      .slice(0, LIMITES_MODELO_FIRESTORE.itemsListaEmbebidosMaximo)
      .map((item) => normalizarItemParaFirestore(item))
    : []
  const listaNormalizada = {
    ...lista,
    id: listaId,
    usuarioId,
    nombre: String(lista?.nombre || 'Lista sin nombre').trim(),
    orden: Number.isFinite(Number(lista?.orden)) ? Number(lista.orden) : 0,
    estadoGeneral: lista?.estadoGeneral || 'activa',
    preferenciaPrecioFaltante: lista?.preferenciaPrecioFaltante || 'preguntar',
    comercioActual: normalizarComercioLista(lista?.comercioActual),
    configuracionInteligente: normalizarConfiguracionInteligente(lista?.configuracionInteligente),
    items,
    metadatos: lista?.metadatos || { version: 2 },
    fechaCreacion: normalizarFechaIso(lista?.fechaCreacion || ahora),
    fechaActualizacion: normalizarFechaIso(lista?.fechaActualizacion || ahora),
    fechaUltimoUso: normalizarFechaIso(lista?.fechaUltimoUso || lista?.fechaActualizacion || ahora),
    eliminado: Boolean(lista?.eliminado),
  }

  return seleccionarCamposPermitidos(listaNormalizada, CAMPOS_MODELO_FIRESTORE.listaJusta)
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

async function guardarListaJusta(lista) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const listaFirestore = normalizarListaParaFirestore(lista, usuarioId)
  await setDoc(obtenerReferenciaListaJusta(usuarioId, listaFirestore.id), listaFirestore, {
    merge: true,
  })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    lista: listaFirestore,
  }
}

async function guardarListasJustas(listas = []) {
  const resultados = []

  for (const lista of listas) {
    resultados.push(await guardarListaJusta(lista))
  }

  return resultados
}

async function obtenerListaJustaPorId(listaId, opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return null

  const snapshot = await getDoc(obtenerReferenciaListaJusta(usuarioId, listaId))
  if (!snapshot.exists()) return null

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

async function obtenerListasJustasUsuario(opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return []

  const cantidad = Number(opciones.limite || LIMITES_MODELO_FIRESTORE.listasPorPagina)
  const consulta = query(
    obtenerColeccionListasJustas(usuarioId),
    orderBy('fechaUltimoUso', 'desc'),
    limit(cantidad),
  )
  const snapshot = await getDocs(consulta)
  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }))
}

async function actualizarListaJusta(listaId, cambios) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const cambiosNormalizados = seleccionarCamposPermitidos(
    {
      ...cambios,
      id: normalizarIdDocumento(listaId),
      usuarioId,
      fechaActualizacion: new Date().toISOString(),
    },
    CAMPOS_MODELO_FIRESTORE.listaJusta,
  )

  await setDoc(obtenerReferenciaListaJusta(usuarioId, listaId), cambiosNormalizados, {
    merge: true,
  })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

async function eliminarListaJusta(listaId) {
  return actualizarListaJusta(listaId, {
    eliminado: true,
    estadoGeneral: 'eliminada',
  })
}

export default {
  obtenerColeccionListasJustas,
  obtenerReferenciaListaJusta,
  normalizarListaParaFirestore,
  normalizarItemParaFirestore,
  guardarListaJusta,
  guardarListasJustas,
  obtenerListaJustaPorId,
  obtenerListasJustasUsuario,
  actualizarListaJusta,
  eliminarListaJusta,
}
