import { App } from '@capacitor/app'
import { versionLocalBuild, urlVersionRemota } from '../constantes/ActualizacionApp.js'

const ESTADO_BASE_ACTUALIZACION = {
  hayActualizacion: false,
  versionInstalada: versionLocalBuild,
  versionDisponible: null,
  urlPlayStore: '',
  debeMostrarModal: false,
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

async function obtenerVersionRemota() {
  if (!urlVersionRemota) return null

  const respuesta = await fetch(urlVersionRemota, { cache: 'no-store' })
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
  }
}

export async function verificarActualizacionApp() {
  const versionInstalada = await obtenerVersionInstalada()

  try {
    const datosRemotos = await obtenerVersionRemota()
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
    }
  } catch {
    return {
      ...ESTADO_BASE_ACTUALIZACION,
      versionInstalada,
    }
  }
}
