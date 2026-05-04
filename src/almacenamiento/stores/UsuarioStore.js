import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import servicioAuthFirebase from '../../Firebase/ServicioAuthFirebase.js'
import servicioFirestoreUsuarios from '../../Firebase/ServicioFirestoreUsuarios.js'
import servicioMigracionLocalFirestore from '../../Firebase/ServicioMigracionLocalFirestore.js'
import { configurarEspacioTrabajoAlmacenamiento } from '../servicios/AlmacenamientoService.js'
import { useProductosStore } from './productosStore.js'
import { useComerciStore } from './comerciosStore.js'
import { useListaJustaStore } from './ListaJustaStore.js'
import { useSesionEscaneoStore } from './sesionEscaneoStore.js'

export const useUsuarioStore = defineStore('usuario', () => {
  const usuarioId = ref(null)
  const autenticado = ref(false)
  const esAnonimo = ref(false)
  const perfil = ref(null)
  const cargandoSesion = ref(false)
  const errorSesion = ref(null)
  const cargandoMigracion = ref(false)
  const errorMigracion = ref(null)
  const ultimoResumenMigracion = ref(null)
  const cargandoPerfil = ref(false)
  const errorPerfil = ref(null)
  const accesoInicialCompletado = ref(false)

  let detenerEscuchaSesion = null
  let promesaInicializacion = null
  let espacioTrabajoActual = null
  let uidMigracionAutomaticaEnSesion = null
  let listenerConexionRegistrado = false
  let manejarVueltaConexion = null
  const CLAVE_ACCESO_INICIAL = 'acceso_inicial_completado'

  const tieneSesionActiva = computed(() => autenticado.value && !!usuarioId.value)
  const tieneSesionRealActiva = computed(
    () => autenticado.value && !!usuarioId.value && !esAnonimo.value,
  )

  function esErrorPermisosFirestore(error) {
    return error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')
  }

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

  function resolverEspacioTrabajo(usuario) {
    if (!usuario || usuario.isAnonymous) return 'compartido'
    return `uid-${usuario.uid}`
  }

  async function recargarContextoDatos() {
    const productosStore = useProductosStore()
    const comerciosStore = useComerciStore()
    const listaJustaStore = useListaJustaStore()
    const sesionEscaneoStore = useSesionEscaneoStore()

    productosStore.limpiarEstado()
    comerciosStore.comercios = []
    listaJustaStore.listas = []

    await Promise.all([
      productosStore.cargarProductos(),
      comerciosStore.cargarComercios(),
      listaJustaStore.cargarListas(),
      sesionEscaneoStore.cargarSesion(),
    ])
  }

  async function sincronizarEspacioTrabajoLocal(usuario) {
    const nuevoEspacioTrabajo = resolverEspacioTrabajo(usuario)
    const cambioEspacioTrabajo = espacioTrabajoActual !== nuevoEspacioTrabajo

    if (!cambioEspacioTrabajo) return

    configurarEspacioTrabajoAlmacenamiento(nuevoEspacioTrabajo)
    espacioTrabajoActual = nuevoEspacioTrabajo
    await recargarContextoDatos()
  }

  async function ejecutarMigracionAutomaticaSiCorresponde(usuario) {
    if (!usuario || usuario.isAnonymous) return
    if (!usuario.uid) return
    if (uidMigracionAutomaticaEnSesion === usuario.uid) return

    uidMigracionAutomaticaEnSesion = usuario.uid
    const resumen = await migrarDatosLocales()

    if (!resumen) {
      uidMigracionAutomaticaEnSesion = null
      console.warn('Migración automática pendiente por error o sin conexión.')
    }
  }

  function registrarEscuchaConexion() {
    if (listenerConexionRegistrado) return
    if (typeof window === 'undefined') return

    manejarVueltaConexion = async () => {
      if (!tieneSesionRealActiva.value) return
      await migrarDatosLocales()
    }

    window.addEventListener('online', manejarVueltaConexion)
    listenerConexionRegistrado = true
  }

  function resolverMensajeErrorAuth(error, accion) {
    const codigo = error?.code || ''

    if (codigo === 'auth/popup-blocked') return 'El navegador bloqueó la ventana de Google. Habilitá popups e intentá de nuevo.'
    if (codigo === 'auth/popup-closed-by-user') return 'Cerraste la ventana de Google antes de terminar el inicio de sesión.'
    if (codigo === 'auth/invalid-email') return 'El correo ingresado no tiene un formato válido.'
    if (codigo === 'auth/user-not-found') return 'No existe una cuenta con ese correo.'
    if (codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential') return 'Correo o contraseña incorrectos.'
    if (codigo === 'auth/email-already-in-use') return 'Ese correo ya está registrado. Probá iniciar sesión.'
    if (codigo === 'auth/weak-password') return 'La contraseña es débil. Usá al menos 6 caracteres.'
    if (codigo === 'auth/account-exists-with-different-credential') return 'Ese correo ya existe con otro método de acceso.'
    if (codigo === 'auth/too-many-requests') return 'Demasiados intentos. Esperá un momento y volvé a intentar.'
    if (codigo === 'auth/network-request-failed') return 'Sin conexión o red inestable. Revisá internet e intentá de nuevo.'

    if (accion === 'google') return 'No se pudo iniciar sesión con Google.'
    if (accion === 'loginCorreo') return 'No se pudo iniciar sesión con correo y contraseña.'
    if (accion === 'registroCorreo') return 'No se pudo crear la cuenta con correo y contraseña.'
    if (accion === 'recuperarContrasena') return 'No se pudo enviar el correo de recuperación.'
    return 'No se pudo completar la operación de autenticación.'
  }

  async function sincronizarPerfilUsuario(usuario) {
    const perfilActual = await servicioFirestoreUsuarios.obtenerPerfilUsuario(usuario.uid)

    if (!perfilActual) {
      perfil.value = await servicioFirestoreUsuarios.guardarPerfilInicial(usuario)
      return
    }

    const perfilSesion = await servicioFirestoreUsuarios.actualizarPerfilSesion(usuario)
    perfil.value = {
      ...perfilActual,
      ...perfilSesion,
    }
  }

  async function sincronizarPerfilConReintento(usuario) {
    try {
      await sincronizarPerfilUsuario(usuario)
      return
    } catch (error) {
      if (!esErrorPermisosFirestore(error)) {
        throw error
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 350))
    await sincronizarPerfilUsuario(usuario)
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

    accesoInicialCompletado.value = localStorage.getItem(CLAVE_ACCESO_INICIAL) === '1'
    cargandoSesion.value = true
    errorSesion.value = null
    registrarEscuchaConexion()

    try {
      const usuarioRedirect = await servicioAuthFirebase.procesarResultadoRedirectGoogle()
      if (usuarioRedirect) {
        await sincronizarEspacioTrabajoLocal(usuarioRedirect)
        aplicarEstadoUsuario(usuarioRedirect)
        await sincronizarPerfilConReintento(usuarioRedirect)
      }
    } catch (error) {
      console.warn('No se pudo procesar redirect de Google:', error?.code || error?.message || error)
    }

    promesaInicializacion = new Promise((resolve) => {
      let primerEventoRecibido = false

      if (!detenerEscuchaSesion) {
        detenerEscuchaSesion = servicioAuthFirebase.escucharCambioSesion(async (usuario) => {
          try {
            await sincronizarEspacioTrabajoLocal(usuario)
            aplicarEstadoUsuario(usuario)

            if (!usuario) {
              await asegurarSesionAnonima()
              return
            }

            await sincronizarPerfilConReintento(usuario)
            await ejecutarMigracionAutomaticaSiCorresponde(usuario)

            if (!primerEventoRecibido) {
              primerEventoRecibido = true
              cargandoSesion.value = false
              resolve(usuario)
            }
          } catch (error) {
            if (esErrorPermisosFirestore(error)) {
              console.warn('Permisos transitorios durante cambio de sesión:', error?.code || error?.message)

              if (!primerEventoRecibido) {
                primerEventoRecibido = true
                cargandoSesion.value = false
                resolve(usuario || null)
              }
              return
            }

            console.error('Error al procesar cambio de sesión:', error)
            errorSesion.value = 'No se pudo sincronizar la sesión'

            if (!primerEventoRecibido) {
              primerEventoRecibido = true
              cargandoSesion.value = false
              resolve(null)
            }
          }
        })
        return
      }

      const usuarioActual = servicioAuthFirebase.obtenerUsuarioActual()
      sincronizarEspacioTrabajoLocal(usuarioActual)
        .catch((error) => {
          console.warn('No se pudo sincronizar espacio de trabajo local:', error)
        })
        .finally(() => {
          aplicarEstadoUsuario(usuarioActual)
          cargandoSesion.value = false
          resolve(usuarioActual)
        })
    }).finally(() => {
      promesaInicializacion = null
    })

    return promesaInicializacion
  }

  async function iniciarSesionConGoogle() {
    errorSesion.value = null

    try {
      const usuario = await servicioAuthFirebase.iniciarSesionConGoogle()
      if (!usuario) {
        return true
      }
      await sincronizarEspacioTrabajoLocal(usuario)
      await sincronizarPerfilUsuario(usuario)
      aplicarEstadoUsuario(usuario)
      marcarAccesoInicialCompletado()
      return true
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error)
      errorSesion.value = resolverMensajeErrorAuth(error, 'google')
      return false
    }
  }

  async function iniciarSesionConCorreo(email, contrasena) {
    errorSesion.value = null

    try {
      const usuario = await servicioAuthFirebase.iniciarSesionConCorreo(email, contrasena)
      await sincronizarEspacioTrabajoLocal(usuario)
      await sincronizarPerfilUsuario(usuario)
      aplicarEstadoUsuario(usuario)
      marcarAccesoInicialCompletado()
      return true
    } catch (error) {
      console.error('Error al iniciar sesión con correo:', error)
      errorSesion.value = resolverMensajeErrorAuth(error, 'loginCorreo')
      return false
    }
  }

  async function registrarConCorreo(email, contrasena) {
    errorSesion.value = null

    try {
      const usuario = await servicioAuthFirebase.registrarConCorreo(email, contrasena)
      await sincronizarEspacioTrabajoLocal(usuario)
      await sincronizarPerfilUsuario(usuario)
      aplicarEstadoUsuario(usuario)
      marcarAccesoInicialCompletado()
      return true
    } catch (error) {
      console.error('Error al registrar con correo:', error)
      errorSesion.value = resolverMensajeErrorAuth(error, 'registroCorreo')
      return false
    }
  }

  async function recuperarContrasena(email) {
    errorSesion.value = null

    try {
      await servicioAuthFirebase.enviarRecuperacionContrasena(email)
      return true
    } catch (error) {
      console.error('Error al enviar recuperación de contraseña:', error)
      errorSesion.value = resolverMensajeErrorAuth(error, 'recuperarContrasena')
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
      const usuarioAnonimo = await servicioAuthFirebase.iniciarSesionAnonimaSiNoExiste()
      await sincronizarEspacioTrabajoLocal(usuarioAnonimo)
      marcarAccesoInicialCompletado()
      return true
    } catch (error) {
      console.error('Error al continuar como invitado:', error)
      errorSesion.value = 'No se pudo continuar como invitado'
      return false
    }
  }

  async function cerrarSesion() {
    accesoInicialCompletado.value = false
    localStorage.removeItem(CLAVE_ACCESO_INICIAL)
    await servicioAuthFirebase.cerrarSesionActual()
  }

  function marcarAccesoInicialCompletado() {
    accesoInicialCompletado.value = true
    localStorage.setItem(CLAVE_ACCESO_INICIAL, '1')
  }

  async function migrarDatosLocales(opciones = {}) {
    if (!usuarioId.value) {
      errorMigracion.value = 'No hay sesión activa para migrar datos'
      return null
    }

    cargandoMigracion.value = true
    errorMigracion.value = null

    try {
      const resumen = await servicioMigracionLocalFirestore.migrarDatosLocalesAFirestore(
        usuarioId.value,
        opciones,
      )
      ultimoResumenMigracion.value = resumen
      await recargarContextoDatos()
      return resumen
    } catch (error) {
      console.error('Error al migrar datos locales:', error)
      errorMigracion.value = 'No se pudo migrar los datos locales a Firebase'
      return null
    } finally {
      cargandoMigracion.value = false
    }
  }

  async function actualizarPerfilEditable(datosPerfilEditable) {
    if (!usuarioId.value) {
      errorPerfil.value = 'No hay sesión activa para actualizar el perfil'
      return false
    }

    cargandoPerfil.value = true
    errorPerfil.value = null

    try {
      const datosGuardados = await servicioFirestoreUsuarios.guardarPerfilEditable(
        usuarioId.value,
        datosPerfilEditable,
      )

      perfil.value = {
        ...(perfil.value || {}),
        ...datosGuardados,
      }

      return true
    } catch (error) {
      console.error('Error al actualizar perfil editable:', error)
      errorPerfil.value = 'No se pudo guardar el perfil'
      return false
    } finally {
      cargandoPerfil.value = false
    }
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
    cargandoMigracion.value = false
    errorMigracion.value = null
    ultimoResumenMigracion.value = null
    cargandoPerfil.value = false
    errorPerfil.value = null
    accesoInicialCompletado.value = false
    uidMigracionAutomaticaEnSesion = null
    if (typeof window !== 'undefined' && listenerConexionRegistrado && manejarVueltaConexion) {
      window.removeEventListener('online', manejarVueltaConexion)
    }
    manejarVueltaConexion = null
    listenerConexionRegistrado = false
  }

  return {
    usuarioId,
    autenticado,
    esAnonimo,
    perfil,
    cargandoSesion,
    errorSesion,
    cargandoMigracion,
    errorMigracion,
    ultimoResumenMigracion,
    cargandoPerfil,
    errorPerfil,
    accesoInicialCompletado,
    tieneSesionActiva,
    tieneSesionRealActiva,
    inicializarSesion,
    iniciarSesionConGoogle,
    iniciarSesionConCorreo,
    registrarConCorreo,
    recuperarContrasena,
    continuarComoInvitado,
    migrarDatosLocales,
    actualizarPerfilEditable,
    marcarAccesoInicialCompletado,
    cerrarSesion,
    limpiarSesionLocal,
  }
})
