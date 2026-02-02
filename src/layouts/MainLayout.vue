<template>
  <q-layout view="hHh lpR fFf">
    <!-- HEADER -->
    <q-header elevated class="bg-white text-primary">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleDrawer"
          color="primary"
        />

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
        <q-list padding>
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

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <IconChartLine :size="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Estadísticas</q-item-label>
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

          <q-separator class="q-my-md" />

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <IconSettings :size="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Configuración</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <IconInfoCircle :size="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Acerca de</q-item-label>
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
import { ref } from 'vue'
import {
  IconSearch,
  IconShoppingCart,
  IconHome,
  IconChartLine,
  IconMapPin,
  IconSettings,
  IconInfoCircle,
} from '@tabler/icons-vue'

const drawerAbierto = ref(false)

const toggleDrawer = () => {
  drawerAbierto.value = !drawerAbierto.value
}
</script>
