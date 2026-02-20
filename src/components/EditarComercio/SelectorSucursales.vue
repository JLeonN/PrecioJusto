<template>
  <!-- CADENA: mini-tarjetas horizontales scrolleables -->
  <div v-if="esCadena" class="selector-sucursales">
    <div class="selector-sucursales__titulo">
      <IconMapPin :size="18" class="text-orange" />
      <span>Sucursales</span>
    </div>
    <div class="selector-sucursales__lista">
      <div
        v-for="direccion in direcciones"
        :key="direccion.id"
        class="mini-tarjeta-sucursal"
        :class="{ 'mini-tarjeta-sucursal--activa': estaSeleccionada(direccion) }"
        @click="$emit('seleccionar', direccion)"
      >
        <div class="mini-tarjeta-sucursal__calle">{{ direccion.calle }}</div>
        <div
          v-if="direccion.barrio || direccion.ciudad"
          class="mini-tarjeta-sucursal__ubicacion"
        >
          {{ [direccion.barrio, direccion.ciudad].filter(Boolean).join(', ') }}
        </div>
        <div class="mini-tarjeta-sucursal__articulos">
          <IconShoppingBag :size="12" />
          {{ articulosPorDireccion[direccion.id] || 0 }}
          {{ (articulosPorDireccion[direccion.id] || 0) === 1 ? 'artículo' : 'artículos' }}
        </div>
      </div>
    </div>
  </div>

  <!-- INDIVIDUAL: dirección estática -->
  <div v-else class="selector-sucursales--unica">
    <IconMapPin :size="16" class="text-grey-6" />
    <span class="text-grey-7">{{ direcciones[0]?.calle }}</span>
    <span v-if="direcciones[0]?.barrio" class="text-grey-5 text-caption">
      - {{ direcciones[0].barrio }}
    </span>
  </div>
</template>

<script setup>
import { IconMapPin, IconShoppingBag } from '@tabler/icons-vue'

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
  articulosPorDireccion: {
    type: Object,
    default: () => ({}),
  },
})

defineEmits(['seleccionar'])

const estaSeleccionada = (direccion) => props.direccionSeleccionada?.id === direccion.id
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
.selector-sucursales__lista {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
}
.mini-tarjeta-sucursal {
  flex-shrink: 0;
  min-width: 150px;
  max-width: 220px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid var(--borde-color);
  background-color: var(--fondo-tarjeta);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.mini-tarjeta-sucursal--activa {
  border-color: var(--color-acento);
  background-color: #fff3e0;
}
.mini-tarjeta-sucursal__calle {
  font-size: 13px;
  font-weight: 600;
  color: var(--texto-primario);
  line-height: 1.3;
  margin-bottom: 3px;
}
.mini-tarjeta-sucursal__ubicacion {
  font-size: 11px;
  color: var(--texto-secundario);
  margin-bottom: 6px;
  line-height: 1.3;
}
.mini-tarjeta-sucursal__articulos {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--texto-secundario);
}
.selector-sucursales--unica {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
}
</style>
