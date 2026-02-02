<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card class="dialogo-misma-ubicacion">
      <!-- HEADER -->
      <q-card-section class="bg-info text-white">
        <div class="row items-center">
          <q-icon name="location_on" size="32px" class="q-mr-md" />
          <div>
            <div class="text-h6">Comercios en esta ubicación</div>
            <div class="text-body2">Ya hay comercios en esta dirección</div>
          </div>
        </div>
      </q-card-section>

      <!-- CONTENIDO: EXPLICACIÓN -->
      <q-card-section>
        <p class="text-body2 text-grey-7 q-mb-md">
          Ya existen comercios registrados en esta dirección o muy cerca:
        </p>

        <!-- LISTA DE COMERCIOS EN LA UBICACIÓN -->
        <q-list bordered separator class="rounded-borders q-mb-md">
          <q-item v-for="comercio in comerciosUbicacion" :key="comercio.id">
            <q-item-section avatar>
              <q-avatar color="info" text-color="white">
                <q-icon name="store" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ comercio.nombre }}
              </q-item-label>
              <q-item-label caption>
                {{ comercio.tipo }}
              </q-item-label>
              <q-item-label caption class="text-grey-7">
                <div v-for="dir in comercio.direcciones" :key="dir.id" class="q-mt-xs">
                  <q-icon name="location_on" size="14px" />
                  {{ dir.calle }}
                </div>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- EXPLICACIÓN -->
        <q-banner dense class="bg-grey-2" rounded>
          <template #avatar>
            <q-icon name="help_outline" color="info" />
          </template>
          <div class="text-caption">
            <p class="q-mb-xs">
              <strong>¿Por qué veo esto?</strong>
            </p>
            <p class="q-mb-none">
              Puede ser el mismo edificio/galería con varios comercios. Si estás seguro de que es un
              comercio diferente, puedes continuar.
            </p>
          </div>
        </q-banner>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cancelar" />
        <q-btn unelevated label="Sí, agregar" color="primary" @click="confirmar" />
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
  comerciosUbicacion: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'confirmar', 'cancelar'])

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/**
 * Usuario confirma que quiere agregar el comercio
 */
function confirmar() {
  emit('confirmar')
  cerrarDialogo()
}

/**
 * Usuario cancela
 */
function cancelar() {
  emit('cancelar')
  cerrarDialogo()
}

/**
 * Cerrar diálogo
 */
function cerrarDialogo() {
  dialogoAbierto.value = false
}
</script>

<style scoped>
.dialogo-misma-ubicacion {
  min-width: 350px;
  max-width: 500px;
}
.q-item {
  transition: background-color 0.2s ease;
}
</style>
