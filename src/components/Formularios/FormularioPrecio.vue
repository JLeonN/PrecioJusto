<template>
  <div class="formulario-precio">
    <!-- COMERCIO -->
    <q-input
      v-model="datosInternos.comercio"
      label="Comercio"
      outlined
      dense
      placeholder="Ej: TATA, DISCO, Almacén del barrio"
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="emitirCambios"
    />

    <!-- DIRECCIÓN / SUCURSAL -->
    <q-input
      v-model="datosInternos.direccion"
      label="Dirección / Sucursal"
      outlined
      dense
      placeholder="Ej: Av. Brasil 2550, Pocitos"
      hint="Opcional: ayuda a identificar la sucursal específica"
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="emitirCambios"
    />

    <!-- PRECIO -->
    <q-input
      v-model.number="datosInternos.valor"
      label="Precio"
      outlined
      dense
      type="number"
      min="0"
      step="0.01"
      suffix="UYU"
      placeholder="0.00"
      :rules="modo === 'comunidad' ? [requerido, precioValido] : [precioValido]"
      @update:model-value="emitirCambios"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      comercio: '',
      direccion: '',
      valor: null,
    }),
  },
  modo: {
    type: String,
    default: 'local',
    validator: (value) => ['local', 'comunidad'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

// Estado interno
const datosInternos = ref({
  comercio: props.modelValue.comercio || '',
  direccion: props.modelValue.direccion || '',
  valor: props.modelValue.valor || null,
})

// Sincronizar con props externos
watch(
  () => props.modelValue,
  (nuevoValor) => {
    datosInternos.value = {
      comercio: nuevoValor.comercio || '',
      direccion: nuevoValor.direccion || '',
      valor: nuevoValor.valor || null,
    }
  },
  { deep: true },
)

// Emitir cambios al padre
function emitirCambios() {
  emit('update:modelValue', { ...datosInternos.value })
}

// Reglas de validación
function requerido(val) {
  return (val && val.length > 0) || 'Este campo es requerido'
}

function precioValido(val) {
  if (val === null || val === undefined || val === '') return true
  return val > 0 || 'El precio debe ser mayor a 0'
}
</script>

<style scoped>
.formulario-precio {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
