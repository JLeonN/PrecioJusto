import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { firestoreDb } from './ClienteFirebase.js'
import { adaptadorActual } from '../almacenamiento/servicios/AlmacenamientoService.js'
import productosService from '../almacenamiento/servicios/ProductosService.js'
import comerciosService from '../almacenamiento/servicios/ComerciosService.js'
import listaJustaService from '../almacenamiento/servicios/ListaJustaService.js'
import preferenciasService from '../almacenamiento/servicios/PreferenciasService.js'

const CLAVE_LISTA_JUSTA = 'lista_justa'
const CLAVE_COMERCIOS = 'comercios'
const CLAVE_PREFERENCIAS = 'preferencias_usuario'
const CLAVE_SESION_ESCANEO = 'sesion_escaneo'
const CLAVE_RESPALDO_MIGRACION = 'respaldo_migracion_firestore'

async function obtenerDatosLocalesActuales() {
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
  }
}

function crearResumenMigracion(datosLocales) {
  return {
    totalProductos: datosLocales.productos.length,
    totalComercios: datosLocales.comercios.length,
    totalListas: datosLocales.listas.length,
    tienePreferencias: Boolean(datosLocales.preferencias),
    tieneSesionEscaneo: Boolean(datosLocales.sesionEscaneo?.items?.length),
  }
}

async function migrarDatosLocalesAFirestore(usuarioId, opciones = {}) {
  const datosLocales = await obtenerDatosLocalesActuales()
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
