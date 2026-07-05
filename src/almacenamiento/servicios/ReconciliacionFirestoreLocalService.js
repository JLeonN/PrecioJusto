const TAMANO_TANDA_DEFECTO = 20

function obtenerId(entidad) {
  return String(entidad?.id || '').trim()
}

function crearSetIds(entidades = []) {
  return new Set((entidades || []).map(obtenerId).filter(Boolean))
}

function obtenerEntidadesLocalesSobrantes(locales = [], remotos = []) {
  const idsRemotos = crearSetIds(remotos)

  return (locales || []).filter((local) => {
    const id = obtenerId(local)
    return id && !idsRemotos.has(id)
  })
}

function filtrarLocalesExistentesEnRemotos(locales = [], remotos = []) {
  const idsRemotos = crearSetIds(remotos)

  return (locales || []).filter((local) => {
    const id = obtenerId(local)
    return id && idsRemotos.has(id)
  })
}

async function ejecutarEnTandas(items = [], accion, tamanoTanda = TAMANO_TANDA_DEFECTO) {
  if (!Array.isArray(items) || items.length === 0 || typeof accion !== 'function') return 0

  let procesados = 0

  for (let indice = 0; indice < items.length; indice += tamanoTanda) {
    const tanda = items.slice(indice, indice + tamanoTanda)
    await Promise.all(tanda.map((item) => accion(item)))
    procesados += tanda.length
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return procesados
}

async function limpiarLocalesSobrantes({ locales = [], remotos = [], limpiarEntidad }) {
  const sobrantes = obtenerEntidadesLocalesSobrantes(locales, remotos)
  await ejecutarEnTandas(sobrantes, limpiarEntidad)
  return sobrantes
}

export default {
  obtenerEntidadesLocalesSobrantes,
  filtrarLocalesExistentesEnRemotos,
  ejecutarEnTandas,
  limpiarLocalesSobrantes,
}
