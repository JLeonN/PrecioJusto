import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import preferenciasService from '../servicios/PreferenciasService.js'
import { MONEDA_DEFAULT } from '../constantes/Monedas.js'
import { detectarMonedaPorRegion, obtenerMonedaFallback } from '../servicios/DeteccionRegionService.js'

export const usePreferenciasStore = defineStore('preferencias', () => {
  const modoMoneda = ref('automatica')
  const monedaManual = ref(MONEDA_DEFAULT)
  const paisDetectado = ref(null)
  const monedaDetectada = ref(null)
  const unidad = ref('unidad')

  const monedaDefaultEfectiva = computed(() => {
    if (modoMoneda.value === 'manual') {
      return monedaManual.value || obtenerMonedaFallback()
    }

    if (monedaDetectada.value) {
      return monedaDetectada.value
    }

    if (monedaManual.value) {
      return monedaManual.value
    }

    return obtenerMonedaFallback()
  })

  const usandoFallbackAutomatico = computed(
    () => modoMoneda.value === 'automatica' && !monedaDetectada.value,
  )

  async function detectarMonedaAutomatica() {
    const resultadoDeteccion = detectarMonedaPorRegion()

    paisDetectado.value = resultadoDeteccion.paisDetectado
    monedaDetectada.value = resultadoDeteccion.monedaDetectada

    await preferenciasService.guardarDeteccionMoneda({
      paisDetectado: paisDetectado.value,
      monedaDetectada: monedaDetectada.value,
    })
  }

  async function inicializar() {
    try {
      const preferencias = await preferenciasService.obtenerPreferencias()
      modoMoneda.value = preferencias.modoMoneda || 'automatica'
      monedaManual.value = preferencias.monedaManual || MONEDA_DEFAULT
      paisDetectado.value = preferencias.paisDetectado || null
      monedaDetectada.value = preferencias.monedaDetectada || null
      unidad.value = preferencias.unidad || 'unidad'

      if (modoMoneda.value === 'automatica') {
        await detectarMonedaAutomatica()
      }
    } catch (error) {
      console.error('Error al cargar preferencias:', error)
    }
  }

  async function guardarModoMoneda(valorModo) {
    modoMoneda.value = valorModo === 'manual' ? 'manual' : 'automatica'
    await preferenciasService.guardarModoMoneda(modoMoneda.value)

    if (modoMoneda.value === 'automatica') {
      await detectarMonedaAutomatica()
    }
  }

  async function guardarMonedaManual(moneda) {
    monedaManual.value = moneda || MONEDA_DEFAULT
    await preferenciasService.guardarMonedaManual(monedaManual.value)
  }

  // Compatibilidad con componentes viejos.
  async function guardarMoneda(moneda) {
    await guardarMonedaManual(moneda)
  }

  async function guardarUnidad(valorUnidad) {
    unidad.value = valorUnidad || 'unidad'
    await preferenciasService.guardarUnidad(unidad.value)
  }

  return {
    modoMoneda,
    monedaManual,
    paisDetectado,
    monedaDetectada,
    monedaDefaultEfectiva,
    usandoFallbackAutomatico,
    unidad,
    inicializar,
    detectarMonedaAutomatica,
    guardarModoMoneda,
    guardarMonedaManual,
    guardarMoneda,
    guardarUnidad,
  }
})