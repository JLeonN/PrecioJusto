import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { firestoreDb } from './ClienteFirebase.js'
import servicioFirestoreDisponibilidad from './ServicioFirestoreDisponibilidad.js'
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
const CLAVE_ELIMINACIONES_PENDIENTES = 'eliminaciones_pendientes_firestore'
const CLAVE_LIMPIEZA_ELIMINACIONES_PENDIENTE = 'limpieza_eliminaciones_pendiente_firestore'
const CLAVE_ESTADO_SINCRONIZACION_FIRESTORE = 'estado_sincronizacion_firestore'
const CAMPOS_ELIMINACIONES = ['productos', 'comercios', 'listasJustas']
const VENTANA_DUPLICADO_HISTORIAL_DIAS = 30
const VERSION_RESPALDO_LIGERO = 2
const TIEMPO_MAXIMO_OPERACION_REMOTA_MS = 12000

function obtenerEspacioActualAdaptador() {
  return adaptadorActual?.espacioTrabajo || 'compartido'
}

function construirEspaciosCandidatos(usuarioId, opciones = {}) {
  const espacios = []
  const incluirEspacioCompartido = opciones.incluirEspacioCompartido === true

  const agregar = (valor) => {
    const normalizado = String(valor || '')
      .trim()
      .toLowerCase()

    if (!normalizado || espacios.includes(normalizado)) return
    espacios.push(normalizado)
  }

  agregar(obtenerEspacioActualAdaptador())
  agregar(`uid-${usuarioId}`)
  if (incluirEspacioCompartido) {
    agregar('compartido')
  }

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

async function obtenerDatosLocalesActuales(usuarioId, opciones = {}) {
  const espacioOriginal = obtenerEspacioActualAdaptador()
  const espacios = construirEspaciosCandidatos(usuarioId, opciones)
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
  if (!fecha) return 0
  if (typeof fecha?.toMillis === 'function') return fecha.toMillis()
  if (fecha instanceof Date) return fecha.getTime()
  if (Number.isFinite(Number(fecha?.seconds))) {
    return Number(fecha.seconds) * 1000 + Math.round(Number(fecha.nanoseconds || 0) / 1000000)
  }
  const fechaMs = Date.parse(String(fecha || ''))
  return Number.isFinite(fechaMs) ? fechaMs : 0
}

function obtenerMarcaActualizacion(entidad) {
  return convertirFechaAms(
    entidad?.fechaActualizacion ||
      entidad?.actualizadoEn ||
      entidad?.fechaUltimoUso ||
      entidad?.fechaCreacion,
  )
}

async function ejecutarConTimeout(promesa, tiempoMaximoMs = TIEMPO_MAXIMO_OPERACION_REMOTA_MS, mensaje = 'Tiempo de espera agotado') {
  let timeoutId = null
  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(mensaje)), tiempoMaximoMs)
    })
    return await Promise.race([promesa, timeout])
  } catch (error) {
    servicioFirestoreDisponibilidad.registrarFalloFirestore(error)
    throw error
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function crearErrorFirestorePausado() {
  const error = new Error('Firestore pausado temporalmente. Se mantiene la operación local pendiente.')
  error.code = 'firestore/pausado'
  return error
}

function verificarFirestoreDisponible() {
  if (servicioFirestoreDisponibilidad.estaFirestoreEnPausa()) {
    throw crearErrorFirestorePausado()
  }
}

function crearIdSincronizacion() {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function crearReferenciaEstadoSincronizacion(usuarioId) {
  return doc(firestoreDb, 'users', usuarioId, 'configuracion', 'estadoSincronizacion')
}

async function obtenerEstadoSincronizacionLocal() {
  return adaptadorActual.obtener(CLAVE_ESTADO_SINCRONIZACION_FIRESTORE)
}

async function guardarEstadoSincronizacionLocal(estado) {
  if (!estado?.sincronizacionId) return false
  return adaptadorActual.guardar(CLAVE_ESTADO_SINCRONIZACION_FIRESTORE, {
    ...estado,
    fechaGuardadoLocal: new Date().toISOString(),
  })
}

async function obtenerEstadoSincronizacionRemoto(usuarioId) {
  const uid = String(usuarioId || '').trim()
  if (!uid) return null
  verificarFirestoreDisponible()

  const snapshot = await ejecutarConTimeout(
    getDoc(crearReferenciaEstadoSincronizacion(uid)),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    'Timeout leyendo estado de sincronización remoto',
  )
  return snapshot.exists() ? snapshot.data() : null
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
  const fechaBaseMs = obtenerMarcaActualizacion(productoBase)
  const fechaNuevoMs = obtenerMarcaActualizacion(productoNuevo)
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
  const fechaBaseMs = obtenerMarcaActualizacion(comercioBase)
  const fechaNuevoMs = obtenerMarcaActualizacion(comercioNuevo)
  return fechaNuevoMs >= fechaBaseMs ? { ...comercioBase, ...comercioNuevo } : { ...comercioNuevo, ...comercioBase }
}

async function obtenerDocumentosColeccionUsuario(usuarioId, nombreColeccion) {
  verificarFirestoreDisponible()
  const referenciaColeccion = collection(firestoreDb, 'users', usuarioId, nombreColeccion)
  const snapshot = await ejecutarConTimeout(
    getDocs(referenciaColeccion),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    `Timeout leyendo ${nombreColeccion}`,
  )

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

function fusionarListaExistente(listaBase, listaNueva) {
  const fechaBaseMs = obtenerMarcaActualizacion(listaBase)
  const fechaNuevaMs = obtenerMarcaActualizacion(listaNueva)
  return fechaNuevaMs >= fechaBaseMs ? { ...listaBase, ...listaNueva } : { ...listaNueva, ...listaBase }
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

    mapaListas.set(id, fusionarListaExistente(mapaListas.get(id), listaLocal))
  }

  return Array.from(mapaListas.values())
}

function fusionarSesionEscaneoConRemoto(sesionRemota, sesionLocal) {
  const normalizarSesion = (sesion) => ({
    ...(sesion || {}),
    items: Array.isArray(sesion?.items) ? sesion.items : [],
    fechaActualizacion: sesion?.fechaActualizacion || null,
  })

  const remota = normalizarSesion(sesionRemota)
  const local = normalizarSesion(sesionLocal)
  const fechaRemota = convertirFechaAms(remota.fechaActualizacion || remota.actualizadoEn)
  const fechaLocal = convertirFechaAms(local.fechaActualizacion || local.actualizadoEn)

  if (!sesionRemota && !sesionLocal) {
    return { items: [], fechaActualizacion: new Date().toISOString() }
  }

  // Firestore es fuente de verdad: si empatan timestamps, priorizamos remoto.
  if (fechaLocal > fechaRemota) return local
  return remota
}

function normalizarListaIds(ids = []) {
  return Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  )
}

function normalizarEliminaciones(eliminaciones = {}) {
  return CAMPOS_ELIMINACIONES.reduce((normalizadas, campo) => {
    normalizadas[campo] = normalizarListaIds(eliminaciones?.[campo])
    return normalizadas
  }, {})
}

function fusionarEliminaciones(...origenes) {
  return normalizarEliminaciones(
    origenes.reduce((acumuladas, eliminaciones) => {
      const normalizadas = normalizarEliminaciones(eliminaciones)
      CAMPOS_ELIMINACIONES.forEach((campo) => {
        acumuladas[campo] = [...(acumuladas[campo] || []), ...normalizadas[campo]]
      })
      return acumuladas
    }, {}),
  )
}

function hayEliminaciones(eliminaciones = {}) {
  const normalizadas = normalizarEliminaciones(eliminaciones)
  return CAMPOS_ELIMINACIONES.some((campo) => normalizadas[campo].length > 0)
}

async function obtenerEliminacionesLocales() {
  const datos = await adaptadorActual.obtener(CLAVE_ELIMINACIONES_PENDIENTES)
  return normalizarEliminaciones(datos)
}

async function guardarEliminacionesLocales(eliminaciones) {
  return adaptadorActual.guardar(
    CLAVE_ELIMINACIONES_PENDIENTES,
    normalizarEliminaciones(eliminaciones),
  )
}

async function obtenerLimpiezaEliminacionesPendiente() {
  const datos = await adaptadorActual.obtener(CLAVE_LIMPIEZA_ELIMINACIONES_PENDIENTE)
  return normalizarEliminaciones(datos)
}

async function guardarLimpiezaEliminacionesPendiente(eliminaciones) {
  return adaptadorActual.guardar(
    CLAVE_LIMPIEZA_ELIMINACIONES_PENDIENTE,
    normalizarEliminaciones(eliminaciones),
  )
}

async function registrarLimpiezaEliminacionPendiente(tipo, entidadId) {
  const campo = CAMPOS_ELIMINACIONES.includes(tipo) ? tipo : null
  const id = String(entidadId || '').trim()
  if (!campo || !id) return false

  const pendientes = await obtenerLimpiezaEliminacionesPendiente()
  if (pendientes[campo].includes(id)) return true

  pendientes[campo].push(id)
  return guardarLimpiezaEliminacionesPendiente(pendientes)
}

async function confirmarLimpiezaEliminacionPendiente(tipo, entidadId) {
  const campo = CAMPOS_ELIMINACIONES.includes(tipo) ? tipo : null
  const id = String(entidadId || '').trim()
  if (!campo || !id) return false

  const pendientes = await obtenerLimpiezaEliminacionesPendiente()
  pendientes[campo] = pendientes[campo].filter((idPendiente) => idPendiente !== id)
  return guardarLimpiezaEliminacionesPendiente(pendientes)
}

function crearReferenciaEliminacionesRemotas(usuarioId) {
  return doc(firestoreDb, 'users', usuarioId, 'configuracion', 'eliminaciones')
}

async function obtenerEliminacionesRemotas(usuarioId) {
  const uid = String(usuarioId || '').trim()
  if (!uid) return normalizarEliminaciones()
  verificarFirestoreDisponible()

  const snapshot = await ejecutarConTimeout(
    getDoc(crearReferenciaEliminacionesRemotas(uid)),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    'Timeout leyendo eliminaciones remotas',
  )
  return snapshot.exists() ? normalizarEliminaciones(snapshot.data()) : normalizarEliminaciones()
}

async function guardarEliminacionesRemotas(usuarioId, eliminaciones) {
  const uid = String(usuarioId || '').trim()
  if (!uid) return false
  verificarFirestoreDisponible()

  await ejecutarConTimeout(
    setDoc(
      crearReferenciaEliminacionesRemotas(uid),
      {
        ...normalizarEliminaciones(eliminaciones),
        actualizadoEn: serverTimestamp(),
      },
      { merge: true },
    ),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    'Timeout guardando eliminaciones remotas',
  )
  return true
}

async function sincronizarEliminacionesConFirestore(usuarioId) {
  const eliminacionesLocales = await obtenerEliminacionesLocales()
  const eliminacionesRemotas = await obtenerEliminacionesRemotas(usuarioId)
  const eliminacionesFusionadas = fusionarEliminaciones(eliminacionesLocales, eliminacionesRemotas)

  await guardarEliminacionesLocales(eliminacionesFusionadas)
  if (hayEliminaciones(eliminacionesFusionadas)) {
    await guardarEliminacionesRemotas(usuarioId, eliminacionesFusionadas)
  }

  return eliminacionesFusionadas
}

async function registrarEliminacionLocal(tipo, entidadId) {
  const campo = CAMPOS_ELIMINACIONES.includes(tipo) ? tipo : null
  const id = String(entidadId || '').trim()
  if (!campo || !id) return false

  const eliminaciones = await obtenerEliminacionesLocales()
  if (eliminaciones[campo].includes(id)) return true

  eliminaciones[campo].push(id)
  const guardado = await guardarEliminacionesLocales(eliminaciones)
  if (guardado) {
    await registrarLimpiezaEliminacionPendiente(campo, id)
  }
  return guardado
}

function filtrarEntidadesPorEliminaciones(entidades = [], eliminaciones = {}, tipo) {
  const idsEliminados = new Set(normalizarEliminaciones(eliminaciones)[tipo] || [])
  if (idsEliminados.size === 0) return entidades

  return entidades.filter((entidad) => !idsEliminados.has(String(entidad?.id || '').trim()))
}

async function procesarEliminacionesPendientes(usuarioId, eliminacionesConfirmadas = null) {
  const uid = String(usuarioId || '').trim()
  if (!uid) return

  const eliminacionesActuales = fusionarEliminaciones(
    await obtenerLimpiezaEliminacionesPendiente(),
    eliminacionesConfirmadas || {},
  )
  const eliminacionesFallidas = normalizarEliminaciones()
  const coleccionesPorCampo = {
    productos: 'productos',
    comercios: 'comercios',
    listasJustas: 'listasJustas',
  }

  await Promise.all(
    CAMPOS_ELIMINACIONES.flatMap((campo) =>
      eliminacionesActuales[campo].map(async (entidadId) => {
        try {
          await ejecutarConTimeout(
            deleteDoc(doc(firestoreDb, 'users', uid, coleccionesPorCampo[campo], entidadId)),
            TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
            `Timeout eliminando ${coleccionesPorCampo[campo]}/${entidadId}`,
          )
        } catch (error) {
          eliminacionesFallidas[campo].push(entidadId)
          console.warn(
            `No se pudo limpiar ${coleccionesPorCampo[campo]}/${entidadId} en Firebase:`,
            error,
          )
        }
      }),
    ),
  )

  await guardarLimpiezaEliminacionesPendiente(eliminacionesFallidas)
}

async function obtenerSesionEscaneoRemota(usuarioId) {
  verificarFirestoreDisponible()
  const referenciaSesionEscaneo = doc(
    firestoreDb,
    'users',
    usuarioId,
    'configuracion',
    'sesionEscaneo',
  )
  const snapshot = await ejecutarConTimeout(
    getDoc(referenciaSesionEscaneo),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    'Timeout leyendo sesión de escaneo remota',
  )
  return snapshot.exists() ? snapshot.data() : null
}

async function obtenerPreferenciasRemotas(usuarioId) {
  verificarFirestoreDisponible()
  const referenciaPreferencias = doc(
    firestoreDb,
    'users',
    usuarioId,
    'configuracion',
    'preferencias',
  )
  const snapshot = await ejecutarConTimeout(
    getDoc(referenciaPreferencias),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    'Timeout leyendo preferencias remotas',
  )
  return snapshot.exists() ? snapshot.data() : null
}

function crearErrorGuardadoLocal(clave) {
  return new Error(`No se pudo guardar ${clave} en el almacenamiento local`)
}

async function guardarDatoLocalObligatorio(clave, valor) {
  const guardado = await adaptadorActual.guardar(clave, valor)
  if (!guardado) throw crearErrorGuardadoLocal(clave)
  return true
}

async function restaurarProductosLocales(productosPrevios, clavesGuardadas) {
  const productosPreviosPorClave = new Map(
    productosPrevios.map((registro) => [registro.clave, registro.valor]),
  )

  const clavesNuevas = clavesGuardadas.filter((clave) => !productosPreviosPorClave.has(clave))
  await Promise.all(clavesNuevas.map((clave) => adaptadorActual.eliminar(clave)))

  await Promise.all(
    clavesGuardadas
      .filter((clave) => productosPreviosPorClave.has(clave))
      .map((clave) => adaptadorActual.guardar(clave, productosPreviosPorClave.get(clave))),
  )
}

async function guardarProductosFusionadosEnLocal(productos = []) {
  const productosValidos = productos
    .map((producto) => ({
      ...producto,
      id: String(producto?.id || '').trim(),
    }))
    .filter((producto) => producto.id)
  const productosLocalesPrevios = await adaptadorActual.listarTodo('producto_')
  const clavesGuardadas = []

  try {
    for (const producto of productosValidos) {
      const clave = `producto_${producto.id}`
      await guardarDatoLocalObligatorio(clave, producto)
      clavesGuardadas.push(clave)
    }
  } catch (error) {
    await restaurarProductosLocales(productosLocalesPrevios, clavesGuardadas)
    throw error
  }

  const clavesActuales = new Set(productosValidos.map((producto) => `producto_${producto.id}`))
  await Promise.all(
    productosLocalesPrevios
      .filter((registro) => !clavesActuales.has(registro.clave))
      .map((registro) => adaptadorActual.eliminar(registro.clave)),
  )
}

async function sincronizarDatosFusionadosEnLocal(datosFusionados) {
  await guardarProductosFusionadosEnLocal(datosFusionados.productos || [])
  await guardarDatoLocalObligatorio(CLAVE_COMERCIOS, datosFusionados.comercios || [])
  await guardarDatoLocalObligatorio(CLAVE_LISTA_JUSTA, { listas: datosFusionados.listas || [] })

  if (datosFusionados.preferencias) {
    await guardarDatoLocalObligatorio(CLAVE_PREFERENCIAS, datosFusionados.preferencias)
  }

  if (datosFusionados.sesionEscaneo) {
    await guardarDatoLocalObligatorio(CLAVE_SESION_ESCANEO, datosFusionados.sesionEscaneo)
  }
}

function normalizarIdsCambios(valor) {
  if (valor === true || valor === '*') {
    return { completo: true, ids: new Set() }
  }

  const ids = Array.isArray(valor)
    ? valor
    : Array.isArray(valor?.ids)
      ? valor.ids
      : []

  return {
    completo: false,
    ids: new Set(
      ids
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  }
}

function debeSincronizarEntidad(entidad, cambio) {
  if (cambio.completo) return true
  const id = String(entidad?.id || '').trim()
  return Boolean(id && cambio.ids.has(id))
}

async function sincronizarCambiosLocalesAFirestore(usuarioId, cambios = {}) {
  const uid = String(usuarioId || '').trim()
  if (!uid) return null
  verificarFirestoreDisponible()

  const sincronizarEliminaciones = cambios.eliminaciones === true
  const eliminaciones = sincronizarEliminaciones
    ? await sincronizarEliminacionesConFirestore(uid)
    : await obtenerEliminacionesLocales()

  if (sincronizarEliminaciones) {
    await procesarEliminacionesPendientes(uid, eliminaciones)
  }

  const datosLocales = await obtenerDatosLocalesActuales(uid, {
    incluirEspacioCompartido: false,
  })
  const resumen = crearResumenMigracion(datosLocales)
  const cambiosProductos = normalizarIdsCambios(cambios.productos)
  const cambiosComercios = normalizarIdsCambios(cambios.comercios)
  const cambiosListas = normalizarIdsCambios(cambios.listasJustas)
  const necesitaRemotosProductos = cambiosProductos.completo || cambiosProductos.ids.size > 0
  const necesitaRemotosComercios = cambiosComercios.completo || cambiosComercios.ids.size > 0
  const necesitaRemotosListas = cambiosListas.completo || cambiosListas.ids.size > 0
  const [productosRemotosActuales, comerciosRemotosActuales, listasRemotasActuales] =
    await Promise.all([
      necesitaRemotosProductos ? obtenerDocumentosColeccionUsuario(uid, 'productos') : [],
      necesitaRemotosComercios ? obtenerDocumentosColeccionUsuario(uid, 'comercios') : [],
      necesitaRemotosListas ? obtenerDocumentosColeccionUsuario(uid, 'listasJustas') : [],
    ])
  const mapaProductosRemotos = new Map(
    productosRemotosActuales.map((producto) => [String(producto?.id || '').trim(), producto]),
  )
  const mapaComerciosRemotos = new Map(
    comerciosRemotosActuales.map((comercio) => [String(comercio?.id || '').trim(), comercio]),
  )
  const mapaListasRemotas = new Map(
    listasRemotasActuales.map((lista) => [String(lista?.id || '').trim(), lista]),
  )
  const lote = writeBatch(firestoreDb)
  const sincronizacionId = crearIdSincronizacion()
  const escrituras = {
    productos: 0,
    comercios: 0,
    listasJustas: 0,
    preferencias: 0,
    sesionEscaneo: 0,
    eliminaciones: sincronizarEliminaciones && hayEliminaciones(eliminaciones) ? 1 : 0,
  }

  if (cambios.preferencias && datosLocales.preferencias) {
    lote.set(
      doc(firestoreDb, 'users', uid, 'configuracion', 'preferencias'),
      {
        ...datosLocales.preferencias,
        actualizadoEn: serverTimestamp(),
        origenSincronizacion: 'automatica_parcial',
        espacioTrabajoOrigen: datosLocales.espacioTrabajo || 'desconocido',
      },
      { merge: true },
    )
    escrituras.preferencias = 1
  }

  if (cambios.sesionEscaneo) {
    lote.set(
      doc(firestoreDb, 'users', uid, 'configuracion', 'sesionEscaneo'),
      {
        ...(datosLocales.sesionEscaneo || { items: [] }),
        actualizadoEn: serverTimestamp(),
        origenSincronizacion: 'automatica_parcial',
      },
      { merge: true },
    )
    escrituras.sesionEscaneo = 1
  }

  datosLocales.comercios
    .filter((comercio) => debeSincronizarEntidad(comercio, cambiosComercios))
    .forEach((comercio) => {
      const idComercio = String(comercio.id || '').trim()
      if (!idComercio || idComercio === 'undefined' || idComercio === 'null') return
      const comercioRemoto = mapaComerciosRemotos.get(idComercio)
      const comercioSincronizado = comercioRemoto
        ? fusionarComerciosExistentes(comercioRemoto, comercio)
        : comercio
      lote.set(
        doc(firestoreDb, 'users', uid, 'comercios', idComercio),
        {
          ...comercioSincronizado,
          legacyId: idComercio,
          actualizadoEn: serverTimestamp(),
          origenSincronizacion: 'automatica_parcial',
        },
        { merge: true },
      )
      escrituras.comercios += 1
    })

  datosLocales.productos
    .filter((producto) => debeSincronizarEntidad(producto, cambiosProductos))
    .forEach((producto) => {
      const idProducto = String(producto.id || '').trim()
      if (!idProducto || idProducto === 'undefined' || idProducto === 'null') return
      const productoRemoto = mapaProductosRemotos.get(idProducto)
      const productoSincronizado = productoRemoto
        ? fusionarProductoExistente(productoRemoto, producto)
        : producto
      lote.set(
        doc(firestoreDb, 'users', uid, 'productos', idProducto),
        {
          ...productoSincronizado,
          legacyId: idProducto,
          actualizadoEn: serverTimestamp(),
          origenSincronizacion: 'automatica_parcial',
        },
        { merge: true },
      )
      escrituras.productos += 1
    })

  datosLocales.listas
    .filter((lista) => debeSincronizarEntidad(lista, cambiosListas))
    .forEach((lista) => {
      const idLista = String(lista.id || '').trim()
      if (!idLista || idLista === 'undefined' || idLista === 'null') return
      const listaRemota = mapaListasRemotas.get(idLista)
      const listaSincronizada = listaRemota
        ? fusionarListaExistente(listaRemota, lista)
        : lista
      lote.set(
        doc(firestoreDb, 'users', uid, 'listasJustas', idLista),
        {
          ...listaSincronizada,
          legacyId: idLista,
          actualizadoEn: serverTimestamp(),
          origenSincronizacion: 'automatica_parcial',
        },
        { merge: true },
      )
      escrituras.listasJustas += 1
    })

  const totalEscrituras =
    escrituras.productos +
    escrituras.comercios +
    escrituras.listasJustas +
    escrituras.preferencias +
    escrituras.sesionEscaneo

  if (totalEscrituras > 0) {
    lote.set(
      crearReferenciaEstadoSincronizacion(uid),
      {
        sincronizacionId,
        modo: 'automatica_parcial',
        resumen: {
          productos: escrituras.productos,
          comercios: escrituras.comercios,
          listasJustas: escrituras.listasJustas,
          preferencias: escrituras.preferencias,
          sesionEscaneo: escrituras.sesionEscaneo,
        },
        actualizadoEn: serverTimestamp(),
      },
      { merge: true },
    )

    await ejecutarConTimeout(
      lote.commit(),
      TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
      'Timeout sincronizando cambios parciales',
    )
    await guardarEstadoSincronizacionLocal({
      sincronizacionId,
      modo: 'automatica_parcial',
    })
  }

  return {
    ...resumen,
    modo: 'automatica_parcial',
    escrituras,
    totalEscrituras: totalEscrituras > 0 ? totalEscrituras + 1 : 0,
    sincronizacionId: totalEscrituras > 0 ? sincronizacionId : null,
    fechaSincronizacion: new Date().toISOString(),
  }
}

async function migrarDatosLocalesAFirestore(usuarioId, opciones = {}) {
  verificarFirestoreDisponible()
  const eliminaciones = await sincronizarEliminacionesConFirestore(usuarioId)
  await procesarEliminacionesPendientes(usuarioId, eliminaciones)
  const datosLocales = await obtenerDatosLocalesActuales(usuarioId, {
    incluirEspacioCompartido: opciones.incluirEspacioCompartido === true,
  })
  const [productosRemotos, comerciosRemotos, listasRemotas] = await Promise.all([
    obtenerDocumentosColeccionUsuario(usuarioId, 'productos'),
    obtenerDocumentosColeccionUsuario(usuarioId, 'comercios'),
    obtenerDocumentosColeccionUsuario(usuarioId, 'listasJustas'),
  ])
  const sesionEscaneoRemota = await obtenerSesionEscaneoRemota(usuarioId)

  const productosLocalesFiltrados = filtrarEntidadesPorEliminaciones(
    datosLocales.productos,
    eliminaciones,
    'productos',
  )
  const comerciosLocalesFiltrados = filtrarEntidadesPorEliminaciones(
    datosLocales.comercios,
    eliminaciones,
    'comercios',
  )
  const listasLocalesFiltradas = filtrarEntidadesPorEliminaciones(
    datosLocales.listas,
    eliminaciones,
    'listasJustas',
  )
  const productosRemotosFiltrados = filtrarEntidadesPorEliminaciones(
    productosRemotos,
    eliminaciones,
    'productos',
  )
  const comerciosRemotosFiltrados = filtrarEntidadesPorEliminaciones(
    comerciosRemotos,
    eliminaciones,
    'comercios',
  )
  const listasRemotasFiltradas = filtrarEntidadesPorEliminaciones(
    listasRemotas,
    eliminaciones,
    'listasJustas',
  )
  const datosFusionados = {
    ...datosLocales,
    productos: fusionarProductosConRemoto(productosRemotosFiltrados, productosLocalesFiltrados),
    comercios: fusionarComerciosConRemoto(comerciosRemotosFiltrados, comerciosLocalesFiltrados),
    listas: fusionarListasConRemoto(listasRemotasFiltradas, listasLocalesFiltradas),
    sesionEscaneo: fusionarSesionEscaneoConRemoto(sesionEscaneoRemota, datosLocales.sesionEscaneo),
  }

  const resumen = crearResumenMigracion(datosFusionados)
  const intentoId = `migracion_${Date.now()}`
  const claveRespaldo = `${CLAVE_RESPALDO_MIGRACION}_${usuarioId}`
  const respaldoTemporal = {
    version: VERSION_RESPALDO_LIGERO,
    intentoId,
    usuarioId,
    fechaRespaldo: new Date().toISOString(),
    resumen,
    espacioTrabajoOrigen: datosFusionados.espacioTrabajo || 'desconocido',
    nota: 'Respaldo liviano sin payload completo para reducir I/O local.',
  }

  const respaldoGuardado = await adaptadorActual.guardar(claveRespaldo, respaldoTemporal)
  if (!respaldoGuardado) {
    console.warn('No se pudo crear respaldo temporal local. La migración continuará sin borrar datos locales.')
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

    lote.set(
      crearReferenciaEstadoSincronizacion(usuarioId),
      {
        sincronizacionId: intentoId,
        modo: 'migracion_completa',
        resumen,
        actualizadoEn: serverTimestamp(),
      },
      { merge: true },
    )

    await lote.commit()
    await guardarEstadoSincronizacionLocal({
      sincronizacionId: intentoId,
      modo: 'migracion_completa',
    })

    await setDoc(
      doc(firestoreDb, 'users', usuarioId, 'configuracion', 'estadoMigracion'),
      {
        localStorageMigrado: true,
        intentoId,
        claveRespaldoTemporal: respaldoGuardado ? claveRespaldo : null,
        fechaUltimaMigracion: serverTimestamp(),
      },
      { merge: true },
    )

    await sincronizarDatosFusionadosEnLocal(datosFusionados)

    return {
      ...resumen,
      intentoId,
      claveRespaldo: respaldoGuardado ? claveRespaldo : null,
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

async function sincronizarDesdeFirestoreALocal(usuarioId) {
  verificarFirestoreDisponible()
  const eliminaciones = await sincronizarEliminacionesConFirestore(usuarioId)
  await procesarEliminacionesPendientes(usuarioId, eliminaciones)
  const datosLocales = await obtenerDatosLocalesActuales(usuarioId, {
    incluirEspacioCompartido: false,
  })
  const [productosRemotos, comerciosRemotos, listasRemotas, preferenciasRemotas, sesionEscaneoRemota] = await Promise.all([
    obtenerDocumentosColeccionUsuario(usuarioId, 'productos'),
    obtenerDocumentosColeccionUsuario(usuarioId, 'comercios'),
    obtenerDocumentosColeccionUsuario(usuarioId, 'listasJustas'),
    obtenerPreferenciasRemotas(usuarioId),
    obtenerSesionEscaneoRemota(usuarioId),
  ])

  const fechaPreferenciasLocales = convertirFechaAms(datosLocales.preferencias?.fechaActualizacion)
  const fechaPreferenciasRemotas = convertirFechaAms(preferenciasRemotas?.fechaActualizacion)
  const preferenciasFusionadas = fechaPreferenciasRemotas >= fechaPreferenciasLocales
    ? (preferenciasRemotas || datosLocales.preferencias || null)
    : (datosLocales.preferencias || preferenciasRemotas || null)

  const productosLocalesFiltrados = filtrarEntidadesPorEliminaciones(
    datosLocales.productos,
    eliminaciones,
    'productos',
  )
  const comerciosLocalesFiltrados = filtrarEntidadesPorEliminaciones(
    datosLocales.comercios,
    eliminaciones,
    'comercios',
  )
  const listasLocalesFiltradas = filtrarEntidadesPorEliminaciones(
    datosLocales.listas,
    eliminaciones,
    'listasJustas',
  )
  const productosRemotosFiltrados = filtrarEntidadesPorEliminaciones(
    productosRemotos,
    eliminaciones,
    'productos',
  )
  const comerciosRemotosFiltrados = filtrarEntidadesPorEliminaciones(
    comerciosRemotos,
    eliminaciones,
    'comercios',
  )
  const listasRemotasFiltradas = filtrarEntidadesPorEliminaciones(
    listasRemotas,
    eliminaciones,
    'listasJustas',
  )
  const datosFusionados = {
    ...datosLocales,
    productos: fusionarProductosConRemoto(productosRemotosFiltrados, productosLocalesFiltrados),
    comercios: fusionarComerciosConRemoto(comerciosRemotosFiltrados, comerciosLocalesFiltrados),
    listas: fusionarListasConRemoto(listasRemotasFiltradas, listasLocalesFiltradas),
    preferencias: preferenciasFusionadas,
    sesionEscaneo: fusionarSesionEscaneoConRemoto(sesionEscaneoRemota, datosLocales.sesionEscaneo),
  }

  await sincronizarDatosFusionadosEnLocal(datosFusionados)

  return {
    ...crearResumenMigracion(datosFusionados),
    fuente: 'firestore',
    fechaSincronizacion: new Date().toISOString(),
  }
}

async function sincronizarDesdeFirestoreALocalSiCambio(usuarioId, opciones = {}) {
  const uid = String(usuarioId || '').trim()
  if (!uid) return null
  verificarFirestoreDisponible()

  const estadoRemoto = await obtenerEstadoSincronizacionRemoto(uid)
  const estadoLocal = await obtenerEstadoSincronizacionLocal()
  const sincronizacionRemotaId = String(estadoRemoto?.sincronizacionId || '').trim()
  const sincronizacionLocalId = String(estadoLocal?.sincronizacionId || '').trim()

  if (
    opciones.forzar !== true &&
    sincronizacionRemotaId &&
    sincronizacionLocalId &&
    sincronizacionRemotaId === sincronizacionLocalId
  ) {
    return {
      sinCambios: true,
      fuente: 'estadoSincronizacion',
      sincronizacionId: sincronizacionRemotaId,
      fechaSincronizacion: new Date().toISOString(),
    }
  }

  const resumen = await sincronizarDesdeFirestoreALocal(uid)
  let sincronizacionAplicadaId = sincronizacionRemotaId || null

  if (sincronizacionRemotaId) {
    await guardarEstadoSincronizacionLocal({
      sincronizacionId: sincronizacionRemotaId,
      modo: estadoRemoto?.modo || 'remoto',
    })
  } else {
    const sincronizacionIdBase = crearIdSincronizacion()
    sincronizacionAplicadaId = sincronizacionIdBase
    await ejecutarConTimeout(
      setDoc(
        crearReferenciaEstadoSincronizacion(uid),
        {
          sincronizacionId: sincronizacionIdBase,
          modo: 'baseline_remoto',
          resumen,
          actualizadoEn: serverTimestamp(),
        },
        { merge: true },
      ),
      TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
      'Timeout guardando estado base de sincronización',
    )
    await guardarEstadoSincronizacionLocal({
      sincronizacionId: sincronizacionIdBase,
      modo: 'baseline_remoto',
    })
  }

  return {
    ...resumen,
    sinCambios: false,
    sincronizacionId: sincronizacionAplicadaId,
  }
}


async function eliminarListaRemota(usuarioId, listaId) {
  const uid = String(usuarioId || '').trim()
  const id = String(listaId || '').trim()
  if (!uid || !id) return false
  verificarFirestoreDisponible()

  await registrarEliminacionListaLocal(id)
  await guardarEliminacionesRemotas(uid, await obtenerEliminacionesLocales())
  await ejecutarConTimeout(
    deleteDoc(doc(firestoreDb, 'users', uid, 'listasJustas', id)),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    `Timeout eliminando lista remota: ${id}`,
  )
  await confirmarLimpiezaEliminacionPendiente('listasJustas', id)
  return true
}

async function eliminarComercioRemoto(usuarioId, comercioId) {
  const uid = String(usuarioId || '').trim()
  const id = String(comercioId || '').trim()
  if (!uid || !id) return false
  verificarFirestoreDisponible()

  await registrarEliminacionComercioLocal(id)
  await guardarEliminacionesRemotas(uid, await obtenerEliminacionesLocales())
  await ejecutarConTimeout(
    deleteDoc(doc(firestoreDb, 'users', uid, 'comercios', id)),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    `Timeout eliminando comercio remoto: ${id}`,
  )
  await confirmarLimpiezaEliminacionPendiente('comercios', id)
  return true
}

async function eliminarProductoRemoto(usuarioId, productoId) {
  const uid = String(usuarioId || '').trim()
  const id = String(productoId || '').trim()
  if (!uid || !id) return false
  verificarFirestoreDisponible()

  await registrarEliminacionProductoLocal(id)
  await guardarEliminacionesRemotas(uid, await obtenerEliminacionesLocales())
  await ejecutarConTimeout(
    deleteDoc(doc(firestoreDb, 'users', uid, 'productos', id)),
    TIEMPO_MAXIMO_OPERACION_REMOTA_MS,
    `Timeout eliminando producto remoto: ${id}`,
  )
  await confirmarLimpiezaEliminacionPendiente('productos', id)
  return true
}

async function registrarEliminacionListaLocal(listaId) {
  return registrarEliminacionLocal('listasJustas', listaId)
}

async function registrarEliminacionComercioLocal(comercioId) {
  return registrarEliminacionLocal('comercios', comercioId)
}

async function registrarEliminacionProductoLocal(productoId) {
  return registrarEliminacionLocal('productos', productoId)
}

export default {
  obtenerDatosLocalesActuales,
  crearResumenMigracion,
  migrarDatosLocalesAFirestore,
  sincronizarCambiosLocalesAFirestore,
  sincronizarDesdeFirestoreALocal,
  sincronizarDesdeFirestoreALocalSiCambio,
  registrarEliminacionListaLocal,
  registrarEliminacionComercioLocal,
  registrarEliminacionProductoLocal,
  eliminarListaRemota,
  eliminarComercioRemoto,
  eliminarProductoRemoto,
}
