/**
 * Servicio de preferencias de usuario.
 * Maneja preferencias globales de moneda, tema y unidad con persistencia.
 */

import { adaptadorActual } from './AlmacenamientoService.js'
import { MONEDA_DEFAULT } from '../constantes/Monedas.js'
import { CLAVE_PREFERENCIAS_USUARIO } from '../constantes/ClavesAlmacenamiento.js'
import { ESTADOS_SINCRONIZACION } from '../constantes/PreparacionFirebase.js'
import firestorePreferenciasService from './FirestorePreferenciasService.js'
import usuarioActualService from './UsuarioActualService.js'

const TIEMPO_MAXIMO_SINCRONIZACION_FIRESTORE_MS = 7000

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
    return {
      usuarioId: usuarioActualService.obtenerUsuarioIdActual(),
      ...PREFERENCIAS_BASE,
    }
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
    usuarioId: preferenciasCrudas.usuarioId || usuarioActualService.obtenerUsuarioIdActual(),
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
    this.clavePreferencias = CLAVE_PREFERENCIAS_USUARIO
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

      fusionadas.sincronizacionFirestore = await this._sincronizarPreferenciasFirestore(fusionadas)
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

  async obtenerPreferenciasFirestoreControladas() {
    try {
      const preferenciasFirestore = await firestorePreferenciasService.obtenerPreferenciasUsuario()
      if (!preferenciasFirestore) {
        return {
          disponible: false,
          mensaje: 'No hay preferencias Firestore para el usuario actual o no hay sesión Firebase.',
          preferencias: null,
        }
      }

      return {
        disponible: true,
        mensaje: 'Preferencias Firestore obtenidas.',
        preferencias: normalizarPreferencias(preferenciasFirestore),
      }
    } catch (error) {
      return {
        disponible: false,
        mensaje: error.message || 'No se pudieron leer preferencias Firestore.',
        preferencias: null,
      }
    }
  }

  async obtenerDiagnosticoSincronizacion() {
    const preferenciasLocales = await this.obtenerPreferencias()
    const preferenciasFirestore = await this.obtenerPreferenciasFirestoreControladas()

    return {
      local: preferenciasLocales,
      firestore: preferenciasFirestore.preferencias,
      firestoreDisponible: preferenciasFirestore.disponible,
      mensajeFirestore: preferenciasFirestore.mensaje,
    }
  }

  async _sincronizarPreferenciasFirestore(preferencias) {
    try {
      const resultado = await this._ejecutarConTimeoutFirestore(
        firestorePreferenciasService.guardarPreferencias(preferencias),
      )

      if (resultado.omitido) {
        return {
          estado: ESTADOS_SINCRONIZACION.LOCAL,
          fecha: new Date().toISOString(),
          mensaje: resultado.mensaje,
          error: null,
        }
      }

      if (!resultado.exito) {
        return {
          estado: ESTADOS_SINCRONIZACION.ERROR,
          fecha: new Date().toISOString(),
          mensaje: resultado.mensaje || 'No se pudo sincronizar preferencias con Firestore.',
          error: resultado.mensaje || 'Error de sincronización Firestore.',
        }
      }

      return {
        estado: resultado.estado || ESTADOS_SINCRONIZACION.SINCRONIZADO,
        fecha: new Date().toISOString(),
        mensaje:
          resultado.estado === ESTADOS_SINCRONIZACION.PENDIENTE
            ? 'Preferencias guardadas localmente y pendientes de sincronizar con Firestore.'
            : 'Preferencias sincronizadas con Firestore.',
        error: null,
      }
    } catch (error) {
      console.error('Error al sincronizar preferencias con Firestore:', error)
      return {
        estado: ESTADOS_SINCRONIZACION.ERROR,
        fecha: new Date().toISOString(),
        mensaje: 'Las preferencias quedaron guardadas localmente, pero no se sincronizaron con Firestore.',
        error: error.message || 'Error de sincronización Firestore.',
      }
    }
  }

  async _ejecutarConTimeoutFirestore(promesa) {
    let timeoutId = null
    const timeout = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({
          exito: true,
          estado: ESTADOS_SINCRONIZACION.PENDIENTE,
          mensaje: 'Firestore aceptó la operación localmente o quedó pendiente por conectividad.',
        })
      }, TIEMPO_MAXIMO_SINCRONIZACION_FIRESTORE_MS)
    })

    const resultado = await Promise.race([promesa, timeout])
    clearTimeout(timeoutId)
    return resultado
  }
}

export default new PreferenciasService()
