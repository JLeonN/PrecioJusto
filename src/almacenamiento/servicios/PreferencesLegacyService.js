import { Preferences } from '@capacitor/preferences'
import {
  CLAVE_MIGRACION_PREFERENCES_LEGACY_META,
  PREFIJO_ALMACENAMIENTO,
} from '../constantes/ClavesAlmacenamiento.js'
import { adaptadorActual } from './AlmacenamientoService.js'

const TAMANO_LOTE_LEGACY = 10

function normalizarEspacioTrabajo(espacioTrabajo = 'compartido') {
  return String(espacioTrabajo || 'compartido').trim() || 'compartido'
}

function crearPrefijoEspacioTrabajo(espacioTrabajo = 'compartido') {
  const espacioNormalizado = normalizarEspacioTrabajo(espacioTrabajo)
  return espacioNormalizado === 'compartido'
    ? PREFIJO_ALMACENAMIENTO
    : `${PREFIJO_ALMACENAMIENTO}${espacioNormalizado}_`
}

function crearClaveCompleta(clave, espacioTrabajo = 'compartido') {
  return `${crearPrefijoEspacioTrabajo(espacioTrabajo)}${clave}`
}

function cederHilo() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

async function obtenerMetaMigracion() {
  return (await adaptadorActual.obtener(CLAVE_MIGRACION_PREFERENCES_LEGACY_META)) || {
    clavesInseguras: [],
    migraciones: {},
  }
}

async function guardarMetaMigracion(meta) {
  return adaptadorActual.guardar(CLAVE_MIGRACION_PREFERENCES_LEGACY_META, {
    ...meta,
    fechaActualizacion: new Date().toISOString(),
  })
}

async function marcarClaveInsegura(claveCompleta, motivo) {
  const meta = await obtenerMetaMigracion()
  const clavesInseguras = new Set(meta.clavesInseguras || [])
  clavesInseguras.add(claveCompleta)

  await guardarMetaMigracion({
    ...meta,
    clavesInseguras: Array.from(clavesInseguras),
    ultimoMotivo: motivo || null,
  })
}

async function listarClavesLegacy({ prefijoBusqueda = '', espacioTrabajo = 'compartido' } = {}) {
  const prefijoEspacioTrabajo = crearPrefijoEspacioTrabajo(espacioTrabajo)
  const prefijoCompleto = `${prefijoEspacioTrabajo}${prefijoBusqueda || ''}`
  const { keys } = await Preferences.keys()

  return (keys || [])
    .filter((claveCompleta) => claveCompleta.startsWith(prefijoCompleto))
    .map((claveCompleta) => ({
      claveCompleta,
      clave: claveCompleta.slice(prefijoEspacioTrabajo.length),
    }))
}

async function obtenerValorLegacy(clave, espacioTrabajo = 'compartido') {
  const claveCompleta = crearClaveCompleta(clave, espacioTrabajo)
  const meta = await obtenerMetaMigracion()

  if ((meta.clavesInseguras || []).includes(claveCompleta)) {
    return null
  }

  try {
    const { value } = await Preferences.get({ key: claveCompleta })
    return value ? JSON.parse(value) : null
  } catch (error) {
    await marcarClaveInsegura(claveCompleta, error?.message || 'No se pudo leer Preferences legacy.')
    return null
  }
}

async function migrarClavesLegacy({
  espacioTrabajo = 'compartido',
  prefijos = [],
  tamanoLote = TAMANO_LOTE_LEGACY,
  procesarValor,
  onProgreso,
} = {}) {
  const claves = []

  for (const prefijoBusqueda of prefijos) {
    claves.push(...await listarClavesLegacy({ prefijoBusqueda, espacioTrabajo }))
  }

  let migradas = 0

  for (let indice = 0; indice < claves.length; indice += tamanoLote) {
    const lote = claves.slice(indice, indice + tamanoLote)

    for (const { clave, claveCompleta } of lote) {
      const valor = await obtenerValorLegacy(clave, espacioTrabajo)
      if (valor === null) continue

      if (typeof procesarValor === 'function') {
        await procesarValor({ clave, claveCompleta, valor })
      } else {
        await adaptadorActual.guardar(clave, valor)
      }

      migradas++
    }

    if (typeof onProgreso === 'function') {
      onProgreso({ migradas, total: claves.length })
    }

    await cederHilo()
  }

  return {
    total: claves.length,
    migradas,
  }
}

export default {
  listarClavesLegacy,
  obtenerValorLegacy,
  migrarClavesLegacy,
  obtenerMetaMigracion,
  marcarClaveInsegura,
}
