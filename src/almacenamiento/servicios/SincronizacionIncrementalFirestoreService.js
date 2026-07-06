function lecturaCompletaPorLimite(cantidadRecibida, limiteConsulta) {
  const cantidad = Number(cantidadRecibida)
  const limite = Number(limiteConsulta)
  if (!Number.isFinite(cantidad) || !Number.isFinite(limite) || limite <= 0) return false
  return cantidad < limite
}

function puedeReconciliarBorrados(resultado) {
  return Boolean(
    resultado &&
      !resultado.error &&
      resultado.conectado &&
      Array.isArray(resultado.datos) &&
      resultado.completa,
  )
}

function obtenerLocalesVigentes({ locales = [], remotos = [], reconciliacionService, lecturaCompleta }) {
  if (!lecturaCompleta) return locales
  return reconciliacionService.filtrarLocalesExistentesEnRemotos(locales, remotos)
}

async function limpiarSobrantesSiCorresponde({
  locales = [],
  remotos = [],
  reconciliacionService,
  limpiarEntidad,
  lecturaCompleta,
}) {
  if (!lecturaCompleta) return []
  return reconciliacionService.limpiarLocalesSobrantes({
    locales,
    remotos,
    limpiarEntidad,
  })
}

export default {
  lecturaCompletaPorLimite,
  puedeReconciliarBorrados,
  obtenerLocalesVigentes,
  limpiarSobrantesSiCorresponde,
}
