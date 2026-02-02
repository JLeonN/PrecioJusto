<template>
  <div v-if="visible" class="barra-seleccion">
    <div class="barra-contenido">
      <!-- BOTÓN SELECCIONAR TODO / DESELECCIONAR TODO -->
      <q-btn
        flat
        dense
        :label="textoBotonSeleccionarTodo"
        color="primary"
        size="sm"
        @click="$emit('toggle-seleccionar-todos')"
      >
        <q-icon :name="iconoSeleccionarTodo" size="18px" class="q-mr-xs" />
      </q-btn>

      <q-space />

      <!-- CONTADOR -->
      <div class="contador-seleccion">
        <span class="texto-contador"> {{ cantidadSeleccionados }} de {{ totalItems }} </span>
        <span class="texto-seleccionados">seleccionados</span>
      </div>
    </div>
  </div>
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
  totalItems: {
    type: Number,
    required: true,
  },
  todoSeleccionado: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle-seleccionar-todos'])

// Texto del botón según estado
const textoBotonSeleccionarTodo = computed(() => {
  return props.todoSeleccionado ? 'Deseleccionar todo' : 'Seleccionar todo'
})

// Ícono del botón según estado
const iconoSeleccionarTodo = computed(() => {
  return props.todoSeleccionado ? 'check_box_outline_blank' : 'check_box'
})
</script>

<style scoped>
.barra-seleccion {
  position: sticky;
  top: 50px;
  z-index: 100;
  background-color: var(--fondo-drawer);
  border-bottom: 2px solid var(--color-primario);
  box-shadow: var(--sombra-media);
  animation: slideDown 0.3s ease;
}
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.barra-contenido {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  max-width: 1200px;
  margin: 0 auto;
}
.contador-seleccion {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.texto-contador {
  font-size: 16px;
  font-weight: bold;
  color: var(--color-primario);
  line-height: 1.2;
}
.texto-seleccionados {
  font-size: 12px;
  color: var(--texto-secundario);
  line-height: 1;
}
@media (max-width: 599px) {
  .barra-seleccion {
    top: 56px;
  }
}
</style>
