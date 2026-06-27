<template>
  <q-page class="q-pa-md pagina-inicio">
    <div class="contenedor-pagina contenedor-inicio">
      <div class="header-pagina header-inicio">
        <h5 class="titulo-pagina">Inicio</h5>
        <p class="contador-items">Accedé rápido a tus listas, productos y comercios.</p>
      </div>
      <div class="grilla-accesos">
        <q-card
          v-for="acceso in accesosPrincipales"
          :key="acceso.ruta"
          flat
          bordered
          class="tarjeta-acceso"
          role="button"
          tabindex="0"
          @click="navegarA(acceso.ruta)"
          @keydown.enter="navegarA(acceso.ruta)"
          @keydown.space.prevent="navegarA(acceso.ruta)"
        >
          <span v-if="acceso.cantidadPendiente" class="chip-pendientes-acceso">
            {{ acceso.cantidadPendiente }}
          </span>
          <q-card-section class="contenido-acceso">
            <div class="icono-acceso" :class="acceso.claseIcono">
              <component :is="acceso.icono" :size="34" />
            </div>
            <div class="texto-acceso">
              <div class="titulo-acceso">{{ acceso.titulo }}</div>
              <div class="subtitulo-acceso">{{ acceso.subtitulo }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconBriefcase, IconClipboardList, IconListDetails, IconMapPin } from '@tabler/icons-vue'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'

const router = useRouter()
const sesionEscaneoStore = useSesionEscaneoStore()

const accesosBase = [
  {
    titulo: 'Lista justa',
    subtitulo: 'Armá tu compra',
    ruta: '/lista-justa',
    icono: IconListDetails,
    claseIcono: 'icono-acceso-lista',
  },
  {
    titulo: 'Mis productos',
    subtitulo: 'Gestioná productos',
    ruta: '/mis-productos',
    icono: IconClipboardList,
    claseIcono: 'icono-acceso-productos',
  },
  {
    titulo: 'Comercios',
    subtitulo: 'Locales y sucursales',
    ruta: '/comercios',
    icono: IconMapPin,
    claseIcono: 'icono-acceso-comercios',
  },
]

const accesosPrincipales = computed(() => {
  if (!sesionEscaneoStore.tieneItemsPendientes) return accesosBase
  return [
    ...accesosBase,
    {
      titulo: 'Mesa de trabajo',
      subtitulo: 'Completá pendientes',
      ruta: '/mesa-trabajo',
      icono: IconBriefcase,
      claseIcono: 'icono-acceso-mesa',
      cantidadPendiente: sesionEscaneoStore.cantidadItems,
    },
  ]
})

function navegarA(ruta) {
  router.push(ruta)
}
</script>

<style scoped>
.pagina-inicio {
  padding-bottom: calc(24px + var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px));
}
.contenedor-inicio {
  max-width: 880px;
}
.header-inicio {
  margin-bottom: 20px;
}
.grilla-accesos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  max-width: 720px;
  margin: 0 auto;
}
.tarjeta-acceso {
  position: relative;
  min-height: 150px;
  border-radius: 14px;
  border-color: var(--borde-color);
  background: var(--fondo-tarjeta);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}
.tarjeta-acceso:hover {
  transform: translateY(-2px);
  box-shadow: var(--sombra-media);
  border-color: color-mix(in srgb, var(--color-primario) 35%, var(--borde-color));
}
.tarjeta-acceso:focus-visible {
  outline: 2px solid var(--color-primario);
  outline-offset: 3px;
}
.chip-pendientes-acceso {
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 7px;
  border-radius: 999px;
  color: var(--texto-sobre-primario);
  background: var(--color-error);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  z-index: 1;
}
.contenido-acceso {
  height: 100%;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 20px 14px;
}
.icono-acceso {
  width: 62px;
  height: 62px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icono-acceso-lista {
  color: var(--color-secundario);
  background: color-mix(in srgb, var(--color-secundario) 16%, transparent);
}
.icono-acceso-productos {
  color: var(--color-primario);
  background: color-mix(in srgb, var(--color-primario) 16%, transparent);
}
.icono-acceso-mesa {
  color: var(--color-primario);
  background: color-mix(in srgb, var(--color-primario) 16%, transparent);
}
.icono-acceso-comercios {
  color: var(--color-acento);
  background: color-mix(in srgb, var(--color-acento) 18%, transparent);
}
.texto-acceso {
  min-width: 0;
}
.titulo-acceso {
  color: var(--texto-primario);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}
.subtitulo-acceso {
  margin-top: 4px;
  color: var(--texto-secundario);
  font-size: 13px;
  line-height: 1.25;
}
@media (max-width: 430px) {
  .grilla-accesos {
    grid-template-columns: 1fr;
    max-width: 360px;
  }
}
</style>
