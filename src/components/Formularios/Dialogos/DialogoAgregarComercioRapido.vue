<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card style="min-width: 350px; max-width: 500px">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="store" color="primary" size="24px" class="q-mr-sm" />
        <div class="text-h6">Agregar comercio rápido</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cerrar" />
      </q-card-section>

      <!-- Contenido -->
      <q-card-section>
        <p class="text-body2 text-grey-7 q-mb-md">
          Completá los datos básicos. Podés agregar más detalles después desde la sección Comercios.
        </p>

        <!-- Nombre del comercio -->
        <q-input
          v-model="nombreInterno"
          label="Nombre del comercio *"
          outlined
          dense
          autofocus
          placeholder="Ej: Disco ABC"
          :rules="[requerido]"
          class="q-mb-md"
        />

        <!-- Dirección (opcional) -->
        <q-input
          v-model="direccionInterna"
          label="Dirección"
          outlined
          dense
          placeholder="Ej: Av. Italia 1234 (opcional)"
          hint="Opcional: podés agregarlo después"
        />
      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cerrar" />
        <q-btn
          unelevated
          label="Guardar"
          color="primary"
          :loading="guardando"
          :disable="!nombreInterno.trim()"
          @click="guardar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  nombreInicial: {
    type: String,
    default: '',
  },
  direccionInicial: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'comercio-creado'])

// Quasar
const $q = useQuasar()

// Store
const comerciosStore = useComerciStore()

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Datos internos del formulario
const nombreInterno = ref('')
const direccionInterna = ref('')
const guardando = ref(false)

// Pre-llenar datos cuando se abra el diálogo
watch(
  () => props.modelValue,
  (nuevoValor) => {
    if (nuevoValor) {
      // Diálogo se abrió -> pre-llenar con valores iniciales
      nombreInterno.value = props.nombreInicial || ''
      direccionInterna.value = props.direccionInicial || ''
    }
  },
)

/**
 * Guardar nuevo comercio
 */
async function guardar() {
  if (!nombreInterno.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'El nombre del comercio es obligatorio',
      position: 'top',
    })
    return
  }

  guardando.value = true

  try {
    // Crear comercio con datos mínimos
    const resultado = await comerciosStore.agregarComercio({
      nombre: nombreInterno.value.trim(),
      tipo: 'Otro',
      calle: direccionInterna.value.trim() || '',
      barrio: '',
      ciudad: '',
    })

    // Si hubo validación de duplicados
    if (!resultado.exito && resultado.validacion) {
      $q.notify({
        type: 'warning',
        message: 'Ya existe un comercio similar. Usá el selector para encontrarlo.',
        position: 'top',
        timeout: 3000,
      })
      cerrar()
      return
    }

    // Comercio creado exitosamente
    const comercioCreado = resultado.comercio

    // Notificación de éxito
    $q.notify({
      type: 'positive',
      message: `Comercio "${comercioCreado.nombre}" agregado correctamente`,
      position: 'top',
    })

    // Emitir evento con el comercio creado
    emit('comercio-creado', comercioCreado)

    // Cerrar diálogo
    cerrar()
  } catch (error) {
    console.error('Error al crear comercio:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al crear el comercio',
      position: 'top',
    })
  } finally {
    guardando.value = false
  }
}

/**
 * Cerrar diálogo y limpiar formulario
 */
function cerrar() {
  dialogoAbierto.value = false
  nombreInterno.value = ''
  direccionInterna.value = ''
}

/**
 * Validación: campo requerido
 */
function requerido(val) {
  return (val && val.trim().length > 0) || 'Este campo es requerido'
}
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
