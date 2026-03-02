<template>
  <div class="formulario-comercio">
    <!-- NOMBRE DEL COMERCIO -->
    <q-input
      v-model="datosInternos.nombre"
      label="Nombre del comercio *"
      outlined
      dense
      placeholder="Ej: TATA, DISCO, Almacén Don Pedro"
      :rules="[requerido]"
      @update:model-value="emitirCambios"
    >
      <template #prepend>
        <q-icon name="store" />
      </template>
    </q-input>

    <!-- TIPO DE COMERCIO -->
    <q-select
      v-model="datosInternos.tipo"
      label="Tipo de comercio (opcional)"
      outlined
      dense
      :options="opcionesTipo"
      emit-value
      map-options
      @update:model-value="emitirCambios"
    >
      <template #prepend>
        <q-icon name="category" />
      </template>
    </q-select>

    <!-- SEPARADOR -->
    <q-separator class="q-my-md" />

    <div class="seccion-titulo">
      <q-icon name="location_on" size="18px" />
      <span>Dirección</span>
    </div>

    <!-- CALLE Y NÚMERO -->
    <q-input
      v-model="datosInternos.calle"
      label="Calle y número *"
      outlined
      dense
      placeholder="Ej: Av. Brasil 2550"
      :rules="[requerido]"
      @update:model-value="emitirCambios"
    >
      <template #prepend>
        <q-icon name="signpost" />
      </template>
    </q-input>

    <!-- BARRIO -->
    <q-input
      v-model="datosInternos.barrio"
      label="Barrio (opcional)"
      outlined
      dense
      placeholder="Ej: Centro, Pocitos, Cordón"
      @update:model-value="emitirCambios"
    >
      <template #prepend>
        <q-icon name="apartment" />
      </template>
    </q-input>

    <!-- CIUDAD -->
    <q-input
      v-model="datosInternos.ciudad"
      label="Ciudad (opcional)"
      outlined
      dense
      placeholder="Ej: Montevideo, Punta del Este"
      @update:model-value="emitirCambios"
    >
      <template #prepend>
        <q-icon name="location_city" />
      </template>
    </q-input>

    <!-- FOTO DEL LOCAL -->
    <div class="seccion-foto">
      <q-img v-if="datosInternos.foto" :src="datosInternos.foto" class="foto-preview" :ratio="16/9" />
      <q-btn
        outline
        color="grey-6"
        class="boton-foto"
        @click="alClickarFoto"
      >
        <IconCamera :size="18" class="q-mr-sm" />
        {{ datosInternos.foto ? 'Cambiar foto del local' : 'Agregar foto del local' }}
      </q-btn>
      <p class="text-caption text-grey-5 q-mt-xs q-mb-none">
        Opcional. Podés cambiarla o quitarla después desde el detalle del comercio
      </p>
    </div>
    <input ref="inputArchivoRef" type="file" accept="image/*" class="input-archivo-oculto" @change="alSeleccionarArchivo" />

    <!-- FEEDBACK DE VALIDACIÓN -->
    <div v-if="mostrarFeedbackValidacion" class="feedback-validacion q-mt-md">
      <q-banner dense class="bg-info text-white" rounded>
        <template #avatar>
          <q-icon name="info" />
        </template>
        Verificando si el comercio ya existe...
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IconCamera } from '@tabler/icons-vue'
import { useCamaraFoto } from '../../composables/useCamaraFoto.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      nombre: '',
      tipo: 'Supermercado',
      calle: '',
      barrio: '',
      ciudad: '',
      foto: null,
    }),
  },
})

const emit = defineEmits(['update:modelValue', 'validar'])

// Opciones de tipo de comercio
const opcionesTipo = [
  { label: 'Supermercado', value: 'Supermercado' },
  { label: 'Hipermercado', value: 'Hipermercado' },
  { label: 'Minimercado', value: 'Minimercado' },
  { label: 'Almacén', value: 'Almacén' },
  { label: 'Verdulería', value: 'Verdulería' },
  { label: 'Carnicería', value: 'Carnicería' },
  { label: 'Panadería', value: 'Panadería' },
  { label: 'Farmacia', value: 'Farmacia' },
  { label: 'Ferretería', value: 'Ferretería' },
  { label: 'Tienda de ropa', value: 'Tienda de ropa' },
  { label: 'Librería', value: 'Librería' },
  { label: 'Perfumería', value: 'Perfumería' },
  { label: 'Juguetería', value: 'Juguetería' },
  { label: 'Electrónica', value: 'Electrónica' },
  { label: 'Mercado', value: 'Mercado' },
  { label: 'Mayorista', value: 'Mayorista' },
  { label: 'Otro', value: 'Otro' },
]

const { inputArchivoRef, tomarFoto, leerArchivo } = useCamaraFoto()

// Estado interno
const datosInternos = ref({
  nombre: props.modelValue.nombre || '',
  tipo: props.modelValue.tipo || 'Supermercado',
  calle: props.modelValue.calle || '',
  barrio: props.modelValue.barrio || '',
  ciudad: props.modelValue.ciudad || '',
  foto: props.modelValue.foto || null,
})

// Feedback de validación
const mostrarFeedbackValidacion = ref(false)

// Sincronizar con props externos
watch(
  () => props.modelValue,
  (nuevoValor) => {
    datosInternos.value = {
      nombre: nuevoValor.nombre || '',
      tipo: nuevoValor.tipo || 'Supermercado',
      calle: nuevoValor.calle || '',
      barrio: nuevoValor.barrio || '',
      ciudad: nuevoValor.ciudad || '',
      foto: nuevoValor.foto || null,
    }
  },
  { deep: true },
)

// Emitir cambios al padre
function emitirCambios() {
  emit('update:modelValue', { ...datosInternos.value })
}

async function alClickarFoto() {
  const resultado = await tomarFoto()
  if (resultado) {
    datosInternos.value.foto = resultado
    emitirCambios()
  }
}

async function alSeleccionarArchivo(event) {
  const resultado = await leerArchivo(event)
  if (resultado) {
    datosInternos.value.foto = resultado
    emitirCambios()
  }
}

// Reglas de validación
function requerido(val) {
  return (val && val.trim().length > 0) || 'Este campo es requerido'
}
</script>

<style scoped>
.formulario-comercio {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.seccion-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 14px;
  color: var(--color-primario);
  margin-bottom: -8px;
}
.seccion-foto {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  background-color: var(--fondo-drawer);
  border-radius: var(--borde-radio);
  gap: 8px;
}
.boton-foto {
  width: 100%;
}
.foto-preview {
  width: 100%;
  border-radius: 8px;
}
.input-archivo-oculto {
  display: none;
}
.feedback-validacion {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
