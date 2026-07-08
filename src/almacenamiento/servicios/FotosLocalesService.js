import { adaptadorActual } from './AlmacenamientoService.js'
import { PREFIJO_FOTOS_LOCALES } from '../constantes/ClavesAlmacenamiento.js'
import { ESTADOS_SINCRONIZACION, ORIGENES_FOTO } from '../constantes/PreparacionFirebase.js'

function esBase64Imagen(valor) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(valor || '').trim())
}

function esUrlImagen(valor) {
  return /^https?:\/\//.test(String(valor || '').trim())
}

function limpiarSegmento(valor) {
  return String(valor || 'sinid').replace(/[^a-zA-Z0-9]/g, '').slice(0, 80) || 'sinid'
}

function crearFotoLocalId(dominio, entidadId, campo = 'principal') {
  return `${limpiarSegmento(dominio)}_${limpiarSegmento(entidadId)}_${limpiarSegmento(campo)}`
}

function clonar(valor) {
  if (!valor || typeof valor !== 'object') return valor
  return JSON.parse(JSON.stringify(valor))
}

function crearSincronizacionFotoLocal() {
  return {
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    fecha: new Date().toISOString(),
    mensaje: 'Foto guardada solo en este dispositivo.',
  }
}

function prepararUrlLiviana(entidad, configuracion) {
  const imagen = entidad?.[configuracion.campoImagen]
  const url = entidad?.[configuracion.campoUrl]

  if (esUrlImagen(imagen)) {
    return {
      ...entidad,
      [configuracion.campoUrl]: imagen,
      [configuracion.campoRuta]: null,
      [configuracion.campoFuente]: entidad[configuracion.campoFuente] || ORIGENES_FOTO.EXTERNA,
    }
  }

  if (esUrlImagen(url)) {
    return {
      ...entidad,
      [configuracion.campoImagen]: entidad[configuracion.campoImagen] || url,
      [configuracion.campoRuta]: null,
      [configuracion.campoFuente]: entidad[configuracion.campoFuente] || ORIGENES_FOTO.EXTERNA,
    }
  }

  return entidad
}

function quitarFotoPesadaEntidad(entidad, configuracion) {
  if (!entidad || typeof entidad !== 'object') return entidad
  const copia = { ...entidad }

  if (esBase64Imagen(copia[configuracion.campoImagen])) {
    copia[configuracion.campoImagen] = null
    copia[configuracion.campoUrl] = null
    copia[configuracion.campoRuta] = null
    copia[configuracion.campoFuente] = copia[configuracion.campoFuente] || ORIGENES_FOTO.USUARIO
    copia.sincronizacionFoto = copia.sincronizacionFoto || crearSincronizacionFotoLocal()
  }

  return prepararUrlLiviana(copia, configuracion)
}

async function guardarFotoLocal(fotoLocalId, imagen, metadatos = {}) {
  if (!fotoLocalId || !esBase64Imagen(imagen)) return false

  return adaptadorActual.guardar(`${PREFIJO_FOTOS_LOCALES}${fotoLocalId}`, {
    id: fotoLocalId,
    imagen,
    ...metadatos,
    fechaGuardado: new Date().toISOString(),
  })
}

async function separarFotoEntidad(entidad, configuracion) {
  if (!entidad || typeof entidad !== 'object') return entidad
  const copia = { ...entidad }
  const imagen = copia[configuracion.campoImagen]
  const entidadId = configuracion.entidadId || copia.id || copia.productoId || copia.codigoBarras
  const fotoLocalId = copia.fotoLocalId || crearFotoLocalId(configuracion.dominio, entidadId, configuracion.campo)

  if (esBase64Imagen(imagen)) {
    await guardarFotoLocal(fotoLocalId, imagen, {
      dominio: configuracion.dominio,
      entidadId: entidadId || null,
      campo: configuracion.campo,
      fuente: copia[configuracion.campoFuente] || ORIGENES_FOTO.USUARIO,
    })

    copia[configuracion.campoImagen] = null
    copia[configuracion.campoUrl] = null
    copia[configuracion.campoRuta] = null
    copia[configuracion.campoFuente] = ORIGENES_FOTO.USUARIO
    copia.fotoLocalId = fotoLocalId
    copia.fotoFuente = copia.fotoFuente || ORIGENES_FOTO.USUARIO
    copia.sincronizacionFoto = copia.sincronizacionFoto || crearSincronizacionFotoLocal()
    return copia
  }

  return prepararUrlLiviana(copia, configuracion)
}

async function protegerProducto(producto) {
  return separarFotoEntidad(producto, {
    dominio: 'productos',
    campo: 'imagen',
    campoImagen: 'imagen',
    campoFuente: 'fotoFuente',
    campoUrl: 'imagenUrl',
    campoRuta: 'imagenRutaStorage',
  })
}

async function protegerProductos(productos = []) {
  const protegidos = []
  for (const producto of productos || []) {
    protegidos.push(await protegerProducto(producto))
  }
  return protegidos
}

async function protegerDireccion(comercio, direccion) {
  return separarFotoEntidad(direccion, {
    dominio: 'direccionesComercio',
    entidadId: `${comercio?.id || 'comercio'}_${direccion?.id || 'direccion'}`,
    campo: 'foto',
    campoImagen: 'foto',
    campoFuente: 'fotoFuente',
    campoUrl: 'fotoUrl',
    campoRuta: 'fotoRutaStorage',
  })
}

async function protegerComercio(comercio) {
  const comercioProtegido = await separarFotoEntidad(comercio, {
    dominio: 'comercios',
    campo: 'foto',
    campoImagen: 'foto',
    campoFuente: 'fotoFuente',
    campoUrl: 'fotoUrl',
    campoRuta: 'fotoRutaStorage',
  })

  const direcciones = []
  for (const direccion of comercioProtegido?.direcciones || []) {
    direcciones.push(await protegerDireccion(comercioProtegido, direccion))
  }

  return {
    ...comercioProtegido,
    direcciones,
  }
}

async function protegerComercios(comercios = []) {
  const protegidos = []
  for (const comercio of comercios || []) {
    protegidos.push(await protegerComercio(comercio))
  }
  return protegidos
}

async function protegerItemLista(lista, item) {
  return separarFotoEntidad(item, {
    dominio: 'listas',
    entidadId: `${lista?.id || 'lista'}_${item?.id || 'item'}`,
    campo: 'imagen',
    campoImagen: 'imagen',
    campoFuente: 'fotoFuente',
    campoUrl: 'imagenUrl',
    campoRuta: 'imagenRutaStorage',
  })
}

async function protegerLista(lista) {
  const items = []
  for (const item of lista?.items || []) {
    items.push(await protegerItemLista(lista, item))
  }

  return {
    ...lista,
    items,
  }
}

async function protegerListas(listas = []) {
  const protegidas = []
  for (const lista of listas || []) {
    protegidas.push(await protegerLista(lista))
  }
  return protegidas
}

async function protegerItemMesa(item) {
  const itemProtegido = await separarFotoEntidad(item, {
    dominio: 'mesa',
    campo: 'imagen',
    campoImagen: 'imagen',
    campoFuente: 'fotoFuente',
    campoUrl: 'imagenUrl',
    campoRuta: 'imagenRutaStorage',
  })

  if (!itemProtegido?.datosOriginales) return itemProtegido

  return {
    ...itemProtegido,
    datosOriginales: await separarFotoEntidad(itemProtegido.datosOriginales, {
      dominio: 'mesaOriginal',
      entidadId: itemProtegido.id || itemProtegido.productoId,
      campo: 'imagen',
      campoImagen: 'imagen',
      campoFuente: 'fotoFuente',
      campoUrl: 'imagenUrl',
      campoRuta: 'imagenRutaStorage',
    }),
  }
}

async function protegerItemsMesa(items = []) {
  const protegidos = []
  for (const item of items || []) {
    protegidos.push(await protegerItemMesa(item))
  }
  return protegidos
}

function quitarFotosPesadasProductos(productos = []) {
  return (productos || []).map((producto) =>
    quitarFotoPesadaEntidad(producto, {
      campoImagen: 'imagen',
      campoFuente: 'fotoFuente',
      campoUrl: 'imagenUrl',
      campoRuta: 'imagenRutaStorage',
    }),
  )
}

function quitarFotosPesadasComercios(comercios = []) {
  return (comercios || []).map((comercio) => ({
    ...quitarFotoPesadaEntidad(comercio, {
      campoImagen: 'foto',
      campoFuente: 'fotoFuente',
      campoUrl: 'fotoUrl',
      campoRuta: 'fotoRutaStorage',
    }),
    direcciones: (comercio?.direcciones || []).map((direccion) =>
      quitarFotoPesadaEntidad(direccion, {
        campoImagen: 'foto',
        campoFuente: 'fotoFuente',
        campoUrl: 'fotoUrl',
        campoRuta: 'fotoRutaStorage',
      }),
    ),
  }))
}

function quitarFotosPesadasListas(listas = []) {
  return (listas || []).map((lista) => ({
    ...lista,
    items: (lista?.items || []).map((item) =>
      quitarFotoPesadaEntidad(item, {
        campoImagen: 'imagen',
        campoFuente: 'fotoFuente',
        campoUrl: 'imagenUrl',
        campoRuta: 'imagenRutaStorage',
      }),
    ),
  }))
}

function quitarFotosPesadasMesa(items = []) {
  return (items || []).map((item) => {
    const itemLiviano = quitarFotoPesadaEntidad(item, {
      campoImagen: 'imagen',
      campoFuente: 'fotoFuente',
      campoUrl: 'imagenUrl',
      campoRuta: 'imagenRutaStorage',
    })

    if (!itemLiviano?.datosOriginales) return itemLiviano

    return {
      ...itemLiviano,
      datosOriginales: quitarFotoPesadaEntidad(itemLiviano.datosOriginales, {
        campoImagen: 'imagen',
        campoFuente: 'fotoFuente',
        campoUrl: 'imagenUrl',
        campoRuta: 'imagenRutaStorage',
      }),
    }
  })
}

async function hidratarFotoLocal(fotoLocalId) {
  if (!fotoLocalId) return null
  const registro = await adaptadorActual.obtener(`${PREFIJO_FOTOS_LOCALES}${fotoLocalId}`)
  return registro?.imagen || null
}

async function eliminarFotoLocal(fotoLocalId) {
  if (!fotoLocalId) return false
  return adaptadorActual.eliminar(`${PREFIJO_FOTOS_LOCALES}${fotoLocalId}`)
}

async function eliminarFotosPorIds(fotoLocalIds = []) {
  const idsUnicos = [...new Set((fotoLocalIds || []).filter(Boolean))]
  let eliminadas = 0

  for (const fotoLocalId of idsUnicos) {
    const eliminada = await eliminarFotoLocal(fotoLocalId)
    if (eliminada) eliminadas++
  }

  return eliminadas
}

async function eliminarFotosProducto(producto) {
  return eliminarFotosPorIds([producto?.fotoLocalId])
}

async function eliminarFotosComercio(comercio) {
  const ids = [comercio?.fotoLocalId]

  for (const direccion of comercio?.direcciones || []) {
    ids.push(direccion?.fotoLocalId)
  }

  return eliminarFotosPorIds(ids)
}

async function eliminarFotosLista(lista) {
  return eliminarFotosPorIds((lista?.items || []).map((item) => item?.fotoLocalId))
}

async function eliminarFotosMesa(item) {
  return eliminarFotosPorIds([item?.fotoLocalId, item?.datosOriginales?.fotoLocalId])
}

async function hidratarProducto(producto) {
  if (!producto?.fotoLocalId) return producto
  const imagenLocal = await hidratarFotoLocal(producto.fotoLocalId)
  return imagenLocal
    ? { ...producto, imagen: imagenLocal }
    : producto
}

async function hidratarProductos(productos = []) {
  const hidratados = []
  for (const producto of productos || []) {
    hidratados.push(await hidratarProducto(producto))
  }
  return hidratados
}

async function hidratarDireccion(direccion) {
  if (!direccion?.fotoLocalId) return direccion
  const imagenLocal = await hidratarFotoLocal(direccion.fotoLocalId)
  return imagenLocal
    ? { ...direccion, foto: imagenLocal }
    : direccion
}

async function hidratarComercio(comercio) {
  const comercioHidratado = comercio?.fotoLocalId
    ? await hidratarDireccion(comercio)
    : comercio

  const direcciones = []
  for (const direccion of comercioHidratado?.direcciones || []) {
    direcciones.push(await hidratarDireccion(direccion))
  }

  return {
    ...comercioHidratado,
    direcciones,
  }
}

async function hidratarComercios(comercios = []) {
  const hidratados = []
  for (const comercio of comercios || []) {
    hidratados.push(await hidratarComercio(comercio))
  }
  return hidratados
}

export default {
  clonar,
  esBase64Imagen,
  esUrlImagen,
  eliminarFotoLocal,
  eliminarFotosProducto,
  eliminarFotosComercio,
  eliminarFotosLista,
  eliminarFotosMesa,
  hidratarFotoLocal,
  hidratarProducto,
  hidratarProductos,
  hidratarDireccion,
  hidratarComercio,
  hidratarComercios,
  protegerProducto,
  protegerProductos,
  protegerComercio,
  protegerComercios,
  protegerLista,
  protegerListas,
  protegerItemsMesa,
  quitarFotosPesadasProductos,
  quitarFotosPesadasComercios,
  quitarFotosPesadasListas,
  quitarFotosPesadasMesa,
}
