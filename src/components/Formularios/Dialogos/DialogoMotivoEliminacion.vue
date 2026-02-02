<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card class="dialogo-motivo-eliminacion">
      <!-- HEADER -->
      <q-card-section class="bg-negative text-white">
        <div class="row items-center">
          <q-icon name="delete_forever" size="32px" class="q-mr-md" />
          <div>
            <div class="text-h6">Confirmar eliminación</div>
            <div class="text-body2">
              {{ cantidadComercios }}
              {{ cantidadComercios === 1 ? 'comercio' : 'comercios' }} seleccionado(s)
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- CONTENIDO: MOTIVO -->
      <q-card-section>
        <p class="text-body2 text-grey-7 q-mb-md">
          <strong
            >¿Por qué deseas eliminar
            {{ cantidadComercios === 1 ? 'este comercio' : 'estos comercios' }}?</strong
          >
        </p>

        <!-- OPCIONES DE MOTIVO -->
        <q-option-group
          v-model="motivoSeleccionado"
          :options="opcionesMotivo"
          color="primary"
          class="q-mb-md"
        />

        <!-- CAMPO "OTRO MOTIVO" -->
        <q-input
          v-if="motivoSeleccionado === 'otro'"
          v-model="otroMotivo"
          outlined
          dense
          label="Especifica el motivo"
          placeholder="Ej: Cambió de nombre, ya no existe..."
          class="q-mb-md"
        />

        <!-- ADVERTENCIA SOBRE PRODUCTOS AFECTADOS -->
        <q-banner v-if="cantidadProductosAfectados > 0" dense class="bg-warning text-white" rounded>
          <template #avatar>
            <q-icon name="warning" />
          </template>
          <div class="text-body2">
            <strong>{{ cantidadProductosAfectados }} productos afectados</strong>
            <p class="q-mb-none q-mt-xs text-caption">
              Los precios de estos productos mantendrán el nombre del comercio como texto.
            </p>
          </div>
        </q-banner>

        <!-- INFORMACIÓN SEGÚN MOTIVO -->
        <q-banner v-if="motivoSeleccionado === 'cerro'" dense class="bg-grey-2 q-mt-md" rounded>
          <template #avatar>
            <q-icon name="info" color="primary" />
          </template>
          <div class="text-caption">Los datos históricos se conservarán para referencia.</div>
        </q-banner>

        <q-banner v-if="motivoSeleccionado === 'duplicado'" dense class="bg-grey-2 q-mt-md" rounded>
          <template #avatar>
            <q-icon name="info" color="primary" />
          </template>
          <div class="text-caption">
            Los precios asociados se mantendrán con el nombre original del comercio.
          </div>
        </q-banner>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cancelar" />
        <q-btn
          unelevated
          label="Confirmar eliminación"
          color="negative"
          :disable="!motivoValido"
          @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  cantidadComercios: {
    type: Number,
    default: 1,
  },
  cantidadProductosAfectados: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue', 'confirmar', 'cancelar'])

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Estado del motivo
const motivoSeleccionado = ref('cerro')
const otroMotivo = ref('')

// Opciones de motivo
const opcionesMotivo = [
  {
    label: 'Cerró definitivamente',
    value: 'cerro',
  },
  {
    label: 'Es un duplicado / Error',
    value: 'duplicado',
  },
  {
    label: 'Otro motivo',
    value: 'otro',
  },
]

// Validación
const motivoValido = computed(() => {
  if (motivoSeleccionado.value === 'otro') {
    return otroMotivo.value.trim().length > 0
  }
  return motivoSeleccionado.value !== ''
})

/**
 * Usuario confirma eliminación
 */
function confirmar() {
  const motivo = {
    tipo: motivoSeleccionado.value,
    descripcion: motivoSeleccionado.value === 'otro' ? otroMotivo.value : '',
  }

  emit('confirmar', motivo)
  cerrarDialogo()
  limpiar()
}

/**
 * Usuario cancela
 */
function cancelar() {
  emit('cancelar')
  cerrarDialogo()
  limpiar()
}

/**
 * Limpiar estado
 */
function limpiar() {
  motivoSeleccionado.value = 'cerro'
  otroMotivo.value = ''
}

/**
 * Cerrar diálogo
 */
function cerrarDialogo() {
  dialogoAbierto.value = false
}
</script>

<style scoped>
.dialogo-motivo-eliminacion {
  min-width: 350px;
  max-width: 500px;
}
</style>
