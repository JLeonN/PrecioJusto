<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="dialogo-agregar-sucursal">
      <!-- HEADER -->
      <q-card-section class="bg-orange text-white">
        <div class="text-h6">
          <q-icon name="add_location" class="q-mr-sm" />
          Nueva sucursal
        </div>
        <div class="text-caption">{{ comercioNombre }}</div>
      </q-card-section>

      <!-- FORMULARIO -->
      <q-card-section class="q-gutter-md">
        <!-- Dirección (obligatorio) -->
        <q-input
          v-model="datos.calle"
          label="Calle y número *"
          outlined
          dense
          placeholder="Ej: Av. 18 de Julio 1234"
          :rules="[val => !!val || 'La dirección es obligatoria']"
        />

        <!-- Barrio (opcional) -->
        <q-input
          v-model="datos.barrio"
          label="Barrio (opcional)"
          outlined
          dense
          placeholder="Ej: Centro, Pocitos"
        />

        <!-- Ciudad (opcional) -->
        <q-input
          v-model="datos.ciudad"
          label="Ciudad (opcional)"
          outlined
          dense
          placeholder="Ej: Montevideo"
        />

        <!-- Categoría (solo si el comercio no tiene) -->
        <q-select
          v-if="!comercioTipo"
          v-model="datos.tipo"
          label="Categoría (opcional)"
          outlined
          dense
          :options="opcionesTipo"
          emit-value
          map-options
          clearable
        />

        <!-- Info de categoría heredada -->
        <div v-else class="text-caption text-grey-6">
          <q-icon name="info" size="14px" class="q-mr-xs" />
          Categoría heredada: {{ comercioTipo }}
        </div>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" color="grey" @click="cerrar" />
        <q-btn
          label="Agregar sucursal"
          color="orange"
          :disable="!datos.calle"
          :loading="guardando"
          @click="guardar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import ComerciosService from '../../../almacenamiento/servicios/ComerciosService.js'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  comercioNombre: {
    type: String,
    required: true,
  },
  comercioTipo: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'sucursal-guardada'])

const comerciosStore = useComerciStore()

const opcionesTipo = [
  'Supermercado', 'Hipermercado', 'Minimercado', 'Almacén',
  'Verdulería', 'Carnicería', 'Panadería', 'Farmacia',
  'Ferretería', 'Tienda de ropa', 'Librería', 'Perfumería',
  'Juguetería', 'Electrónica', 'Mercado', 'Mayorista', 'Otro',
]

const guardando = ref(false)
const datos = reactive({
  calle: '',
  barrio: '',
  ciudad: '',
  tipo: '',
})

function limpiar() {
  datos.calle = ''
  datos.barrio = ''
  datos.ciudad = ''
  datos.tipo = ''
}

function cerrar() {
  limpiar()
  emit('update:modelValue', false)
}

// Crea un nuevo comercio con el mismo nombre → se agrupa automáticamente
async function guardar() {
  if (!datos.calle) return

  guardando.value = true
  try {
    const nuevoComercio = {
      nombre: props.comercioNombre,
      tipo: props.comercioTipo || datos.tipo || 'Otro',
      calle: datos.calle.trim(),
      barrio: datos.barrio?.trim() || '',
      ciudad: datos.ciudad?.trim() || '',
    }

    await ComerciosService.agregarComercio(nuevoComercio)
    await comerciosStore.cargarComercios()

    emit('sucursal-guardada')
    cerrar()
  } catch (err) {
    console.error('Error al agregar sucursal:', err)
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.dialogo-agregar-sucursal {
  min-width: 350px;
  max-width: 500px;
  width: 90vw;
}
</style>
