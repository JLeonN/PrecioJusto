import { TIPOS_USUARIO, USUARIO_LOCAL_LEGACY_ID } from '../constantes/PreparacionFirebase.js'

const usuarioActual = {
  id: USUARIO_LOCAL_LEGACY_ID,
  tipo: TIPOS_USUARIO.LOCAL,
  esLocal: true,
}

const suscriptores = new Set()

function clonarUsuarioActual() {
  return { ...usuarioActual }
}

function notificarCambioUsuario() {
  const usuario = clonarUsuarioActual()
  suscriptores.forEach((callback) => callback(usuario))
}

function normalizarUsuario(usuario) {
  if (typeof usuario === 'string') {
    return {
      id: usuario,
      tipo: TIPOS_USUARIO.FIREBASE,
      esLocal: false,
    }
  }

  return {
    id: usuario?.id || USUARIO_LOCAL_LEGACY_ID,
    tipo: usuario?.tipo || TIPOS_USUARIO.LOCAL,
    esLocal: usuario?.esLocal ?? usuario?.tipo !== TIPOS_USUARIO.FIREBASE,
  }
}

function obtenerUsuarioActual() {
  return clonarUsuarioActual()
}

function obtenerUsuarioIdActual() {
  return usuarioActual.id
}

function cambiarUsuarioActual(nuevoUsuario) {
  const usuarioNormalizado = normalizarUsuario(nuevoUsuario)
  usuarioActual.id = usuarioNormalizado.id
  usuarioActual.tipo = usuarioNormalizado.tipo
  usuarioActual.esLocal = usuarioNormalizado.esLocal
  notificarCambioUsuario()
  return clonarUsuarioActual()
}

function restaurarUsuarioLocal() {
  return cambiarUsuarioActual({
    id: USUARIO_LOCAL_LEGACY_ID,
    tipo: TIPOS_USUARIO.LOCAL,
    esLocal: true,
  })
}

function suscribirCambioUsuario(callback) {
  suscriptores.add(callback)
  return () => suscriptores.delete(callback)
}

export default {
  obtenerUsuarioActual,
  obtenerUsuarioIdActual,
  cambiarUsuarioActual,
  restaurarUsuarioLocal,
  suscribirCambioUsuario,
}
