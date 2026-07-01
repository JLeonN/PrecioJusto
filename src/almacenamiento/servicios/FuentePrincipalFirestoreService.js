import { TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import conexionService from './ConexionService.js'
import firestoreComerciosService from './FirestoreComerciosService.js'
import firestoreConfirmacionesService from './FirestoreConfirmacionesService.js'
import firestoreListasJustasService from './FirestoreListasJustasService.js'
import firestoreMesaTrabajoService from './FirestoreMesaTrabajoService.js'
import firestorePreferenciasService from './FirestorePreferenciasService.js'
import firestoreProductosService from './FirestoreProductosService.js'
import usuarioActualService from './UsuarioActualService.js'

export const FUENTES_DATOS = Object.freeze({
  LOCAL: 'local',
  FIRESTORE: 'firestore',
  FIRESTORE_CACHE: 'firestoreCache',
  FALLBACK_LOCAL: 'fallbackLocal',
  ERROR: 'error',
})

const DOMINIOS = Object.freeze({
  PRODUCTOS: 'productos',
  COMERCIOS: 'comercios',
  LISTAS: 'listas',
  MESA_TRABAJO: 'mesaTrabajo',
  PREFERENCIAS: 'preferencias',
  CONFIRMACIONES: 'confirmaciones',
})

const estadosPorDominio = new Map()

function crearEstadoInicial(dominio) {
  return {
    dominio,
    fuente: FUENTES_DATOS.LOCAL,
    mensaje: 'Datos locales.',
    conectado: true,
    fechaActualizacion: null,
    error: null,
  }
}

function obtenerUsuarioActual() {
  return usuarioActualService.obtenerUsuarioActual()
}

function debeUsarFirestore(usuario = obtenerUsuarioActual()) {
  return Boolean(usuario?.id && !usuario.esLocal && usuario.tipo === TIPOS_USUARIO.FIREBASE)
}

function tieneDatos(datos) {
  if (!datos) return false
  if (Array.isArray(datos)) return datos.length > 0
  if (datos instanceof Set) return datos.size > 0
  if (typeof datos === 'object') return Object.keys(datos).length > 0
  return true
}

function filtrarEliminados(lista = []) {
  return Array.isArray(lista)
    ? lista.filter((item) => !item?.eliminado && item?.estadoGeneral !== 'eliminada')
    : []
}

function esImagenBase64(valor) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(valor || '').trim())
}

function esUrlImagen(valor) {
  return /^https?:\/\//.test(String(valor || '').trim())
}

function prepararProductosVisuales(productos = []) {
  return filtrarEliminados(productos).map((producto) => ({
    ...producto,
    imagen: producto?.imagen || producto?.imagenUrl || null,
  }))
}

function fusionarProductoLocalFirestore(productoLocal, productoFirestore) {
  if (!productoFirestore) return productoLocal
  if (productoFirestore.eliminado) return { ...productoFirestore }

  const imagenLocal = productoLocal?.imagen
  const imagenUrlLocal = productoLocal?.imagenUrl
  const imagenRemota = productoFirestore?.imagen || productoFirestore?.imagenUrl
  const tieneFotoRemota = esImagenBase64(imagenRemota) || esUrlImagen(imagenRemota)
  const conservaFotoLocal =
    !tieneFotoRemota && (esImagenBase64(imagenLocal) || esUrlImagen(imagenLocal) || esUrlImagen(imagenUrlLocal))
  const imagen = conservaFotoLocal ? imagenLocal || imagenUrlLocal : imagenRemota || null

  return {
    ...productoLocal,
    ...productoFirestore,
    imagen,
    imagenUrl: productoFirestore.imagenUrl || (esUrlImagen(imagen) ? imagen : productoLocal?.imagenUrl || null),
    imagenRutaStorage: productoFirestore.imagenRutaStorage || null,
    fotoFuente: conservaFotoLocal
      ? productoLocal?.fotoFuente || productoFirestore?.fotoFuente || null
      : productoFirestore?.fotoFuente || productoLocal?.fotoFuente || null,
    sincronizacionFoto: conservaFotoLocal
      ? productoLocal?.sincronizacionFoto
      : productoFirestore?.sincronizacionFoto,
  }
}

function fusionarProductosLocalFirestore(productosLocales = [], productosFirestore = []) {
  const productosPorId = new Map()

  for (const productoLocal of productosLocales) {
    if (!productoLocal?.id || productoLocal.eliminado) continue
    productosPorId.set(String(productoLocal.id), productoLocal)
  }

  for (const productoFirestore of productosFirestore) {
    if (!productoFirestore?.id) continue

    const clave = String(productoFirestore.id)
    const productoLocal = productosPorId.get(clave)
    const productoFusionado = fusionarProductoLocalFirestore(productoLocal, productoFirestore)

    if (productoFusionado?.eliminado) {
      productosPorId.delete(clave)
      continue
    }

    productosPorId.set(clave, productoFusionado)
  }

  return prepararProductosVisuales([...productosPorId.values()])
}

function resolverImagenLocalRemota(local, remoto, campoImagen, campoUrl) {
  const imagenLocal = local?.[campoImagen]
  const imagenUrlLocal = local?.[campoUrl]
  const imagenRemota = remoto?.[campoImagen] || remoto?.[campoUrl]

  if (esImagenBase64(imagenRemota) || esUrlImagen(imagenRemota)) {
    return imagenRemota
  }

  if (esImagenBase64(imagenLocal) || esUrlImagen(imagenLocal)) {
    return imagenLocal
  }

  if (esUrlImagen(imagenUrlLocal)) {
    return imagenUrlLocal
  }

  return imagenRemota || null
}

function fusionarComercioLocalFirestore(comercioLocal, comercioFirestore) {
  if (!comercioFirestore) return comercioLocal
  if (comercioFirestore.eliminado) return { ...comercioFirestore }

  const direccionesLocales = new Map(
    (comercioLocal?.direcciones || []).map((direccion) => [String(direccion.id), direccion]),
  )

  return {
    ...comercioLocal,
    ...comercioFirestore,
    foto: resolverImagenLocalRemota(comercioLocal, comercioFirestore, 'foto', 'fotoUrl'),
    fotoUrl: comercioFirestore.fotoUrl || null,
    fotoRutaStorage: comercioFirestore.fotoRutaStorage || null,
    fotoFuente: comercioFirestore.fotoFuente || comercioLocal?.fotoFuente || null,
    direcciones: (comercioFirestore.direcciones || []).map((direccionFirestore) => {
      const direccionLocal = direccionesLocales.get(String(direccionFirestore.id))
      return {
        ...direccionLocal,
        ...direccionFirestore,
        foto: resolverImagenLocalRemota(direccionLocal, direccionFirestore, 'foto', 'fotoUrl'),
        fotoUrl: direccionFirestore.fotoUrl || null,
        fotoRutaStorage: direccionFirestore.fotoRutaStorage || null,
        fotoFuente: direccionFirestore.fotoFuente || direccionLocal?.fotoFuente || null,
      }
    }),
  }
}

function fusionarComerciosLocalFirestore(comerciosLocales = [], comerciosFirestore = []) {
  const comerciosPorId = new Map()

  for (const comercioLocal of comerciosLocales) {
    if (!comercioLocal?.id || comercioLocal.eliminado) continue
    comerciosPorId.set(String(comercioLocal.id), comercioLocal)
  }

  for (const comercioFirestore of comerciosFirestore) {
    if (!comercioFirestore?.id) continue
    const clave = String(comercioFirestore.id)
    const fusionado = fusionarComercioLocalFirestore(comerciosPorId.get(clave), comercioFirestore)

    if (fusionado?.eliminado) {
      comerciosPorId.delete(clave)
      continue
    }

    comerciosPorId.set(clave, fusionado)
  }

  return prepararComerciosVisuales([...comerciosPorId.values()])
}

function fusionarListaLocalFirestore(listaLocal, listaFirestore) {
  if (!listaFirestore) return listaLocal
  if (listaFirestore.eliminado || listaFirestore.estadoGeneral === 'eliminada') return { ...listaFirestore }

  const itemsLocales = new Map((listaLocal?.items || []).map((item) => [String(item.id), item]))

  return {
    ...listaLocal,
    ...listaFirestore,
    items: (listaFirestore.items || []).map((itemFirestore) => {
      const itemLocal = itemsLocales.get(String(itemFirestore.id))
      return {
        ...itemLocal,
        ...itemFirestore,
        imagen: resolverImagenLocalRemota(itemLocal, itemFirestore, 'imagen', 'imagenUrl'),
        imagenUrl: itemFirestore.imagenUrl || null,
        imagenRutaStorage: itemFirestore.imagenRutaStorage || null,
        fotoFuente: itemFirestore.fotoFuente || itemLocal?.fotoFuente || null,
      }
    }),
  }
}

function fusionarListasLocalFirestore(listasLocales = [], listasFirestore = []) {
  const listasPorId = new Map()

  for (const listaLocal of listasLocales) {
    if (!listaLocal?.id || listaLocal.eliminado || listaLocal.estadoGeneral === 'eliminada') continue
    listasPorId.set(String(listaLocal.id), listaLocal)
  }

  for (const listaFirestore of listasFirestore) {
    if (!listaFirestore?.id) continue
    const clave = String(listaFirestore.id)
    const fusionada = fusionarListaLocalFirestore(listasPorId.get(clave), listaFirestore)

    if (fusionada?.eliminado || fusionada?.estadoGeneral === 'eliminada') {
      listasPorId.delete(clave)
      continue
    }

    listasPorId.set(clave, fusionada)
  }

  return prepararListasVisuales([...listasPorId.values()])
}

function fusionarMesaLocalFirestore(itemsLocales = [], itemsFirestore = []) {
  const itemsPorId = new Map()

  for (const itemLocal of itemsLocales) {
    if (!itemLocal?.id) continue
    itemsPorId.set(String(itemLocal.id), itemLocal)
  }

  for (const itemFirestore of itemsFirestore) {
    if (!itemFirestore?.id) continue
    const clave = String(itemFirestore.id)
    const itemLocal = itemsPorId.get(clave)
    const datosOriginalesLocal = itemLocal?.datosOriginales
    const datosOriginalesFirestore = itemFirestore.datosOriginales
    const datosOriginales =
      datosOriginalesLocal || datosOriginalesFirestore
        ? {
          ...datosOriginalesLocal,
          ...datosOriginalesFirestore,
          imagen: resolverImagenLocalRemota(
            datosOriginalesLocal,
            datosOriginalesFirestore,
            'imagen',
            'imagenUrl',
          ),
          fotoFuente: datosOriginalesFirestore?.fotoFuente || datosOriginalesLocal?.fotoFuente || null,
        }
        : null

    itemsPorId.set(clave, {
      ...itemLocal,
      ...itemFirestore,
      imagen: resolverImagenLocalRemota(itemLocal, itemFirestore, 'imagen', 'imagenUrl'),
      imagenUrl: itemFirestore.imagenUrl || null,
      imagenRutaStorage: itemFirestore.imagenRutaStorage || null,
      fotoFuente: itemFirestore.fotoFuente || itemLocal?.fotoFuente || null,
      datosOriginales,
    })
  }

  return [...itemsPorId.values()]
}

function prepararComerciosVisuales(comercios = []) {
  return filtrarEliminados(comercios).map((comercio) => ({
    ...comercio,
    foto: comercio?.foto || comercio?.fotoUrl || null,
    direcciones: Array.isArray(comercio?.direcciones)
      ? comercio.direcciones.map((direccion) => ({
        ...direccion,
        foto: direccion?.foto || direccion?.fotoUrl || null,
      }))
      : [],
  }))
}

function prepararListasVisuales(listas = []) {
  return filtrarEliminados(listas).map((lista) => ({
    ...lista,
    items: Array.isArray(lista?.items)
      ? lista.items.map((item) => ({
        ...item,
        imagen: item?.imagen || item?.imagenUrl || null,
      }))
      : [],
  }))
}

async function obtenerConexionSegura() {
  try {
    return await conexionService.obtenerEstadoConexion()
  } catch (error) {
    console.warn('No se pudo resolver la conexión para fuente de datos:', error)
    return {
      conectado: typeof navigator === 'undefined' ? true : navigator.onLine,
      tipoConexion: 'unknown',
      fechaLectura: new Date().toISOString(),
    }
  }
}

function resolverFuenteFirestore(conexion) {
  return conexion?.conectado ? FUENTES_DATOS.FIRESTORE : FUENTES_DATOS.FIRESTORE_CACHE
}

function crearResultado({ dominio, datos, fuente, mensaje, conexion, error = null }) {
  const resultado = {
    dominio,
    datos,
    fuente,
    mensaje,
    conectado: Boolean(conexion?.conectado),
    fechaActualizacion: new Date().toISOString(),
    error,
  }

  registrarResultadoCarga(dominio, resultado)
  return resultado
}

function registrarResultadoCarga(dominio, resultado) {
  estadosPorDominio.set(dominio, {
    dominio,
    fuente: resultado.fuente,
    mensaje: resultado.mensaje,
    conectado: resultado.conectado,
    fechaActualizacion: resultado.fechaActualizacion,
    error: resultado.error || null,
  })
}

async function cargarDesdeLocal({ dominio, cargarLocal, conexion, mensaje = 'Datos locales.' }) {
  const datosLocales = await cargarLocal()
  return crearResultado({
    dominio,
    datos: datosLocales,
    fuente: FUENTES_DATOS.LOCAL,
    mensaje,
    conexion,
  })
}

async function cargarConFuentePrincipal({
  dominio,
  cargarFirestore,
  cargarLocal,
  aceptaDatos = tieneDatos,
  normalizarFirestore = (datos) => datos,
}) {
  const usuario = obtenerUsuarioActual()
  const conexion = await obtenerConexionSegura()

  if (!debeUsarFirestore(usuario)) {
    return cargarDesdeLocal({
      dominio,
      cargarLocal,
      conexion,
      mensaje: 'Usuario local: se usa almacenamiento local.',
    })
  }

  try {
    const datosFirestore = normalizarFirestore(await cargarFirestore({ usuarioId: usuario.id }))

    if (aceptaDatos(datosFirestore)) {
      const fuente = resolverFuenteFirestore(conexion)
      return crearResultado({
        dominio,
        datos: datosFirestore,
        fuente,
        mensaje:
          fuente === FUENTES_DATOS.FIRESTORE
            ? 'Datos cargados desde Firestore.'
            : 'Datos cargados desde cache offline de Firestore.',
        conexion,
      })
    }

    return crearResultado({
      dominio,
      datos: datosFirestore,
      fuente: resolverFuenteFirestore(conexion),
      mensaje: 'Tu cuenta no tiene datos guardados en esta sección.',
      conexion,
    })
  } catch (error) {
    console.warn(`No se pudo cargar ${dominio} desde Firestore:`, error)

    if (debeUsarFirestore(usuario)) {
      return crearResultado({
        dominio,
        datos: null,
        fuente: FUENTES_DATOS.ERROR,
        mensaje: 'No se pudieron cargar datos de tu cuenta.',
        conexion,
        error: error.message || 'Error al cargar Firestore.',
      })
    }

    try {
      const datosLocales = await cargarLocal()
      return crearResultado({
        dominio,
        datos: datosLocales,
        fuente: tieneDatos(datosLocales) ? FUENTES_DATOS.FALLBACK_LOCAL : FUENTES_DATOS.ERROR,
        mensaje: tieneDatos(datosLocales)
          ? 'Firestore falló; se muestra respaldo local.'
          : 'Firestore falló y no hay respaldo local.',
        conexion,
        error: error.message || 'Error al cargar Firestore.',
      })
    } catch (errorLocal) {
      return crearResultado({
        dominio,
        datos: null,
        fuente: FUENTES_DATOS.ERROR,
        mensaje: 'No se pudieron cargar datos desde Firestore ni respaldo local.',
        conexion,
        error: errorLocal.message || error.message || 'Error de carga.',
      })
    }
  }
}

async function cargarProductos({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.PRODUCTOS,
    cargarLocal,
    cargarFirestore: () => firestoreProductosService.obtenerProductosUsuario({ incluirPrecios: true }),
    normalizarFirestore: prepararProductosVisuales,
  })
}

async function cargarProductosFirestoreCrudos({ usuarioId } = {}) {
  const conexion = await obtenerConexionSegura()
  const usuario = obtenerUsuarioActual()
  const idUsuario = usuarioId || usuario.id

  if (!debeUsarFirestore(usuario) || !idUsuario) {
    return crearResultado({
      dominio: DOMINIOS.PRODUCTOS,
      datos: [],
      fuente: FUENTES_DATOS.LOCAL,
      mensaje: 'Usuario local: se usa almacenamiento local.',
      conexion,
    })
  }

  try {
    const productos = await firestoreProductosService.obtenerProductosUsuario({
      usuarioId: idUsuario,
      limite: 200,
      incluirPrecios: true,
    })

    return crearResultado({
      dominio: DOMINIOS.PRODUCTOS,
      datos: productos,
      fuente: resolverFuenteFirestore(conexion),
      mensaje: 'Datos actualizados desde la nube.',
      conexion,
    })
  } catch (error) {
    return crearResultado({
      dominio: DOMINIOS.PRODUCTOS,
      datos: null,
      fuente: FUENTES_DATOS.ERROR,
      mensaje: 'No se pudieron actualizar productos desde la nube.',
      conexion,
      error: error.message || 'Error al cargar Firestore.',
    })
  }
}

async function cargarComercios({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.COMERCIOS,
    cargarLocal,
    cargarFirestore: () => firestoreComerciosService.obtenerComerciosUsuario(),
    normalizarFirestore: prepararComerciosVisuales,
  })
}

async function cargarComerciosFirestoreCrudos({ usuarioId } = {}) {
  const conexion = await obtenerConexionSegura()
  const usuario = obtenerUsuarioActual()
  const idUsuario = usuarioId || usuario.id

  if (!debeUsarFirestore(usuario) || !idUsuario) {
    return crearResultado({
      dominio: DOMINIOS.COMERCIOS,
      datos: [],
      fuente: FUENTES_DATOS.LOCAL,
      mensaje: 'Usuario local: se usa almacenamiento local.',
      conexion,
    })
  }

  try {
    const comercios = await firestoreComerciosService.obtenerComerciosUsuario({
      usuarioId: idUsuario,
      limite: 200,
    })

    return crearResultado({
      dominio: DOMINIOS.COMERCIOS,
      datos: comercios,
      fuente: resolverFuenteFirestore(conexion),
      mensaje: 'Datos actualizados desde la nube.',
      conexion,
    })
  } catch (error) {
    return crearResultado({
      dominio: DOMINIOS.COMERCIOS,
      datos: null,
      fuente: FUENTES_DATOS.ERROR,
      mensaje: 'No se pudieron actualizar comercios desde la nube.',
      conexion,
      error: error.message || 'Error al cargar Firestore.',
    })
  }
}

async function cargarListas({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.LISTAS,
    cargarLocal,
    cargarFirestore: () => firestoreListasJustasService.obtenerListasJustasUsuario(),
    normalizarFirestore: prepararListasVisuales,
  })
}

async function cargarListasFirestoreCrudas({ usuarioId } = {}) {
  const conexion = await obtenerConexionSegura()
  const usuario = obtenerUsuarioActual()
  const idUsuario = usuarioId || usuario.id

  if (!debeUsarFirestore(usuario) || !idUsuario) {
    return crearResultado({
      dominio: DOMINIOS.LISTAS,
      datos: [],
      fuente: FUENTES_DATOS.LOCAL,
      mensaje: 'Usuario local: se usa almacenamiento local.',
      conexion,
    })
  }

  try {
    const listas = await firestoreListasJustasService.obtenerListasJustasUsuario({
      usuarioId: idUsuario,
      limite: 100,
    })

    return crearResultado({
      dominio: DOMINIOS.LISTAS,
      datos: listas,
      fuente: resolverFuenteFirestore(conexion),
      mensaje: 'Datos actualizados desde la nube.',
      conexion,
    })
  } catch (error) {
    return crearResultado({
      dominio: DOMINIOS.LISTAS,
      datos: null,
      fuente: FUENTES_DATOS.ERROR,
      mensaje: 'No se pudieron actualizar listas desde la nube.',
      conexion,
      error: error.message || 'Error al cargar Firestore.',
    })
  }
}

async function cargarMesaTrabajo({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.MESA_TRABAJO,
    cargarLocal,
    cargarFirestore: () => firestoreMesaTrabajoService.obtenerItemsMesaTrabajoUsuario(),
  })
}

async function cargarMesaTrabajoFirestoreCruda({ usuarioId } = {}) {
  const conexion = await obtenerConexionSegura()
  const usuario = obtenerUsuarioActual()
  const idUsuario = usuarioId || usuario.id

  if (!debeUsarFirestore(usuario) || !idUsuario) {
    return crearResultado({
      dominio: DOMINIOS.MESA_TRABAJO,
      datos: [],
      fuente: FUENTES_DATOS.LOCAL,
      mensaje: 'Usuario local: se usa almacenamiento local.',
      conexion,
    })
  }

  try {
    const items = await firestoreMesaTrabajoService.obtenerItemsMesaTrabajoUsuario({
      usuarioId: idUsuario,
      limite: 300,
    })

    return crearResultado({
      dominio: DOMINIOS.MESA_TRABAJO,
      datos: items,
      fuente: resolverFuenteFirestore(conexion),
      mensaje: 'Datos actualizados desde la nube.',
      conexion,
    })
  } catch (error) {
    return crearResultado({
      dominio: DOMINIOS.MESA_TRABAJO,
      datos: null,
      fuente: FUENTES_DATOS.ERROR,
      mensaje: 'No se pudo actualizar la mesa desde la nube.',
      conexion,
      error: error.message || 'Error al cargar Firestore.',
    })
  }
}

async function cargarPreferencias({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.PREFERENCIAS,
    cargarLocal,
    cargarFirestore: () => firestorePreferenciasService.obtenerPreferenciasUsuario(),
  })
}

async function cargarPreferenciasFirestoreCrudas({ usuarioId } = {}) {
  const conexion = await obtenerConexionSegura()
  const usuario = obtenerUsuarioActual()
  const idUsuario = usuarioId || usuario.id

  if (!debeUsarFirestore(usuario) || !idUsuario) {
    return crearResultado({
      dominio: DOMINIOS.PREFERENCIAS,
      datos: null,
      fuente: FUENTES_DATOS.LOCAL,
      mensaje: 'Usuario local: se usa almacenamiento local.',
      conexion,
    })
  }

  try {
    const preferencias = await firestorePreferenciasService.obtenerPreferenciasUsuario({
      usuarioId: idUsuario,
    })

    return crearResultado({
      dominio: DOMINIOS.PREFERENCIAS,
      datos: preferencias,
      fuente: resolverFuenteFirestore(conexion),
      mensaje: 'Datos actualizados desde la nube.',
      conexion,
    })
  } catch (error) {
    return crearResultado({
      dominio: DOMINIOS.PREFERENCIAS,
      datos: null,
      fuente: FUENTES_DATOS.ERROR,
      mensaje: 'No se pudieron actualizar preferencias desde la nube.',
      conexion,
      error: error.message || 'Error al cargar Firestore.',
    })
  }
}

async function cargarConfirmaciones({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.CONFIRMACIONES,
    cargarLocal,
    cargarFirestore: () => firestoreConfirmacionesService.obtenerConfirmacionesUsuario(),
  })
}

function obtenerEstadoDominio(dominio) {
  return estadosPorDominio.get(dominio) || crearEstadoInicial(dominio)
}

function obtenerResumenFuentes() {
  return Object.values(DOMINIOS).map((dominio) => obtenerEstadoDominio(dominio))
}

function obtenerEtiquetaFuente(fuente) {
  const etiquetas = {
    [FUENTES_DATOS.LOCAL]: 'Local',
    [FUENTES_DATOS.FIRESTORE]: 'Firestore',
    [FUENTES_DATOS.FIRESTORE_CACHE]: 'Firestore offline',
    [FUENTES_DATOS.FALLBACK_LOCAL]: 'Respaldo local',
    [FUENTES_DATOS.ERROR]: 'Error',
  }

  return etiquetas[fuente] || 'Sin datos'
}

export default {
  FUENTES_DATOS,
  DOMINIOS,
  crearEstadoInicial,
  debeUsarFirestore,
  obtenerUsuarioActual,
  cargarProductos,
  cargarProductosFirestoreCrudos,
  cargarComercios,
  cargarComerciosFirestoreCrudos,
  cargarListas,
  cargarListasFirestoreCrudas,
  cargarMesaTrabajo,
  cargarMesaTrabajoFirestoreCruda,
  cargarPreferencias,
  cargarPreferenciasFirestoreCrudas,
  cargarConfirmaciones,
  registrarResultadoCarga,
  fusionarProductoLocalFirestore,
  fusionarProductosLocalFirestore,
  fusionarComerciosLocalFirestore,
  fusionarListasLocalFirestore,
  fusionarMesaLocalFirestore,
  obtenerEstadoDominio,
  obtenerResumenFuentes,
  obtenerEtiquetaFuente,
}
