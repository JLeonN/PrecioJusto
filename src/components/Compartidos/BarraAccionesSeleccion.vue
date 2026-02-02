<template>
  <transition name="slide-up">
    <div v-if="visible" class="barra-acciones-fixed">
      <div class="barra-acciones-contenido">
        <!-- BOTÓN ELIMINAR -->
        <q-btn
          unelevated
          :label="textoBotonEliminar"
          color="negative"
          :disable="!haySeleccionados"
          class="boton-accion"
          @click="$emit('eliminar')"
        >
          <q-icon name="delete" size="20px" class="q-mr-xs" />
        </q-btn>

        <q-space />

        <!-- BOTÓN CANCELAR -->
        <q-btn flat label="Cancelar" color="grey-7" class="boton-accion" @click="$emit('cancelar')">
          <q-icon name="close" size="20px" class="q-mr-xs" />
        </q-btn>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  cantidadSeleccionados: {
    type: Number,
    required: true,
  },
  haySeleccionados: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['eliminar', 'cancelar'])

// Texto dinámico del botón eliminar
const textoBotonEliminar = computed(() => {
  if (props.cantidadSeleccionados === 0) {
    return 'Eliminar'
  }
  if (props.cantidadSeleccionados === 1) {
    return 'Eliminar 1 producto'
  }
  return `Eliminar ${props.cantidadSeleccionados} productos`
})
</script>

<style scoped>
.barra-acciones-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--fondo-tarjeta);
  border-top: 2px solid var(--borde-color);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom)); /* Safe area para iOS */
}
.barra-acciones-contenido {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}
.boton-accion {
  flex: 1;
  max-width: 200px;
}
/* Animación de entrada */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from {
  transform: translateY(100%);
}
.slide-up-leave-to {
  transform: translateY(100%);
}
/* Responsive móvil */
@media (max-width: 599px) {
  .barra-acciones-contenido {
    flex-direction: row;
  }
  .boton-accion {
    max-width: none;
  }
}
</style>
