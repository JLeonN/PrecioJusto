import { App } from '@capacitor/app'
import { versionLocalBuild, urlVersionRemota } from '../constantes/ActualizacionApp.js'

const IDIOMA_PREDETERMINADO = 'es-AR'
const MAXIMO_GRUPOS = 4
const MAXIMO_NOVEDADES = 8
const MAXIMO_CARACTERES_APARTADO = 80
const MAXIMO_CARACTERES_NOVEDAD = 500

const ESTADO_BASE_ACTUALIZACION = {
  hayActualizacion: false,
  versionInstalada: versionLocalBuild,
  versionDisponible: null,
  urlPlayStore: '',
  debeMostrarModal: false,
  cambios: [],
}

function normalizarVersion(version) {
  if (typeof version !== 'string') return null
  const limpia = version.trim()
  return limpia ? limpia : null
}

function convertirParteNumero(parte) {
  const numero = Number.parseInt(`${parte || '0'}`.replace(/[^\d]/g, ''), 10)
  return Number.isNaN(numero) ? 0 : numero
}

function compararVersionesSemanticas(versionA, versionB) {
  const partesA = versionA.split('.')
  const partesB = versionB.split('.')
  const longitudMaxima = Math.max(partesA.length, partesB.length)

  for (let indice = 0; indice < longitudMaxima; indice += 1) {
    const valorA = convertirParteNumero(partesA[indice])
    const valorB = convertirParteNumero(partesB[indice])

    if (valorA > valorB) return 1
    if (valorA < valorB) return -1
  }

  return 0
}

function normalizarGruposCambios(cambios) {
  if (!Array.isArray(cambios)) return []

  const grupos = []
  let cantidadNovedades = 0

  cambios.slice(0, MAXIMO_GRUPOS).forEach((cambio) => {
    if (typeof cambio === 'string' && cambio.trim()) {
      if (cantidadNovedades >= MAXIMO_NOVEDADES) return
      grupos.push({
        apartado: '',
        novedades: [cambio.trim().slice(0, MAXIMO_CARACTERES_NOVEDAD)],
      })
      cantidadNovedades += 1
      return
    }

    if (!cambio || typeof cambio !== 'object' || !Array.isArray(cambio.novedades)) return

    const novedades = cambio.novedades
      .filter((novedad) => typeof novedad === 'string' && novedad.trim())
      .slice(0, Math.max(0, MAXIMO_NOVEDADES - cantidadNovedades))
      .map((novedad) => novedad.trim().slice(0, MAXIMO_CARACTERES_NOVEDAD))

    if (novedades.length === 0) return

    grupos.push({
      apartado:
        typeof cambio.apartado === 'string'
          ? cambio.apartado.trim().slice(0, MAXIMO_CARACTERES_APARTADO)
          : '',
      novedades,
    })
    cantidadNovedades += novedades.length
  })

  return grupos
}

export function normalizarCambiosActualizacion(cambios, idiomaActual = IDIOMA_PREDETERMINADO) {
  if (Array.isArray(cambios)) return normalizarGruposCambios(cambios)
  if (!cambios || typeof cambios !== 'object') return []

  const cambiosIdioma = cambios[idiomaActual] ?? cambios[IDIOMA_PREDETERMINADO]
  if (Array.isArray(cambiosIdioma)) return normalizarGruposCambios(cambiosIdioma)
  if (cambiosIdioma && typeof cambiosIdioma === 'object') {
    return normalizarGruposCambios([cambiosIdioma])
  }

  return []
}

async function obtenerVersionInstalada() {
  try {
    const infoApp = await App.getInfo()
    const versionPlugin = normalizarVersion(infoApp?.version)
    if (versionPlugin) return versionPlugin
  } catch {
    // En web o ante error de plugin, se usa la versión de build.
  }

  return versionLocalBuild
}

async function obtenerVersionRemota(idiomaActual) {
  if (!urlVersionRemota) return null

  const separadorQuery = urlVersionRemota.includes('?') ? '&' : '?'
  const urlVersionConCacheBust = `${urlVersionRemota}${separadorQuery}t=${Date.now()}`
  const respuesta = await fetch(urlVersionConCacheBust, { cache: 'no-store' })
  if (!respuesta.ok) return null

  const datos = await respuesta.json()
  const versionDisponible = normalizarVersion(datos?.versionDisponible)
  const urlPlayStore = normalizarVersion(datos?.urlPlayStore) || ''
  const mostrarActualizacion = Boolean(datos?.mostrarActualizacion)

  if (!versionDisponible || !urlPlayStore) return null

  return {
    versionDisponible,
    urlPlayStore,
    mostrarActualizacion,
    cambios: normalizarCambiosActualizacion(datos?.cambios, idiomaActual),
  }
}

export async function verificarActualizacionApp({ idiomaActual = IDIOMA_PREDETERMINADO } = {}) {
  const versionInstalada = await obtenerVersionInstalada()

  try {
    const datosRemotos = await obtenerVersionRemota(idiomaActual)
    if (!datosRemotos) {
      return {
        ...ESTADO_BASE_ACTUALIZACION,
        versionInstalada,
      }
    }

    const hayActualizacion =
      compararVersionesSemanticas(versionInstalada, datosRemotos.versionDisponible) < 0

    return {
      hayActualizacion,
      versionInstalada,
      versionDisponible: datosRemotos.versionDisponible,
      urlPlayStore: datosRemotos.urlPlayStore,
      debeMostrarModal: hayActualizacion && datosRemotos.mostrarActualizacion,
      cambios: datosRemotos.cambios,
    }
  } catch {
    return {
      ...ESTADO_BASE_ACTUALIZACION,
      versionInstalada,
    }
  }
}
