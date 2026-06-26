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
              class="bandeja-drawer-item"
            >
              <q-item-section avatar>
                <IconBriefcase :size="24" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-primary text-weight-medium">Mesa de trabajo</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip color="primary" text-color="white" dense>
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
import conexionService from '../almacenamiento/servicios/ConexionService.js'
import fotosPendientesStorageService from '../almacenamiento/servicios/FotosPendientesStorageService.js'

const router = useRouter()
const route = useRoute()
const quasar = useQuasar()
const drawerAbierto = ref(false)
const sesionEscaneoStore = useSesionEscaneoStore()
const preferenciasStore = usePreferenciasStore()
const { inicializar, mostrarBanner, precargarInterstitial, altoBanner } = usePublicidad()
const {
  estadoActualizacion,
  modalActualizacionAbierto,
  refrescarEstadoActualizacion,
  cerrarModalActualizacion,
  abrirUrlPlayStore,
} = useActualizacionApp()
let removerListenerEstadoApp = null
let removerListenerConexionFotos = null

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

// Carga datos persistidos al iniciar la app
onMounted(async () => {
  await Promise.all([sesionEscaneoStore.cargarSesion(), preferenciasStore.inicializar()])
  await preferenciasStore.hidratarDesdeFuentePrincipal()
  await fotosPendientesStorageService.sincronizarFotosPendientes()
  await refrescarEstadoActualizacion({ mostrarModalSiHay: true })

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
      fotosPendientesStorageService.sincronizarFotosPendientes()
    })
    removerListenerEstadoApp = () => listenerEstadoApp.remove()
  } catch {
    // En web puede no estar disponible este evento.
  }

  try {
    removerListenerConexionFotos = await conexionService.escucharCambiosConexion((estado) => {
      if (!estado.conectado) return
      fotosPendientesStorageService.sincronizarFotosPendientes()
    })
  } catch {
    // En web puede no estar disponible el listener nativo de red.
  }
})

onUnmounted(() => {
  if (removerListenerEstadoApp) {
    removerListenerEstadoApp()
  }
  removerListenerEstadoApp = null
  if (removerListenerConexionFotos) {
    removerListenerConexionFotos()
  }
  removerListenerConexionFotos = null
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
.bandeja-drawer-item {
  background: color-mix(in srgb, var(--color-primario) 8%, transparent);
  border-radius: 8px;
  margin: 0 8px;
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
