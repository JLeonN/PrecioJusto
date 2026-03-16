<template>
  <q-layout view="hHh lpR fFf">
    <!-- HEADER -->
    <q-header elevated class="bg-white text-primary">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" @click="toggleDrawer" color="primary">
          <q-icon name="menu" />
          <q-badge
            v-if="sesionEscaneoStore.tieneItemsPendientes"
            floating
            color="negative"
            :label="sesionEscaneoStore.cantidadItems"
          />
        </q-btn>

        <q-toolbar-title class="text-weight-bold"> Precio Justo </q-toolbar-title>

        <q-btn flat round dense>
          <IconSearch :size="24" />
        </q-btn>
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
              <q-avatar color="primary" text-color="white" size="56px">
                <IconShoppingCart :size="32" />
              </q-avatar>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  IconSearch,
  IconShoppingCart,
  IconHome,
  IconMapPin,
  IconBriefcase,
} from '@tabler/icons-vue'
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

// Carga datos persistidos al iniciar la app
onMounted(async () => {
  await Promise.all([sesionEscaneoStore.cargarSesion(), preferenciasStore.inicializar()])
})

useBotonAtras({ drawerAbierto, router, route })
</script>

<style scoped>
.drawer-lista {
  padding-top: calc(8px + var(--safe-area-top)) !important;
}
.bandeja-drawer-item {
  background: color-mix(in srgb, var(--color-primario) 8%, transparent);
  border-radius: 8px;
  margin: 0 8px;
}
</style>
