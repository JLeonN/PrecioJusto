import { TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import conexionService from './ConexionService.js'
import firestoreComerciosService from './FirestoreComerciosService.js'
import firestoreConfirmacionesService from './FirestoreConfirmacionesService.js'
import firestoreListasJustasService from './FirestoreListasJustasService.js'
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

function prepararProductosVisuales(productos = []) {
  return filtrarEliminados(productos).map((producto) => ({
    ...producto,
    imagen: producto?.imagen || producto?.imagenUrl || null,
  }))
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

    const datosLocales = await cargarLocal()
    if (tieneDatos(datosLocales)) {
      return crearResultado({
        dominio,
        datos: datosLocales,
        fuente: FUENTES_DATOS.FALLBACK_LOCAL,
        mensaje: 'Firestore no tiene datos; se muestra respaldo local.',
        conexion,
      })
    }

    return crearResultado({
      dominio,
      datos: datosFirestore,
      fuente: resolverFuenteFirestore(conexion),
      mensaje: 'Firestore está vacío para este usuario.',
      conexion,
    })
  } catch (error) {
    console.warn(`No se pudo cargar ${dominio} desde Firestore:`, error)

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

async function cargarComercios({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.COMERCIOS,
    cargarLocal,
    cargarFirestore: () => firestoreComerciosService.obtenerComerciosUsuario(),
    normalizarFirestore: prepararComerciosVisuales,
  })
}

async function cargarListas({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.LISTAS,
    cargarLocal,
    cargarFirestore: () => firestoreListasJustasService.obtenerListasJustasUsuario(),
    normalizarFirestore: prepararListasVisuales,
  })
}

async function cargarPreferencias({ cargarLocal }) {
  return cargarConFuentePrincipal({
    dominio: DOMINIOS.PREFERENCIAS,
    cargarLocal,
    cargarFirestore: () => firestorePreferenciasService.obtenerPreferenciasUsuario(),
  })
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
  cargarComercios,
  cargarListas,
  cargarPreferencias,
  cargarConfirmaciones,
  registrarResultadoCarga,
  obtenerEstadoDominio,
  obtenerResumenFuentes,
  obtenerEtiquetaFuente,
}
