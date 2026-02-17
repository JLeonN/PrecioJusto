<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card class="dialogo-duplicado-exacto">
      <!-- HEADER -->
      <q-card-section class="bg-orange text-white">
        <div class="row items-center">
          <q-icon name="warning" size="32px" class="q-mr-md" />
          <div>
            <div class="text-h6">Comercio Duplicado</div>
            <div class="text-body2">Este comercio ya existe</div>
          </div>
        </div>
      </q-card-section>

      <!-- CONTENIDO -->
      <q-card-section>
        <p class="text-body2 text-grey-7 q-mb-md">
          Ya existe un comercio con este nombre y dirección:
        </p>

        <!-- COMERCIO EXISTENTE -->
        <q-list bordered separator class="rounded-borders q-mb-md">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="orange" text-color="white">
                <q-icon name="store" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold text-h6">
                {{ comercioExistente?.nombre }}
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                {{ comercioExistente?.tipo }}
              </q-item-label>
              <q-item-label caption class="text-grey-7 q-mt-sm">
                <div class="direccion-info">
                  <q-icon name="location_on" size="16px" class="q-mr-xs" />
                  {{ comercioExistente?.direcciones[0]?.calle }}
                </div>
                <div
                  v-if="comercioExistente?.direcciones[0]?.barrio"
                  class="text-caption q-ml-md q-mt-xs"
                >
                  {{ comercioExistente?.direcciones[0]?.barrio }}
                </div>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- EXPLICACIÓN -->
        <q-banner dense class="bg-orange-1" rounded>
          <template #avatar>
            <q-icon name="help_outline" color="orange" />
          </template>
          <div class="text-caption">
            <p class="q-mb-xs">
              <strong>¿Por qué veo esto?</strong>
            </p>
            <p class="q-mb-none">
              Detectamos que el nombre y la dirección coinciden con un comercio ya registrado. Si
              estás seguro de que quieres crear un duplicado, puedes continuar.
            </p>
          </div>
        </q-banner>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cancelar" />
        <q-btn
          unelevated
          label="Sí, crear duplicado"
          color="orange"
          icon="warning"
          @click="continuar"
        />
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
  comercioExistente: {
    type: Object,
    default: null,
  },
  datosNuevos: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'continuar', 'cancelar'])

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/**
 * Usuario confirma que quiere crear duplicado
 */
function continuar() {
  emit('continuar')
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
.dialogo-duplicado-exacto {
  min-width: 350px;
  max-width: 500px;
}

.direccion-info {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.q-item {
  transition: background-color 0.2s ease;
}

/* Animación de entrada */
.dialogo-duplicado-exacto {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
