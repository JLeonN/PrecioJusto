/**
 * Servicio de preferencias de usuario.
 * Maneja preferencias globales de moneda, tema y unidad con persistencia.
 */

import { adaptadorActual } from './AlmacenamientoService.js'
import { MONEDA_DEFAULT } from '../constantes/Monedas.js'

const PREFERENCIAS_BASE = {
  modoMoneda: 'automatica',
  modoTema: 'sistema',
  monedaManual: MONEDA_DEFAULT,
  paisDetectado: null,
  monedaDetectada: null,
  unidad: 'unidad',
}

function normalizarPreferencias(preferenciasCrudas) {
  if (!preferenciasCrudas || typeof preferenciasCrudas !== 'object') {
    return { ...PREFERENCIAS_BASE }
  }

  const monedaManual =
    preferenciasCrudas.monedaManual || preferenciasCrudas.moneda || PREFERENCIAS_BASE.monedaManual

  const modoMoneda =
    preferenciasCrudas.modoMoneda === 'manual' || preferenciasCrudas.modoMoneda === 'automatica'
      ? preferenciasCrudas.modoMoneda
      : PREFERENCIAS_BASE.modoMoneda

  const modoTema =
    preferenciasCrudas.modoTema === 'claro' ||
    preferenciasCrudas.modoTema === 'oscuro' ||
    preferenciasCrudas.modoTema === 'sistema'
      ? preferenciasCrudas.modoTema
      : PREFERENCIAS_BASE.modoTema

  return {
    modoMoneda,
    modoTema,
    monedaManual,
    paisDetectado: preferenciasCrudas.paisDetectado || null,
    monedaDetectada: preferenciasCrudas.monedaDetectada || null,
    unidad: preferenciasCrudas.unidad || PREFERENCIAS_BASE.unidad,
  }
}

class PreferenciasService {
  constructor() {
    this.adaptador = adaptadorActual
    this.clavePreferencias = 'preferencias_usuario'
  }

  async obtenerPreferencias() {
    try {
      const preferenciasGuardadas = await this.adaptador.obtener(this.clavePreferencias)
      return normalizarPreferencias(preferenciasGuardadas)
    } catch (error) {
      console.error('Error al obtener preferencias:', error)
      return { ...PREFERENCIAS_BASE }
    }
  }

  async guardarPreferenciasParciales(cambios) {
    try {
      const actuales = await this.obtenerPreferencias()
      const fusionadas = normalizarPreferencias({ ...actuales, ...cambios })
      await this.adaptador.guardar(this.clavePreferencias, fusionadas)
      return fusionadas
    } catch (error) {
      console.error('Error al guardar preferencias:', error)
      throw error
    }
  }

  async guardarModoMoneda(modoMoneda) {
    return this.guardarPreferenciasParciales({ modoMoneda })
  }

  async guardarModoTema(modoTema) {
    return this.guardarPreferenciasParciales({ modoTema })
  }

  async guardarMonedaManual(monedaManual) {
    return this.guardarPreferenciasParciales({ monedaManual })
  }

  async guardarDeteccionMoneda({ paisDetectado, monedaDetectada }) {
    return this.guardarPreferenciasParciales({ paisDetectado, monedaDetectada })
  }

  // Compatibilidad con llamadas previas de la app.
  async guardarMoneda(moneda) {
    return this.guardarMonedaManual(moneda)
  }

  async guardarUnidad(unidad) {
    return this.guardarPreferenciasParciales({ unidad })
  }
}

export default new PreferenciasService()
