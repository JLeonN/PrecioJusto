import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { firestoreDb } from './ClienteFirebase.js'
import {
  adaptadorActual,
  configurarEspacioTrabajoAlmacenamiento,
} from '../almacenamiento/servicios/AlmacenamientoService.js'
import productosService from '../almacenamiento/servicios/ProductosService.js'
import comerciosService from '../almacenamiento/servicios/ComerciosService.js'
import listaJustaService from '../almacenamiento/servicios/ListaJustaService.js'
import preferenciasService from '../almacenamiento/servicios/PreferenciasService.js'

const CLAVE_LISTA_JUSTA = 'lista_justa'
const CLAVE_COMERCIOS = 'comercios'
const CLAVE_PREFERENCIAS = 'preferencias_usuario'
const CLAVE_SESION_ESCANEO = 'sesion_escaneo'
const CLAVE_RESPALDO_MIGRACION = 'respaldo_migracion_firestore'
const VENTANA_DUPLICADO_HISTORIAL_DIAS = 30

function obtenerEspacioActualAdaptador() {
  return adaptadorActual?.espacioTrabajo || 'compartido'
}

function construirEspaciosCandidatos(usuarioId) {
  const espacios = []

  const agregar = (valor) => {
    const normalizado = String(valor || '')
      .trim()
      .toLowerCase()

    if (!normalizado || espacios.includes(normalizado)) return
    espacios.push(normalizado)
  }

  agregar(obtenerEspacioActualAdaptador())
  agregar(`uid-${usuarioId}`)
  agregar('compartido')

  return espacios
}

async function obtenerDatosLocalesEspacio(espacioTrabajo) {
  configurarEspacioTrabajoAlmacenamiento(espacioTrabajo)

  const [productos, comercios, listas, preferencias, sesionEscaneo] = await Promise.all([
    productosService.obtenerTodos(),
    comerciosService.obtenerTodos(),
    listaJustaService.obtenerListas(),
    preferenciasService.obtenerPreferencias(),
    adaptadorActual.obtener(CLAVE_SESION_ESCANEO),
  ])

  return {
    productos,
    comercios,
    listas,
    preferencias,
    sesionEscaneo: sesionEscaneo || null,
    espacioTrabajo,
  }
}

async function obtenerDatosLocalesActuales(usuarioId) {
  const espacioOriginal = obtenerEspacioActualAdaptador()
  const espacios = construirEspaciosCandidatos(usuarioId)
  const datosAcumulados = {
    productos: [],
    comercios: [],
    listas: [],
    preferencias: null,
    sesionEscaneo: null,
    espacioTrabajo: espacioOriginal,
    espaciosDetectados: [],
  }
  let mejorMarcaTiempoPreferencias = 0

  try {
    for (const espacio of espacios) {
      const datos = await obtenerDatosLocalesEspacio(espacio)
      const marcaTiempoPreferencias = convertirFechaAms(datos?.preferencias?.fechaActualizacion)

      datosAcumulados.productos = fusionarProductosConRemoto(
        datosAcumulados.productos,
        datos.productos,
      )
      datosAcumulados.comercios = fusionarComerciosConRemoto(
        datosAcumulados.comercios,
        datos.comercios,
      )
      datosAcumulados.listas = fusionarListasConRemoto(datosAcumulados.listas, datos.listas)
      datosAcumulados.espaciosDetectados.push(espacio)

      if (
        datos.preferencias &&
        (!datosAcumulados.preferencias || marcaTiempoPreferencias >= mejorMarcaTiempoPreferencias)
      ) {
        datosAcumulados.preferencias = datos.preferencias
        mejorMarcaTiempoPreferencias = marcaTiempoPreferencias
      }

      if (datos.sesionEscaneo?.items?.length && !datosAcumulados.sesionEscaneo?.items?.length) {
        datosAcumulados.sesionEscaneo = datos.sesionEscaneo
      }
    }
  } finally {
    configurarEspacioTrabajoAlmacenamiento(espacioOriginal)
  }

  datosAcumulados.espacioTrabajo = datosAcumulados.espaciosDetectados.join(',') || espacioOriginal

  return datosAcumulados
}

function crearResumenMigracion(datosLocales) {
  return {
    totalProductos: datosLocales.productos.length,
    totalComercios: datosLocales.comercios.length,
    totalListas: datosLocales.listas.length,
    tienePreferencias: Boolean(datosLocales.preferencias),
    tieneSesionEscaneo: Boolean(datosLocales.sesionEscaneo?.items?.length),
    espacioTrabajoOrigen: datosLocales.espacioTrabajo || 'desconocido',
  }
}

function normalizarCodigoBarras(codigoBarras) {
  return String(codigoBarras || '').trim()
}

function convertirFechaAms(fecha) {
  const fechaMs = Date.parse(String(fecha || ''))
  return Number.isFinite(fechaMs) ? fechaMs : 0
}

function obtenerClavePrecio(precio) {
  const comercioId = String(precio?.comercioId || '').trim().toLowerCase()
  const direccionId = String(precio?.direccionId || '').trim().toLowerCase()
  const comercio = String(precio?.comercio || '').trim().toLowerCase()
  const direccion = String(precio?.direccion || '').trim().toLowerCase()
  const valor = Number(precio?.valor || 0)
  const moneda = String(precio?.moneda || 'UYU').trim().toUpperCase()
  const bloqueComercio = comercioId && direccionId ? `${comercioId}|${direccionId}` : `${comercio}|${direccion}`

  return `${bloqueComercio}|${valor}|${moneda}`
}

function fusionarHistorialPrecios(preciosBase = [], preciosNuevos = []) {
  const todos = [...preciosBase, ...preciosNuevos]
    .filter((precio) => Number.isFinite(Number(precio?.valor)))
    .map((precio) => ({ ...precio }))
    .sort((a, b) => convertirFechaAms(a?.fecha) - convertirFechaAms(b?.fecha))

  const ventanaMs = VENTANA_DUPLICADO_HISTORIAL_DIAS * 24 * 60 * 60 * 1000
  const mapaUltimoIndicePorClave = new Map()
  const preciosFusionados = []

  for (const precio of todos) {
    const clave = obtenerClavePrecio(precio)
    const indiceAnterior = mapaUltimoIndicePorClave.get(clave)

    if (indiceAnterior === undefined) {
      preciosFusionados.push(precio)
      mapaUltimoIndicePorClave.set(clave, preciosFusionados.length - 1)
      continue
    }

    const precioAnterior = preciosFusionados[indiceAnterior]
    const fechaAnteriorMs = convertirFechaAms(precioAnterior?.fecha)
    const fechaActualMs = convertirFechaAms(precio?.fecha)
    const diferenciaMs = Math.abs(fechaActualMs - fechaAnteriorMs)

    if (diferenciaMs <= ventanaMs) {
      if (fechaActualMs >= fechaAnteriorMs) {
        preciosFusionados[indiceAnterior] = {
          ...precioAnterior,
          ...precio,
          fecha: precio?.fecha || precioAnterior?.fecha,
        }
      }

      continue
    }

    preciosFusionados.push(precio)
    mapaUltimoIndicePorClave.set(clave, preciosFusionados.length - 1)
  }

  return preciosFusionados.sort((a, b) => convertirFechaAms(b?.fecha) - convertirFechaAms(a?.fecha))
}

function fusionarProductoExistente(productoBase, productoNuevo) {
  const fechaBaseMs = convertirFechaAms(productoBase?.fechaActualizacion)
  const fechaNuevoMs = convertirFechaAms(productoNuevo?.fechaActualizacion)
  const masReciente = fechaNuevoMs >= fechaBaseMs ? productoNuevo : productoBase
  const menosReciente = masReciente === productoNuevo ? productoBase : productoNuevo
  const preciosFusionados = fusionarHistorialPrecios(productoBase?.precios || [], productoNuevo?.precios || [])

  return {
    ...menosReciente,
    ...masReciente,
    precios: preciosFusionados,
    codigoBarras: masReciente?.codigoBarras || menosReciente?.codigoBarras || null,
    fechaActualizacion: masReciente?.fechaActualizacion || menosReciente?.fechaActualizacion || null,
  }
}

function construirClaveComercio(comercio) {
  const id = String(comercio?.id || '').trim().toLowerCase()
  if (id) return `id:${id}`

  const nombre = String(comercio?.nombre || '').trim().toLowerCase()
  const direccion = String(comercio?.direccion || '').trim().toLowerCase()
  return `nombre:${nombre}|direccion:${direccion}`
}

function fusionarComerciosExistentes(comercioBase, comercioNuevo) {
  const fechaBaseMs = convertirFechaAms(comercioBase?.fechaActualizacion)
  const fechaNuevoMs = convertirFechaAms(comercioNuevo?.fechaActualizacion)
  return fechaNuevoMs >= fechaBaseMs ? { ...comercioBase, ...comercioNuevo } : { ...comercioNuevo, ...comercioBase }
}

async function obtenerDocumentosColeccionUsuario(usuarioId, nombreColeccion) {
  const referenciaColeccion = collection(firestoreDb, 'users', usuarioId, nombreColeccion)
  const snapshot = await getDocs(referenciaColeccion)

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }))
}

function fusionarProductosConRemoto(productosRemotos = [], productosLocales = []) {
  const mapaPorId = new Map()
  const mapaCodigo = new Map()

  for (const productoRemoto of productosRemotos) {
    const idProducto = String(productoRemoto?.id || '').trim()
    const codigo = normalizarCodigoBarras(productoRemoto?.codigoBarras)

    if (idProducto) mapaPorId.set(idProducto, { ...productoRemoto, id: idProducto })
    if (codigo) mapaCodigo.set(codigo, idProducto || productoRemoto?.id || '')
  }

  for (const productoLocal of productosLocales) {
    const idLocal = String(productoLocal?.id || '').trim()
    const codigoLocal = normalizarCodigoBarras(productoLocal?.codigoBarras)

    let idObjetivo = idLocal

    if (idLocal && mapaPorId.has(idLocal)) {
      idObjetivo = idLocal
    } else if (codigoLocal && mapaCodigo.has(codigoLocal)) {
      idObjetivo = mapaCodigo.get(codigoLocal)
    }

    if (!idObjetivo || !mapaPorId.has(idObjetivo)) {
      const idNuevo = idLocal || `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
      const productoNuevo = { ...productoLocal, id: idNuevo }
      mapaPorId.set(idNuevo, productoNuevo)
      if (codigoLocal) mapaCodigo.set(codigoLocal, idNuevo)
      continue
    }

    const productoExistente = mapaPorId.get(idObjetivo)
    const productoFusionado = fusionarProductoExistente(productoExistente, {
      ...productoLocal,
      id: idObjetivo,
    })
    mapaPorId.set(idObjetivo, productoFusionado)

    if (codigoLocal) mapaCodigo.set(codigoLocal, idObjetivo)
  }

  return Array.from(mapaPorId.values())
}

function fusionarComerciosConRemoto(comerciosRemotos = [], comerciosLocales = []) {
  const mapaComercios = new Map()

  for (const comercio of comerciosRemotos) {
    mapaComercios.set(construirClaveComercio(comercio), comercio)
  }

  for (const comercio of comerciosLocales) {
    const clave = construirClaveComercio(comercio)

    if (!mapaComercios.has(clave)) {
      mapaComercios.set(clave, comercio)
      continue
    }

    const fusionado = fusionarComerciosExistentes(mapaComercios.get(clave), comercio)
    mapaComercios.set(clave, fusionado)
  }

  return Array.from(mapaComercios.values())
}

function fusionarListasConRemoto(listasRemotas = [], listasLocales = []) {
  const mapaListas = new Map()

  for (const lista of listasRemotas) {
    const id = String(lista?.id || '').trim()
    if (!id) continue
    mapaListas.set(id, lista)
  }

  for (const listaLocal of listasLocales) {
    const id = String(listaLocal?.id || '').trim()
    if (!id) continue

    if (!mapaListas.has(id)) {
      mapaListas.set(id, listaLocal)
      continue
    }

    const existente = mapaListas.get(id)
    const fechaExistente = convertirFechaAms(existente?.fechaActualizacion)
    const fechaLocal = convertirFechaAms(listaLocal?.fechaActualizacion)
    mapaListas.set(id, fechaLocal >= fechaExistente ? { ...existente, ...listaLocal } : { ...listaLocal, ...existente })
  }

  return Array.from(mapaListas.values())
}

function fusionarSesionEscaneoConRemoto(sesionRemota, sesionLocal) {
  const itemsRemotos = Array.isArray(sesionRemota?.items) ? sesionRemota.items : []
  const itemsLocales = Array.isArray(sesionLocal?.items) ? sesionLocal.items : []
  const mapaItems = new Map()

  const obtenerClaveItem = (item) => {
    const id = String(item?.id || '').trim()
    if (id) return `id:${id}`

    const codigo = String(item?.codigoBarras || '').trim()
    const nombre = String(item?.nombre || '').trim().toLowerCase()
    const precio = Number(item?.precio || 0)
    return `alt:${codigo}|${nombre}|${precio}`
  }

  const insertarItems = (items) => {
    for (const item of items) {
      const clave = obtenerClaveItem(item)
      if (!mapaItems.has(clave)) {
        mapaItems.set(clave, { ...item })
        continue
      }

      const existente = mapaItems.get(clave)
      const fechaExistente = convertirFechaAms(existente?.actualizadoEn || existente?.creadoEn)
      const fechaActual = convertirFechaAms(item?.actualizadoEn || item?.creadoEn)
      mapaItems.set(
        clave,
        fechaActual >= fechaExistente ? { ...existente, ...item } : { ...item, ...existente },
      )
    }
  }

  insertarItems(itemsRemotos)
  insertarItems(itemsLocales)

  return {
    items: Array.from(mapaItems.values()),
  }
}

async function obtenerSesionEscaneoRemota(usuarioId) {
  const referenciaSesionEscaneo = doc(
    firestoreDb,
    'users',
    usuarioId,
    'configuracion',
    'sesionEscaneo',
  )
  const snapshot = await getDoc(referenciaSesionEscaneo)
  return snapshot.exists() ? snapshot.data() : null
}

async function sincronizarDatosFusionadosEnLocal(datosFusionados) {
  const productosLocales = await adaptadorActual.listarTodo('producto_')
  await Promise.all(productosLocales.map((registro) => adaptadorActual.eliminar(registro.clave)))

  await Promise.all(
    (datosFusionados.productos || []).map((producto) =>
      adaptadorActual.guardar(`producto_${producto.id}`, producto),
    ),
  )

  await adaptadorActual.guardar(CLAVE_COMERCIOS, datosFusionados.comercios || [])
  await adaptadorActual.guardar(CLAVE_LISTA_JUSTA, { listas: datosFusionados.listas || [] })

  if (datosFusionados.preferencias) {
    await adaptadorActual.guardar(CLAVE_PREFERENCIAS, datosFusionados.preferencias)
  }

  if (datosFusionados.sesionEscaneo) {
    await adaptadorActual.guardar(CLAVE_SESION_ESCANEO, datosFusionados.sesionEscaneo)
  }
}

async function migrarDatosLocalesAFirestore(usuarioId, opciones = {}) {
  const datosLocales = await obtenerDatosLocalesActuales(usuarioId)
  const [productosRemotos, comerciosRemotos, listasRemotas] = await Promise.all([
    obtenerDocumentosColeccionUsuario(usuarioId, 'productos'),
    obtenerDocumentosColeccionUsuario(usuarioId, 'comercios'),
    obtenerDocumentosColeccionUsuario(usuarioId, 'listasJustas'),
  ])
  const sesionEscaneoRemota = await obtenerSesionEscaneoRemota(usuarioId)

  const datosFusionados = {
    ...datosLocales,
    productos: fusionarProductosConRemoto(productosRemotos, datosLocales.productos),
    comercios: fusionarComerciosConRemoto(comerciosRemotos, datosLocales.comercios),
    listas: fusionarListasConRemoto(listasRemotas, datosLocales.listas),
    sesionEscaneo: fusionarSesionEscaneoConRemoto(sesionEscaneoRemota, datosLocales.sesionEscaneo),
  }

  const resumen = crearResumenMigracion(datosFusionados)
  const intentoId = `migracion_${Date.now()}`
  const claveRespaldo = `${CLAVE_RESPALDO_MIGRACION}_${usuarioId}`
  const respaldoTemporal = {
    version: 1,
    intentoId,
    usuarioId,
    fechaRespaldo: new Date().toISOString(),
    resumen,
    datosLocales: datosFusionados,
  }

  const respaldoGuardado = await adaptadorActual.guardar(claveRespaldo, respaldoTemporal)
  if (!respaldoGuardado) {
    throw new Error('No se pudo crear respaldo temporal antes de migrar')
  }

  if (opciones.forzarErrorControlado === true) {
    throw new Error('Error controlado de migración (prueba)')
  }

  try {
    const lote = writeBatch(firestoreDb)

    const referenciaPreferencias = doc(
      firestoreDb,
      'users',
      usuarioId,
      'configuracion',
      'preferencias',
    )

    lote.set(
      referenciaPreferencias,
      {
        ...datosFusionados.preferencias,
        actualizadoEn: serverTimestamp(),
        migradoDesdeLocal: true,
        origenMigracion: 'localStorageAdapter',
        espacioTrabajoOrigen: datosFusionados.espacioTrabajo || 'desconocido',
      },
      { merge: true },
    )

    const referenciaSesionEscaneo = doc(
      firestoreDb,
      'users',
      usuarioId,
      'configuracion',
      'sesionEscaneo',
    )

    lote.set(
      referenciaSesionEscaneo,
      {
        ...(datosFusionados.sesionEscaneo || { items: [] }),
        actualizadoEn: serverTimestamp(),
        migradoDesdeLocal: true,
      },
      { merge: true },
    )

    datosFusionados.comercios.forEach((comercio) => {
      const idComercio = String(comercio.id)
      if (!idComercio || idComercio === 'undefined' || idComercio === 'null') return
      const referenciaComercio = doc(firestoreDb, 'users', usuarioId, 'comercios', idComercio)

      lote.set(
        referenciaComercio,
        {
          ...comercio,
          legacyId: idComercio,
          actualizadoEn: serverTimestamp(),
          migradoDesdeLocal: true,
        },
        { merge: true },
      )
    })

    datosFusionados.productos.forEach((producto) => {
      const idProducto = String(producto.id)
      if (!idProducto || idProducto === 'undefined' || idProducto === 'null') return
      const referenciaProducto = doc(firestoreDb, 'users', usuarioId, 'productos', idProducto)

      lote.set(
        referenciaProducto,
        {
          ...producto,
          legacyId: idProducto,
          actualizadoEn: serverTimestamp(),
          migradoDesdeLocal: true,
        },
        { merge: true },
      )
    })

    datosFusionados.listas.forEach((lista) => {
      const idLista = String(lista.id)
      if (!idLista || idLista === 'undefined' || idLista === 'null') return
      const referenciaLista = doc(firestoreDb, 'users', usuarioId, 'listasJustas', idLista)

      lote.set(
        referenciaLista,
        {
          ...lista,
          legacyId: idLista,
          actualizadoEn: serverTimestamp(),
          migradoDesdeLocal: true,
        },
        { merge: true },
      )
    })

    const referenciaEstadoMigracion = doc(
      firestoreDb,
      'users',
      usuarioId,
      'migraciones',
      'localStorage',
    )

    lote.set(
      referenciaEstadoMigracion,
      {
        resumen,
        clavesLocalesDetectadas: [
          CLAVE_PREFERENCIAS,
          CLAVE_LISTA_JUSTA,
          CLAVE_COMERCIOS,
          CLAVE_SESION_ESCANEO,
          'producto_*',
        ],
        estado: 'completada',
        intentoId,
        fechaMigracion: serverTimestamp(),
        nota: 'Migracion idempotente con merge. No elimina datos locales.',
        espacioTrabajoOrigen: datosFusionados.espacioTrabajo || 'desconocido',
      },
      { merge: true },
    )

    await lote.commit()

    await setDoc(
      doc(firestoreDb, 'users', usuarioId, 'configuracion', 'estadoMigracion'),
      {
        localStorageMigrado: true,
        intentoId,
        claveRespaldoTemporal: claveRespaldo,
        fechaUltimaMigracion: serverTimestamp(),
      },
      { merge: true },
    )

    await sincronizarDatosFusionadosEnLocal(datosFusionados)

    return {
      ...resumen,
      intentoId,
      claveRespaldo,
    }
  } catch (error) {
    await setDoc(
      doc(firestoreDb, 'users', usuarioId, 'migraciones', 'localStorage'),
      {
        estado: 'error',
        intentoId,
        fechaError: serverTimestamp(),
        mensajeError: error?.message || 'Error desconocido durante migración',
      },
      { merge: true },
    )

    await setDoc(
      doc(firestoreDb, 'users', usuarioId, 'configuracion', 'estadoMigracion'),
      {
        localStorageMigrado: false,
        intentoId,
        fechaUltimoErrorMigracion: serverTimestamp(),
      },
      { merge: true },
    )

    throw error
  }
}

export default {
  obtenerDatosLocalesActuales,
  crearResumenMigracion,
  migrarDatosLocalesAFirestore,
}

