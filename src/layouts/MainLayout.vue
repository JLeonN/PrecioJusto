<template>
  <q-layout view="hHh lpR fFf" :style="estiloLayout">
    <!-- HEADER -->
    <q-header :class="clasesHeader">
      <q-toolbar class="header-toolbar">
        <div class="header-left">
          <q-btn flat dense round aria-label="Menu" @click="toggleDrawer" :color="colorBotonMenu">
            <q-icon name="menu" />
            <q-badge
              v-if="sesionEscaneoStore.tieneItemsPendientes"
              floating
              color="negative"
              :label="sesionEscaneoStore.cantidadItems"
            />
          </q-btn>

          <transition name="inicio-header">
            <div v-if="!esInicioActivo" class="inicio-header-wrapper">
              <q-btn
                flat
                dense
                round
                aria-label="Ir a Inicio"
                class="boton-inicio-header"
                @click="irAInicio"
              >
                <IconHome :size="22" :style="obtenerEstiloIconoHeader(esInicioActivo, 'inicio')" />
              </q-btn>
            </div>
          </transition>

          <q-btn
            flat
            no-caps
            class="title-link"
            :style="estiloTituloHeader"
            @click="irAInicio"
          >
            <span class="title-text">Precio Justo</span>
          </q-btn>
        </div>

        <div class="header-actions">
          <q-btn
            flat
            round
            class="quick-access-btn"
            aria-label="Ir a Lista Justa"
            @click="irAListaJusta"
          >
            <IconListDetails :size="22" :style="obtenerEstiloIconoHeader(esListaJustaActiva, 'listaJusta')" />
          </q-btn>

          <q-btn
            flat
            round
            class="quick-access-btn"
            aria-label="Ir a Mis Productos"
            @click="irAMisProductos"
          >
            <IconClipboardList :size="22" :style="obtenerEstiloIconoHeader(esMisProductosActivo, 'misProductos')" />
          </q-btn>

          <q-btn
            flat
            round
            class="quick-access-btn"
            aria-label="Ir a Comercios"
            @click="irAComercios"
          >
            <IconMapPin :size="22" :style="obtenerEstiloIconoHeader(esComerciosActivo, 'comercios')" />
          </q-btn>

          <transition name="mesa-action">
            <div v-if="sesionEscaneoStore.tieneItemsPendientes" class="mesa-action-wrapper">
              <q-btn
                flat
                round
                class="quick-access-btn"
                aria-label="Ir a Mesa de trabajo"
                @click="irAMesaTrabajo"
              >
                <IconBriefcase :size="22" :style="obtenerEstiloIconoHeader(esMesaActivo, 'mesa')" />
              </q-btn>
            </div>
          </transition>
        </div>
      </q-toolbar>
    </q-header>

    <!-- DRAWER LATERAL -->
    <q-drawer
      v-model="drawerAbierto"
      :width="280"
      :breakpoint="9999"
      bordered
      overlay
      behavior="mobile"
      :class="clasesDrawer"
    >
      <div class="fit drawer-contenedor">
        <q-scroll-area class="drawer-scroll">
          <q-list padding class="drawer-lista">
            <!-- Header del drawer -->
            <q-item class="q-mb-md">
              <q-item-section avatar>
                <div class="logo-app-drawer-box">
                  <img
                    src="/icons/PrecioJusto-Icono.png"
                    alt="Icono de Precio Justo"
                    class="logo-app-drawer"
                  />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-h6 text-weight-bold"> Precio Justo </q-item-label>
                <q-item-label caption> Compará y ahorrá </q-item-label>
              </q-item-section>
            </q-item>

            <q-separator class="q-mb-md" />

            <!-- Opciones del menú -->
            <transition name="inicio-drawer">
              <q-item
                v-if="!esInicioActivo"
                clickable
                v-ripple
                to="/"
                exact
                class="item-drawer-principal"
                :class="{ 'item-drawer-principal-activo': esInicioActivo }"
                :style="{ '--color-item-drawer': 'var(--color-primario)' }"
              >
                <q-item-section avatar>
                  <div class="icono-drawer-principal">
                    <IconHome :size="24" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="titulo-drawer-principal">Inicio</q-item-label>
                  <q-item-label caption class="subtitulo-drawer-principal">
                    Pantalla principal
                  </q-item-label>
                </q-item-section>
              </q-item>
            </transition>

            <q-item
              clickable
              v-ripple
              to="/lista-justa"
              exact
              class="item-drawer-principal"
              :class="{ 'item-drawer-principal-activo': esListaJustaActiva }"
              :style="{ '--color-item-drawer': 'var(--color-secundario)' }"
            >
              <q-item-section avatar>
                <div class="icono-drawer-principal">
                  <IconListDetails :size="24" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="titulo-drawer-principal">Lista Justa</q-item-label>
                <q-item-label caption class="subtitulo-drawer-principal">
                  Armá tu compra
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              to="/mis-productos"
              class="item-drawer-principal"
              :class="{ 'item-drawer-principal-activo': esMisProductosActivo }"
              :style="{ '--color-item-drawer': 'var(--color-primario)' }"
            >
              <q-item-section avatar>
                <div class="icono-drawer-principal">
                  <IconClipboardList :size="24" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="titulo-drawer-principal">Mis Productos</q-item-label>
                <q-item-label caption class="subtitulo-drawer-principal">
                  Gestioná productos
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              to="/comercios"
              class="item-drawer-principal"
              :class="{ 'item-drawer-principal-activo': esComerciosActivo }"
              :style="{ '--color-item-drawer': 'var(--color-acento)' }"
            >
              <q-item-section avatar>
                <div class="icono-drawer-principal">
                  <IconMapPin :size="24" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="titulo-drawer-principal">Comercios</q-item-label>
                <q-item-label caption class="subtitulo-drawer-principal">
                  Locales y sucursales
                </q-item-label>
              </q-item-section>
            </q-item>

            <!-- Mesa de trabajo (solo visible con items pendientes) -->
            <q-item
              v-if="sesionEscaneoStore.tieneItemsPendientes"
              clickable
              v-ripple
              to="/mesa-trabajo"
              class="item-drawer-principal"
              :class="{ 'item-drawer-principal-activo': esMesaActivo }"
              :style="{ '--color-item-drawer': 'var(--color-primario)' }"
            >
              <q-item-section avatar>
                <div class="icono-drawer-principal">
                  <IconBriefcase :size="24" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="titulo-drawer-principal">Mesa de trabajo</q-item-label>
                <q-item-label caption class="subtitulo-drawer-principal">
                  Completá pendientes
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip color="primary" text-color="white" dense class="chip-drawer-principal">
                  {{ sesionEscaneoStore.cantidadItems }}
                </q-chip>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-ripple
              to="/gracias"
              class="item-drawer-principal"
              :class="{ 'item-drawer-principal-activo': esGraciasActivo }"
              :style="{ '--color-item-drawer': 'var(--color-error)' }"
            >
              <q-item-section avatar>
                <div class="icono-drawer-principal">
                  <IconHeart :size="24" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="titulo-drawer-principal">Gracias</q-item-label>
                <q-item-label caption class="subtitulo-drawer-principal">
                  Apoyá el proyecto
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <q-separator />

        <q-list padding class="drawer-lista-inferior">
          <q-item
            clickable
            v-ripple
            class="item-drawer-secundario"
            :class="{ 'item-drawer-secundario-destacado': estadoActualizacion.hayActualizacion }"
            @click="manejarClickActualizarApp"
          >
            <q-item-section avatar>
              <IconRefresh :size="24" class="icono-drawer-secundario" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">Actualizar app</q-item-label>
              <q-item-label caption>
                {{ textoActualizacionDrawer }}
              </q-item-label>
            </q-item-section>
            <q-item-section v-if="estadoActualizacion.hayActualizacion" side>
              <q-chip color="positive" text-color="white" dense>Nuevo</q-chip>
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/configuracion" class="item-drawer-secundario">
            <q-item-section avatar>
              <IconSettings :size="24" class="icono-drawer-secundario" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">Configuración</q-item-label>
              <q-item-label caption>Preferencias y cuenta</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <!-- CONTENIDO PRINCIPAL -->
    <q-page-container :style="estiloContenedorPrincipal">
      <router-view />
    </q-page-container>

    <ModalActualizacion
      :visible="modalActualizacionAbierto"
      :version-instalada="estadoActualizacion.versionInstalada"
      :version-disponible="estadoActualizacion.versionDisponible"
      :cambios="estadoActualizacion.cambios"
      @cerrar="cerrarModalActualizacion"
      @actualizar="actualizarAppAhora"
    />
  </q-layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  IconClipboardList,
  IconListDetails,
  IconMapPin,
  IconBriefcase,
  IconHeart,
  IconSettings,
  IconRefresh,
  IconHome,
} from '@tabler/icons-vue'
import { useQuasar } from 'quasar'
import { App } from '@capacitor/app'
import { useBotonAtras } from '../composables/useBotonAtras.js'
import { usePublicidad } from '../composables/usePublicidad.js'
import { useActualizacionApp } from '../composables/useActualizacionApp.js'
import ModalActualizacion from '../components/Actualizacion/ModalActualizacion.vue'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'
import { usePreferenciasStore } from '../almacenamiento/stores/preferenciasStore.js'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'
import { ESTADOS_MIGRACION_FIREBASE } from '../almacenamiento/constantes/PreparacionFirebase.js'
import migracionLocalFirebaseService from '../almacenamiento/servicios/MigracionLocalFirebaseService.js'
import migracionLocalPreguntadaService from '../almacenamiento/servicios/MigracionLocalPreguntadaService.js'

const router = useRouter()
const route = useRoute()
const quasar = useQuasar()
const drawerAbierto = ref(false)
const sesionEscaneoStore = useSesionEscaneoStore()
const preferenciasStore = usePreferenciasStore()
const usuarioStore = useUsuarioStore()
const { inicializar, mostrarBanner, precargarInterstitial, altoBanner } = usePublicidad()
const {
  estadoActualizacion,
  modalActualizacionAbierto,
  refrescarEstadoActualizacion,
  cerrarModalActualizacion,
  abrirUrlPlayStore,
} = useActualizacionApp()
let removerListenerEstadoApp = null
const evaluandoMigracionLocal = ref(false)

const toggleDrawer = () => {
  drawerAbierto.value = !drawerAbierto.value
}

const esListaJustaActiva = computed(
  () => route.path === '/lista-justa' || route.path.startsWith('/lista-justa/'),
)
const esInicioActivo = computed(() => route.path === '/')
const esMisProductosActivo = computed(() => route.path === '/mis-productos')
const esComerciosActivo = computed(() => route.path.startsWith('/comercios'))
const esMesaActivo = computed(() => route.path === '/mesa-trabajo')
const esGraciasActivo = computed(() => route.path === '/gracias')
const clasesHeader = computed(() => {
  return quasar.dark.isActive ? 'header-tema-oscuro text-white' : 'header-tema-claro text-primary'
})
const clasesDrawer = computed(() =>
  quasar.dark.isActive ? 'drawer-tema drawer-tema-oscuro' : 'drawer-tema drawer-tema-claro',
)
const colorBotonMenu = computed(() => {
  return quasar.dark.isActive ? 'white' : 'primary'
})
const estiloLayout = computed(() => ({
  '--espacio-publicidad': `${altoBanner.value}px`,
}))
const estiloContenedorPrincipal = computed(() => ({
  paddingBottom: `calc(${altoBanner.value}px + var(--safe-area-bottom, 0px) + 8px)`,
}))
const textoActualizacionDrawer = computed(() => {
  if (estadoActualizacion.value.hayActualizacion) {
    return `Versión ${estadoActualizacion.value.versionDisponible} disponible`
  }

  return 'Buscar versión nueva'
})

const colorInactivoHeader = computed(() => (quasar.dark.isActive ? '#b0bec5' : '#757575'))
const coloresHeaderPorSeccion = {
  inicio: 'var(--color-primario)',
  listaJusta: 'var(--color-secundario)',
  misProductos: 'var(--color-primario)',
  comercios: 'var(--color-acento)',
  mesa: 'var(--color-primario)',
}
const seccionHeaderActiva = computed(() => {
  if (esInicioActivo.value) return 'inicio'
  if (esListaJustaActiva.value) return 'listaJusta'
  if (esMisProductosActivo.value) return 'misProductos'
  if (esComerciosActivo.value) return 'comercios'
  if (esMesaActivo.value) return 'mesa'
  return null
})
const estiloTituloHeader = computed(() => {
  const colorActivo = coloresHeaderPorSeccion[seccionHeaderActiva.value]
  return { color: colorActivo || colorInactivoHeader.value }
})

const obtenerEstiloIconoHeader = (estaActivo, seccion) => {
  return {
    color: estaActivo.value ? coloresHeaderPorSeccion[seccion] : colorInactivoHeader.value,
  }
}

const irAMisProductos = () => {
  if (esMisProductosActivo.value) return
  router.push('/mis-productos')
}

const irAInicio = () => {
  if (esInicioActivo.value) return
  router.push('/')
}

const irAListaJusta = () => {
  if (esListaJustaActiva.value) return
  router.push('/lista-justa')
}

const irAComercios = () => {
  if (esComerciosActivo.value) return
  router.push('/comercios')
}

const irAMesaTrabajo = () => {
  if (esMesaActivo.value) return
  router.push('/mesa-trabajo')
}

const manejarClickActualizarApp = async () => {
  await refrescarEstadoActualizacion({ mostrarModalSiHay: true })

  if (!estadoActualizacion.value.hayActualizacion) {
    quasar.notify({
      type: 'positive',
      message: 'Tu app ya está actualizada.',
      position: 'top',
      timeout: 2000,
    })
  }
}

const actualizarAppAhora = async () => {
  await abrirUrlPlayStore()
  cerrarModalActualizacion()
}

const recargarDatosPrivados = async () => {
  const [
    { useProductosStore },
    { useComerciStore },
    { useListaJustaStore },
    { useConfirmacionesStore },
  ] = await Promise.all([
    import('../almacenamiento/stores/productosStore.js'),
    import('../almacenamiento/stores/comerciosStore.js'),
    import('../almacenamiento/stores/ListaJustaStore.js'),
    import('../almacenamiento/stores/confirmacionesStore.js'),
  ])

  await Promise.all([
    useProductosStore().cargarProductos(),
    useComerciStore().cargarComercios(),
    useListaJustaStore().cargarListas(),
    useConfirmacionesStore().cargarConfirmaciones(),
    sesionEscaneoStore.cargarSesion(),
    preferenciasStore.hidratarDesdeFuentePrincipal(),
  ])
}

const ofrecerMigracionLocalSiCorresponde = async () => {
  if (!usuarioStore.estaAutenticado || evaluandoMigracionLocal.value) {
    return { accion: 'omitida' }
  }

  evaluandoMigracionLocal.value = true

  try {
    const evaluacion = await migracionLocalPreguntadaService.evaluarOfertaMigracion(
      usuarioStore.usuarioId,
    )

    if (!evaluacion.debeMostrar) {
      return { accion: 'sinOferta', evaluacion }
    }

    return await new Promise((resolve) => {
      quasar
        .dialog({
          title: 'Encontramos datos guardados',
          message:
            'Tenés datos anteriores guardados solo en este dispositivo. Podés guardarlos en la nube para usarlos con tu cuenta o dejarlos solo en este dispositivo.',
          cancel: {
            label: 'Dejar en este dispositivo',
            flat: true,
            noCaps: true,
          },
          ok: {
            label: 'Guardar en la nube',
            color: 'primary',
            noCaps: true,
          },
          persistent: true,
        })
        .onOk(async () => {
          try {
            const resultado = await ejecutarMigracionLocalConFeedback()
            await recargarDatosPrivados()
            if (resultado.estado === ESTADOS_MIGRACION_FIREBASE.COMPLETADA) {
              quasar.notify({
                type: 'positive',
                message: 'Datos guardados en la nube.',
              })
              resolve({ accion: 'migrada' })
              return
            }

            quasar.notify({
              type: 'warning',
              message: 'Quedaron datos pendientes. Podés reintentarlo desde Configuración.',
            })
            resolve({ accion: 'parcial', resultado })
          } catch (error) {
            quasar.notify({
              type: 'negative',
              message: error.message || 'No se pudieron guardar los datos en tu cuenta.',
            })
            resolve({ accion: 'error', error })
          } finally {
            evaluandoMigracionLocal.value = false
          }
        })
        .onCancel(async () => {
          try {
            await migracionLocalPreguntadaService.guardarDecision(
              usuarioStore.usuarioId,
              migracionLocalPreguntadaService.DECISIONES_MIGRACION_LOCAL.AHORA_NO,
            )
            quasar.notify({
              type: 'info',
              message:
                'Tu cuenta queda vacía. Podés guardar o borrar esos datos más adelante desde Configuración.',
            })
            resolve({ accion: 'rechazada' })
          } finally {
            evaluandoMigracionLocal.value = false
          }
        })
    })
  } catch (error) {
    console.warn('No se pudo evaluar la migración local preguntada:', error)
    return { accion: 'error', error }
  } finally {
    if (evaluandoMigracionLocal.value) {
      evaluandoMigracionLocal.value = false
    }
  }
}

const inicializarPreferenciasSinGuardar = async () => {
  await preferenciasStore.inicializar({ silencioso: true })
  await preferenciasStore.hidratarDesdeFuentePrincipal()
}

const inicializarPreferenciasPostMigracion = async () => {
  if (preferenciasStore.modoMoneda === 'automatica' && !preferenciasStore.paisDetectado) {
    await preferenciasStore.detectarMonedaAutomatica()
  }
}

const puedeSincronizarPreferenciasDespuesDeMigracion = (resultadoMigracion) =>
  resultadoMigracion?.accion === 'sinOferta' || resultadoMigracion?.accion === 'migrada'

function crearMensajeProgresoMigracion(progreso) {
  if (!progreso?.total) return progreso?.mensaje || 'Guardando tus datos en la nube...'
  return `${progreso.mensaje} ${progreso.procesados}/${progreso.total}`
}

async function ejecutarMigracionLocalConFeedback() {
  const dialogoProgreso = quasar.dialog({
    title: 'Guardando datos',
    message: 'Guardando tus datos en la nube...',
    progress: true,
    persistent: true,
    ok: false,
  })

  try {
    const resultado = await migracionLocalFirebaseService.iniciarMigracion({
      confirmarMigracion: true,
      onProgreso: (progreso) => {
        if (dialogoProgreso?.update) {
          dialogoProgreso.update({ message: crearMensajeProgresoMigracion(progreso) })
        }
      },
    })

    if (resultado.estado === ESTADOS_MIGRACION_FIREBASE.COMPLETADA) {
      await migracionLocalPreguntadaService.guardarDecision(
        usuarioStore.usuarioId,
        migracionLocalPreguntadaService.DECISIONES_MIGRACION_LOCAL.MIGRADA,
      )
    }

    return resultado
  } finally {
    if (dialogoProgreso?.hide) {
      dialogoProgreso.hide()
    }
  }
}

// Carga datos persistidos al iniciar la app
onMounted(async () => {
  await Promise.all([sesionEscaneoStore.asegurarSesionCargada(), inicializarPreferenciasSinGuardar()])
  await refrescarEstadoActualizacion({ mostrarModalSiHay: true })
  const resultadoMigracion = await ofrecerMigracionLocalSiCorresponde()

  if (puedeSincronizarPreferenciasDespuesDeMigracion(resultadoMigracion)) {
    try {
      await inicializarPreferenciasPostMigracion()
    } catch {
      // Las preferencias locales deben seguir funcionando aunque no se puedan sincronizar.
    }
  }

  try {
    await inicializar()
    await precargarInterstitial()
    await mostrarBanner()
  } catch {
    // Si AdMob falla, la app debe seguir funcionando sin publicidad.
  }

  try {
    const listenerEstadoApp = await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return
      refrescarEstadoActualizacion({ mostrarModalSiHay: true })
    })
    removerListenerEstadoApp = () => listenerEstadoApp.remove()
  } catch {
    // En web puede no estar disponible este evento.
  }
})

watch(
  () => usuarioStore.usuarioId,
  async () => {
    const resultadoMigracion = await ofrecerMigracionLocalSiCorresponde()
    if (puedeSincronizarPreferenciasDespuesDeMigracion(resultadoMigracion)) {
      await inicializarPreferenciasPostMigracion()
    }
  },
)

onUnmounted(() => {
  if (removerListenerEstadoApp) {
    removerListenerEstadoApp()
  }
  removerListenerEstadoApp = null
})

useBotonAtras({ drawerAbierto, router, route })
</script>

<style scoped>
.header-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-tema-claro {
  background: var(--fondo-header-claro);
  border-bottom: 1px solid var(--borde-header-claro);
  box-shadow: 0 2px 10px rgba(16, 24, 40, 0.08);
}
.header-tema-oscuro {
  background: var(--fondo-header-oscuro);
  border-bottom: 1px solid var(--borde-header-oscuro);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
}
.drawer-tema-claro {
  background: var(--fondo-drawer-claro);
}
.drawer-tema-oscuro {
  background: var(--fondo-drawer-oscuro);
}
.header-left {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}
.title-link {
  min-width: 0;
  max-width: 100%;
  padding: 0 6px;
}
.inicio-header-wrapper {
  overflow: hidden;
  flex: 0 0 auto;
}
.boton-inicio-header {
  min-width: 40px;
  min-height: 40px;
}
.inicio-header-enter-active,
.inicio-header-leave-active,
.inicio-drawer-enter-active,
.inicio-drawer-leave-active {
  transition:
    max-width 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}
.inicio-header-enter-from,
.inicio-header-leave-to,
.inicio-drawer-enter-from,
.inicio-drawer-leave-to {
  max-width: 0;
  opacity: 0;
  transform: translateX(-6px);
}
.inicio-header-enter-to,
.inicio-header-leave-from {
  max-width: 48px;
  opacity: 1;
  transform: translateX(0);
}
.inicio-drawer-enter-to,
.inicio-drawer-leave-from {
  max-width: 280px;
  opacity: 1;
  transform: translateX(0);
}
.title-text {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}
.quick-access-btn {
  min-width: 40px;
  min-height: 40px;
  transition: color 0.18s ease;
}
.mesa-action-wrapper {
  overflow: hidden;
}
.mesa-action-enter-active,
.mesa-action-leave-active {
  transition:
    max-width 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}
.mesa-action-enter-from,
.mesa-action-leave-to {
  max-width: 0;
  opacity: 0;
  transform: translateX(4px);
}
.mesa-action-enter-to,
.mesa-action-leave-from {
  max-width: 48px;
  opacity: 1;
  transform: translateX(0);
}
.drawer-lista {
  padding-top: calc(8px + var(--safe-area-top)) !important;
}
.item-drawer-principal {
  --color-item-drawer: var(--color-primario);
  min-height: 64px;
  margin: 4px 8px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--color-item-drawer) 12%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-item-drawer) 8%, transparent);
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}
.item-drawer-principal:hover {
  border-color: color-mix(in srgb, var(--color-item-drawer) 28%, transparent);
  background: color-mix(in srgb, var(--color-item-drawer) 13%, transparent);
}
.item-drawer-principal-activo,
.item-drawer-principal.q-router-link--active,
.item-drawer-principal.q-router-link--exact-active {
  border-color: color-mix(in srgb, var(--color-item-drawer) 45%, var(--borde-color));
  background: color-mix(in srgb, var(--color-item-drawer) 18%, transparent);
}
.item-drawer-principal .q-item__section--avatar {
  min-width: 46px;
  padding-right: 10px;
}
.icono-drawer-principal {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--color-item-drawer);
  background: color-mix(in srgb, var(--color-item-drawer) 16%, transparent);
}
.titulo-drawer-principal {
  color: var(--color-item-drawer);
  font-weight: 700;
  line-height: 1.15;
}
.subtitulo-drawer-principal {
  color: var(--texto-secundario);
  line-height: 1.2;
}
.drawer-contenedor {
  display: flex;
  flex-direction: column;
}
.drawer-scroll {
  flex: 1 1 auto;
  padding-bottom: 8px;
}
.drawer-lista-inferior {
  padding-top: 8px;
  padding-bottom: calc(12px + var(--safe-area-bottom) + var(--espacio-publicidad, 0px)) !important;
}
.item-drawer-secundario {
  margin: 2px 8px;
  border-radius: 10px;
  color: var(--texto-primario);
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}
.item-drawer-secundario:hover,
.item-drawer-secundario.q-router-link--active,
.item-drawer-secundario.q-router-link--exact-active {
  background: color-mix(in srgb, var(--color-primario) 8%, transparent);
}
.item-drawer-secundario-destacado {
  background: color-mix(in srgb, var(--color-exito) 10%, transparent);
}
.item-drawer-secundario-destacado .icono-drawer-secundario {
  color: var(--color-exito);
}
.icono-drawer-secundario {
  color: var(--texto-secundario);
}
.chip-drawer-principal {
  font-weight: 700;
}
.logo-app-drawer-box {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-primario);
}
.logo-app-drawer {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
@media (max-width: 420px) {
  .title-text {
    font-size: 0.98rem;
  }
}
@media (max-width: 350px) {
  .title-link {
    display: none;
  }
}
</style>
