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
  const ultimaSincronizacionAutomatica = ref(null)
  const ultimoErrorSincronizacionAutomatica = ref(null)
  const ultimaSincronizacionRemota = ref(null)
  const ultimoErrorSincronizacionRemota = ref(null)
  const pendientesSincronizacion = ref([])

  let detenerEscuchaSesion = null
  let promesaInicializacion = null
  let espacioTrabajoActual = null
  let uidMigracionAutomaticaEnSesion = null
  let listenerConexionRegistrado = false
  let manejarVueltaConexion = null
  let temporizadorSincronizacionAutomatica = null
  let temporizadorSincronizacionRemota = null
  let sincronizacionAutomaticaEnCurso = false
  let sincronizacionRemotaEnCurso = false
  let sincronizacionAutomaticaReprogramada = false
  let ultimoMotivoSincronizacion = null
  const motivosPendientes = new Set()
  const CLAVE_ACCESO_INICIAL = 'acceso_inicial_completado'
  const RETRASO_SINCRONIZACION_MS = 1200
  const RETRASO_SINCRONIZACION_REMOTA_MS = 2500
  const RETRASO_SINCRONIZACION_REMOTA_ARRANQUE_MS = 8000
  const INTERVALO_SINCRONIZACION_REMOTA_MS = 90000

  const tieneSesionActiva = computed(() => autenticado.value && !!usuarioId.value)
  const tieneSesionRealActiva = computed(
    () => autenticado.value && !!usuarioId.value && !esAnonimo.value,
  )
  const cantidadPendientesSincronizacion = computed(() => pendientesSincronizacion.value.length)
  const hayPendientesSincronizacion = computed(() => cantidadPendientesSincronizacion.value > 0)

  function esErrorPermisosFirestore(error) {
    return error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')
  }

  function esErrorConectividad(error) {
    const codigo = String(error?.code || '').toLowerCase()
    const mensaje = String(error?.message || '').toLowerCase()
    return (
      codigo.includes('unavailable') ||
      codigo.includes('network') ||
      mensaje.includes('network') ||
      mensaje.includes('offline') ||
      mensaje.includes('failed to fetch')
    )
  }
  function registrarDesajusteUidEnPerfil(usuarioUid, perfilUid) {
    const uidSesion = String(usuarioUid || '').trim()
    const uidPerfil = String(perfilUid || '').trim()
    if (!uidSesion || !uidPerfil || uidSesion === uidPerfil) return false

    const mensaje = 'Se detectó un desajuste de sesión. Se actualizará el perfil con el usuario activo.'
    console.error('[SeguridadSesion] desajuste uid', { uidSesion, uidPerfil })
    errorSesion.value = mensaje
    return true
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
    const resumen = await migrarDatosLocales({
      incluirEspacioCompartido: true,
      recargarContexto: true,
    })

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
      await solicitarSincronizacionAutomatica('reconexion')
      await solicitarSincronizacionRemota('reconexion')
    }

    window.addEventListener('online', manejarVueltaConexion)
    listenerConexionRegistrado = true
  }

  function registrarEscuchaVisibilidad() {
    if (typeof window === 'undefined') return
    if (window.__precioJustoEscuchaVisibilidadRegistrada) return

    const alVolverVisible = () => {
      if (document.visibilityState !== 'visible') return
      void solicitarSincronizacionRemota('vuelta_visible')
    }

    window.addEventListener('visibilitychange', alVolverVisible)
    window.__precioJustoEscuchaVisibilidadRegistrada = true
    window.__precioJustoAlVolverVisible = alVolverVisible
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
    const existeDesajuste = registrarDesajusteUidEnPerfil(usuario.uid, perfil.value?.usuarioId)
    if (existeDesajuste) {
      perfil.value = {
        ...perfil.value,
        usuarioId: usuario.uid,
      }
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
    registrarEscuchaVisibilidad()

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
              detenerIntervaloSincronizacionRemota()
              await asegurarSesionAnonima()
              return
            }

            await sincronizarPerfilConReintento(usuario)
            void ejecutarMigracionAutomaticaSiCorresponde(usuario)
            void solicitarSincronizacionRemota('arranque_sesion', {
              retrasoMs: RETRASO_SINCRONIZACION_REMOTA_ARRANQUE_MS,
            })
            iniciarIntervaloSincronizacionRemota()

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
          if (usuarioActual && !usuarioActual.isAnonymous) {
            iniciarIntervaloSincronizacionRemota()
            void solicitarSincronizacionRemota('arranque_sesion', {
              retrasoMs: RETRASO_SINCRONIZACION_REMOTA_ARRANQUE_MS,
            })
          } else {
            detenerIntervaloSincronizacionRemota()
          }
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
      pendientesSincronizacion.value = []
      motivosPendientes.clear()
      if (opciones.recargarContexto === true) {
        await recargarContextoDatos()
      }
      return resumen
    } catch (error) {
      console.error('Error al migrar datos locales:', error)
      errorMigracion.value = 'No se pudo migrar los datos locales a Firebase'
      return null
    } finally {
      cargandoMigracion.value = false
    }
  }

  function puedeSincronizarAutomaticamente() {
    if (!tieneSesionRealActiva.value) return false
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
    return true
  }

  function puedeSincronizarRemoto() {
    if (!tieneSesionRealActiva.value) return false
    if (hayPendientesSincronizacion.value) return false
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
    return true
  }

  async function ejecutarSincronizacionAutomatica(motivo = 'operacion') {
    if (!puedeSincronizarAutomaticamente()) return false

    if (sincronizacionAutomaticaEnCurso) {
      sincronizacionAutomaticaReprogramada = true
      return false
    }

    sincronizacionAutomaticaEnCurso = true
    ultimoMotivoSincronizacion = motivo
    ultimoErrorSincronizacionAutomatica.value = null

    try {
      const resumen = await migrarDatosLocales()
      if (!resumen) {
        ultimoErrorSincronizacionAutomatica.value = 'No se pudo completar la sincronización automática.'
        return false
      }

      ultimaSincronizacionAutomatica.value = {
        fecha: new Date().toISOString(),
        motivo,
      }
      pendientesSincronizacion.value = []
      motivosPendientes.clear()
      return true
    } catch (error) {
      console.error('Error en sincronización automática:', error)
      ultimoErrorSincronizacionAutomatica.value = 'Ocurrió un error en la sincronización automática.'
      return false
    } finally {
      sincronizacionAutomaticaEnCurso = false

      if (sincronizacionAutomaticaReprogramada) {
        sincronizacionAutomaticaReprogramada = false
        solicitarSincronizacionAutomatica(ultimoMotivoSincronizacion || 'reintento')
      }
    }
  }

  function registrarPendienteSincronizacion(motivo = 'operacion') {
    const motivoNormalizado = String(motivo || 'operacion').trim().toLowerCase()
    if (!motivoNormalizado) return

    motivosPendientes.add(motivoNormalizado)
    pendientesSincronizacion.value = Array.from(motivosPendientes.values())
  }

  function solicitarSincronizacionAutomatica(motivo = 'operacion') {
    if (!tieneSesionRealActiva.value) return false
    registrarPendienteSincronizacion(motivo)

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      ultimoErrorSincronizacionAutomatica.value = 'Sin conexión. Se reintentará automáticamente al volver internet.'
      return true
    }

    if (temporizadorSincronizacionAutomatica) {
      clearTimeout(temporizadorSincronizacionAutomatica)
    }

    temporizadorSincronizacionAutomatica = setTimeout(() => {
      temporizadorSincronizacionAutomatica = null
      void ejecutarSincronizacionAutomatica(motivo)
    }, RETRASO_SINCRONIZACION_MS)

    return true
  }

  async function ejecutarSincronizacionRemota(motivo = 'remoto') {
    if (!puedeSincronizarRemoto()) return false
    if (sincronizacionRemotaEnCurso) return false
    if (!usuarioId.value) return false

    sincronizacionRemotaEnCurso = true
    ultimoErrorSincronizacionRemota.value = null

    try {
      const resumenRemoto = await servicioMigracionLocalFirestore.sincronizarDesdeFirestoreALocal(
        usuarioId.value,
      )
      await recargarContextoDatos()
      ultimaSincronizacionRemota.value = {
        fecha: new Date().toISOString(),
        motivo,
        resumen: resumenRemoto,
      }
      return true
    } catch (error) {
      console.error('Error en sincronización remota:', error)
      ultimoErrorSincronizacionRemota.value = 'No se pudo actualizar desde la nube en segundo plano.'
      return false
    } finally {
      sincronizacionRemotaEnCurso = false
    }
  }

  function iniciarIntervaloSincronizacionRemota() {
    if (temporizadorSincronizacionRemota || typeof window === 'undefined') return

    temporizadorSincronizacionRemota = window.setInterval(() => {
      void solicitarSincronizacionRemota('intervalo')
    }, INTERVALO_SINCRONIZACION_REMOTA_MS)
  }

  function detenerIntervaloSincronizacionRemota() {
    if (!temporizadorSincronizacionRemota) return
    clearInterval(temporizadorSincronizacionRemota)
    temporizadorSincronizacionRemota = null
  }

  function solicitarSincronizacionRemota(motivo = 'remoto', opciones = {}) {
    if (!tieneSesionRealActiva.value) return false
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
    const retrasoMs = Number(opciones?.retrasoMs)
    const retrasoNormalizado = Number.isFinite(retrasoMs) && retrasoMs >= 0
      ? retrasoMs
      : RETRASO_SINCRONIZACION_REMOTA_MS

    setTimeout(() => {
      void ejecutarSincronizacionRemota(motivo)
    }, retrasoNormalizado)

    return true
  }

  async function actualizarPerfilEditable(datosPerfilEditable) {
    if (!usuarioId.value) {
      errorPerfil.value = 'No hay sesión activa para actualizar el perfil'
      return false
    }

    cargandoPerfil.value = true
    errorPerfil.value = null

    const datosLocalesNormalizados = {
      nombre: (datosPerfilEditable.nombre || '').trim(),
      foto: (datosPerfilEditable.foto || '').trim() || null,
      fechaNacimiento: datosPerfilEditable.fechaNacimiento || null,
      edad:
        servicioFirestoreUsuarios.calcularEdadDesdeFecha(datosPerfilEditable.fechaNacimiento || null) || null,
      perfilEditable: {
        nombre: (datosPerfilEditable.nombre || '').trim(),
        foto: (datosPerfilEditable.foto || '').trim() || null,
        fechaNacimiento: datosPerfilEditable.fechaNacimiento || null,
        edad:
          servicioFirestoreUsuarios.calcularEdadDesdeFecha(datosPerfilEditable.fechaNacimiento || null) || null,
      },
      fechaActualizacion: new Date().toISOString(),
    }

    perfil.value = {
      ...(perfil.value || {}),
      ...datosLocalesNormalizados,
    }
    solicitarSincronizacionAutomatica('perfil_actualizado')

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
      if (esErrorConectividad(error)) {
        errorPerfil.value = 'Sin conexión: el perfil se guardó localmente y se sincronizará cuando vuelva internet.'
        return true
      }
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
    ultimaSincronizacionAutomatica.value = null
    ultimoErrorSincronizacionAutomatica.value = null
    ultimaSincronizacionRemota.value = null
    ultimoErrorSincronizacionRemota.value = null
    pendientesSincronizacion.value = []
    accesoInicialCompletado.value = false
    uidMigracionAutomaticaEnSesion = null
    if (temporizadorSincronizacionAutomatica) {
      clearTimeout(temporizadorSincronizacionAutomatica)
      temporizadorSincronizacionAutomatica = null
    }
    detenerIntervaloSincronizacionRemota()
    sincronizacionAutomaticaEnCurso = false
    sincronizacionAutomaticaReprogramada = false
    ultimoMotivoSincronizacion = null
    motivosPendientes.clear()
    if (typeof window !== 'undefined' && listenerConexionRegistrado && manejarVueltaConexion) {
      window.removeEventListener('online', manejarVueltaConexion)
    }
    manejarVueltaConexion = null
    listenerConexionRegistrado = false
    if (
      typeof window !== 'undefined' &&
      window.__precioJustoEscuchaVisibilidadRegistrada &&
      window.__precioJustoAlVolverVisible
    ) {
      window.removeEventListener('visibilitychange', window.__precioJustoAlVolverVisible)
      window.__precioJustoEscuchaVisibilidadRegistrada = false
      window.__precioJustoAlVolverVisible = null
    }
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
    ultimaSincronizacionAutomatica,
    ultimoErrorSincronizacionAutomatica,
    ultimaSincronizacionRemota,
    ultimoErrorSincronizacionRemota,
    pendientesSincronizacion,
    cantidadPendientesSincronizacion,
    hayPendientesSincronizacion,
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
    solicitarSincronizacionAutomatica,
    solicitarSincronizacionRemota,
    actualizarPerfilEditable,
    marcarAccesoInicialCompletado,
    cerrarSesion,
    limpiarSesionLocal,
  }
})
