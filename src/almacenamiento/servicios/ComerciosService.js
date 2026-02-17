import { adaptadorActual } from './AlmacenamientoService.js'

/**
 * COMERCIOS SERVICE
 * Servicio para gestión de comercios con validación inteligente de duplicados
 */

const CLAVE_COMERCIOS = 'comercios'

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
    return comercios || []
  } catch (error) {
    console.error('Error al obtener comercios:', error)
    return []
  }
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
 * @returns {Promise<Object>} Resultado de validación
 */
async function validarDuplicados(nuevoComercio) {
  const comercios = await obtenerTodos()

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

  const nuevoComercio = {
    id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
    nombre: datosComercio.nombre.trim(),
    tipo: datosComercio.tipo || 'Otro',
    direcciones: [
      {
        id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
        calle: datosComercio.calle.trim(),
        barrio: datosComercio.barrio?.trim() || '',
        ciudad: datosComercio.ciudad?.trim() || '',
        nombreCompleto: `${datosComercio.nombre.trim()} - ${datosComercio.calle.trim()}`,
        fechaUltimoUso: new Date().toISOString(),
      },
    ],
    foto: null,
    fechaCreacion: new Date().toISOString(),
    fechaUltimoUso: new Date().toISOString(),
    cantidadUsos: 0,
  }

  comercios.push(nuevoComercio)
  await adaptadorActual.guardar(CLAVE_COMERCIOS, comercios)

  return nuevoComercio
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
  }

  await adaptadorActual.guardar(CLAVE_COMERCIOS, comercios)
  return comercios[indice]
}

/**
 * Elimina un comercio
 * @param {string} id - ID del comercio
 * @returns {Promise<boolean>} true si se eliminó
 */
async function eliminarComercio(id) {
  const comercios = await obtenerTodos()
  const comerciosFiltrados = comercios.filter((c) => c.id !== id)

  if (comercios.length === comerciosFiltrados.length) {
    return false // No se encontró
  }

  await adaptadorActual.guardar(CLAVE_COMERCIOS, comerciosFiltrados)
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

  if (!comercio) return null

  const nuevaDireccion = {
    id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
    calle: datosDireccion.calle.trim(),
    barrio: datosDireccion.barrio?.trim() || '',
    ciudad: datosDireccion.ciudad?.trim() || '',
    nombreCompleto: `${comercio.nombre} - ${datosDireccion.calle.trim()}`,
    fechaUltimoUso: new Date().toISOString(),
  }

  comercio.direcciones.push(nuevaDireccion)

  await adaptadorActual.guardar(CLAVE_COMERCIOS, comercios)
  return comercio
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
  comercio.direcciones = comercio.direcciones.filter((d) => d.id !== direccionId)

  if (comercio.direcciones.length === longitudOriginal) {
    return false // No se encontró la dirección
  }

  await adaptadorActual.guardar(CLAVE_COMERCIOS, comercios)
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

  comercio.fechaUltimoUso = new Date().toISOString()
  comercio.cantidadUsos = (comercio.cantidadUsos || 0) + 1

  // Si se especifica dirección, actualizar su fecha de uso
  if (direccionId) {
    const direccion = comercio.direcciones.find((d) => d.id === direccionId)
    if (direccion) {
      direccion.fechaUltimoUso = new Date().toISOString()
    }
  }

  await adaptadorActual.guardar(CLAVE_COMERCIOS, comercios)
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

export default {
  obtenerTodos,
  buscarPorNombre,
  buscarPorId,
  agregarComercio,
  editarComercio,
  eliminarComercio,
  agregarDireccion,
  eliminarDireccion,
  validarDuplicados,
  registrarUsoComercio,
  obtenerComercioPorUso,
  // Utilidades exportadas para uso en otros módulos
  normalizar,
  similitudTexto,
  expandirAbreviaturas,
}
