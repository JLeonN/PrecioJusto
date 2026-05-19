import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import autenticacionFirebaseService from '../servicios/AutenticacionFirebaseService.js'
import usuarioActualService from '../servicios/UsuarioActualService.js'

export const useUsuarioStore = defineStore('usuario', () => {
  const usuario = ref(null)
  const cargandoSesion = ref(true)
  const cargandoAccion = ref(false)
  const error = ref('')
  const escuchaInicializada = ref(false)
  const cancelarEscucha = ref(null)
  const promesaSesionLista = ref(null)
  const resolverSesionLista = ref(null)

  const usuarioId = computed(() => usuario.value?.id || '')
  const email = computed(() => usuario.value?.email || '')
  const nombre = computed(() => usuario.value?.nombre || '')
  const foto = computed(() => usuario.value?.foto || '')
  const estaAutenticado = computed(() => Boolean(usuario.value?.id))

  function crearPromesaSesionLista() {
    if (promesaSesionLista.value) return

    promesaSesionLista.value = new Promise((resolve) => {
      resolverSesionLista.value = resolve
    })
  }

  function resolverCargaSesion() {
    cargandoSesion.value = false

    if (resolverSesionLista.value) {
      resolverSesionLista.value()
      resolverSesionLista.value = null
    }
  }

  function aplicarUsuarioAutenticado(usuarioFirebase) {
    usuario.value = usuarioFirebase

    if (usuarioFirebase) {
      usuarioActualService.cambiarUsuarioActual({
        id: usuarioFirebase.id,
        tipo: TIPOS_USUARIO.FIREBASE,
        esLocal: false,
      })
    } else {
      usuarioActualService.restaurarUsuarioLocal()
    }
  }

  function inicializarSesion() {
    if (escuchaInicializada.value) return promesaSesionLista.value

    crearPromesaSesionLista()
    cargandoSesion.value = true
    escuchaInicializada.value = true
    cancelarEscucha.value = autenticacionFirebaseService.observarSesion((usuarioFirebase) => {
      aplicarUsuarioAutenticado(usuarioFirebase)
      resolverCargaSesion()
    })

    return promesaSesionLista.value
  }

  async function esperarSesionLista() {
    if (!escuchaInicializada.value) {
      await inicializarSesion()
      return
    }

    if (cargandoSesion.value && promesaSesionLista.value) {
      await promesaSesionLista.value
    }
  }

  function limpiarError() {
    error.value = ''
  }

  async function ejecutarAccionAutenticacion(accion) {
    cargandoAccion.value = true
    limpiarError()

    try {
      return await accion()
    } catch (accionError) {
      error.value = accionError.message || 'No se pudo completar la autenticación.'
      throw accionError
    } finally {
      cargandoAccion.value = false
    }
  }

  async function registrarUsuario(datosRegistro) {
    return ejecutarAccionAutenticacion(async () => {
      const usuarioRegistrado = await autenticacionFirebaseService.registrarConCorreo(datosRegistro)
      aplicarUsuarioAutenticado(usuarioRegistrado)
      return usuarioRegistrado
    })
  }

  async function iniciarSesion(datosIngreso) {
    return ejecutarAccionAutenticacion(async () => {
      const usuarioIngresado = await autenticacionFirebaseService.iniciarSesionConCorreo(datosIngreso)
      aplicarUsuarioAutenticado(usuarioIngresado)
      return usuarioIngresado
    })
  }

  async function cerrarSesion() {
    return ejecutarAccionAutenticacion(async () => {
      await autenticacionFirebaseService.cerrarSesion()
      aplicarUsuarioAutenticado(null)
    })
  }

  async function recuperarContrasena(correo) {
    return ejecutarAccionAutenticacion(async () => {
      await autenticacionFirebaseService.enviarRecuperacionContrasena(correo)
    })
  }

  return {
    usuario,
    cargandoSesion,
    cargandoAccion,
    error,
    escuchaInicializada,
    cancelarEscucha,
    usuarioId,
    email,
    nombre,
    foto,
    estaAutenticado,
    inicializarSesion,
    esperarSesionLista,
    registrarUsuario,
    iniciarSesion,
    cerrarSesion,
    recuperarContrasena,
    limpiarError,
  }
})
