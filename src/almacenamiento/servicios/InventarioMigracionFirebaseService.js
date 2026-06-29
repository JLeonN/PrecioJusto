import { adaptadorActual, infoAdaptador } from './AlmacenamientoService.js'
import {
  CLAVE_COMERCIOS,
  CLAVE_LISTA_JUSTA,
  CLAVE_PREFERENCIAS_USUARIO,
  CLAVE_SESION_ESCANEO,
  PREFIJO_BACKUP_MIGRACION_FIREBASE,
  PREFIJO_CONFIRMACIONES,
  PREFIJO_PRODUCTOS,
} from '../constantes/ClavesAlmacenamiento.js'

function esBase64(valor) {
  return typeof valor === 'string' && valor.trim().startsWith('data:')
}

function limpiarImagenBase64(entidad, campoImagen, campoUrl, campoRuta) {
  if (!entidad || !esBase64(entidad[campoImagen])) return

  entidad[campoImagen] = null
  entidad[campoUrl] = null
  entidad[campoRuta] = null
}

function quitarFotosPesadasProducto(producto) {
  limpiarImagenBase64(producto, 'imagen', 'imagenUrl', 'imagenRutaStorage')
  return producto
}

function quitarFotosPesadasComercio(comercio) {
  limpiarImagenBase64(comercio, 'foto', 'fotoUrl', 'fotoRutaStorage')

  for (const direccion of comercio?.direcciones || []) {
    limpiarImagenBase64(direccion, 'foto', 'fotoUrl', 'fotoRutaStorage')
  }

  return comercio
}

function quitarFotosPesadasLista(lista) {
  for (const item of lista?.items || []) {
    limpiarImagenBase64(item, 'imagen', 'imagenUrl', 'imagenRutaStorage')
  }

  return lista
}

function quitarFotosPesadasSesionEscaneo(sesionEscaneo) {
  for (const item of sesionEscaneo?.items || []) {
    limpiarImagenBase64(item, 'imagen', 'imagenUrl', 'imagenRutaStorage')

    if (item.datosOriginales) {
      limpiarImagenBase64(item.datosOriginales, 'imagen', 'imagenUrl', 'imagenRutaStorage')
    }
  }

  return sesionEscaneo
}

function quitarFotosPesadas(datos) {
  datos.productos.forEach(quitarFotosPesadasProducto)
  datos.comercios.forEach(quitarFotosPesadasComercio)
  datos.listas.forEach(quitarFotosPesadasLista)
  quitarFotosPesadasSesionEscaneo(datos.sesionEscaneo)
  return datos
}

class InventarioMigracionFirebaseService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async leerDatosLocalesActuales(opciones = {}) {
    const incluirFotos = opciones.incluirFotos !== false
    const productos = await this.adaptador.listarTodo(PREFIJO_PRODUCTOS)
    const confirmaciones = await this.adaptador.listarTodo(PREFIJO_CONFIRMACIONES)
    const comercios = (await this.adaptador.obtener(CLAVE_COMERCIOS)) || []
    const datosListas = await this.adaptador.obtener(CLAVE_LISTA_JUSTA)
    const preferencias = await this.adaptador.obtener(CLAVE_PREFERENCIAS_USUARIO)
    const sesionEscaneo = await this.adaptador.obtener(CLAVE_SESION_ESCANEO)

    const datos = {
      adaptador: infoAdaptador,
      productos: productos.map((registro) => registro.valor),
      comercios,
      listas: Array.isArray(datosListas?.listas) ? datosListas.listas : [],
      preferencias,
      sesionEscaneo,
      confirmaciones,
    }

    return incluirFotos ? datos : quitarFotosPesadas(datos)
  }

  async obtenerResumenMigracionLocal(opciones = {}) {
    const incluirFotos = opciones.incluirFotos !== false
    const datos = await this.leerDatosLocalesActuales({ incluirFotos })

    return {
      adaptador: datos.adaptador.nombre,
      productos: datos.productos.length,
      precios: datos.productos.reduce((total, producto) => total + (producto.precios?.length || 0), 0),
      comercios: datos.comercios.length,
      direcciones: datos.comercios.reduce(
        (total, comercio) => total + (comercio.direcciones?.length || 0),
        0,
      ),
      listas: datos.listas.length,
      itemsListaJusta: datos.listas.reduce((total, lista) => total + (lista.items?.length || 0), 0),
      fotosProductos: incluirFotos
        ? datos.productos.filter((producto) => Boolean(producto.imagen)).length
        : 0,
      fotosComercios: incluirFotos
        ? datos.comercios.reduce(
            (total, comercio) =>
              total +
              (comercio.foto ? 1 : 0) +
              (comercio.direcciones || []).filter((direccion) => Boolean(direccion.foto)).length,
            0,
          )
        : 0,
      fotosListas: incluirFotos
        ? datos.listas.reduce(
            (total, lista) => total + (lista.items || []).filter((item) => Boolean(item.imagen)).length,
            0,
          )
        : 0,
      confirmaciones: datos.confirmaciones.length,
      tienePreferencias: Boolean(datos.preferencias),
      tieneSesionEscaneo: Boolean(datos.sesionEscaneo?.items?.length),
    }
  }

  async crearBackupLocalPrevio() {
    const datos = await this.leerDatosLocalesActuales({ incluirFotos: false })
    const fecha = new Date().toISOString()
    const clave = `${PREFIJO_BACKUP_MIGRACION_FIREBASE}${fecha.replace(/[:.]/g, '')}`
    const guardado = await this.adaptador.guardar(clave, {
      fecha,
      datos,
      fotosLocalesConservadasEnDispositivo: true,
    })

    return {
      guardado,
      clave,
      fecha,
    }
  }
}

export default new InventarioMigracionFirebaseService()
