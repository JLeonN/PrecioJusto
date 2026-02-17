<template>
  <div v-if="esCadena" class="selector-sucursales">
    <div class="selector-sucursales__titulo">
      <IconMapPin :size="18" class="text-orange" />
      <span>Sucursales</span>
    </div>
    <div class="selector-sucursales__chips">
      <q-chip
        v-for="direccion in direcciones"
        :key="direccion.id"
        clickable
        :color="estaSeleccionada(direccion) ? 'orange' : 'grey-3'"
        :text-color="estaSeleccionada(direccion) ? 'white' : 'grey-8'"
        class="selector-sucursales__chip"
        @click="$emit('seleccionar', direccion)"
      >
        <div class="selector-sucursales__chip-contenido">
          <div class="selector-sucursales__chip-calle">{{ direccion.calle }}</div>
          <div v-if="direccion.barrio" class="selector-sucursales__chip-barrio">
            {{ direccion.barrio }}
          </div>
        </div>
      </q-chip>
    </div>
  </div>
  <div v-else class="selector-sucursales--unica">
    <IconMapPin :size="16" class="text-grey-6" />
    <span class="text-grey-7">{{ direcciones[0]?.calle }}</span>
    <span v-if="direcciones[0]?.barrio" class="text-grey-5 text-caption">
      - {{ direcciones[0].barrio }}
    </span>
  </div>
</template>

<script setup>
import { IconMapPin } from '@tabler/icons-vue'

const props = defineProps({
  direcciones: {
    type: Array,
    required: true,
  },
  direccionSeleccionada: {
    type: Object,
    default: null,
  },
  esCadena: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['seleccionar'])

const estaSeleccionada = (direccion) => {
  return props.direccionSeleccionada?.id === direccion.id
}
</script>

<style scoped>
.selector-sucursales {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.selector-sucursales__titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--texto-primario);
}
.selector-sucursales__chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}
.selector-sucursales__chip {
  flex-shrink: 0;
}
.selector-sucursales__chip-contenido {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.selector-sucursales__chip-calle {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}
.selector-sucursales__chip-barrio {
  font-size: 11px;
  opacity: 0.8;
  line-height: 1.2;
}
.selector-sucursales--unica {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
}
</style>
