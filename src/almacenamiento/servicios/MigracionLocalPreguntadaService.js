import firestoreComerciosService from './FirestoreComerciosService.js'
import firestoreConfirmacionesService from './FirestoreConfirmacionesService.js'
import firestoreListasJustasService from './FirestoreListasJustasService.js'
import firestoreMesaTrabajoService from './FirestoreMesaTrabajoService.js'
import firestorePreferenciasService from './FirestorePreferenciasService.js'
import firestoreProductosService from './FirestoreProductosService.js'
import inventarioMigracionFirebaseService from './InventarioMigracionFirebaseService.js'
import { adaptadorActual } from './AlmacenamientoService.js'
import {
  CLAVE_COMERCIOS,
  CLAVE_LISTA_JUSTA,
  CLAVE_PREFERENCIAS_USUARIO,
  CLAVE_SESION_ESCANEO,
  PREFIJO_BACKUP_MIGRACION_FIREBASE,
  PREFIJO_COLA_SINCRONIZACION,
  PREFIJO_CONFIRMACIONES,
  PREFIJO_DECISION_MIGRACION_LOCAL_FIREBASE,
  PREFIJO_PRODUCTOS,
} from '../constantes/ClavesAlmacenamiento.js'

const DECISIONES_MIGRACION_LOCAL = Object.freeze({
  AHORA_NO: 'ahoraNo',
  BORRADA: 'borrada',
  MIGRADA: 'migrada',
})

function obtenerClaveDecision(usuarioId) {
  return `${PREFIJO_DECISION_MIGRACION_LOCAL_FIREBASE}${usuarioId}`
}

function tieneDatosLocalesMigrables(resumen = {}) {
  return Boolean(
    Number(resumen.productos || 0) > 0 ||
      Number(resumen.precios || 0) > 0 ||
      Number(resumen.comercios || 0) > 0 ||
      Number(resumen.direcciones || 0) > 0 ||
      Number(resumen.listas || 0) > 0 ||
      Number(resumen.itemsListaJusta || 0) > 0 ||
      Number(resumen.preferencias || 0) > 0 ||
      Number(resumen.confirmaciones || 0) > 0 ||
      Number(resumen.sesionEscaneo || 0) > 0 ||
      resumen.tienePreferencias ||
      resumen.tieneSesionEscaneo,
  )
}

async function obtenerDecision(usuarioId) {
  if (!usuarioId) return null
  return (await adaptadorActual.obtener(obtenerClaveDecision(usuarioId))) || null
}

async function guardarDecision(usuarioId, decision) {
  if (!usuarioId) return null

  const registro = {
    usuarioId,
    decision,
    fechaDecision: new Date().toISOString(),
  }

  await adaptadorActual.guardar(obtenerClaveDecision(usuarioId), registro)
  return registro
}

async function borrarPorPrefijo(prefijo) {
  const registros = await adaptadorActual.listarTodo(prefijo)
  await Promise.all(registros.map((registro) => adaptadorActual.eliminar(registro.clave)))
  return registros.length
}

async function borrarDatosLocalesMigrables() {
  const [productos, confirmaciones] = await Promise.all([
    borrarPorPrefijo(PREFIJO_PRODUCTOS),
    borrarPorPrefijo(PREFIJO_CONFIRMACIONES),
  ])
  const [backups, colas] = await Promise.all([
    borrarPorPrefijo(PREFIJO_BACKUP_MIGRACION_FIREBASE),
    borrarPorPrefijo(PREFIJO_COLA_SINCRONIZACION),
  ])

  const clavesDirectas = [
    CLAVE_COMERCIOS,
    CLAVE_LISTA_JUSTA,
    CLAVE_PREFERENCIAS_USUARIO,
    CLAVE_SESION_ESCANEO,
  ]
  const resultadosDirectos = await Promise.all(
    clavesDirectas.map(async (clave) => ({
      clave,
      borrado: await adaptadorActual.eliminar(clave),
    })),
  )

  return {
    productos,
    confirmaciones,
    backups,
    colas,
    clavesDirectas: resultadosDirectos.filter((resultado) => resultado.borrado).length,
  }
}

async function cuentaFirestoreTieneDatos(usuarioId) {
  if (!usuarioId) return false

  const [
    productos,
    comercios,
    listas,
    mesaTrabajo,
    preferencias,
    confirmaciones,
  ] = await Promise.all([
    firestoreProductosService.obtenerProductosUsuario({ usuarioId, limite: 1, incluirPrecios: true }),
    firestoreComerciosService.obtenerComerciosUsuario({ usuarioId, limite: 1 }),
    firestoreListasJustasService.obtenerListasJustasUsuario({ usuarioId, limite: 1 }),
    firestoreMesaTrabajoService.obtenerItemsMesaTrabajoUsuario({ usuarioId, limite: 1 }),
    firestorePreferenciasService.obtenerPreferenciasUsuario({ usuarioId }),
    firestoreConfirmacionesService.obtenerConfirmacionesUsuario({ usuarioId }),
  ])

  return Boolean(
    productos.length > 0 ||
      comercios.length > 0 ||
      listas.length > 0 ||
      mesaTrabajo.length > 0 ||
      preferencias ||
      confirmaciones.size > 0,
  )
}

async function evaluarOfertaMigracion(usuarioId) {
  if (!usuarioId) {
    return {
      debeMostrar: false,
      motivo: 'sinUsuario',
    }
  }

  const decision = await obtenerDecision(usuarioId)
  if (decision?.decision) {
    return {
      debeMostrar: false,
      motivo: 'decisionExistente',
      decision,
    }
  }

  const resumenLocal = await inventarioMigracionFirebaseService.obtenerResumenMigracionLocal()
  if (!tieneDatosLocalesMigrables(resumenLocal)) {
    return {
      debeMostrar: false,
      motivo: 'sinDatosLocales',
      resumenLocal,
    }
  }

  const firestoreTieneDatos = await cuentaFirestoreTieneDatos(usuarioId)
  if (firestoreTieneDatos) {
    return {
      debeMostrar: false,
      motivo: 'cuentaConDatos',
      resumenLocal,
    }
  }

  return {
    debeMostrar: true,
    motivo: 'datosLocalesCuentaVacia',
    resumenLocal,
  }
}

export default {
  DECISIONES_MIGRACION_LOCAL,
  evaluarOfertaMigracion,
  obtenerDecision,
  guardarDecision,
  borrarDatosLocalesMigrables,
  cuentaFirestoreTieneDatos,
  tieneDatosLocalesMigrables,
}
