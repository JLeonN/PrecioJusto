import { doc, getDoc, setDoc } from 'firebase/firestore'
import { adaptadorActual, infoAdaptador } from './AlmacenamientoService.js'
import conexionService from './ConexionService.js'
import firebaseBaseService from './FirebaseBaseService.js'
import firestoreComerciosService from './FirestoreComerciosService.js'
import firestoreConfirmacionesService from './FirestoreConfirmacionesService.js'
import firestoreListasJustasService from './FirestoreListasJustasService.js'
import firestoreMesaTrabajoService from './FirestoreMesaTrabajoService.js'
import firestorePreferenciasService from './FirestorePreferenciasService.js'
import firestoreProductosService from './FirestoreProductosService.js'
import inventarioMigracionFirebaseService from './InventarioMigracionFirebaseService.js'
import usuarioActualService from './UsuarioActualService.js'
import { PREFIJO_COLA_SINCRONIZACION } from '../constantes/ClavesAlmacenamiento.js'
import {
  ACCIONES_SINCRONIZABLES,
  ESTADOS_MIGRACION_FIREBASE,
  ESTADOS_SINCRONIZACION,
  LIMITES_MODELO_FIRESTORE,
  TIPOS_DATO_USUARIO,
  TIPOS_USUARIO,
  VERSION_MIGRACION_LOCAL_FIREBASE,
} from '../constantes/PreparacionFirebase.js'

const CLAVE_COLA_MIGRACION_FIREBASE = `${PREFIJO_COLA_SINCRONIZACION}migracionFirebase`
const TIEMPO_MAXIMO_OPERACION_FIRESTORE_MS = 7000
const TAMANO_TANDA_MIGRACION = 20

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()

  if (!usuario.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) {
    throw new Error('Necesitás iniciar sesión con Firebase antes de migrar datos locales.')
  }

  return usuario.id
}

function obtenerReferenciaEstadoMigracion(usuarioId) {
  return doc(
    firebaseBaseService.obtenerFirestoreDb(),
    'usuarios',
    usuarioId,
    'configuracion',
    'migracionLocal',
  )
}

function clonarDato(dato) {
  return JSON.parse(JSON.stringify(dato || null))
}

function contarPrecios(productos) {
  return productos.reduce((total, producto) => total + (producto.precios?.length || 0), 0)
}

function contarDireccionesMigrables(comercios) {
  return comercios.reduce(
    (total, comercio) =>
      total +
      Math.min(
        comercio.direcciones?.length || 0,
        LIMITES_MODELO_FIRESTORE.direccionesComercioEmbebidasMaximo,
      ),
    0,
  )
}

function contarItemsListaJusta(listas) {
  return listas.reduce(
    (total, lista) =>
      total +
      Math.min(lista.items?.length || 0, LIMITES_MODELO_FIRESTORE.itemsListaEmbebidosMaximo),
    0,
  )
}

function obtenerItemsMesaTrabajo(datosLocales) {
  return Array.isArray(datosLocales.sesionEscaneo?.items) ? datosLocales.sesionEscaneo.items : []
}

function contarFotosProductos() {
  return 0
}

function contarFotosComercios() {
  return 0
}

function contarFotosListas() {
  return 0
}

function crearMapaPrecioAProducto(productos) {
  const mapa = new Map()

  productos.forEach((producto) => {
    const precios = producto.precios || []
    precios.forEach((precio) => {
      if (precio?.id) {
        mapa.set(String(precio.id), producto.id)
      }
    })
  })

  return mapa
}

function obtenerConfirmacionesMigrables(datosLocales) {
  const mapaPrecioAProducto = crearMapaPrecioAProducto(datosLocales.productos)
  const confirmaciones = []

  datosLocales.confirmaciones.forEach((registro) => {
    const valor = registro.valor
    const usuarioIdLocal = valor?.usuarioId || String(registro.clave || '').replace(/^confirmaciones_/, '')
    const preciosConfirmados = Array.isArray(valor)
      ? valor
      : Array.isArray(valor?.preciosConfirmados)
        ? valor.preciosConfirmados
        : []

    preciosConfirmados.forEach((precioId) => {
      const productoId = mapaPrecioAProducto.get(String(precioId)) || null
      confirmaciones.push({
        id: firestoreConfirmacionesService.crearConfirmacionId(productoId, precioId),
        usuarioIdLocal,
        productoId,
        precioId,
        fecha: valor?.fechaActualizacion || new Date().toISOString(),
        origen: 'migracionLocal',
      })
    })
  })

  return confirmaciones
}

function obtenerConteosMigrables(datosLocales) {
  const confirmaciones = obtenerConfirmacionesMigrables(datosLocales)

  return {
    productos: datosLocales.productos.length,
    precios: contarPrecios(datosLocales.productos),
    comercios: datosLocales.comercios.length,
    direcciones: contarDireccionesMigrables(datosLocales.comercios),
    listas: datosLocales.listas.length,
    itemsListaJusta: contarItemsListaJusta(datosLocales.listas),
    preferencias: datosLocales.preferencias ? 1 : 0,
    confirmaciones: confirmaciones.length,
    mesaTrabajoItems: obtenerItemsMesaTrabajo(datosLocales).length,
    fotosProductos: contarFotosProductos(datosLocales.productos),
    fotosComercios: contarFotosComercios(datosLocales.comercios),
    fotosListas: contarFotosListas(datosLocales.listas),
  }
}

function crearConteosVacios() {
  return {
    productos: 0,
    precios: 0,
    comercios: 0,
    direcciones: 0,
    listas: 0,
    itemsListaJusta: 0,
    preferencias: 0,
    confirmaciones: 0,
    mesaTrabajoItems: 0,
    fotosProductos: 0,
    fotosComercios: 0,
    fotosListas: 0,
  }
}

function resumirError(error) {
  return error?.message || String(error || 'Error desconocido')
}

function esBase64(valor) {
  return typeof valor === 'string' && valor.trim().startsWith('data:')
}

function dividirEnTandas(items, tamano = TAMANO_TANDA_MIGRACION) {
  const tandas = []
  for (let indice = 0; indice < items.length; indice += tamano) {
    tandas.push(items.slice(indice, indice + tamano))
  }
  return tandas
}

function limpiarImagenBase64(entidad, campoImagen, campoUrl, campoRuta) {
  if (!entidad) return

  if (esBase64(entidad[campoImagen])) {
    entidad[campoImagen] = null
    entidad[campoUrl] = null
    entidad[campoRuta] = null
  }
}

function prepararProductoSinFotosStorage(producto) {
  limpiarImagenBase64(producto, 'imagen', 'imagenUrl', 'imagenRutaStorage')
  const dato = clonarDato(producto)
  return dato
}

function prepararComercioSinFotosStorage(comercio) {
  limpiarImagenBase64(comercio, 'foto', 'fotoUrl', 'fotoRutaStorage')

  for (const direccion of comercio.direcciones || []) {
    limpiarImagenBase64(direccion, 'foto', 'fotoUrl', 'fotoRutaStorage')
  }

  return clonarDato(comercio)
}

function prepararListaSinFotosStorage(lista) {
  for (const item of lista.items || []) {
    limpiarImagenBase64(item, 'imagen', 'imagenUrl', 'imagenRutaStorage')
  }

  return clonarDato(lista)
}

function prepararItemMesaSinFotosStorage(item) {
  limpiarImagenBase64(item, 'imagen', 'imagenUrl', 'imagenRutaStorage')

  if (item.datosOriginales) {
    limpiarImagenBase64(item.datosOriginales, 'imagen', 'imagenUrl', 'imagenRutaStorage')
  }

  return clonarDato(item)
}

async function ejecutarConTimeoutFirestore(promesa) {
  let timeoutId = null
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        exito: false,
        pendiente: true,
        estado: ESTADOS_SINCRONIZACION.PENDIENTE,
        mensaje: 'La operación quedó pendiente por conectividad.',
      })
    }, TIEMPO_MAXIMO_OPERACION_FIRESTORE_MS)
  })

  const resultado = await Promise.race([promesa, timeout])
  clearTimeout(timeoutId)
  return resultado
}

class MigracionLocalFirebaseService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async obtenerResumenLocal() {
    const datosLocales = await inventarioMigracionFirebaseService.leerDatosLocalesActuales({
      incluirFotos: false,
    })
    const resumen = await inventarioMigracionFirebaseService.obtenerResumenMigracionLocal({
      incluirFotos: false,
    })

    return {
      ...resumen,
      conteosMigrables: obtenerConteosMigrables(datosLocales),
    }
  }

  async obtenerEstadoActual() {
    const usuarioId = obtenerUsuarioFirebaseActual()
    const snapshot = await getDoc(obtenerReferenciaEstadoMigracion(usuarioId))

    if (!snapshot.exists()) {
      return this._crearEstadoBase(usuarioId, ESTADOS_MIGRACION_FIREBASE.SIN_INICIAR)
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    }
  }

  async prepararMigracionLocal() {
    const usuarioId = obtenerUsuarioFirebaseActual()
    const datosLocales = await inventarioMigracionFirebaseService.leerDatosLocalesActuales({
      incluirFotos: false,
    })
    const resumen = await inventarioMigracionFirebaseService.obtenerResumenMigracionLocal({
      incluirFotos: false,
    })
    const backup = await inventarioMigracionFirebaseService.crearBackupLocalPrevio()
    if (!backup.guardado) {
      throw new Error('No se pudo confirmar el backup local previo.')
    }

    const estado = {
      ...this._crearEstadoBase(usuarioId, ESTADOS_MIGRACION_FIREBASE.BACKUP_CREADO),
      fechaInicio: new Date().toISOString(),
      fechaUltimoIntento: new Date().toISOString(),
      adaptadorOrigen: infoAdaptador.nombre,
      conteosEsperados: obtenerConteosMigrables(datosLocales),
      conteosLocalesOriginales: resumen,
      backupLocal: {
        clave: backup.clave,
        fecha: backup.fecha,
      },
      ultimoPasoCompletado: 'backupLocal',
      errores: [],
    }

    if (await this._estaConectado()) {
      await this._guardarEstado(usuarioId, estado)
    }

    return estado
  }

  async iniciarMigracion(opciones = {}) {
    if (opciones.confirmarMigracion !== true) {
      throw new Error('La migración requiere confirmación explícita del usuario.')
    }

    const usuarioId = obtenerUsuarioFirebaseActual()
    const datosLocales = await inventarioMigracionFirebaseService.leerDatosLocalesActuales({
      incluirFotos: false,
    })
    let estadoActual = await this.obtenerEstadoActual()

    if (!estadoActual.backupLocal?.clave) {
      estadoActual = await this.prepararMigracionLocal()
    }

    const estadoEnProceso = {
      ...estadoActual,
      estado: ESTADOS_MIGRACION_FIREBASE.EN_PROCESO,
      fechaInicio: estadoActual.fechaInicio || new Date().toISOString(),
      fechaUltimoIntento: new Date().toISOString(),
      conteosEsperados: obtenerConteosMigrables(datosLocales),
      conteosMigrados: crearConteosVacios(),
      errores: [],
      ultimoPasoCompletado: 'inicioMigracion',
    }

    if (!(await this._estaConectado())) {
      const resultadoSinConexion = this._crearResultadoSinConexion(datosLocales)
      await this._guardarColaPendiente(resultadoSinConexion.colaPendiente)
      return {
        ...estadoEnProceso,
        estado: ESTADOS_MIGRACION_FIREBASE.PARCIAL,
        fechaUltimoIntento: new Date().toISOString(),
        conteosMigrados: resultadoSinConexion.conteosMigrados,
        conteosFirestore: resultadoSinConexion.conteosMigrados,
        diferencias: [],
        errores: resultadoSinConexion.errores,
        colaPendiente: resultadoSinConexion.colaPendiente.map((item) => this._resumirItemCola(item)),
        ultimoPasoCompletado: 'sinConexion',
      }
    }

    await this._guardarEstado(usuarioId, estadoEnProceso)

    await this._notificarProgreso(opciones.onProgreso, {
      sector: 'inicio',
      mensaje: 'Preparando tus datos...',
      procesados: 0,
      total: 0,
    })

    const resultado = await this._migrarDatosLocales(
      usuarioId,
      datosLocales,
      estadoEnProceso,
      opciones.onProgreso,
    )
    await this._guardarColaPendiente(resultado.colaPendiente)

    const tienePendientes = resultado.colaPendiente.length > 0
    const validacion = tienePendientes
      ? {
          conteosFirestore: resultado.conteosMigrados,
          diferencias: [],
        }
      : await this._validarConteosFirestore(datosLocales)
    const tieneDiferencias = validacion.diferencias.length > 0
    const estadoFinal = {
      ...estadoEnProceso,
      estado:
        tienePendientes || tieneDiferencias
          ? ESTADOS_MIGRACION_FIREBASE.PARCIAL
          : ESTADOS_MIGRACION_FIREBASE.COMPLETADA,
      fechaUltimoIntento: new Date().toISOString(),
      fechaFinalizacion: tienePendientes || tieneDiferencias ? null : new Date().toISOString(),
      conteosMigrados: resultado.conteosMigrados,
      conteosFirestore: validacion.conteosFirestore,
      diferencias: validacion.diferencias,
      errores: resultado.errores,
      colaPendiente: resultado.colaPendiente.map((item) => this._resumirItemCola(item)),
      ultimoPasoCompletado: 'validacionConteos',
    }

    await this._guardarEstado(usuarioId, estadoFinal)
    return estadoFinal
  }

  async reintentarMigracion() {
    return this.iniciarMigracion({ confirmarMigracion: true })
  }

  async obtenerColaPendiente() {
    return (await this.adaptador.obtener(CLAVE_COLA_MIGRACION_FIREBASE)) || []
  }

  async limpiarColaPendiente() {
    await this.adaptador.guardar(CLAVE_COLA_MIGRACION_FIREBASE, [])
  }

  async _migrarDatosLocales(usuarioId, datosLocales, estadoBase, onProgreso) {
    const resultado = {
      conteosMigrados: crearConteosVacios(),
      errores: [],
      colaPendiente: [],
    }
    const conectado = await this._estaConectado()

    await this._procesarTandas({
      items: datosLocales.productos,
      sector: 'productos',
      mensaje: 'Guardando productos...',
      onProgreso,
      procesar: async (producto) => {
        if (!conectado) {
          resultado.colaPendiente.push(this._crearItemColaProducto(producto, 'Sin conexion.'))
          return
        }

        try {
          const productoFirestore = prepararProductoSinFotosStorage(producto)
          const resultadoProducto = await ejecutarConTimeoutFirestore(
            firestoreProductosService.guardarProductoConPrecios(productoFirestore),
          )

          if (resultadoProducto.exito && !resultadoProducto.pendiente) {
            resultado.conteosMigrados.productos += 1
            resultado.conteosMigrados.precios += productoFirestore.precios?.length || 0
            return
          }

          this._registrarProductoPendiente(resultado, producto, resultadoProducto)
        } catch (error) {
          this._registrarProductoPendiente(resultado, producto, {
            mensaje: resumirError(error),
          })
        }
      },
    })

    await this._guardarEstado(usuarioId, {
      ...estadoBase,
      estado: ESTADOS_MIGRACION_FIREBASE.EN_PROCESO,
      conteosMigrados: resultado.conteosMigrados,
      errores: resultado.errores,
      ultimoPasoCompletado: 'productosYPrecios',
      fechaUltimoIntento: new Date().toISOString(),
    })

    await this._procesarTandas({
      items: datosLocales.comercios,
      sector: 'comercios',
      mensaje: 'Guardando comercios...',
      onProgreso,
      procesar: async (comercio) => {
        if (!conectado) {
          resultado.colaPendiente.push(this._crearItemColaComercio(comercio, 'Sin conexion.'))
          return
        }

        try {
          const comercioFirestore = prepararComercioSinFotosStorage(comercio)
          const resultadoComercio = await ejecutarConTimeoutFirestore(
            firestoreComerciosService.guardarComercio(comercioFirestore),
          )

          if (resultadoComercio.exito && !resultadoComercio.pendiente) {
            resultado.conteosMigrados.comercios += 1
            resultado.conteosMigrados.direcciones += Math.min(
              comercioFirestore.direcciones?.length || 0,
              LIMITES_MODELO_FIRESTORE.direccionesComercioEmbebidasMaximo,
            )
            return
          }

          this._registrarComercioPendiente(resultado, comercio, resultadoComercio)
        } catch (error) {
          this._registrarComercioPendiente(resultado, comercio, {
            mensaje: resumirError(error),
          })
        }
      },
    })

    await this._guardarEstado(usuarioId, {
      ...estadoBase,
      estado: ESTADOS_MIGRACION_FIREBASE.EN_PROCESO,
      conteosMigrados: resultado.conteosMigrados,
      errores: resultado.errores,
      ultimoPasoCompletado: 'comerciosYDirecciones',
      fechaUltimoIntento: new Date().toISOString(),
    })

    await this._procesarTandas({
      items: datosLocales.listas,
      sector: 'listas',
      mensaje: 'Guardando listas...',
      onProgreso,
      procesar: async (lista) => {
        if (!conectado) {
          resultado.colaPendiente.push(this._crearItemColaLista(lista, 'Sin conexion.'))
          return
        }

        try {
          const listaFirestore = prepararListaSinFotosStorage(lista)
          const resultadoLista = await ejecutarConTimeoutFirestore(
            firestoreListasJustasService.guardarListaJusta(listaFirestore),
          )

          if (resultadoLista.exito && !resultadoLista.pendiente) {
            resultado.conteosMigrados.listas += 1
            resultado.conteosMigrados.itemsListaJusta += Math.min(
              listaFirestore.items?.length || 0,
              LIMITES_MODELO_FIRESTORE.itemsListaEmbebidosMaximo,
            )
            return
          }

          this._registrarListaPendiente(resultado, lista, resultadoLista)
        } catch (error) {
          this._registrarListaPendiente(resultado, lista, {
            mensaje: resumirError(error),
          })
        }
      },
    })

    const itemsMesaTrabajo = obtenerItemsMesaTrabajo(datosLocales)
    await this._procesarTandas({
      items: itemsMesaTrabajo,
      sector: 'mesaTrabajo',
      mensaje: 'Guardando mesa de trabajo...',
      onProgreso,
      procesar: async (item) => {
        if (!conectado) {
          resultado.colaPendiente.push(this._crearItemColaMesaTrabajo(item, 'Sin conexion.'))
          return
        }

        try {
          const itemFirestore = prepararItemMesaSinFotosStorage(item)
          const resultadoMesa = await ejecutarConTimeoutFirestore(
            firestoreMesaTrabajoService.guardarItemMesaTrabajo(itemFirestore),
          )

          if (resultadoMesa.exito && !resultadoMesa.pendiente) {
            resultado.conteosMigrados.mesaTrabajoItems += 1
            return
          }

          this._registrarMesaTrabajoPendiente(resultado, item, resultadoMesa)
        } catch (error) {
          this._registrarMesaTrabajoPendiente(resultado, item, {
            mensaje: resumirError(error),
          })
        }
      },
    })

    await this._guardarEstado(usuarioId, {
      ...estadoBase,
      estado: ESTADOS_MIGRACION_FIREBASE.EN_PROCESO,
      conteosMigrados: resultado.conteosMigrados,
      errores: resultado.errores,
      ultimoPasoCompletado: 'mesaTrabajo',
      fechaUltimoIntento: new Date().toISOString(),
    })

    if (datosLocales.preferencias) {
      await this._notificarProgreso(onProgreso, {
        sector: 'preferencias',
        mensaje: 'Guardando preferencias...',
        procesados: 0,
        total: 1,
      })

      if (!conectado) {
        resultado.colaPendiente.push(this._crearItemColaPreferencias('Sin conexion.'))
      } else {
        try {
          const resultadoPreferencias = await ejecutarConTimeoutFirestore(
            firestorePreferenciasService.guardarPreferencias(datosLocales.preferencias),
          )

          if (resultadoPreferencias.exito && !resultadoPreferencias.pendiente) {
            resultado.conteosMigrados.preferencias = 1
          } else {
            this._registrarPreferenciasPendiente(resultado, resultadoPreferencias)
          }
        } catch (error) {
          this._registrarPreferenciasPendiente(resultado, {
            mensaje: resumirError(error),
          })
        }
      }

      await this._notificarProgreso(onProgreso, {
        sector: 'preferencias',
        mensaje: 'Guardando preferencias...',
        procesados: 1,
        total: 1,
      })
    }

    const confirmaciones = obtenerConfirmacionesMigrables(datosLocales)
    await this._procesarTandas({
      items: confirmaciones,
      sector: 'confirmaciones',
      mensaje: 'Guardando confirmaciones...',
      onProgreso,
      procesar: async (confirmacion) => {
        if (!conectado) {
          resultado.colaPendiente.push(this._crearItemColaConfirmacion(confirmacion, 'Sin conexion.'))
          return
        }

        try {
          const resultadoConfirmacion = await ejecutarConTimeoutFirestore(
            firestoreConfirmacionesService.guardarConfirmacion(confirmacion),
          )

          if (resultadoConfirmacion.exito && !resultadoConfirmacion.pendiente) {
            resultado.conteosMigrados.confirmaciones += 1
            return
          }

          this._registrarConfirmacionPendiente(resultado, confirmacion, resultadoConfirmacion)
        } catch (error) {
          this._registrarConfirmacionPendiente(resultado, confirmacion, {
            mensaje: resumirError(error),
          })
        }
      },
    })

    return resultado
  }

  async _procesarTandas({ items = [], sector, mensaje, onProgreso, procesar }) {
    let procesados = 0
    const total = items.length

    await this._notificarProgreso(onProgreso, { sector, mensaje, procesados, total })

    for (const tanda of dividirEnTandas(items)) {
      for (const item of tanda) {
        await procesar(item)
        procesados += 1
      }

      await this._notificarProgreso(onProgreso, { sector, mensaje, procesados, total })
    }
  }

  async _notificarProgreso(onProgreso, datos) {
    if (typeof onProgreso !== 'function') return
    await onProgreso(datos)
  }

  async _validarConteosFirestore(datosLocales) {
    const esperados = obtenerConteosMigrables(datosLocales)
    const productosFirestore = await firestoreProductosService.obtenerProductosUsuario({
      limite: Math.max(esperados.productos, 1),
      incluirPrecios: true,
    })
    const comerciosFirestore = await firestoreComerciosService.obtenerComerciosUsuario({
      limite: Math.max(esperados.comercios, 1),
    })
    const listasFirestore = await firestoreListasJustasService.obtenerListasJustasUsuario({
      limite: Math.max(esperados.listas, 1),
    })
    const mesaTrabajoFirestore = await firestoreMesaTrabajoService.obtenerItemsMesaTrabajoUsuario({
      limite: Math.max(esperados.mesaTrabajoItems, 1),
    })
    const preferenciasFirestore = await firestorePreferenciasService.obtenerPreferenciasUsuario()
    const confirmacionesFirestore = await firestoreConfirmacionesService.obtenerConfirmacionesUsuario()
    const conteosFirestore = {
      productos: productosFirestore.length,
      precios: contarPrecios(productosFirestore),
      comercios: comerciosFirestore.length,
      direcciones: contarDireccionesMigrables(comerciosFirestore),
      listas: listasFirestore.length,
      itemsListaJusta: contarItemsListaJusta(listasFirestore),
      preferencias: preferenciasFirestore ? 1 : 0,
      confirmaciones: confirmacionesFirestore.size,
      mesaTrabajoItems: mesaTrabajoFirestore.length,
      fotosProductos: 0,
      fotosComercios: 0,
      fotosListas: 0,
    }
    const diferencias = Object.entries(esperados)
      .filter(([clave, valor]) => conteosFirestore[clave] !== valor)
      .map(([clave, esperado]) => ({
        tipoDato: clave,
        esperado,
        migrado: conteosFirestore[clave],
      }))
    const base64EnFirestore = [
      ...productosFirestore.filter((producto) => esBase64(producto.imagenUrl)),
      ...comerciosFirestore.filter((comercio) => esBase64(comercio.fotoUrl)),
      ...comerciosFirestore.flatMap((comercio) =>
        (comercio.direcciones || []).filter((direccion) => esBase64(direccion.fotoUrl)),
      ),
      ...listasFirestore.flatMap((lista) =>
        (lista.items || []).filter((item) => esBase64(item.imagenUrl)),
      ),
      ...mesaTrabajoFirestore.filter((item) => esBase64(item.imagenUrl)),
    ]

    if (base64EnFirestore.length > 0) {
      diferencias.push({
        tipoDato: 'fotos',
        esperado: 0,
        migrado: base64EnFirestore.length,
        mensaje: 'Se detectaron fotos base64 en Firestore.',
      })
    }

    return {
      conteosFirestore,
      diferencias,
    }
  }

  async _guardarEstado(usuarioId, estado) {
    await setDoc(obtenerReferenciaEstadoMigracion(usuarioId), clonarDato(estado), { merge: true })
  }

  async _guardarColaPendiente(colaNueva) {
    if (colaNueva.length === 0) {
      await this.limpiarColaPendiente()
      return
    }

    const colaAnterior = await this.obtenerColaPendiente()
    const mapa = new Map()

    for (const item of [...colaAnterior, ...colaNueva]) {
      mapa.set(`${item.tipoDato}:${item.documentoId}`, {
        ...item,
        intentos: Number(item.intentos || 0) + 1,
        fechaUltimoIntento: new Date().toISOString(),
      })
    }

    await this.adaptador.guardar(CLAVE_COLA_MIGRACION_FIREBASE, [...mapa.values()])
  }

  async _estaConectado() {
    const estadoConexion = await conexionService.obtenerEstadoConexion()
    const navegadorOffline = typeof navigator !== 'undefined' && navigator.onLine === false
    return estadoConexion.conectado && !navegadorOffline
  }

  _crearResultadoSinConexion(datosLocales) {
    const resultado = {
      conteosMigrados: crearConteosVacios(),
      errores: [],
      colaPendiente: [],
    }
    const mensaje = 'Sin conexión.'

    for (const producto of datosLocales.productos) {
      resultado.errores.push({
        tipoDato: TIPOS_DATO_USUARIO.PRODUCTO,
        documentoId: producto.id,
        mensaje,
      })
      resultado.colaPendiente.push(this._crearItemColaProducto(producto, mensaje))

      for (const precio of producto.precios || []) {
        resultado.colaPendiente.push(this._crearItemColaPrecio(producto.id, precio, mensaje))
      }
    }

    for (const comercio of datosLocales.comercios) {
      resultado.errores.push({
        tipoDato: TIPOS_DATO_USUARIO.COMERCIO,
        documentoId: comercio.id,
        mensaje,
      })
      resultado.colaPendiente.push(this._crearItemColaComercio(comercio, mensaje))
    }

    for (const lista of datosLocales.listas) {
      resultado.errores.push({
        tipoDato: TIPOS_DATO_USUARIO.LISTA_JUSTA,
        documentoId: lista.id,
        mensaje,
      })
      resultado.colaPendiente.push(this._crearItemColaLista(lista, mensaje))
    }

    for (const item of obtenerItemsMesaTrabajo(datosLocales)) {
      resultado.errores.push({
        tipoDato: TIPOS_DATO_USUARIO.MESA_TRABAJO,
        documentoId: item.id,
        mensaje,
      })
      resultado.colaPendiente.push(this._crearItemColaMesaTrabajo(item, mensaje))
    }

    if (datosLocales.preferencias) {
      resultado.errores.push({
        tipoDato: TIPOS_DATO_USUARIO.PREFERENCIAS,
        documentoId: 'preferencias',
        mensaje,
      })
      resultado.colaPendiente.push(this._crearItemColaPreferencias(mensaje))
    }

    for (const confirmacion of obtenerConfirmacionesMigrables(datosLocales)) {
      resultado.errores.push({
        tipoDato: TIPOS_DATO_USUARIO.CONFIRMACION,
        documentoId: confirmacion.id,
        mensaje,
      })
      resultado.colaPendiente.push(this._crearItemColaConfirmacion(confirmacion, mensaje))
    }

    return resultado
  }

  _crearEstadoBase(usuarioId, estado) {
    return {
      usuarioId,
      estado,
      versionMigracion: VERSION_MIGRACION_LOCAL_FIREBASE,
      adaptadorOrigen: infoAdaptador.nombre,
      fechaInicio: null,
      fechaUltimoIntento: null,
      fechaFinalizacion: null,
      conteosEsperados: crearConteosVacios(),
      conteosMigrados: crearConteosVacios(),
      conteosFirestore: crearConteosVacios(),
      ultimoPasoCompletado: null,
      errores: [],
    }
  }

  _registrarProductoPendiente(resultado, producto, error) {
    const mensaje = error?.mensaje || error?.message || 'No se pudo migrar el producto.'
    resultado.errores.push({
      tipoDato: TIPOS_DATO_USUARIO.PRODUCTO,
      documentoId: producto.id,
      mensaje,
    })
    resultado.colaPendiente.push(this._crearItemColaProducto(producto, mensaje))

    for (const precio of producto.precios || []) {
      resultado.colaPendiente.push(this._crearItemColaPrecio(producto.id, precio, mensaje))
    }
  }

  _registrarComercioPendiente(resultado, comercio, error) {
    const mensaje = error?.mensaje || error?.message || 'No se pudo migrar el comercio.'
    resultado.errores.push({
      tipoDato: TIPOS_DATO_USUARIO.COMERCIO,
      documentoId: comercio.id,
      mensaje,
    })
    resultado.colaPendiente.push(this._crearItemColaComercio(comercio, mensaje))
  }

  _registrarListaPendiente(resultado, lista, error) {
    const mensaje = error?.mensaje || error?.message || 'No se pudo migrar la Lista Justa.'
    resultado.errores.push({
      tipoDato: TIPOS_DATO_USUARIO.LISTA_JUSTA,
      documentoId: lista.id,
      mensaje,
    })
    resultado.colaPendiente.push(this._crearItemColaLista(lista, mensaje))
  }

  _registrarMesaTrabajoPendiente(resultado, item, error) {
    const mensaje = error?.mensaje || error?.message || 'No se pudo migrar la mesa de trabajo.'
    resultado.errores.push({
      tipoDato: TIPOS_DATO_USUARIO.MESA_TRABAJO,
      documentoId: item.id,
      mensaje,
    })
    resultado.colaPendiente.push(this._crearItemColaMesaTrabajo(item, mensaje))
  }

  _registrarPreferenciasPendiente(resultado, error) {
    const mensaje = error?.mensaje || error?.message || 'No se pudieron migrar las preferencias.'
    resultado.errores.push({
      tipoDato: TIPOS_DATO_USUARIO.PREFERENCIAS,
      documentoId: 'preferencias',
      mensaje,
    })
    resultado.colaPendiente.push(this._crearItemColaPreferencias(mensaje))
  }

  _registrarConfirmacionPendiente(resultado, confirmacion, error) {
    const mensaje = error?.mensaje || error?.message || 'No se pudo migrar la confirmación.'
    resultado.errores.push({
      tipoDato: TIPOS_DATO_USUARIO.CONFIRMACION,
      documentoId: confirmacion.id,
      mensaje,
    })
    resultado.colaPendiente.push(this._crearItemColaConfirmacion(confirmacion, mensaje))
  }

  _crearItemColaProducto(producto, mensaje) {
    return {
      id: `${TIPOS_DATO_USUARIO.PRODUCTO}-${producto.id}`,
      tipoDato: TIPOS_DATO_USUARIO.PRODUCTO,
      accion: ACCIONES_SINCRONIZABLES.ACTUALIZAR,
      documentoId: producto.id,
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _crearItemColaPrecio(productoId, precio, mensaje) {
    return {
      id: `${TIPOS_DATO_USUARIO.PRECIO}-${productoId}-${precio.id}`,
      tipoDato: TIPOS_DATO_USUARIO.PRECIO,
      accion: ACCIONES_SINCRONIZABLES.ACTUALIZAR,
      documentoId: precio.id,
      productoId,
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _crearItemColaComercio(comercio, mensaje) {
    return {
      id: `${TIPOS_DATO_USUARIO.COMERCIO}-${comercio.id}`,
      tipoDato: TIPOS_DATO_USUARIO.COMERCIO,
      accion: ACCIONES_SINCRONIZABLES.ACTUALIZAR,
      documentoId: comercio.id,
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _crearItemColaLista(lista, mensaje) {
    return {
      id: `${TIPOS_DATO_USUARIO.LISTA_JUSTA}-${lista.id}`,
      tipoDato: TIPOS_DATO_USUARIO.LISTA_JUSTA,
      accion: ACCIONES_SINCRONIZABLES.ACTUALIZAR,
      documentoId: lista.id,
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _crearItemColaMesaTrabajo(item, mensaje) {
    return {
      id: `${TIPOS_DATO_USUARIO.MESA_TRABAJO}-${item.id}`,
      tipoDato: TIPOS_DATO_USUARIO.MESA_TRABAJO,
      accion: ACCIONES_SINCRONIZABLES.ACTUALIZAR,
      documentoId: item.id,
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _crearItemColaPreferencias(mensaje) {
    return {
      id: `${TIPOS_DATO_USUARIO.PREFERENCIAS}-preferencias`,
      tipoDato: TIPOS_DATO_USUARIO.PREFERENCIAS,
      accion: ACCIONES_SINCRONIZABLES.ACTUALIZAR,
      documentoId: 'preferencias',
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _crearItemColaConfirmacion(confirmacion, mensaje) {
    return {
      id: `${TIPOS_DATO_USUARIO.CONFIRMACION}-${confirmacion.id}`,
      tipoDato: TIPOS_DATO_USUARIO.CONFIRMACION,
      accion: ACCIONES_SINCRONIZABLES.ACTUALIZAR,
      documentoId: confirmacion.id,
      productoId: confirmacion.productoId,
      precioId: confirmacion.precioId,
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _crearItemColaFoto(tipoDato, documentoId, mensaje) {
    return {
      id: `${tipoDato}-${documentoId}`,
      tipoDato,
      accion: ACCIONES_SINCRONIZABLES.SUBIR_FOTO,
      documentoId,
      intentos: 0,
      ultimoError: mensaje,
      fechaUltimoIntento: new Date().toISOString(),
    }
  }

  _resumirItemCola(item) {
    return {
      tipoDato: item.tipoDato,
      documentoId: item.documentoId,
      intentos: item.intentos,
      ultimoError: item.ultimoError,
    }
  }
}

export default new MigracionLocalFirebaseService()
