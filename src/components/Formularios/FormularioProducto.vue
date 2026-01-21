<template>
  <div class="formulario-producto">
    <!-- NOMBRE DEL PRODUCTO -->
    <q-input
      v-model="datosInternos.nombre"
      label="Nombre del producto"
      outlined
      dense
      placeholder="Ej: Leche La Serenísima"
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="emitirCambios"
    />

    <!-- MARCA -->
    <q-input
      v-model="datosInternos.marca"
      label="Marca"
      outlined
      dense
      placeholder="Ej: La Serenísima, Conaprole"
      hint="Opcional"
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="emitirCambios"
    />

    <!-- CÓDIGO DE BARRAS -->
    <q-input
      v-model="datosInternos.codigoBarras"
      label="Código de barras"
      outlined
      dense
      placeholder="Ej: 7790742005526"
      hint="Opcional"
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="emitirCambios"
    />

    <!-- CANTIDAD Y UNIDAD -->
    <div class="row q-col-gutter-md">
      <div class="col-6">
        <q-input
          v-model.number="datosInternos.cantidad"
          label="Cantidad"
          outlined
          dense
          type="number"
          min="0"
          step="0.01"
          placeholder="1"
          :rules="modo === 'comunidad' ? [requerido, cantidadValida] : [cantidadValida]"
          @update:model-value="emitirCambios"
        />
      </div>

      <div class="col-6">
        <q-select
          v-model="datosInternos.unidad"
          label="Unidad"
          outlined
          dense
          :options="opcionesUnidades"
          emit-value
          map-options
          :rules="modo === 'comunidad' ? [requerido] : []"
          @update:model-value="emitirCambios"
        />
      </div>
    </div>

    <!-- CATEGORÍA -->
    <q-input
      v-model="datosInternos.categoria"
      label="Categoría"
      outlined
      dense
      placeholder="Ej: Lácteos, Bebidas, Almacén"
      hint="Opcional"
      :rules="modo === 'comunidad' ? [requerido] : []"
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
      nombre: '',
      marca: '',
      codigoBarras: '',
      cantidad: 1,
      unidad: 'unidad',
      categoria: '',
    }),
  },
  modo: {
    type: String,
    default: 'local',
    validator: (value) => ['local', 'comunidad'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

// Opciones de unidades
const opcionesUnidades = [
  { label: 'Unidad', value: 'unidad' },
  { label: 'Litro', value: 'litro' },
  { label: 'Mililitro', value: 'mililitro' },
  { label: 'Kilo', value: 'kilo' },
  { label: 'Gramo', value: 'gramo' },
  { label: 'Metro', value: 'metro' },
  { label: 'Pack', value: 'pack' },
]

// Estado interno
const datosInternos = ref({
  nombre: props.modelValue.nombre || '',
  marca: props.modelValue.marca || '',
  codigoBarras: props.modelValue.codigoBarras || '',
  cantidad: props.modelValue.cantidad || 1,
  unidad: props.modelValue.unidad || 'unidad',
  categoria: props.modelValue.categoria || '',
})

// Sincronizar con props externos
watch(
  () => props.modelValue,
  (nuevoValor) => {
    datosInternos.value = {
      nombre: nuevoValor.nombre || '',
      marca: nuevoValor.marca || '',
      codigoBarras: nuevoValor.codigoBarras || '',
      cantidad: nuevoValor.cantidad || 1,
      unidad: nuevoValor.unidad || 'unidad',
      categoria: nuevoValor.categoria || '',
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

function cantidadValida(val) {
  if (val === null || val === undefined || val === '') return true
  return val > 0 || 'La cantidad debe ser mayor a 0'
}
</script>

<style scoped>
.formulario-producto {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
