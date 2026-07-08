import { adaptadorActual } from './AlmacenamientoService.js'
import {
  CLAVE_CACHE_FIRESTORE_COMERCIOS_META,
  CLAVE_COMERCIOS,
} from '../constantes/ClavesAlmacenamiento.js'
import { ESTADOS_SINCRONIZACION, ORIGENES_FOTO, TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import { comprimirImagenParaFirestore } from '../../utils/ImagenesFirestoreUtils.js'
import fotosLocalesService from './FotosLocalesService.js'
import firestoreComerciosService from './FirestoreComerciosService.js'
import firestoreImagenesComerciosService from './FirestoreImagenesComerciosService.js'
import usuarioActualService from './UsuarioActualService.js'

const TIEMPO_MAXIMO_SINCRONIZACION_FIRESTORE_MS = 7000

/**
 * COMERCIOS SERVICE
 * Servicio para gestión de comercios con validación inteligente de duplicados
 */

// ═══════════════════════════════════════════════════════════
// ABREVIATURAS COMUNES
// ═══════════════════════════════════════════════════════════
const ABREVIATURAS = {
  av: 'avenida',
  ave: 'avenida',
  avda: 'avenida',
  bv: 'bulevar',
  blvd: 'bulevar',
  dr: 'doctor',
  gral: 'general',
  brig: 'brigadier',
  cnel: 'coronel',
  tte: 'teniente',
  cap: 'capitan',
  pte: 'presidente',
  esq: 'esquina',
  no: 'numero',
  num: 'numero',
  nro: 'numero',
  st: 'santa',
  sto: 'santo',
  sta: 'santa',
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES DE NORMALIZACIÓN
// ═══════════════════════════════════════════════════════════

/**
 * Normaliza un texto para comparación
 * @param {string} texto - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizar(texto) {
  if (!texto) return ''

  return texto
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, ' ') // Espacios múltiples a uno solo
    .trim()
}

/**
 * Expande abreviaturas comunes en una dirección
 * @param {string} texto - Texto con posibles abreviaturas
 * @returns {string} Texto con abreviaturas expandidas
 */
function expandirAbreviaturas(texto) {
  if (!texto) return ''

  let resultado = texto.toLowerCase()

  // Reemplazar abreviaturas (con punto y sin punto)
  Object.entries(ABREVIATURAS).forEach(([abr, completa]) => {
    const regex1 = new RegExp(`\\b${abr}\\.?\\s`, 'g')
    resultado = resultado.replace(regex1, `${completa} `)
  })

  return resultado
}

/**
 * Calcula similitud entre dos textos usando Levenshtein Distance
 * @param {string} texto1 - Primer texto
 * @param {string} texto2 - Segundo texto
 * @returns {number} Porcentaje de similitud (0-100)
 */
function similitudTexto(texto1, texto2) {
  if (texto1 === texto2) return 100

  const a = normalizar(texto1)
  const b = normalizar(texto2)

  if (a === b) return 100
  if (a.length === 0 || b.length === 0) return 0

  // Algoritmo Levenshtein
  const matriz = []

  for (let i = 0; i <= b.length; i++) {
    matriz[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matriz[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matriz[i][j] = matriz[i - 1][j - 1]
      } else {
        matriz[i][j] = Math.min(
          matriz[i - 1][j - 1] + 1, // sustitución
          matriz[i][j - 1] + 1, // inserción
          matriz[i - 1][j] + 1, // eliminación
        )
      }
    }
  }

  const distancia = matriz[b.length][a.length]
  const longitudMaxima = Math.max(a.length, b.length)
  const similitud = ((longitudMaxima - distancia) / longitudMaxima) * 100

  return Math.round(similitud)
}

// ═══════════════════════════════════════════════════════════
// MÉTODOS PRINCIPALES
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene todos los comercios
 * @returns {Promise<Array>} Lista de comercios
 */
async function obtenerTodos() {
  try {
    const comercios = await adaptadorActual.obtener(CLAVE_COMERCIOS)
    const comerciosProtegidos = await fotosLocalesService.protegerComercios(comercios || [])
    return await fotosLocalesService.hidratarComercios(comerciosProtegidos)
  } catch (error) {
    console.error('Error al obtener comercios:', error)
    return []
  }
}

async function guardarComerciosProtegidos(comercios = []) {
  const comerciosParaCache = await fotosLocalesService.protegerComercios(comercios)
  return adaptadorActual.guardar(CLAVE_COMERCIOS, comerciosParaCache)
}

/**
 * Busca comercios por nombre (búsqueda parcial)
 * @param {string} nombre - Nombre a buscar
 * @returns {Promise<Array>} Comercios que coinciden
 */
async function buscarPorNombre(nombre) {
  const comercios = await obtenerTodos()
  const nombreNormalizado = normalizar(nombre)

  return comercios.filter((comercio) => {
    const nombreComercioNormalizado = normalizar(comercio.nombre)
    return nombreComercioNormalizado.includes(nombreNormalizado)
  })
}

/**
 * Busca un comercio por ID
 * @param {string} id - ID del comercio
 * @returns {Promise<Object|null>} Comercio encontrado o null
 */
async function buscarPorId(id) {
  const comercios = await obtenerTodos()
  return comercios.find((comercio) => comercio.id === id) || null
}

/**
 * Valida si un comercio es duplicado (3 niveles)
 * @param {Object} nuevoComercio - Comercio a validar
 * @param {Array} comerciosParaValidar - Comercios a usar (opcional, usa agrupados si no se pasa)
 * @returns {Promise<Object>} Resultado de validación
 */
async function validarDuplicados(nuevoComercio, comerciosParaValidar = null) {
  const comercios = comerciosParaValidar || (await obtenerTodos())

  const nombreNuevo = normalizar(nuevoComercio.nombre)
  const direccionNueva = normalizar(
    `${nuevoComercio.calle} ${nuevoComercio.barrio || ''} ${nuevoComercio.ciudad || ''}`,
  )

  // NIVEL 1: Coincidencia exacta (nombre + dirección normalizados)
  const duplicadoExacto = comercios.find((comercio) => {
    return comercio.direcciones.some((dir) => {
      const nombreExistente = normalizar(comercio.nombre)
      const direccionExistente = normalizar(`${dir.calle} ${dir.barrio || ''} ${dir.ciudad || ''}`)

      return nombreExistente === nombreNuevo && direccionExistente === direccionNueva
    })
  })

  if (duplicadoExacto) {
    return {
      esDuplicado: true,
      nivel: 1,
      tipo: 'exacto',
      comercio: duplicadoExacto,
      mensaje: 'Ya existe este comercio en esta ubicación',
      permitirContinuar: true, // ⭐ NUEVO: Permitir confirmar y crear duplicado
    }
  }

  // NIVEL 2: Nombre similar + dirección diferente
  const similares = []

  comercios.forEach((comercio) => {
    const similitudNombre = similitudTexto(comercio.nombre, nuevoComercio.nombre)

    if (similitudNombre >= 85) {
      // 85% de similitud
      similares.push({
        comercio,
        similitud: similitudNombre,
      })
    }
  })

  if (similares.length > 0) {
    return {
      esDuplicado: true,
      nivel: 2,
      tipo: 'similar',
      comercios: similares,
      mensaje: 'Encontramos comercios con nombres similares',
    }
  }

  // NIVEL 3: Misma ubicación + nombre diferente
  const mismaUbicacion = comercios.filter((comercio) => {
    return comercio.direcciones.some((dir) => {
      const direccionExistente = normalizar(`${dir.calle} ${dir.barrio || ''} ${dir.ciudad || ''}`)
      const similitudDireccion = similitudTexto(direccionExistente, direccionNueva)

      return similitudDireccion >= 90 // 90% de similitud en dirección
    })
  })

  if (mismaUbicacion.length > 0) {
    return {
      esDuplicado: true,
      nivel: 3,
      tipo: 'misma_ubicacion',
      comercios: mismaUbicacion,
      mensaje: 'Ya existen comercios en esta ubicación',
    }
  }

  // No es duplicado
  return {
    esDuplicado: false,
    nivel: 0,
    tipo: 'unico',
    mensaje: 'El comercio es único',
  }
}

/**
 * Agrega un nuevo comercio
 * @param {Object} datosComercio - Datos del comercio
 * @returns {Promise<Object>} Comercio agregado
 */
async function agregarComercio(datosComercio) {
  const comercios = await obtenerTodos()
  const ahora = new Date().toISOString()
  const usuarioId = usuarioActualService.obtenerUsuarioIdActual()

  const nuevoComercio = {
    id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
    usuarioId,
    nombre: datosComercio.nombre.trim(),
    tipo: datosComercio.tipo || 'Otro',
    direcciones: [
      {
        id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
        calle: datosComercio.calle?.trim() || '',
        barrio: datosComercio.barrio?.trim() || '',
        ciudad: datosComercio.ciudad?.trim() || '',
        nombreCompleto: datosComercio.calle?.trim()
          ? `${datosComercio.nombre.trim()} - ${datosComercio.calle.trim()}`
          : datosComercio.nombre.trim(),
        fechaUltimoUso: ahora,
        foto: datosComercio.foto || null,
        fotoFuente: datosComercio.foto ? ORIGENES_FOTO.USUARIO : null,
      },
    ],
    foto: null,
    fechaCreacion: ahora,
    fechaUltimoUso: ahora,
    cantidadUsos: 0,
  }

  comercios.push(nuevoComercio)
  await prepararFotosStorageComercio(nuevoComercio)
  await prepararImagenesFirestoreComercio(nuevoComercio)
  await guardarComerciosProtegidos(comercios)
  nuevoComercio.sincronizacionFirestore = await sincronizarComercioFirestore(nuevoComercio)

  return await fotosLocalesService.protegerComercio(nuevoComercio)
}

/**
 * Edita un comercio existente
 * @param {string} id - ID del comercio
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Promise<Object|null>} Comercio actualizado o null
 */
async function editarComercio(id, datosActualizados) {
  const comercios = await obtenerTodos()
  const indice = comercios.findIndex((c) => c.id === id)

  if (indice === -1) return null

  comercios[indice] = {
    ...comercios[indice],
    ...datosActualizados,
    id, // Mantener ID original
    fechaActualizacion: new Date().toISOString(),
  }
  if (Object.prototype.hasOwnProperty.call(datosActualizados, 'foto')) {
    limpiarMetadatosFotoFirestore(comercios[indice])
  }

  await prepararFotosStorageComercio(comercios[indice])
  await prepararImagenesFirestoreComercio(comercios[indice])

  await guardarComerciosProtegidos(comercios)
  comercios[indice].sincronizacionFirestore = await sincronizarComercioFirestore(comercios[indice])
  return await fotosLocalesService.protegerComercio(comercios[indice])
}

/**
 * Elimina un comercio
 * @param {string} id - ID del comercio
 * @returns {Promise<boolean>} true si se eliminó
 */
async function eliminarComercio(id) {
  const comercios = await obtenerTodos()
  const comercioEliminado = comercios.find((c) => c.id === id)
  const comerciosFiltrados = comercios.filter((c) => c.id !== id)

  if (comercios.length === comerciosFiltrados.length) {
    return false // No se encontró
  }

  await guardarComerciosProtegidos(comerciosFiltrados)
  await fotosLocalesService.eliminarFotosComercio(comercioEliminado)
  await eliminarImagenesFirestoreComercio(comercioEliminado)
  await adaptadorActual.eliminar(CLAVE_CACHE_FIRESTORE_COMERCIOS_META)
  await sincronizarEliminacionComercioFirestore(id)
  return true
}

/**
 * Agrega una dirección a un comercio existente
 * @param {string} comercioId - ID del comercio
 * @param {Object} datosDireccion - Datos de la dirección
 * @returns {Promise<Object|null>} Comercio actualizado o null
 */
async function agregarDireccion(comercioId, datosDireccion) {
  const comercios = await obtenerTodos()
  const comercio = comercios.find((c) => c.id === comercioId)
  const ahora = new Date().toISOString()

  if (!comercio) return null

  const nuevaDireccion = {
    id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
    calle: datosDireccion.calle.trim(),
    barrio: datosDireccion.barrio?.trim() || '',
    ciudad: datosDireccion.ciudad?.trim() || '',
    nombreCompleto: `${comercio.nombre} - ${datosDireccion.calle.trim()}`,
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
    fechaUltimoUso: ahora,
    foto: datosDireccion.foto || null,
    fotoFuente: datosDireccion.foto ? ORIGENES_FOTO.USUARIO : null,
  }

  comercio.direcciones.push(nuevaDireccion)
  comercio.fechaActualizacion = ahora
  await prepararFotosStorageComercio(comercio)
  await prepararImagenesFirestoreComercio(comercio)

  await guardarComerciosProtegidos(comercios)
  comercio.sincronizacionFirestore = await sincronizarComercioFirestore(comercio)
  return await fotosLocalesService.protegerComercio(comercio)
}

/**
 * Edita una dirección específica de un comercio
 * @param {string} comercioId - ID del comercio
 * @param {string} direccionId - ID de la dirección
 * @param {Object} datosDireccion - Datos a actualizar (calle, barrio, ciudad)
 * @returns {Promise<Object|null>} Comercio actualizado o null
 */
async function editarDireccion(comercioId, direccionId, datosDireccion) {
  const comercios = await obtenerTodos()
  const comercio = comercios.find((c) => c.id === comercioId)

  if (!comercio) return null

  const direccion = comercio.direcciones.find((d) => d.id === direccionId)
  if (!direccion) return null

  // Aplicar cambios
  Object.assign(direccion, datosDireccion, {
    id: direccionId,
    fechaActualizacion: new Date().toISOString(),
  })
  if (Object.prototype.hasOwnProperty.call(datosDireccion, 'foto')) {
    limpiarMetadatosFotoFirestore(direccion)
  }

  // Recalcular nombreCompleto (calle puede estar vacía)
  direccion.nombreCompleto = direccion.calle
    ? `${comercio.nombre} - ${direccion.calle}`
    : comercio.nombre

  comercio.fechaActualizacion = new Date().toISOString()
  await prepararFotosStorageComercio(comercio)
  await prepararImagenesFirestoreComercio(comercio)
  await guardarComerciosProtegidos(comercios)
  comercio.sincronizacionFirestore = await sincronizarComercioFirestore(comercio)
  return await fotosLocalesService.protegerComercio(comercio)
}

/**
 * Elimina una dirección de un comercio
 * @param {string} comercioId - ID del comercio
 * @param {string} direccionId - ID de la dirección
 * @returns {Promise<boolean>} true si se eliminó
 */
async function eliminarDireccion(comercioId, direccionId) {
  const comercios = await obtenerTodos()
  const comercio = comercios.find((c) => c.id === comercioId)

  if (!comercio) return false

  const longitudOriginal = comercio.direcciones.length
  const direccionEliminada = comercio.direcciones.find((d) => d.id === direccionId)
  comercio.direcciones = comercio.direcciones.filter((d) => d.id !== direccionId)

  if (comercio.direcciones.length === longitudOriginal) {
    return false // No se encontró la dirección
  }

  comercio.fechaActualizacion = new Date().toISOString()
  await prepararFotosStorageComercio(comercio)
  await prepararImagenesFirestoreComercio(comercio)
  await guardarComerciosProtegidos(comercios)
  await fotosLocalesService.eliminarFotosComercio({ direcciones: [direccionEliminada] })
  await eliminarImagenFirestoreDireccion(comercioId, direccionEliminada)
  await adaptadorActual.eliminar(CLAVE_CACHE_FIRESTORE_COMERCIOS_META)
  await sincronizarEliminacionDireccionFirestore(comercioId, direccionId, comercio)
  return true
}

/**
 * Actualiza la foto de una dirección específica
 * @param {string} comercioId - ID del comercio
 * @param {string} direccionId - ID de la dirección
 * @param {string|null} base64 - Foto en Base64 o null para quitar
 * @returns {Promise<boolean>} true si se actualizó
 */
async function actualizarFotoDireccion(comercioId, direccionId, base64) {
  const comercios = await obtenerTodos()
  const comercio = comercios.find((c) => c.id === comercioId)
  if (!comercio) return false
  const direccion = comercio.direcciones.find((d) => d.id === direccionId)
  if (!direccion) return false
  direccion.foto = base64 || null
  direccion.fotoFuente = base64 ? ORIGENES_FOTO.USUARIO : null
  limpiarMetadatosFotoFirestore(direccion)
  direccion.fechaActualizacion = new Date().toISOString()
  comercio.fechaActualizacion = new Date().toISOString()
  await prepararFotosStorageComercio(comercio)
  await prepararImagenesFirestoreComercio(comercio)
  await guardarComerciosProtegidos(comercios)
  await sincronizarComercioFirestore(comercio)
  return true
}

/**
 * Registra el uso de un comercio (para orden por últimos usados)
 * @param {string} comercioId - ID del comercio
 * @param {string} direccionId - ID de la dirección usada (opcional)
 * @returns {Promise<void>}
 */
async function registrarUsoComercio(comercioId, direccionId = null) {
  const comercios = await obtenerTodos()
  const comercio = comercios.find((c) => c.id === comercioId)

  if (!comercio) return

  const ahora = new Date().toISOString()
  comercio.fechaUltimoUso = ahora
  comercio.fechaActualizacion = ahora
  comercio.cantidadUsos = (comercio.cantidadUsos || 0) + 1

  // Si se especifica dirección, actualizar su fecha de uso
  if (direccionId) {
    const direccion = comercio.direcciones.find((d) => d.id === direccionId)
    if (direccion) {
      direccion.fechaUltimoUso = ahora
      direccion.fechaActualizacion = ahora
    }
  }

  await guardarComerciosProtegidos(comercios)
  await sincronizarComercioFirestore(comercio)
}

/**
 * Obtiene comercios ordenados por uso reciente
 * @returns {Promise<Array>} Comercios ordenados
 */
async function obtenerComercioPorUso() {
  const comercios = await obtenerTodos()

  return comercios.sort((a, b) => {
    const fechaA = new Date(a.fechaUltimoUso || a.fechaCreacion)
    const fechaB = new Date(b.fechaUltimoUso || b.fechaCreacion)
    return fechaB - fechaA // Más reciente primero
  })
}

// ═══════════════════════════════════════════════════════════
// EXPORTACIÓN
// ═══════════════════════════════════════════════════════════

async function sincronizarComercioFirestore(comercio) {
  try {
    const resultado = await ejecutarConTimeoutFirestore(
      firestoreComerciosService.guardarComercio(comercio),
    )

    if (resultado.omitido) {
      return {
        estado: ESTADOS_SINCRONIZACION.LOCAL,
        fecha: new Date().toISOString(),
        mensaje: resultado.mensaje,
        error: null,
      }
    }

    if (!resultado.exito) {
      return {
        estado: ESTADOS_SINCRONIZACION.ERROR,
        fecha: new Date().toISOString(),
        mensaje: resultado.mensaje || 'No se pudo sincronizar el comercio con Firestore.',
        error: resultado.mensaje || 'Error de sincronización Firestore.',
      }
    }

    return {
      estado: resultado.estado || ESTADOS_SINCRONIZACION.SINCRONIZADO,
      fecha: new Date().toISOString(),
      mensaje:
        resultado.estado === ESTADOS_SINCRONIZACION.PENDIENTE
          ? 'Comercio guardado localmente y pendiente de sincronizar con Firestore.'
          : 'Comercio sincronizado con Firestore.',
      error: null,
    }
  } catch (error) {
    console.error('Error al sincronizar comercio con Firestore:', error)
    return {
      estado: ESTADOS_SINCRONIZACION.ERROR,
      fecha: new Date().toISOString(),
      mensaje: 'El comercio quedó guardado localmente, pero no se sincronizó con Firestore.',
      error: error.message || 'Error de sincronización Firestore.',
    }
  }
}

async function prepararFotosStorageComercio(comercio) {
  if (!comercio) return comercio

  if (!comercio.foto) {
    comercio.fotoUrl = null
    comercio.fotoRutaStorage = null
  } else if (esDataUriImagen(comercio.foto)) {
    comercio.fotoUrl = null
    comercio.fotoRutaStorage = null
    comercio.fotoFuente = ORIGENES_FOTO.USUARIO
  } else if (/^https?:\/\//.test(String(comercio.foto))) {
    comercio.fotoUrl = comercio.foto
    comercio.fotoRutaStorage = null
  }

  for (const direccion of comercio.direcciones || []) {
    if (!direccion.foto) {
      direccion.fotoUrl = null
      direccion.fotoRutaStorage = null
      continue
    }

    if (esDataUriImagen(direccion.foto)) {
      direccion.fotoUrl = null
      direccion.fotoRutaStorage = null
      direccion.fotoFuente = ORIGENES_FOTO.USUARIO
      continue
    }

    if (/^https?:\/\//.test(String(direccion.foto))) {
      direccion.fotoUrl = direccion.foto
      direccion.fotoRutaStorage = null
    }
  }

  return comercio
}

function debeUsarFirestore() {
  const usuario = usuarioActualService.obtenerUsuarioActual()
  return Boolean(usuario?.id && !usuario.esLocal && usuario.tipo === TIPOS_USUARIO.FIREBASE)
}

function limpiarMetadatosFotoFirestore(entidad) {
  if (!entidad) return entidad
  entidad.fotoFirestoreId = null
  entidad.fotoFirestoreEstado = null
  entidad.fotoFirestorePesoBytes = null
  entidad.fechaFotoFirestore = null
  return entidad
}

function marcarErrorFotoFirestore(entidad, mensaje) {
  if (!entidad) return entidad
  entidad.fotoFirestoreEstado = ESTADOS_SINCRONIZACION.ERROR
  entidad.sincronizacionFoto = {
    estado: ESTADOS_SINCRONIZACION.ERROR,
    fecha: new Date().toISOString(),
    mensaje,
    error: mensaje,
  }
  return entidad
}

async function prepararFotoFirestoreComercio(comercio) {
  if (!comercio?.id || !debeUsarFirestore()) return comercio

  if (!comercio.foto) {
    if (comercio.fotoFirestoreId || comercio.fechaFotoFirestore) {
      await firestoreImagenesComerciosService.eliminarImagenComercio(comercio.id)
    }
    return limpiarMetadatosFotoFirestore(comercio)
  }

  if (!esDataUriImagen(comercio.foto) || comercio.fotoFirestoreId) return comercio

  try {
    const imagenOptimizada = await comprimirImagenParaFirestore(comercio.foto)
    const resultado = await firestoreImagenesComerciosService.guardarImagenComercio(
      comercio.id,
      imagenOptimizada,
    )

    if (resultado.omitido) return comercio
    if (!resultado.exito) {
      return marcarErrorFotoFirestore(
        comercio,
        resultado.mensaje || 'No se pudo sincronizar la foto del comercio.',
      )
    }

    comercio.fotoFirestoreId = comercio.id
    comercio.fotoFirestoreEstado = resultado.estado || ESTADOS_SINCRONIZACION.SINCRONIZADO
    comercio.fotoFirestorePesoBytes = imagenOptimizada.pesoBytes
    comercio.fechaFotoFirestore = new Date().toISOString()
    comercio.fotoFuente = ORIGENES_FOTO.USUARIO
    comercio.sincronizacionFoto = {
      estado: comercio.fotoFirestoreEstado,
      fecha: new Date().toISOString(),
      mensaje: 'Foto del comercio sincronizada como miniatura en Firestore.',
    }
  } catch (error) {
    console.warn('No se pudo preparar la foto del comercio para Firestore:', error)
    marcarErrorFotoFirestore(
      comercio,
      error.message || 'No se pudo sincronizar la foto del comercio.',
    )
  }

  return comercio
}

async function prepararFotoFirestoreDireccion(comercio, direccion) {
  if (!comercio?.id || !direccion?.id || !debeUsarFirestore()) return direccion

  if (!direccion.foto) {
    if (direccion.fotoFirestoreId || direccion.fechaFotoFirestore) {
      await firestoreImagenesComerciosService.eliminarImagenDireccion(comercio.id, direccion.id)
    }
    return limpiarMetadatosFotoFirestore(direccion)
  }

  if (!esDataUriImagen(direccion.foto) || direccion.fotoFirestoreId) return direccion

  try {
    const imagenOptimizada = await comprimirImagenParaFirestore(direccion.foto)
    const resultado = await firestoreImagenesComerciosService.guardarImagenDireccion(
      comercio.id,
      direccion.id,
      imagenOptimizada,
    )

    if (resultado.omitido) return direccion
    if (!resultado.exito) {
      return marcarErrorFotoFirestore(
        direccion,
        resultado.mensaje || 'No se pudo sincronizar la foto de la dirección.',
      )
    }

    direccion.fotoFirestoreId = firestoreImagenesComerciosService.crearImagenDireccionId(
      comercio.id,
      direccion.id,
    )
    direccion.fotoFirestoreEstado = resultado.estado || ESTADOS_SINCRONIZACION.SINCRONIZADO
    direccion.fotoFirestorePesoBytes = imagenOptimizada.pesoBytes
    direccion.fechaFotoFirestore = new Date().toISOString()
    direccion.fotoFuente = ORIGENES_FOTO.USUARIO
    direccion.sincronizacionFoto = {
      estado: direccion.fotoFirestoreEstado,
      fecha: new Date().toISOString(),
      mensaje: 'Foto de la dirección sincronizada como miniatura en Firestore.',
    }
  } catch (error) {
    console.warn('No se pudo preparar la foto de la dirección para Firestore:', error)
    marcarErrorFotoFirestore(
      direccion,
      error.message || 'No se pudo sincronizar la foto de la dirección.',
    )
  }

  return direccion
}

async function prepararImagenesFirestoreComercio(comercio) {
  if (!comercio) return comercio

  await prepararFotoFirestoreComercio(comercio)
  for (const direccion of comercio.direcciones || []) {
    await prepararFotoFirestoreDireccion(comercio, direccion)
  }

  return comercio
}

async function eliminarImagenFirestoreDireccion(comercioId, direccion) {
  if (!direccion?.id || !debeUsarFirestore()) return
  if (!direccion.fotoFirestoreId && !direccion.fechaFotoFirestore) return

  try {
    await firestoreImagenesComerciosService.eliminarImagenDireccion(comercioId, direccion.id)
  } catch (error) {
    console.warn('No se pudo eliminar la imagen remota de la dirección:', error)
  }
}

async function eliminarImagenesFirestoreComercio(comercio) {
  if (!comercio?.id || !debeUsarFirestore()) return

  try {
    if (comercio.fotoFirestoreId || comercio.fechaFotoFirestore) {
      await firestoreImagenesComerciosService.eliminarImagenComercio(comercio.id)
    }

    for (const direccion of comercio.direcciones || []) {
      await eliminarImagenFirestoreDireccion(comercio.id, direccion)
    }
  } catch (error) {
    console.warn('No se pudieron eliminar las imágenes remotas del comercio:', error)
  }
}

async function guardarComerciosEnCacheLocal(comercios = []) {
  try {
    return await guardarComerciosProtegidos(comercios)
  } catch (error) {
    console.error('Error al guardar comercios en caché local:', error)
    return false
  }
}

async function eliminarComercioLocalPorSincronizacion(comercio) {
  if (!comercio?.id) return false

  const comercios = await obtenerTodos()
  const comerciosFiltrados = comercios.filter((actual) => String(actual.id) !== String(comercio.id))

  await fotosLocalesService.eliminarFotosComercio(comercio)
  await adaptadorActual.eliminar(CLAVE_CACHE_FIRESTORE_COMERCIOS_META)
  return guardarComerciosProtegidos(comerciosFiltrados)
}

async function obtenerMetaCacheFirestore() {
  return (await adaptadorActual.obtener(CLAVE_CACHE_FIRESTORE_COMERCIOS_META)) || null
}

async function guardarMetaCacheFirestore(meta) {
  return adaptadorActual.guardar(CLAVE_CACHE_FIRESTORE_COMERCIOS_META, {
    ...meta,
    fechaGuardado: new Date().toISOString(),
  })
}

async function sincronizarFotosPendientesStorage() {
  return 0
}

function esDataUriImagen(valor) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(valor || '').trim())
}

async function sincronizarEliminacionComercioFirestore(comercioId) {
  try {
    const resultado = await ejecutarConTimeoutFirestore(
      firestoreComerciosService.eliminarComercioDefinitivo(comercioId),
    )
    if (!resultado.omitido && !resultado.exito) {
      console.warn('El comercio se eliminó localmente, pero no se borró en Firestore.')
    }
  } catch (error) {
    console.warn('El comercio se eliminó localmente, pero falló el borrado Firestore.', error)
  }
}

async function sincronizarEliminacionDireccionFirestore(comercioId, direccionId, comercioActualizado) {
  try {
    const resultado = await ejecutarConTimeoutFirestore(
      firestoreComerciosService.eliminarDireccionDefinitiva(
        comercioId,
        direccionId,
        comercioActualizado,
      ),
    )
    if (!resultado.omitido && !resultado.exito) {
      console.warn('La dirección se eliminó localmente, pero no se borró en Firestore.')
    }
  } catch (error) {
    console.warn('La dirección se eliminó localmente, pero falló el borrado Firestore.', error)
  }
}

async function ejecutarConTimeoutFirestore(promesa) {
  let timeoutId = null
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        exito: true,
        estado: ESTADOS_SINCRONIZACION.PENDIENTE,
        mensaje: 'Firestore aceptó la operación localmente o quedó pendiente por conectividad.',
      })
    }, TIEMPO_MAXIMO_SINCRONIZACION_FIRESTORE_MS)
  })

  const resultado = await Promise.race([promesa, timeout])
  clearTimeout(timeoutId)
  return resultado
}

export default {
  obtenerTodos,
  guardarComerciosEnCacheLocal,
  eliminarComercioLocalPorSincronizacion,
  obtenerMetaCacheFirestore,
  guardarMetaCacheFirestore,
  buscarPorNombre,
  buscarPorId,
  agregarComercio,
  editarComercio,
  eliminarComercio,
  agregarDireccion,
  editarDireccion,
  eliminarDireccion,
  validarDuplicados,
  actualizarFotoDireccion,
  registrarUsoComercio,
  obtenerComercioPorUso,
  sincronizarComercioFirestore,
  sincronizarFotosPendientesStorage,
  // Utilidades exportadas para uso en otros módulos
  normalizar,
  similitudTexto,
  expandirAbreviaturas,
}
