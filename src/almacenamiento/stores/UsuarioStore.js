import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import servicioAuthFirebase from '../../Firebase/ServicioAuthFirebase.js'
import servicioFirestoreUsuarios from '../../Firebase/ServicioFirestoreUsuarios.js'
import servicioMigracionLocalFirestore from '../../Firebase/ServicioMigracionLocalFirestore.js'
import {
  adaptadorActual,
  configurarEspacioTrabajoAlmacenamiento,
} from '../servicios/AlmacenamientoService.js'
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
  let detenerEscuchaEstadoSincronizacion = null
  let promesaInicializacion = null
  let espacioTrabajoActual = null
  let uidMigracionAutomaticaEnSesion = null
  let listenerConexionRegistrado = false
  let manejarVueltaConexion = null
  let temporizadorSincronizacionAutomatica = null
  let temporizadorSincronizacionRemota = null
  let temporizadorSolicitudSincronizacionRemota = null
  let motivoSolicitudSincronizacionRemota = 'remoto'
  let opcionesSolicitudSincronizacionRemota = {}
  let sincronizacionAutomaticaEnCurso = false
  let sincronizacionRemotaEnCurso = false
  let promesaSincronizacionRemotaEnCurso = null
  let sincronizacionAutomaticaReprogramada = false
  let ultimoMotivoSincronizacion = null
  const motivosPendientes = new Set()
  const cambiosPendientesSincronizacion = {
    productos: new Set(),
    comercios: new Set(),
    listasJustas: new Set(),
    preferencias: false,
    sesionEscaneo: false,
    perfil: false,
    eliminaciones: false,
  }
  const CLAVE_ACCESO_INICIAL = 'acceso_inicial_completado'
  const CLAVE_PERFIL_EDITABLE_PENDIENTE = 'perfil_editable_pendiente'
  const CLAVE_SINCRONIZACION_PENDIENTE = 'sincronizacion_pendiente_firestore'
  const RETRASO_SINCRONIZACION_MS = 1200
  const RETRASO_SINCRONIZACION_REMOTA_POST_LOCAL_MS = 1200
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
      codigo.includes('resource-exhausted') ||
      codigo.includes('firestore/pausado') ||
      codigo.includes('deadline-exceeded') ||
      codigo.includes('unavailable') ||
      codigo.includes('network') ||
      mensaje.includes('quota exceeded') ||
      mensaje.includes('firestore pausado') ||
      mensaje.includes('timeout') ||
      mensaje.includes('network') ||
      mensaje.includes('offline') ||
      mensaje.includes('failed to fetch')
    )
  }

  function aplicarPerfilLocalTemporal(usuario) {
    if (!usuario) return

    const datosProveedor = servicioFirestoreUsuarios.resolverDatosPerfilDesdeUsuario(usuario)
    perfil.value = {
      ...datosProveedor,
      ...(perfil.value || {}),
      usuarioId: usuario.uid,
      tipoCuenta: usuario.isAnonymous ? 'anonima' : 'registrada',
      perfilEditable: perfil.value?.perfilEditable || {
        nombre: datosProveedor.nombre,
        foto: datosProveedor.foto,
        fechaNacimiento: null,
        edad: null,
      },
      sincronizacionPerfilPendiente: true,
    }
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

  async function recargarContextoDatos(opciones = {}) {
    const limpiarAntes = opciones?.limpiarAntes === true
    const productosStore = useProductosStore()
    const comerciosStore = useComerciStore()
    const listaJustaStore = useListaJustaStore()
    const sesionEscaneoStore = useSesionEscaneoStore()
    const { usePreferenciasStore } = await import('./preferenciasStore.js')
    const preferenciasStore = usePreferenciasStore()

    if (limpiarAntes) {
      productosStore.limpiarEstado()
      comerciosStore.comercios = []
      listaJustaStore.listas = []
    }

    await Promise.all([
      productosStore.cargarProductos(),
      comerciosStore.cargarComercios(),
      listaJustaStore.cargarListas({ silencioso: !limpiarAntes }),
      sesionEscaneoStore.cargarSesion(),
      preferenciasStore.inicializar(),
    ])
  }

  async function sincronizarEspacioTrabajoLocal(usuario) {
    const nuevoEspacioTrabajo = resolverEspacioTrabajo(usuario)
    const cambioEspacioTrabajo = espacioTrabajoActual !== nuevoEspacioTrabajo

    if (!cambioEspacioTrabajo) return

    detenerEscuchaEstadoSincronizacionRemota()
    configurarEspacioTrabajoAlmacenamiento(nuevoEspacioTrabajo)
    espacioTrabajoActual = nuevoEspacioTrabajo
    await recargarContextoDatos({ limpiarAntes: true })
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
      console.info('Migración automática pendiente por Firebase temporalmente no disponible.')
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

  async function guardarSincronizacionPendienteLocal() {
    try {
      await adaptadorActual.guardar(CLAVE_SINCRONIZACION_PENDIENTE, {
        motivos: Array.from(motivosPendientes.values()),
        cambios: clonarCambiosPendientesSincronizacion(),
        fechaActualizacion: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('No se pudo persistir la sincronización pendiente:', error?.message || error)
    }
  }

  function aplicarCambiosPendientesPersistidos(cambiosPersistidos = {}) {
    const restaurarSet = (campo, valor) => {
      if (valor === true) {
        cambiosPendientesSincronizacion[campo] = true
        return
      }
      if (Array.isArray(valor) && valor.length > 0) {
        cambiosPendientesSincronizacion[campo] = new Set(
          valor
            .map((id) => String(id || '').trim())
            .filter(Boolean),
        )
      }
    }

    restaurarSet('productos', cambiosPersistidos.productos)
    restaurarSet('comercios', cambiosPersistidos.comercios)
    restaurarSet('listasJustas', cambiosPersistidos.listasJustas)
    if (cambiosPersistidos.preferencias === true) cambiosPendientesSincronizacion.preferencias = true
    if (cambiosPersistidos.sesionEscaneo === true) cambiosPendientesSincronizacion.sesionEscaneo = true
    if (cambiosPersistidos.perfil === true) cambiosPendientesSincronizacion.perfil = true
    if (cambiosPersistidos.eliminaciones === true) cambiosPendientesSincronizacion.eliminaciones = true
  }

  async function restaurarSincronizacionPendienteLocal() {
    try {
      const estadoPendiente = await adaptadorActual.obtener(CLAVE_SINCRONIZACION_PENDIENTE)
      if (!estadoPendiente) return false

      const motivos = Array.isArray(estadoPendiente.motivos) ? estadoPendiente.motivos : []
      motivos
        .map((motivo) => String(motivo || '').trim().toLowerCase())
        .filter(Boolean)
        .forEach((motivo) => motivosPendientes.add(motivo))

      aplicarCambiosPendientesPersistidos(estadoPendiente.cambios || {})
      pendientesSincronizacion.value = Array.from(motivosPendientes.values())
      return pendientesSincronizacion.value.length > 0
    } catch (error) {
      console.warn('No se pudo restaurar la sincronización pendiente:', error?.message || error)
      return false
    }
  }

  async function limpiarSincronizacionPendienteLocal() {
    try {
      await adaptadorActual.eliminar(CLAVE_SINCRONIZACION_PENDIENTE)
    } catch (error) {
      console.warn('No se pudo limpiar la sincronización pendiente local:', error?.message || error)
    }
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

  async function guardarPerfilEditablePendiente(datosPerfilEditable) {
    const guardado = await adaptadorActual.guardar(CLAVE_PERFIL_EDITABLE_PENDIENTE, {
      ...datosPerfilEditable,
      fechaPendiente: new Date().toISOString(),
    })
    if (!guardado) {
      console.warn('No se pudo guardar el perfil pendiente para reintento.')
    }
    return guardado
  }

  async function obtenerPerfilEditablePendiente() {
    return adaptadorActual.obtener(CLAVE_PERFIL_EDITABLE_PENDIENTE)
  }

  async function limpiarPerfilEditablePendiente() {
    await adaptadorActual.eliminar(CLAVE_PERFIL_EDITABLE_PENDIENTE)
  }

  async function sincronizarPerfilEditablePendiente() {
    if (!tieneSesionRealActiva.value || !usuarioId.value) return false

    const perfilPendiente = await obtenerPerfilEditablePendiente()
    if (!perfilPendiente) return false

    try {
      const datosGuardados = await servicioFirestoreUsuarios.guardarPerfilEditable(
        usuarioId.value,
        perfilPendiente,
      )
      perfil.value = {
        ...(perfil.value || {}),
        ...datosGuardados,
      }
      await limpiarPerfilEditablePendiente()
      solicitarSincronizacionRemota('post_perfil_editable_guardado', { retrasoMs: 400 })
      return true
    } catch (error) {
      if (!esErrorConectividad(error)) {
        console.warn('No se pudo sincronizar el perfil pendiente:', error)
      }
      return false
    }
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
    if (usuario?.isAnonymous) {
      aplicarPerfilLocalTemporal(usuario)
      return
    }

    try {
      await sincronizarPerfilUsuario(usuario)
      return
    } catch (error) {
      if (esErrorConectividad(error)) {
        aplicarPerfilLocalTemporal(usuario)
        return
      }

      if (!esErrorPermisosFirestore(error)) {
        throw error
      }
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 350))
      await sincronizarPerfilUsuario(usuario)
    } catch (error) {
      if (esErrorConectividad(error)) {
        aplicarPerfilLocalTemporal(usuario)
        return
      }
      throw error
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
              detenerEscuchaEstadoSincronizacionRemota()
              detenerIntervaloSincronizacionRemota()
              await asegurarSesionAnonima()
              return
            }

            await sincronizarPerfilConReintento(usuario)
            void sincronizarPerfilEditablePendiente()
            const habiaPendientes = await restaurarSincronizacionPendienteLocal()
            void ejecutarMigracionAutomaticaSiCorresponde(usuario)
            if (habiaPendientes) {
              void solicitarSincronizacionAutomatica('pendientes_restaurados')
            }
            void solicitarSincronizacionRemota('arranque_sesion', {
              retrasoMs: RETRASO_SINCRONIZACION_REMOTA_ARRANQUE_MS,
            })
            iniciarEscuchaEstadoSincronizacionRemota()
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
            void restaurarSincronizacionPendienteLocal().then((habiaPendientes) => {
              if (habiaPendientes) {
                void solicitarSincronizacionAutomatica('pendientes_restaurados')
              }
            })
            iniciarIntervaloSincronizacionRemota()
            iniciarEscuchaEstadoSincronizacionRemota()
            void solicitarSincronizacionRemota('arranque_sesion', {
              retrasoMs: RETRASO_SINCRONIZACION_REMOTA_ARRANQUE_MS,
            })
          } else {
            detenerEscuchaEstadoSincronizacionRemota()
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
      await sincronizarPerfilConReintento(usuario)
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
      await sincronizarPerfilConReintento(usuario)
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
      await sincronizarPerfilConReintento(usuario)
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
      if (esErrorConectividad(error)) {
        console.info('Migración local pendiente por Firebase temporalmente no disponible:', error?.code || error?.message)
        errorMigracion.value = 'Firebase no está disponible ahora. Los datos locales quedan pendientes de sincronización.'
        return null
      }

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
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
    return true
  }

  function hayCambiosLocalesPendientes() {
    return (
      motivosPendientes.size > 0 ||
      pendientesSincronizacion.value.length > 0 ||
      sincronizacionAutomaticaEnCurso
    )
  }

  function agregarIdsPendientes(campo, ids) {
    const destino = cambiosPendientesSincronizacion[campo]
    if (!(destino instanceof Set)) return

    ids
      .map((id) => String(id || '').trim())
      .filter(Boolean)
      .forEach((id) => destino.add(id))
  }

  function registrarCambioPendientePorMotivo(motivo, cambio = {}) {
    const motivoNormalizado = String(motivo || '').trim().toLowerCase()
    const idsProductos = [
      cambio.productoId,
      ...(Array.isArray(cambio.productos) ? cambio.productos : []),
    ]
    const idsComercios = [
      cambio.comercioId,
      ...(Array.isArray(cambio.comercios) ? cambio.comercios : []),
    ]
    const idsListas = [
      cambio.listaId,
      ...(Array.isArray(cambio.listasJustas) ? cambio.listasJustas : []),
    ]

    agregarIdsPendientes('productos', idsProductos)
    agregarIdsPendientes('comercios', idsComercios)
    agregarIdsPendientes('listasJustas', idsListas)

    if (cambio.preferencias || motivoNormalizado.includes('preferencias')) {
      cambiosPendientesSincronizacion.preferencias = true
    }
    if (
      cambio.sesionEscaneo ||
      motivoNormalizado.includes('sesion_escaneo') ||
      motivoNormalizado.includes('mesa')
    ) {
      cambiosPendientesSincronizacion.sesionEscaneo = true
    }
    if (cambio.perfil || motivoNormalizado.includes('perfil')) {
      cambiosPendientesSincronizacion.perfil = true
    }
    if (cambio.eliminaciones || motivoNormalizado.includes('eliminado')) {
      cambiosPendientesSincronizacion.eliminaciones = true
    }

    if (idsProductos.filter(Boolean).length === 0) {
      if (
        motivoNormalizado.includes('producto') ||
        motivoNormalizado.includes('precio') ||
        motivoNormalizado.includes('confirmacion')
      ) {
        cambiosPendientesSincronizacion.productos = true
      }
    }
    if (idsComercios.filter(Boolean).length === 0) {
      if (
        motivoNormalizado.includes('comercio') ||
        motivoNormalizado.includes('direccion') ||
        motivoNormalizado.includes('foto_direccion')
      ) {
        cambiosPendientesSincronizacion.comercios = true
      }
    }
    if (idsListas.filter(Boolean).length === 0 && motivoNormalizado.includes('lista')) {
      cambiosPendientesSincronizacion.listasJustas = true
    }
  }

  function clonarCambiosPendientesSincronizacion() {
    const clonarCampo = (valor) => {
      if (valor === true) return true
      if (valor instanceof Set) return Array.from(valor.values())
      return false
    }

    return {
      productos: clonarCampo(cambiosPendientesSincronizacion.productos),
      comercios: clonarCampo(cambiosPendientesSincronizacion.comercios),
      listasJustas: clonarCampo(cambiosPendientesSincronizacion.listasJustas),
      preferencias: cambiosPendientesSincronizacion.preferencias,
      sesionEscaneo: cambiosPendientesSincronizacion.sesionEscaneo,
      perfil: cambiosPendientesSincronizacion.perfil,
      eliminaciones: cambiosPendientesSincronizacion.eliminaciones,
    }
  }

  function limpiarCambiosPendientesSincronizacion() {
    cambiosPendientesSincronizacion.productos = new Set()
    cambiosPendientesSincronizacion.comercios = new Set()
    cambiosPendientesSincronizacion.listasJustas = new Set()
    cambiosPendientesSincronizacion.preferencias = false
    cambiosPendientesSincronizacion.sesionEscaneo = false
    cambiosPendientesSincronizacion.perfil = false
    cambiosPendientesSincronizacion.eliminaciones = false
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
      await sincronizarPerfilEditablePendiente()
      const cambiosPendientes = clonarCambiosPendientesSincronizacion()
      const resumen = await servicioMigracionLocalFirestore.sincronizarCambiosLocalesAFirestore(
        usuarioId.value,
        cambiosPendientes,
      )
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
      limpiarCambiosPendientesSincronizacion()
      await limpiarSincronizacionPendienteLocal()
      solicitarSincronizacionRemota('post_sincronizacion_local', {
        forzar: true,
        retrasoMs: RETRASO_SINCRONIZACION_REMOTA_POST_LOCAL_MS,
      })
      return true
    } catch (error) {
      if (esErrorConectividad(error)) {
        console.info('Sincronización automática pendiente por Firebase temporalmente no disponible:', error?.code || error?.message)
        ultimoErrorSincronizacionAutomatica.value = 'Firebase no está disponible ahora. Los cambios quedaron guardados localmente.'
        return false
      }

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

  function registrarPendienteSincronizacion(motivo = 'operacion', cambio = {}) {
    const motivoNormalizado = String(motivo || 'operacion').trim().toLowerCase()
    if (!motivoNormalizado) return

    motivosPendientes.add(motivoNormalizado)
    registrarCambioPendientePorMotivo(motivoNormalizado, cambio)
    pendientesSincronizacion.value = Array.from(motivosPendientes.values())
    void guardarSincronizacionPendienteLocal()
  }

  function solicitarSincronizacionAutomatica(motivo = 'operacion', cambio = {}) {
    if (!tieneSesionRealActiva.value) return false
    registrarPendienteSincronizacion(motivo, cambio)

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

  function detenerEscuchaEstadoSincronizacionRemota() {
    if (!detenerEscuchaEstadoSincronizacion) return
    detenerEscuchaEstadoSincronizacion()
    detenerEscuchaEstadoSincronizacion = null
  }

  function iniciarEscuchaEstadoSincronizacionRemota() {
    if (detenerEscuchaEstadoSincronizacion) return
    if (!tieneSesionRealActiva.value || !usuarioId.value) return

    try {
      detenerEscuchaEstadoSincronizacion =
        servicioMigracionLocalFirestore.escucharEstadoSincronizacion(
          usuarioId.value,
          (estado) => {
            const sincronizacionId = String(estado?.sincronizacionId || '').trim()
            if (!sincronizacionId) return
            if (hayCambiosLocalesPendientes()) return

            void ejecutarSincronizacionRemota('estado_sincronizacion_remoto', {
              forzar: false,
            })
          },
          (error) => {
            if (esErrorConectividad(error)) {
              console.info(
                'Escucha de sincronización remota pausada:',
                error?.code || error?.message,
              )
              return
            }

            console.warn('Error en escucha de estado de sincronización:', error)
          },
        )
    } catch (error) {
      if (esErrorConectividad(error)) {
        console.info(
          'No se inició la escucha de sincronización remota:',
          error?.code || error?.message,
        )
        return
      }

      console.warn('No se pudo iniciar la escucha de estado de sincronización:', error)
    }
  }

  async function ejecutarSincronizacionRemota(motivo = 'remoto', opciones = {}) {
    if (!puedeSincronizarRemoto()) return false
    if (hayCambiosLocalesPendientes() && opciones?.permitirConPendientes !== true) {
      return false
    }
    if (sincronizacionRemotaEnCurso && promesaSincronizacionRemotaEnCurso) {
      return promesaSincronizacionRemotaEnCurso
    }
    if (!usuarioId.value) return false

    sincronizacionRemotaEnCurso = true
    ultimoErrorSincronizacionRemota.value = null

    promesaSincronizacionRemotaEnCurso = (async () => {
      try {
        const resumenRemoto = await servicioMigracionLocalFirestore.sincronizarDesdeFirestoreALocalSiCambio(
          usuarioId.value,
          opciones,
        )
        if (!resumenRemoto?.sinCambios) {
          await recargarContextoDatos()
        }
        ultimaSincronizacionRemota.value = {
          fecha: new Date().toISOString(),
          motivo,
          resumen: resumenRemoto,
        }
        return true
      } catch (error) {
        if (esErrorConectividad(error)) {
          console.info('Actualización remota pausada por Firebase temporalmente no disponible:', error?.code || error?.message)
          ultimoErrorSincronizacionRemota.value = 'Firebase no está disponible ahora. Se usan los datos locales.'
          return false
        }

        console.error('Error en sincronización remota:', error)
        ultimoErrorSincronizacionRemota.value = 'No se pudo actualizar desde la nube en segundo plano.'
        return false
      } finally {
        sincronizacionRemotaEnCurso = false
        promesaSincronizacionRemotaEnCurso = null
      }
    })()

    return promesaSincronizacionRemotaEnCurso
  }

  async function sincronizarRemotoAhora(motivo = 'remoto', opciones = {}) {
    if (temporizadorSolicitudSincronizacionRemota) {
      clearTimeout(temporizadorSolicitudSincronizacionRemota)
      temporizadorSolicitudSincronizacionRemota = null
    }
    return ejecutarSincronizacionRemota(motivo, {
      ...opciones,
      forzar: opciones?.forzar === true,
    })
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

    if (temporizadorSolicitudSincronizacionRemota) {
      clearTimeout(temporizadorSolicitudSincronizacionRemota)
    }

    motivoSolicitudSincronizacionRemota = motivo
    opcionesSolicitudSincronizacionRemota = { ...opciones }

    temporizadorSolicitudSincronizacionRemota = setTimeout(() => {
      temporizadorSolicitudSincronizacionRemota = null
      void ejecutarSincronizacionRemota(
        motivoSolicitudSincronizacionRemota,
        opcionesSolicitudSincronizacionRemota,
      )
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
    await guardarPerfilEditablePendiente(datosLocalesNormalizados.perfilEditable)
    solicitarSincronizacionAutomatica('perfil_actualizado', { perfil: true })

    try {
      const datosGuardados = await servicioFirestoreUsuarios.guardarPerfilEditable(
        usuarioId.value,
        datosPerfilEditable,
      )

      perfil.value = {
        ...(perfil.value || {}),
        ...datosGuardados,
      }
      await limpiarPerfilEditablePendiente()
      return true
    } catch (error) {
      if (esErrorConectividad(error)) {
        console.info('Perfil editable pendiente por Firebase temporalmente no disponible:', error?.code || error?.message)
        errorPerfil.value = 'Sin conexión: el perfil se guardó localmente y se sincronizará cuando vuelva internet.'
        return true
      }
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
    if (temporizadorSolicitudSincronizacionRemota) {
      clearTimeout(temporizadorSolicitudSincronizacionRemota)
      temporizadorSolicitudSincronizacionRemota = null
    }
    detenerEscuchaEstadoSincronizacionRemota()
    detenerIntervaloSincronizacionRemota()
    sincronizacionAutomaticaEnCurso = false
    sincronizacionAutomaticaReprogramada = false
    promesaSincronizacionRemotaEnCurso = null
    ultimoMotivoSincronizacion = null
    motivosPendientes.clear()
    limpiarCambiosPendientesSincronizacion()
    void limpiarSincronizacionPendienteLocal()
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
    sincronizarRemotoAhora,
    actualizarPerfilEditable,
    marcarAccesoInicialCompletado,
    cerrarSesion,
    limpiarSesionLocal,
  }
})
