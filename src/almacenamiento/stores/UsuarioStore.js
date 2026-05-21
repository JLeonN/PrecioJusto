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

  async function aplicarUsuarioAutenticado(usuarioFirebase) {
    const usuarioAnteriorId = usuarioActualService.obtenerUsuarioIdActual()
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

    const usuarioSiguienteId = usuarioActualService.obtenerUsuarioIdActual()
    if (usuarioAnteriorId !== usuarioSiguienteId) {
      await limpiarStoresPrivados()
    }
  }

  async function limpiarStoresPrivados() {
    try {
      const [
        { useProductosStore },
        { useComerciStore },
        { useListaJustaStore },
        { useConfirmacionesStore },
      ] = await Promise.all([
        import('./productosStore.js'),
        import('./comerciosStore.js'),
        import('./ListaJustaStore.js'),
        import('./confirmacionesStore.js'),
      ])

      useProductosStore().limpiarEstado()
      useComerciStore().limpiarEstado()
      useListaJustaStore().limpiarEstado()
      useConfirmacionesStore().limpiarEstado()
    } catch (error) {
      console.warn('No se pudieron limpiar stores privados al cambiar usuario:', error)
    }
  }

  function inicializarSesion() {
    if (escuchaInicializada.value) return promesaSesionLista.value

    crearPromesaSesionLista()
    cargandoSesion.value = true
    escuchaInicializada.value = true
    cancelarEscucha.value = autenticacionFirebaseService.observarSesion(async (usuarioFirebase) => {
      await aplicarUsuarioAutenticado(usuarioFirebase)
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
      await aplicarUsuarioAutenticado(usuarioRegistrado)
      return usuarioRegistrado
    })
  }

  async function iniciarSesion(datosIngreso) {
    return ejecutarAccionAutenticacion(async () => {
      const usuarioIngresado = await autenticacionFirebaseService.iniciarSesionConCorreo(datosIngreso)
      await aplicarUsuarioAutenticado(usuarioIngresado)
      return usuarioIngresado
    })
  }

  async function cerrarSesion() {
    return ejecutarAccionAutenticacion(async () => {
      await autenticacionFirebaseService.cerrarSesion()
      await aplicarUsuarioAutenticado(null)
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
