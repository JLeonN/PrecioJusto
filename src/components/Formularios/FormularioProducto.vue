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
      :loading="buscandoNombre"
      @update:model-value="emitirCambios"
    >
      <template #append>
        <q-btn
          flat
          dense
          round
          size="sm"
          color="primary"
          :loading="buscandoNombre"
          :disable="!datosInternos.nombre.trim()"
          @click="buscarPorNombre"
        >
          <IconSearch :size="18" />
          <q-tooltip>Buscar en base de datos</q-tooltip>
        </q-btn>
      </template>
    </q-input>

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
      :loading="buscandoCodigo"
      @update:model-value="emitirCambios"
    >
      <template #append>
        <q-btn flat round dense color="primary" size="sm" @click="iniciarEscaneo">
          <IconCamera :size="18" />
          <q-tooltip>Escanear con cámara</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          size="sm"
          color="primary"
          :loading="buscandoCodigo"
          :disable="!datosInternos.codigoBarras.trim()"
          @click="buscarPorCodigo"
        >
          <IconSearch :size="18" />
          <q-tooltip>Buscar por código</q-tooltip>
        </q-btn>
      </template>
    </q-input>

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
          :step="stepCantidad"
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
          @update:model-value="alCambiarUnidad"
        />
      </div>
    </div>

    <!-- FOTO DEL PRODUCTO (compacta) -->
    <div class="foto-fila">
      <div class="foto-fila__izquierda">
        <IconPhoto :size="18" class="text-grey-6" />
        <span class="text-caption text-grey-7 q-ml-xs">Foto</span>
      </div>
      <div class="foto-fila__derecha">
        <img v-if="datosInternos.imagen" :src="datosInternos.imagen" class="foto-miniatura" />
        <q-btn flat round dense size="sm" color="grey-6">
          <IconCamera :size="18" />
          <q-tooltip>Gestionar foto</q-tooltip>
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 160px">
              <q-item v-if="esNativo" clickable v-close-popup @click="seleccionarCamara">
                <q-item-section avatar><IconCamera :size="18" /></q-item-section>
                <q-item-section>Tomar foto</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="abrirGaleria">
                <q-item-section avatar><IconPhoto :size="18" /></q-item-section>
                <q-item-section>Desde galería</q-item-section>
              </q-item>
              <q-item v-if="datosInternos.imagen" clickable v-close-popup @click="quitarFoto">
                <q-item-section avatar><IconTrash :size="18" class="text-negative" /></q-item-section>
                <q-item-section class="text-negative">Borrar foto</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>
    <input ref="inputArchivoRef" type="file" accept="image/*" class="input-archivo-oculto" @change="alSeleccionarArchivo" />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { IconSearch, IconCamera, IconPhoto, IconTrash } from '@tabler/icons-vue'
import { useCamaraFoto } from '../../composables/useCamaraFoto.js'
import { usePreferenciasStore } from '../../almacenamiento/stores/preferenciasStore.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      nombre: '',
      marca: '',
      codigoBarras: '',
      cantidad: 1,
      unidad: 'unidad',
    }),
  },
  modo: {
    type: String,
    default: 'local',
    validator: (value) => ['local', 'comunidad'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'buscar-codigo', 'buscar-nombre', 'escanear-codigo'])

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

const { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo } = useCamaraFoto()
const preferenciasStore = usePreferenciasStore()

// Estado interno
const datosInternos = ref({
  nombre: props.modelValue.nombre || '',
  marca: props.modelValue.marca || '',
  codigoBarras: props.modelValue.codigoBarras || '',
  cantidad: props.modelValue.cantidad || 1,
  unidad: props.modelValue.unidad || preferenciasStore.unidad,
  imagen: props.modelValue.imagen || null,
})

// Estados de búsqueda
const buscandoCodigo = ref(false)
const buscandoNombre = ref(false)

// Step inteligente según unidad
const stepCantidad = computed(() => {
  const unidadesEnteras = ['unidad', 'pack', 'metro']
  return unidadesEnteras.includes(datosInternos.value.unidad) ? '1' : '0.01'
})

// Al cambiar unidad, guardarla
async function alCambiarUnidad() {
  await preferenciasStore.guardarUnidad(datosInternos.value.unidad)
  emitirCambios()
}

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
      imagen: nuevoValor.imagen || null,
    }
  },
  { deep: true },
)

// ── Foto del producto ─────────────────────────────────────
async function seleccionarCamara() {
  const resultado = await abrirCamara()
  if (resultado) {
    datosInternos.value.imagen = resultado
    emitirCambios()
  }
}
async function alSeleccionarArchivo(event) {
  const resultado = await leerArchivo(event)
  if (resultado) {
    datosInternos.value.imagen = resultado
    emitirCambios()
  }
}
function quitarFoto() {
  datosInternos.value.imagen = null
  emitirCambios()
}

// Emitir cambios al padre
function emitirCambios() {
  emit('update:modelValue', { ...datosInternos.value })
}

// Funciones de búsqueda
function buscarPorCodigo() {
  buscandoCodigo.value = true
  emit('buscar-codigo', datosInternos.value.codigoBarras, () => {
    buscandoCodigo.value = false
  })
}

// Emite evento al padre para escanear un código (modo unitario, no sesión)
function iniciarEscaneo() {
  emit('escanear-codigo')
}

function buscarPorNombre() {
  buscandoNombre.value = true
  emit('buscar-nombre', datosInternos.value.nombre, () => {
    buscandoNombre.value = false
  })
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
.foto-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--color-carta-borde, #ddd);
  border-radius: 8px;
  background: var(--fondo-tarjeta, white);
}
.foto-fila__izquierda {
  display: flex;
  align-items: center;
}
.foto-fila__derecha {
  display: flex;
  align-items: center;
  gap: 8px;
}
.foto-miniatura {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
}
.input-archivo-oculto {
  display: none;
}
</style>
