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

class InventarioMigracionFirebaseService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async leerDatosLocalesActuales() {
    const productos = await this.adaptador.listarTodo(PREFIJO_PRODUCTOS)
    const confirmaciones = await this.adaptador.listarTodo(PREFIJO_CONFIRMACIONES)
    const comercios = (await this.adaptador.obtener(CLAVE_COMERCIOS)) || []
    const datosListas = await this.adaptador.obtener(CLAVE_LISTA_JUSTA)
    const preferencias = await this.adaptador.obtener(CLAVE_PREFERENCIAS_USUARIO)
    const sesionEscaneo = await this.adaptador.obtener(CLAVE_SESION_ESCANEO)

    return {
      adaptador: infoAdaptador,
      productos: productos.map((registro) => registro.valor),
      comercios,
      listas: Array.isArray(datosListas?.listas) ? datosListas.listas : [],
      preferencias,
      sesionEscaneo,
      confirmaciones,
    }
  }

  async obtenerResumenMigracionLocal() {
    const datos = await this.leerDatosLocalesActuales()

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
      fotosProductos: datos.productos.filter((producto) => Boolean(producto.imagen)).length,
      fotosComercios: datos.comercios.reduce(
        (total, comercio) =>
          total +
          (comercio.foto ? 1 : 0) +
          (comercio.direcciones || []).filter((direccion) => Boolean(direccion.foto)).length,
        0,
      ),
      fotosListas: datos.listas.reduce(
        (total, lista) => total + (lista.items || []).filter((item) => Boolean(item.imagen)).length,
        0,
      ),
      confirmaciones: datos.confirmaciones.length,
      tienePreferencias: Boolean(datos.preferencias),
      tieneSesionEscaneo: Boolean(datos.sesionEscaneo?.items?.length),
    }
  }

  async crearBackupLocalPrevio() {
    const datos = await this.leerDatosLocalesActuales()
    const fecha = new Date().toISOString()
    const clave = `${PREFIJO_BACKUP_MIGRACION_FIREBASE}${fecha.replace(/[:.]/g, '')}`
    const guardado = await this.adaptador.guardar(clave, {
      fecha,
      datos,
    })

    return {
      guardado,
      clave,
      fecha,
    }
  }
}

export default new InventarioMigracionFirebaseService()
