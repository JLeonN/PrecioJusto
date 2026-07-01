import { adaptadorActual, ejecutarConEspacioTrabajoAlmacenamiento } from './AlmacenamientoService.js'
import {
  CLAVE_COMERCIOS,
  CLAVE_LISTA_JUSTA,
  CLAVE_SESION_ESCANEO,
  PREFIJO_PRODUCTOS,
} from '../constantes/ClavesAlmacenamiento.js'

function esBase64Imagen(valor) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(valor || '').trim())
}

function esUrlImagen(valor) {
  return /^https?:\/\//.test(String(valor || '').trim())
}

function tieneImagenActual(entidad, campoImagen, campoUrl) {
  return (
    esBase64Imagen(entidad?.[campoImagen]) ||
    esUrlImagen(entidad?.[campoImagen]) ||
    esUrlImagen(entidad?.[campoUrl])
  )
}

function copiarCamposImagen(destino, origen, configuracion) {
  if (!destino || !origen) return destino
  if (tieneImagenActual(destino, configuracion.campoImagen, configuracion.campoUrl)) return destino

  const imagenLegacy = origen[configuracion.campoImagen]
  const urlLegacy = origen[configuracion.campoUrl]

  if (!esBase64Imagen(imagenLegacy) && !esUrlImagen(urlLegacy) && !esUrlImagen(imagenLegacy)) {
    return destino
  }

  return {
    ...destino,
    [configuracion.campoImagen]: esBase64Imagen(imagenLegacy) || esUrlImagen(imagenLegacy)
      ? imagenLegacy
      : destino[configuracion.campoImagen] || null,
    [configuracion.campoFuente]: origen[configuracion.campoFuente] || destino[configuracion.campoFuente] || null,
    [configuracion.campoUrl]: esUrlImagen(urlLegacy)
      ? urlLegacy
      : esUrlImagen(imagenLegacy)
        ? imagenLegacy
        : destino[configuracion.campoUrl] || null,
    [configuracion.campoRuta]: origen[configuracion.campoRuta] || destino[configuracion.campoRuta] || null,
    sincronizacionFoto: origen.sincronizacionFoto || destino.sincronizacionFoto,
  }
}

async function leerCompartido(operacion) {
  return ejecutarConEspacioTrabajoAlmacenamiento('compartido', operacion)
}

async function obtenerProductoLegacy(productoId) {
  if (!productoId) return null
  return leerCompartido(() => adaptadorActual.obtener(`${PREFIJO_PRODUCTOS}${productoId}`))
}

async function obtenerComerciosLegacy() {
  return leerCompartido(async () => (await adaptadorActual.obtener(CLAVE_COMERCIOS)) || [])
}

async function obtenerListasLegacy() {
  return leerCompartido(async () => {
    const datos = await adaptadorActual.obtener(CLAVE_LISTA_JUSTA)
    return Array.isArray(datos?.listas) ? datos.listas : []
  })
}

async function obtenerMesaLegacy() {
  return leerCompartido(async () => {
    const datos = await adaptadorActual.obtener(CLAVE_SESION_ESCANEO)
    return Array.isArray(datos?.items) ? datos.items : []
  })
}

async function recuperarFotoProducto(producto) {
  if (!producto?.id || tieneImagenActual(producto, 'imagen', 'imagenUrl')) return producto

  const legacy = await obtenerProductoLegacy(producto.id)
  return copiarCamposImagen(producto, legacy, {
    campoImagen: 'imagen',
    campoFuente: 'fotoFuente',
    campoUrl: 'imagenUrl',
    campoRuta: 'imagenRutaStorage',
  })
}

async function recuperarFotosProductos(productos = []) {
  const recuperados = []

  for (const producto of productos) {
    recuperados.push(await recuperarFotoProducto(producto))
  }

  return recuperados
}

async function recuperarFotosComercios(comercios = []) {
  const comerciosLegacy = await obtenerComerciosLegacy()
  const legacyPorComercio = new Map(comerciosLegacy.map((comercio) => [String(comercio.id), comercio]))

  return comercios.map((comercio) => {
    const legacy = legacyPorComercio.get(String(comercio?.id))
    const comercioConFoto = copiarCamposImagen(comercio, legacy, {
      campoImagen: 'foto',
      campoFuente: 'fotoFuente',
      campoUrl: 'fotoUrl',
      campoRuta: 'fotoRutaStorage',
    })

    const direccionesLegacy = new Map(
      (legacy?.direcciones || []).map((direccion) => [String(direccion.id), direccion]),
    )

    return {
      ...comercioConFoto,
      direcciones: (comercioConFoto.direcciones || []).map((direccion) =>
        copiarCamposImagen(direccion, direccionesLegacy.get(String(direccion.id)), {
          campoImagen: 'foto',
          campoFuente: 'fotoFuente',
          campoUrl: 'fotoUrl',
          campoRuta: 'fotoRutaStorage',
        }),
      ),
    }
  })
}

async function recuperarFotosListas(listas = []) {
  const listasLegacy = await obtenerListasLegacy()
  const legacyPorLista = new Map(listasLegacy.map((lista) => [String(lista.id), lista]))

  return listas.map((lista) => {
    const legacy = legacyPorLista.get(String(lista?.id))
    const itemsLegacy = new Map((legacy?.items || []).map((item) => [String(item.id), item]))

    return {
      ...lista,
      items: (lista.items || []).map((item) =>
        copiarCamposImagen(item, itemsLegacy.get(String(item.id)), {
          campoImagen: 'imagen',
          campoFuente: 'fotoFuente',
          campoUrl: 'imagenUrl',
          campoRuta: 'imagenRutaStorage',
        }),
      ),
    }
  })
}

async function recuperarFotosMesa(items = []) {
  const itemsLegacy = await obtenerMesaLegacy()
  const legacyPorItem = new Map(itemsLegacy.map((item) => [String(item.id), item]))

  return items.map((item) => {
    const legacy = legacyPorItem.get(String(item?.id))
    const itemConFoto = copiarCamposImagen(item, legacy, {
      campoImagen: 'imagen',
      campoFuente: 'fotoFuente',
      campoUrl: 'imagenUrl',
      campoRuta: 'imagenRutaStorage',
    })

    if (!itemConFoto.datosOriginales || !legacy?.datosOriginales) return itemConFoto

    return {
      ...itemConFoto,
      datosOriginales: copiarCamposImagen(itemConFoto.datosOriginales, legacy.datosOriginales, {
        campoImagen: 'imagen',
        campoFuente: 'fotoFuente',
        campoUrl: 'imagenUrl',
        campoRuta: 'imagenRutaStorage',
      }),
    }
  })
}

export default {
  esBase64Imagen,
  esUrlImagen,
  recuperarFotoProducto,
  recuperarFotosProductos,
  recuperarFotosComercios,
  recuperarFotosListas,
  recuperarFotosMesa,
}
