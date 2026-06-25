import { readFile } from 'node:fs/promises'

const RUTA_VERSION = new URL('../public/version.json', import.meta.url)
const RUTA_IDIOMAS = new URL('../src/i18n/IdiomasApp.json', import.meta.url)

function contieneNovedades(cambios) {
  if (Array.isArray(cambios)) {
    return cambios.some((cambio) => {
      if (typeof cambio === 'string') {
        return cambio.trim().length > 0
      }

      return (
        cambio &&
        typeof cambio === 'object' &&
        Array.isArray(cambio.novedades) &&
        cambio.novedades.some((novedad) => typeof novedad === 'string' && novedad.trim())
      )
    })
  }

  if (!cambios || typeof cambios !== 'object') {
    return false
  }

  return Object.values(cambios).some(contieneNovedades)
}

const version = JSON.parse(await readFile(RUTA_VERSION, 'utf8'))
const catalogoIdiomas = JSON.parse(await readFile(RUTA_IDIOMAS, 'utf8'))
const idiomasHabilitados = catalogoIdiomas.idiomas.filter((idioma) => idioma.habilitado)

if (contieneNovedades(version.cambios) && version.mostrarActualizacion !== true) {
  throw new Error('public/version.json contiene novedades, pero mostrarActualizacion no está en true.')
}

if (version.mostrarActualizacion === true) {
  idiomasHabilitados.forEach((idioma) => {
    if (!contieneNovedades(version.cambios?.[idioma.codigoApp])) {
      throw new Error(`Faltan novedades para el idioma ${idioma.codigoApp}.`)
    }
  })
}

console.log('Contrato de actualización listo para publicar.')
