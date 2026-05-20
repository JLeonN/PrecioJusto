import { doc, getDoc, setDoc } from 'firebase/firestore'
import { adaptadorActual, infoAdaptador } from './AlmacenamientoService.js'
import conexionService from './ConexionService.js'
import firebaseBaseService from './FirebaseBaseService.js'
import firestoreComerciosService from './FirestoreComerciosService.js'
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

function obtenerConteosMigrables(datosLocales) {
  return {
    productos: datosLocales.productos.length,
    precios: contarPrecios(datosLocales.productos),
    comercios: datosLocales.comercios.length,
    direcciones: contarDireccionesMigrables(datosLocales.comercios),
  }
}

function crearConteosVacios() {
  return {
    productos: 0,
    precios: 0,
    comercios: 0,
    direcciones: 0,
  }
}

function resumirError(error) {
  return error?.message || String(error || 'Error desconocido')
}

function esBase64(valor) {
  return typeof valor === 'string' && valor.trim().startsWith('data:')
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
    const datosLocales = await inventarioMigracionFirebaseService.leerDatosLocalesActuales()
    const resumen = await inventarioMigracionFirebaseService.obtenerResumenMigracionLocal()

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
    const datosLocales = await inventarioMigracionFirebaseService.leerDatosLocalesActuales()
    const resumen = await inventarioMigracionFirebaseService.obtenerResumenMigracionLocal()
    const backup = await inventarioMigracionFirebaseService.crearBackupLocalPrevio()
    const backupGuardado = backup.guardado ? await this.adaptador.obtener(backup.clave) : null

    if (!backup.guardado || !backupGuardado) {
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
    const datosLocales = await inventarioMigracionFirebaseService.leerDatosLocalesActuales()
    let estadoActual = await this.obtenerEstadoActual()

    if (!estadoActual.backupLocal?.clave) {
      estadoActual = await this.prepararMigracionLocal()
    }

    const backupGuardado = await this.adaptador.obtener(estadoActual.backupLocal.clave)
    if (!backupGuardado) {
      throw new Error('No se encontró el backup local requerido para iniciar la migración.')
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

    const resultado = await this._migrarDatosLocales(usuarioId, datosLocales, estadoEnProceso)
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

  async _migrarDatosLocales(usuarioId, datosLocales, estadoBase) {
    const resultado = {
      conteosMigrados: crearConteosVacios(),
      errores: [],
      colaPendiente: [],
    }
    const conectado = await this._estaConectado()

    for (const producto of datosLocales.productos) {
      if (!conectado) {
        resultado.colaPendiente.push(this._crearItemColaProducto(producto, 'Sin conexión.'))
        continue
      }

      try {
        const resultadoProducto = await ejecutarConTimeoutFirestore(
          firestoreProductosService.guardarProductoConPrecios(producto),
        )

        if (resultadoProducto.exito && !resultadoProducto.pendiente) {
          resultado.conteosMigrados.productos += 1
          resultado.conteosMigrados.precios += producto.precios?.length || 0
          continue
        }

        this._registrarProductoPendiente(resultado, producto, resultadoProducto)
      } catch (error) {
        this._registrarProductoPendiente(resultado, producto, {
          mensaje: resumirError(error),
        })
      }
    }

    await this._guardarEstado(usuarioId, {
      ...estadoBase,
      estado: ESTADOS_MIGRACION_FIREBASE.EN_PROCESO,
      conteosMigrados: resultado.conteosMigrados,
      errores: resultado.errores,
      ultimoPasoCompletado: 'productosYPrecios',
      fechaUltimoIntento: new Date().toISOString(),
    })

    for (const comercio of datosLocales.comercios) {
      if (!conectado) {
        resultado.colaPendiente.push(this._crearItemColaComercio(comercio, 'Sin conexión.'))
        continue
      }

      try {
        const resultadoComercio = await ejecutarConTimeoutFirestore(
          firestoreComerciosService.guardarComercio(comercio),
        )

        if (resultadoComercio.exito && !resultadoComercio.pendiente) {
          resultado.conteosMigrados.comercios += 1
          resultado.conteosMigrados.direcciones += Math.min(
            comercio.direcciones?.length || 0,
            LIMITES_MODELO_FIRESTORE.direccionesComercioEmbebidasMaximo,
          )
          continue
        }

        this._registrarComercioPendiente(resultado, comercio, resultadoComercio)
      } catch (error) {
        this._registrarComercioPendiente(resultado, comercio, {
          mensaje: resumirError(error),
        })
      }
    }

    return resultado
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
    const conteosFirestore = {
      productos: productosFirestore.length,
      precios: contarPrecios(productosFirestore),
      comercios: comerciosFirestore.length,
      direcciones: contarDireccionesMigrables(comerciosFirestore),
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
