<template>
  <q-layout view="hHh lpR fFf">
    <!-- HEADER -->
    <q-header elevated class="bg-white text-primary">
      <q-toolbar class="header-toolbar">
        <div class="header-left">
          <q-btn flat dense round aria-label="Menu" @click="toggleDrawer" color="primary">
            <q-icon name="menu" />
            <q-badge
              v-if="sesionEscaneoStore.tieneItemsPendientes"
              floating
              color="negative"
              :label="sesionEscaneoStore.cantidadItems"
            />
          </q-btn>

          <q-btn
            flat
            no-caps
            class="title-link"
            :color="esInicioActivo ? 'primary' : 'grey-8'"
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
            :color="esInicioActivo ? 'primary' : 'grey-6'"
            aria-label="Ir a Inicio"
            @click="irAInicio"
          >
            <IconHome :size="22" />
          </q-btn>

          <q-btn
            flat
            round
            class="quick-access-btn"
            :color="esComerciosActivo ? 'primary' : 'grey-6'"
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
                :color="esMesaActivo ? 'primary' : 'grey-6'"
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
      <q-scroll-area class="fit">
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
          <!--
          <q-item clickable v-ripple to="/gracias">
            <q-item-section avatar>
              <IconHeart :size="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Gracias</q-item-label>
            </q-item-section>
          </q-item>
          -->

        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- CONTENIDO PRINCIPAL -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconHome, IconMapPin, IconBriefcase } from '@tabler/icons-vue'
import { useBotonAtras } from '../composables/useBotonAtras.js'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'
import { usePreferenciasStore } from '../almacenamiento/stores/preferenciasStore.js'

const router = useRouter()
const route = useRoute()
const drawerAbierto = ref(false)
const sesionEscaneoStore = useSesionEscaneoStore()
const preferenciasStore = usePreferenciasStore()

const toggleDrawer = () => {
  drawerAbierto.value = !drawerAbierto.value
}

const esInicioActivo = computed(() => route.path === '/')
const esComerciosActivo = computed(() => route.path.startsWith('/comercios'))
const esMesaActivo = computed(() => route.path === '/mesa-trabajo')

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
})

useBotonAtras({ drawerAbierto, router, route })
</script>

<style scoped>
.header-toolbar {
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
