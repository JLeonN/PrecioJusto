import { defineStore } from 'pinia'
import { ref } from 'vue'
import preferenciasService from '../servicios/PreferenciasService.js'
import { MONEDA_DEFAULT } from '../constantes/Monedas.js'

export const usePreferenciasStore = defineStore('preferencias', () => {
  const moneda = ref(MONEDA_DEFAULT)
  const unidad = ref('unidad')

  // Carga las preferencias desde el almacenamiento al iniciar la app
  async function inicializar() {
    try {
      const preferencias = await preferenciasService.obtenerPreferencias()
      moneda.value = preferencias.moneda || MONEDA_DEFAULT
      unidad.value = preferencias.unidad || 'unidad'
    } catch (error) {
      console.error('Error al cargar preferencias:', error)
    }
  }

  async function guardarMoneda(val) {
    moneda.value = val
    await preferenciasService.guardarMoneda(val)
  }

  async function guardarUnidad(val) {
    unidad.value = val
    await preferenciasService.guardarUnidad(val)
  }

  return { moneda, unidad, inicializar, guardarMoneda, guardarUnidad }
})
