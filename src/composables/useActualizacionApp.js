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
  const urlObjetivo = estadoActualizacion.value.urlPlayStore || urlPlayStoreDefecto
  if (!urlObjetivo) return

  try {
    await App.openUrl({ url: urlObjetivo })
    return
  } catch {
    // Fallback web.
  }

  window.open(urlObjetivo, '_blank', 'noopener')
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
