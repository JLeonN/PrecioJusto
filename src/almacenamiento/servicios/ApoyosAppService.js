import { adaptadorActual } from './AlmacenamientoService.js'
import { CLAVE_APOYOS_APP, CLAVE_CONTADOR_GRACIAS } from '../constantes/ClavesAlmacenamiento.js'
import firestoreApoyosAppService from './FirestoreApoyosAppService.js'

const APOYOS_INICIALES = Object.freeze({
  graciasVideo: 0,
  compartidosIniciados: 0,
  fechaActualizacion: null,
})

function normalizarContador(valor) {
  const numero = Number.parseInt(valor ?? 0, 10)
  return Number.isNaN(numero) || numero < 0 ? 0 : numero
}

function normalizarApoyos(apoyos) {
  return {
    graciasVideo: normalizarContador(apoyos?.graciasVideo),
    compartidosIniciados: normalizarContador(apoyos?.compartidosIniciados),
    fechaActualizacion: apoyos?.fechaActualizacion || null,
  }
}

class ApoyosAppService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async obtenerApoyos() {
    const apoyosGuardados = await this.adaptador.obtener(CLAVE_APOYOS_APP)
    if (apoyosGuardados && typeof apoyosGuardados === 'object') {
      return normalizarApoyos(apoyosGuardados)
    }

    const graciasVideo = await this.obtenerGraciasLegadas()
    const apoyosMigrados = {
      ...APOYOS_INICIALES,
      graciasVideo,
      fechaActualizacion: graciasVideo > 0 ? new Date().toISOString() : null,
    }
    await this.guardarApoyos(apoyosMigrados)
    void this.sincronizarApoyos(apoyosMigrados)
    return apoyosMigrados
  }

  async obtenerGraciasLegadas() {
    const valorGuardado = await this.adaptador.obtener(CLAVE_CONTADOR_GRACIAS)
    const contadorGuardado = normalizarContador(valorGuardado)
    if (contadorGuardado > 0) return contadorGuardado

    if (typeof window === 'undefined' || !window.localStorage) return 0
    return normalizarContador(window.localStorage.getItem(CLAVE_CONTADOR_GRACIAS))
  }

  async guardarApoyos(apoyos) {
    const apoyosNormalizados = {
      ...normalizarApoyos(apoyos),
      fechaActualizacion: new Date().toISOString(),
    }
    await this.adaptador.guardar(CLAVE_APOYOS_APP, apoyosNormalizados)
    return apoyosNormalizados
  }

  async incrementarGraciasVideo() {
    const apoyos = await this.obtenerApoyos()
    const actualizados = await this.guardarApoyos({
      ...apoyos,
      graciasVideo: apoyos.graciasVideo + 1,
    })
    void this.sincronizarApoyos(actualizados)
    return actualizados
  }

  async incrementarCompartidosIniciados() {
    const apoyos = await this.obtenerApoyos()
    const actualizados = await this.guardarApoyos({
      ...apoyos,
      compartidosIniciados: apoyos.compartidosIniciados + 1,
    })
    void this.sincronizarApoyos(actualizados)
    return actualizados
  }

  async sincronizarApoyos(apoyos) {
    try {
      return await firestoreApoyosAppService.guardarApoyosApp(apoyos)
    } catch (error) {
      console.warn('Los apoyos quedaron guardados localmente y se sincronizarán más adelante.', error)
      return null
    }
  }
}

export default new ApoyosAppService()
