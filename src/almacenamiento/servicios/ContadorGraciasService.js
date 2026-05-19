import { adaptadorActual } from './AlmacenamientoService.js'
import { CLAVE_CONTADOR_GRACIAS } from '../constantes/ClavesAlmacenamiento.js'

class ContadorGraciasService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async obtenerContador() {
    const valorGuardado = await this.adaptador.obtener(CLAVE_CONTADOR_GRACIAS)
    const contadorGuardado = this._normalizarContador(valorGuardado)

    if (contadorGuardado > 0) {
      return contadorGuardado
    }

    const contadorLegado = this._obtenerContadorLegadoLocalStorage()
    if (contadorLegado > 0) {
      await this.guardarContador(contadorLegado)
      return contadorLegado
    }

    return 0
  }

  async guardarContador(valor) {
    const contador = this._normalizarContador(valor)
    await this.adaptador.guardar(CLAVE_CONTADOR_GRACIAS, contador)
    return contador
  }

  async incrementar() {
    const contadorActual = await this.obtenerContador()
    return this.guardarContador(contadorActual + 1)
  }

  _normalizarContador(valor) {
    const numero = Number.parseInt(valor ?? 0, 10)
    return Number.isNaN(numero) || numero < 0 ? 0 : numero
  }

  _obtenerContadorLegadoLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 0
    }

    const valorLegado = window.localStorage.getItem(CLAVE_CONTADOR_GRACIAS)
    return this._normalizarContador(valorLegado)
  }
}

export default new ContadorGraciasService()
