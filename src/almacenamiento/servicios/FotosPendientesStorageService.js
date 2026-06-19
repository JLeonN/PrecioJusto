import { TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import conexionService from './ConexionService.js'
import usuarioActualService from './UsuarioActualService.js'

let sincronizando = false

function hayUsuarioFirebase() {
  const usuario = usuarioActualService.obtenerUsuarioActual()
  return Boolean(usuario?.id && !usuario.esLocal && usuario.tipo === TIPOS_USUARIO.FIREBASE)
}

async function sincronizarFotosPendientes() {
  if (sincronizando || !hayUsuarioFirebase()) return { exito: false, omitido: true }

  const conexion = await conexionService.obtenerEstadoConexion()
  if (!conexion.conectado) return { exito: false, omitido: true, mensaje: 'Sin conexión.' }

  sincronizando = true

  try {
    const [
      { default: productosService },
      { default: comerciosService },
      { default: listaJustaService },
    ] = await Promise.all([
      import('./ProductosService.js'),
      import('./ComerciosService.js'),
      import('./ListaJustaService.js'),
    ])

    const [productos, comercios, listas] = await Promise.all([
      productosService.sincronizarFotosPendientesStorage(),
      comerciosService.sincronizarFotosPendientesStorage(),
      listaJustaService.sincronizarFotosPendientesStorage(),
    ])

    return {
      exito: true,
      productos,
      comercios,
      listas,
    }
  } catch (error) {
    console.warn('No se pudieron sincronizar fotos pendientes con Storage:', error)
    return {
      exito: false,
      mensaje: error.message || 'No se pudieron sincronizar fotos pendientes.',
    }
  } finally {
    sincronizando = false
  }
}

export default {
  sincronizarFotosPendientes,
}
