import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import servicioAuthFirebase from '../../Firebase/ServicioAuthFirebase.js'
import servicioFirestoreUsuarios from '../../Firebase/ServicioFirestoreUsuarios.js'

export const useUsuarioStore = defineStore('usuario', () => {
  const usuarioId = ref(null)
  const autenticado = ref(false)
  const esAnonimo = ref(false)
  const perfil = ref(null)
  const cargandoSesion = ref(false)
  const errorSesion = ref(null)

  let detenerEscuchaSesion = null
  let promesaInicializacion = null

  const tieneSesionActiva = computed(() => autenticado.value && !!usuarioId.value)

  function aplicarEstadoUsuario(usuario) {
    if (!usuario) {
      usuarioId.value = null
      autenticado.value = false
      esAnonimo.value = false
      perfil.value = null
      return
    }

    usuarioId.value = usuario.uid
    autenticado.value = true
    esAnonimo.value = !!usuario.isAnonymous
  }

  async function sincronizarPerfilUsuario(usuario) {
    const perfilActual = await servicioFirestoreUsuarios.obtenerPerfilUsuario(usuario.uid)

    if (!perfilActual) {
      await servicioFirestoreUsuarios.guardarPerfilInicial(usuario)
      perfil.value = {
        usuarioId: usuario.uid,
        tipoCuenta: usuario.isAnonymous ? 'anonima' : 'registrada',
        nombre: usuario.displayName || 'Usuario anónimo',
        email: usuario.email || null,
        foto: usuario.photoURL || null,
      }
      return
    }

    await servicioFirestoreUsuarios.actualizarPerfilSesion(usuario)
    perfil.value = {
      ...perfilActual,
      tipoCuenta: usuario.isAnonymous ? 'anonima' : 'registrada',
      nombre: usuario.displayName || 'Usuario anónimo',
      email: usuario.email || null,
      foto: usuario.photoURL || null,
    }
  }

  async function asegurarSesionAnonima() {
    try {
      await servicioAuthFirebase.iniciarSesionAnonimaSiNoExiste()
    } catch (error) {
      console.error('Error al iniciar sesión anónima:', error)
      errorSesion.value = 'No se pudo iniciar la sesión anónima'
    }
  }

  async function inicializarSesion() {
    if (promesaInicializacion) {
      return promesaInicializacion
    }

    cargandoSesion.value = true
    errorSesion.value = null

    promesaInicializacion = new Promise((resolve) => {
      let primerEventoRecibido = false

      if (!detenerEscuchaSesion) {
        detenerEscuchaSesion = servicioAuthFirebase.escucharCambioSesion(async (usuario) => {
          aplicarEstadoUsuario(usuario)

          if (!usuario) {
            await asegurarSesionAnonima()
            return
          }

          await sincronizarPerfilUsuario(usuario)

          if (!primerEventoRecibido) {
            primerEventoRecibido = true
            cargandoSesion.value = false
            resolve(usuario)
          }
        })
        return
      }

      const usuarioActual = servicioAuthFirebase.obtenerUsuarioActual()
      aplicarEstadoUsuario(usuarioActual)
      cargandoSesion.value = false
      resolve(usuarioActual)
    }).finally(() => {
      promesaInicializacion = null
    })

    return promesaInicializacion
  }

  async function iniciarSesionConGoogle() {
    errorSesion.value = null

    try {
      const usuario = await servicioAuthFirebase.iniciarSesionConGoogle()
      await sincronizarPerfilUsuario(usuario)
      aplicarEstadoUsuario(usuario)
      return true
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error)
      errorSesion.value = 'No se pudo iniciar sesión con Google'
      return false
    }
  }

  async function continuarComoInvitado() {
    errorSesion.value = null

    if (esAnonimo.value && autenticado.value) {
      return true
    }

    try {
      await servicioAuthFirebase.cerrarSesionActual()
      await servicioAuthFirebase.iniciarSesionAnonimaSiNoExiste()
      return true
    } catch (error) {
      console.error('Error al continuar como invitado:', error)
      errorSesion.value = 'No se pudo continuar como invitado'
      return false
    }
  }

  async function cerrarSesion() {
    await servicioAuthFirebase.cerrarSesionActual()
  }

  function limpiarSesionLocal() {
    if (detenerEscuchaSesion) {
      detenerEscuchaSesion()
      detenerEscuchaSesion = null
    }

    usuarioId.value = null
    autenticado.value = false
    esAnonimo.value = false
    perfil.value = null
    cargandoSesion.value = false
    errorSesion.value = null
  }

  return {
    usuarioId,
    autenticado,
    esAnonimo,
    perfil,
    cargandoSesion,
    errorSesion,
    tieneSesionActiva,
    inicializarSesion,
    iniciarSesionConGoogle,
    continuarComoInvitado,
    cerrarSesion,
    limpiarSesionLocal,
  }
})
