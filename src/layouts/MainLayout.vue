<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="header-personalizado">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="alternarMenuIzquierdo" class="boton-menu" />
        <q-toolbar-title class="titulo-toolbar">
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          Precio Justo
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="menuIzquierdoAbierto"
      side="left"
      overlay
      behavior="mobile"
      bordered
      class="drawer-personalizado"
    >
      <!-- Contenido del drawer -->
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const menuIzquierdoAbierto = ref(false)

function alternarMenuIzquierdo() {
  menuIzquierdoAbierto.value = !menuIzquierdoAbierto.value
}
</script>

<style scoped>
.header-personalizado {
  background-color: var(--color-primario);
  color: var(--texto-sobre-primario);
}
.boton-menu {
  color: var(--texto-sobre-primario);
}
.titulo-toolbar {
  color: var(--texto-sobre-primario);
  display: flex;
  align-items: center;
  gap: var(--espaciado-sm);
}
</style>
<style>
/* Sin scoped para sobrescribir Quasar */
.drawer-personalizado {
  background-color: var(--fondo-drawer) !important;
}
</style>
