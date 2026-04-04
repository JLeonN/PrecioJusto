import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Dark } from 'quasar'
import preferenciasService from '../servicios/PreferenciasService.js'
import { MONEDA_DEFAULT } from '../constantes/Monedas.js'
import { detectarMonedaPorRegion, obtenerMonedaFallback } from '../servicios/DeteccionRegionService.js'

export const usePreferenciasStore = defineStore('preferencias', () => {
  const modoMoneda = ref('automatica')
  const modoTema = ref('sistema')
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
  const esTemaSistema = computed(() => modoTema.value === 'sistema')
  const temaEfectivo = computed(() => {
    if (modoTema.value === 'claro') return 'claro'
    if (modoTema.value === 'oscuro') return 'oscuro'
    return Dark.isActive ? 'oscuro' : 'claro'
  })

  function aplicarModoTema() {
    if (modoTema.value === 'sistema') {
      Dark.set('auto')
      return
    }

    Dark.set(modoTema.value === 'oscuro')
  }

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
      modoTema.value = preferencias.modoTema || 'sistema'
      monedaManual.value = preferencias.monedaManual || MONEDA_DEFAULT
      paisDetectado.value = preferencias.paisDetectado || null
      monedaDetectada.value = preferencias.monedaDetectada || null
      unidad.value = preferencias.unidad || 'unidad'
      aplicarModoTema()

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

  async function guardarModoTema(valorModoTema) {
    const modoNormalizado =
      valorModoTema === 'claro' || valorModoTema === 'oscuro' || valorModoTema === 'sistema'
        ? valorModoTema
        : 'sistema'

    if (modoTema.value === modoNormalizado) return

    modoTema.value = modoNormalizado
    aplicarModoTema()
    await preferenciasService.guardarModoTema(modoTema.value)
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
    modoTema,
    monedaManual,
    paisDetectado,
    monedaDetectada,
    monedaDefaultEfectiva,
    usandoFallbackAutomatico,
    esTemaSistema,
    temaEfectivo,
    unidad,
    aplicarModoTema,
    inicializar,
    detectarMonedaAutomatica,
    guardarModoMoneda,
    guardarModoTema,
    guardarMonedaManual,
    guardarMoneda,
    guardarUnidad,
  }
})
