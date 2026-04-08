function normalizarNumero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function clasificarEscala(precioBase, precioUnitario, precioUnitarioAnterior = null) {
  const base = normalizarNumero(precioBase)
  const precio = normalizarNumero(precioUnitario)
  const anterior = normalizarNumero(precioUnitarioAnterior)

  if (precio === null || precio <= 0) return 'sospechosa'
  if (base !== null && precio > base) return 'sospechosa'
  if (anterior !== null && precio > anterior) return 'sospechosa'
  if (base !== null && precio === base) return 'neutral'
  if (anterior !== null && precio === anterior) return 'neutral'
  return 'mejora'
}

export function normalizarEscalasPorCantidad(escalas, precioBase) {
  if (!Array.isArray(escalas)) return []

  const escalasValidas = escalas
    .map((escala) => ({
      cantidadMinima: Math.trunc(Number(escala?.cantidadMinima)),
      precioUnitario: normalizarNumero(escala?.precioUnitario),
    }))
    .filter((escala) => escala.cantidadMinima >= 2 && escala.precioUnitario !== null)
    .sort((a, b) => a.cantidadMinima - b.cantidadMinima)

  const claves = new Set()
  const resultado = []
  let precioAnterior = null

  escalasValidas.forEach((escala) => {
    if (claves.has(escala.cantidadMinima)) return
    claves.add(escala.cantidadMinima)

    const estadoEscala = clasificarEscala(precioBase, escala.precioUnitario, precioAnterior)
    resultado.push({
      cantidadMinima: escala.cantidadMinima,
      precioUnitario: escala.precioUnitario,
      estadoEscala,
    })
    precioAnterior = escala.precioUnitario
  })

  return resultado
}

export function obtenerResumenEscalas(escalas) {
  const lista = Array.isArray(escalas) ? escalas : []
  const tieneMejoras = lista.some((escala) => escala?.estadoEscala === 'mejora')
  const tieneSospechosas = lista.some((escala) => escala?.estadoEscala === 'sospechosa')
  const tieneNeutrales = lista.some((escala) => escala?.estadoEscala === 'neutral')

  return {
    cantidadEscalas: lista.length,
    tieneMejoras,
    tieneSospechosas,
    tieneNeutrales,
  }
}
