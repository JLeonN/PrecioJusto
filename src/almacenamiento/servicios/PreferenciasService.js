/**
 * ⚙️ SERVICIO DE PREFERENCIAS DE USUARIO
 * Guarda configuraciones del usuario (moneda, unidad, etc.)
 */

import { adaptadorActual } from './AlmacenamientoService.js'

class PreferenciasService {
  constructor() {
    this.adaptador = adaptadorActual
    this.clavePreferencias = 'preferencias_usuario'

    console.log('⚙️ PreferenciasService inicializado')
  }

  /**
   * 📥 OBTENER PREFERENCIAS
   * @returns {Promise<Object>} - Preferencias del usuario
   */
  async obtenerPreferencias() {
    try {
      const preferencias = await this.adaptador.obtener(this.clavePreferencias)

      // Si no existen, devolver valores por defecto
      if (!preferencias) {
        return {
          moneda: 'UYU',
          unidad: 'unidad',
        }
      }

      return preferencias
    } catch (error) {
      console.error('❌ Error al obtener preferencias:', error)
      return {
        moneda: 'UYU',
        unidad: 'unidad',
      }
    }
  }

  /**
   * 💾 GUARDAR MONEDA
   * @param {string} moneda - Código de moneda
   */
  async guardarMoneda(moneda) {
    try {
      const preferencias = await this.obtenerPreferencias()
      preferencias.moneda = moneda

      await this.adaptador.guardar(this.clavePreferencias, preferencias)
      console.log(`✅ Moneda guardada: ${moneda}`)
    } catch (error) {
      console.error('❌ Error al guardar moneda:', error)
    }
  }

  /**
   * 💾 GUARDAR UNIDAD
   * @param {string} unidad - Tipo de unidad
   */
  async guardarUnidad(unidad) {
    try {
      const preferencias = await this.obtenerPreferencias()
      preferencias.unidad = unidad

      await this.adaptador.guardar(this.clavePreferencias, preferencias)
      console.log(`✅ Unidad guardada: ${unidad}`)
    } catch (error) {
      console.error('❌ Error al guardar unidad:', error)
    }
  }
}

export default new PreferenciasService()
