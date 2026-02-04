<template>
  <q-dialog v-model="dialogoAbierto" persistent class="dialogo-responsive">
    <q-card>
      <!-- HEADER -->
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="warning" color="warning" size="24px" class="q-mr-sm" />
        <div class="text-h6">Dirección nueva detectada</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cerrar" />
      </q-card-section>

      <!-- CONTENIDO -->
      <q-card-section>
        <p class="text-body2 q-mb-sm">
          Esta dirección no existe en <strong>{{ comercio?.nombre }}</strong
          >:
        </p>

        <q-banner dense class="bg-grey-3 q-mb-md" rounded>
          <div class="text-body1 text-weight-medium">"{{ direccionEscrita }}"</div>
        </q-banner>

        <p class="text-body2 text-grey-7">¿Qué querés hacer?</p>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions vertical class="q-px-md q-pb-md">
        <q-btn
          unelevated
          color="primary"
          icon="add_location"
          label="Agregar a comercio existente"
          class="full-width q-mb-sm"
          @click="emitAgregarAExistente"
        />

        <q-btn
          outline
          color="secondary"
          icon="store"
          label="Crear comercio nuevo"
          class="full-width q-mb-sm"
          @click="emitCrearNuevo"
        />

        <q-btn flat color="grey-7" label="Cancelar" class="full-width" @click="cerrar" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  comercio: {
    type: Object,
    default: null,
  },
  direccionEscrita: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'agregar-a-existente', 'crear-nuevo'])

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

/**
 * Emitir evento: Agregar dirección a comercio existente
 */
function emitAgregarAExistente() {
  emit('agregar-a-existente')
}

/**
 * Emitir evento: Crear comercio nuevo
 */
function emitCrearNuevo() {
  emit('crear-nuevo')
}

/**
 * Cerrar diálogo
 */
function cerrar() {
  dialogoAbierto.value = false
}
</script>

<style scoped>
.q-card {
  min-width: 350px;
  max-width: 500px;
}
.q-btn {
  text-transform: none;
}
</style>
