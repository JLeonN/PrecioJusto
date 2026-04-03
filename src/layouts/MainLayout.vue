<template>
  <q-layout view="hHh lpR fFf" :style="estiloLayout">
    <!-- HEADER -->
    <q-header elevated :class="clasesHeader">
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

          <q-btn
            v-if="!MODO_PRUEBA"
            flat
            no-caps
            class="title-link"
            :color="esInicioActivo ? 'primary' : 'grey-8'"
            @click="irAInicio"
          >
            <span class="title-text">Precio Justo</span>
          </q-btn>
        </div>
        <div v-if="MODO_PRUEBA" class="indicador-modo-prueba">MODO PRUEBA</div>

        <div class="header-actions">
          <q-btn
            flat
            round
            class="quick-access-btn"
            :color="obtenerColorAccion(esInicioActivo)"
            aria-label="Ir a Inicio"
            @click="irAInicio"
          >
            <IconHome :size="22" />
          </q-btn>

          <q-btn
            flat
            round
            class="quick-access-btn"
            :color="obtenerColorAccion(esComerciosActivo)"
            aria-label="Ir a Comercios"
            @click="irAComercios"
          >
            <IconMapPin :size="22" />
          </q-btn>

          <transition name="mesa-action">
            <div v-if="sesionEscaneoStore.tieneItemsPendientes" class="mesa-action-wrapper">
              <q-btn
                flat
                round
                class="quick-access-btn"
                :color="obtenerColorAccion(esMesaActivo)"
                aria-label="Ir a Mesa de trabajo"
                @click="irAMesaTrabajo"
              >
                <IconBriefcase :size="22" />
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
      class="bg-grey-1"
    >
      <div class="fit drawer-contenedor">
        <q-scroll-area class="drawer-scroll">
          <q-list padding class="drawer-lista">
          <!-- Header del drawer -->
          <q-item class="q-mb-md">
            <q-item-section avatar>
              <div class="logo-app-drawer-box">
                <img src="/icons/PrecioJusto-Icono.png" alt="Icono de Precio Justo" class="logo-app-drawer" />
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-h6 text-weight-bold"> Precio Justo </q-item-label>
              <q-item-label caption> Compará y ahorrá </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-mb-md" />

          <!-- Opciones del menú -->
          <q-item clickable v-ripple to="/" exact>
            <q-item-section avatar>
              <IconHome :size="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Mis Productos</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/comercios">
            <q-item-section avatar>
              <IconMapPin :size="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Comercios</q-item-label>
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
            <q-item clickable v-ripple to="/gracias">
              <q-item-section avatar>
                <IconHeart :size="24" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Gracias</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <q-separator />

        <q-list padding class="drawer-lista-inferior">
          <q-item clickable v-ripple to="/configuracion">
            <q-item-section avatar>
              <IconSettings :size="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">Configuración</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <!-- CONTENIDO PRINCIPAL -->
    <q-page-container :style="estiloContenedorPrincipal">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconHome, IconMapPin, IconBriefcase, IconHeart, IconSettings } from '@tabler/icons-vue'
import { useBotonAtras } from '../composables/useBotonAtras.js'
import { usePublicidad } from '../composables/usePublicidad.js'
import { MODO_PRUEBA } from '../almacenamiento/constantes/ConfigPublicidad.js'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'
import { usePreferenciasStore } from '../almacenamiento/stores/preferenciasStore.js'

const router = useRouter()
const route = useRoute()
const drawerAbierto = ref(false)
const sesionEscaneoStore = useSesionEscaneoStore()
const preferenciasStore = usePreferenciasStore()
const { inicializar, mostrarBanner, precargarInterstitial, altoBanner } = usePublicidad()

const toggleDrawer = () => {
  drawerAbierto.value = !drawerAbierto.value
}

const esInicioActivo = computed(() => route.path === '/')
const esComerciosActivo = computed(() => route.path.startsWith('/comercios'))
const esMesaActivo = computed(() => route.path === '/mesa-trabajo')
const clasesHeader = computed(() => (MODO_PRUEBA ? 'bg-orange-8 text-white' : 'bg-white text-primary'))
const colorBotonMenu = computed(() => (MODO_PRUEBA ? 'white' : 'primary'))
const estiloLayout = computed(() => ({
  '--espacio-publicidad': `${altoBanner.value}px`,
}))
const estiloContenedorPrincipal = computed(() => ({
  paddingBottom: `calc(${altoBanner.value}px + var(--safe-area-bottom, 0px) + 8px)`,
}))

const obtenerColorAccion = (estaActivo) => {
  if (MODO_PRUEBA) return estaActivo.value ? 'white' : 'grey-3'
  return estaActivo.value ? 'primary' : 'grey-6'
}

const irAInicio = () => {
  if (esInicioActivo.value) return
  router.push('/')
}

const irAComercios = () => {
  if (esComerciosActivo.value) return
  router.push('/comercios')
}

const irAMesaTrabajo = () => {
  if (esMesaActivo.value) return
  router.push('/mesa-trabajo')
}

// Carga datos persistidos al iniciar la app
onMounted(async () => {
  await Promise.all([sesionEscaneoStore.cargarSesion(), preferenciasStore.inicializar()])
  try {
    await inicializar()
    await precargarInterstitial()
    await mostrarBanner()
  } catch {
    // Si AdMob falla, la app debe seguir funcionando sin publicidad.
  }
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
.indicador-modo-prueba {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  letter-spacing: 0.04em;
  pointer-events: none;
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
  transition: max-width 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
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
