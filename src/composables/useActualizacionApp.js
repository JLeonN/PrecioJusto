import { App } from '@capacitor/app'
import { ref } from 'vue'
import { verificarActualizacionApp } from '../almacenamiento/servicios/ActualizacionAppService.js'
import { urlPlayStoreDefecto } from '../almacenamiento/constantes/ActualizacionApp.js'

const cargandoActualizacion = ref(false)
const modalActualizacionAbierto = ref(false)
const estadoActualizacion = ref({
  hayActualizacion: false,
  versionInstalada: null,
  versionDisponible: null,
  urlPlayStore: urlPlayStoreDefecto,
  debeMostrarModal: false,
})

function obtenerUrlPlayStoreNativa(urlPlayStore) {
  if (typeof urlPlayStore !== 'string' || !urlPlayStore.includes('play.google.com/store/apps/details')) {
    return urlPlayStore
  }

  const coincidenciaId = urlPlayStore.match(/[?&]id=([^&]+)/)
  if (!coincidenciaId?.[1]) return urlPlayStore

  return `market://details?id=${decodeURIComponent(coincidenciaId[1])}`
}

async function refrescarEstadoActualizacion({ mostrarModalSiHay = false } = {}) {
  cargandoActualizacion.value = true

  try {
    const nuevoEstado = await verificarActualizacionApp()
    estadoActualizacion.value = nuevoEstado

    if (mostrarModalSiHay && nuevoEstado.debeMostrarModal) {
      modalActualizacionAbierto.value = true
    }
  } finally {
    cargandoActualizacion.value = false
  }

  return estadoActualizacion.value
}

function cerrarModalActualizacion() {
  modalActualizacionAbierto.value = false
}

async function abrirUrlPlayStore() {
  const urlHttps = estadoActualizacion.value.urlPlayStore || urlPlayStoreDefecto
  if (!urlHttps) return

  try {
    const urlNativa = obtenerUrlPlayStoreNativa(urlHttps)
    await App.openUrl({ url: urlNativa })
    return true
  } catch {
    // Si falla market:// o no hay app compatible, usamos el enlace web.
  }

  try {
    await App.openUrl({ url: urlHttps })
    return true
  } catch {
    // Fallback final para web o navegadores restrictivos.
  }

  window.open(urlHttps, '_blank', 'noopener')
  return true
}

export function useActualizacionApp() {
  return {
    cargandoActualizacion,
    modalActualizacionAbierto,
    estadoActualizacion,
    refrescarEstadoActualizacion,
    cerrarModalActualizacion,
    abrirUrlPlayStore,
  }
}
