import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
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
  let datosSeleccionados = null

  try {
    for (const espacio of espacios) {
      const datos = await obtenerDatosLocalesEspacio(espacio)
      const tieneContenido =
        datos.productos.length > 0 || datos.comercios.length > 0 || datos.listas.length > 0

      if (tieneContenido) {
        datosSeleccionados = datos
        break
      }

      if (!datosSeleccionados) {
        datosSeleccionados = datos
      }
    }
  } finally {
    configurarEspacioTrabajoAlmacenamiento(espacioOriginal)
  }

  return (
    datosSeleccionados || {
      productos: [],
      comercios: [],
      listas: [],
      preferencias: null,
      sesionEscaneo: null,
      espacioTrabajo: espacioOriginal,
    }
  )
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

async function migrarDatosLocalesAFirestore(usuarioId, opciones = {}) {
  const datosLocales = await obtenerDatosLocalesActuales(usuarioId)
  const resumen = crearResumenMigracion(datosLocales)
  const intentoId = `migracion_${Date.now()}`
  const claveRespaldo = `${CLAVE_RESPALDO_MIGRACION}_${usuarioId}`
  const respaldoTemporal = {
    version: 1,
    intentoId,
    usuarioId,
    fechaRespaldo: new Date().toISOString(),
    resumen,
    datosLocales,
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
        ...datosLocales.preferencias,
        actualizadoEn: serverTimestamp(),
        migradoDesdeLocal: true,
        origenMigracion: 'localStorageAdapter',
        espacioTrabajoOrigen: datosLocales.espacioTrabajo || 'desconocido',
      },
      { merge: true },
    )

    datosLocales.comercios.forEach((comercio) => {
      const idComercio = String(comercio.id)
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

    datosLocales.productos.forEach((producto) => {
      const idProducto = String(producto.id)
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

    datosLocales.listas.forEach((lista) => {
      const idLista = String(lista.id)
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
        espacioTrabajoOrigen: datosLocales.espacioTrabajo || 'desconocido',
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
