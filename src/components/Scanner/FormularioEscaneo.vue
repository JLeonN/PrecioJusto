<template>
  <!-- Bottom sheet: aparece luego de cada escaneo -->
  <q-dialog v-model="abierto" position="bottom" @show="alAbrir" @hide="alCerrar">
    <q-card class="formulario-escaneo-card">

      <!-- HEADER: info del producto + ícono basura -->
      <q-card-section class="formulario-escaneo-header">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-subtitle1 text-weight-bold ellipsis">
              {{ item?.origenApi ? item.nombre : 'Producto no encontrado' }}
            </div>
            <div v-if="item?.origenApi && item.marca" class="text-caption text-grey-6">
              {{ item.marca }}{{ item.cantidad ? ` — ${item.cantidad} ${item.unidad}` : '' }}
            </div>
            <div v-if="!item?.origenApi" class="text-caption text-grey-6">
              Código: {{ item?.codigoBarras || '—' }}
            </div>
          </div>
          <!-- Miniatura de imagen si viene de la API -->
          <q-img
            v-if="item?.origenApi && item.imagen"
            :src="item.imagen"
            class="formulario-escaneo-imagen q-ml-sm"
            fit="cover"
          />
          <!-- Botón descartar este item -->
          <q-btn round flat color="negative" class="q-ml-sm" @click="emitDescartar">
            <IconTrash :size="22" />
          </q-btn>
        </div>
      </q-card-section>

      <q-separator />

      <!-- CAMPOS DEL FORMULARIO -->
      <q-card-section class="formulario-escaneo-campos">

        <!-- Nombre: solo en modo mínimo (producto no encontrado en API) -->
        <q-input
          v-if="!item?.origenApi"
          ref="inputNombreRef"
          v-model="datosForm.nombre"
          label="Nombre del producto *"
          outlined
          dense
          :rules="[v => !!v || 'El nombre es requerido']"
          lazy-rules
        />

        <!-- Precio y moneda -->
        <div class="row q-col-gutter-sm">
          <div class="col-8">
            <q-input
              ref="inputPrecioRef"
              v-model.number="datosForm.precio"
              label="Precio *"
              outlined
              dense
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              :rules="[v => (v > 0) || 'El precio debe ser mayor a 0']"
              lazy-rules
            />
          </div>
          <div class="col-4">
            <q-select
              v-model="datosForm.moneda"
              label="Moneda"
              outlined
              dense
              :options="MONEDAS"
              emit-value
              map-options
            />
          </div>
        </div>

      </q-card-section>

      <!-- FOOTER FIJO: contador + botones de acción -->
      <q-card-section class="formulario-escaneo-footer">
        <div class="row items-center no-wrap q-gutter-xs">

          <!-- Cantidad acumulada en bandeja -->
          <div class="col">
            <span v-if="cantidadEnBandeja > 0" class="text-caption text-grey-7">
              <strong>{{ cantidadEnBandeja }}</strong>
              {{ cantidadEnBandeja === 1 ? 'item' : 'items' }} en bandeja
            </span>
          </div>

          <!-- Botón Siguiente: guarda y vuelve al scanner -->
          <q-btn
            outline
            no-caps
            color="primary"
            :disable="!formularioValido"
            @click="emitSiguiente"
          >
            Siguiente
            <IconArrowRight :size="18" class="q-ml-xs" />
          </q-btn>

          <!-- Botón Enviar a bandeja: guarda y cierra el flujo -->
          <q-btn
            no-caps
            color="primary"
            :disable="!formularioValido"
            @click="emitEnviarABandeja"
          >
            <IconCheck :size="18" class="q-mr-xs" />
            Enviar
          </q-btn>

        </div>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { MONEDAS, MONEDA_DEFAULT } from '../../almacenamiento/constantes/Monedas.js'
import { IconTrash, IconArrowRight, IconCheck } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  // Item escaneado: viene del componente padre, no del store directamente
  item: {
    type: Object,
    default: null,
  },
  // Cantidad de items acumulados en la bandeja para mostrar el indicador
  cantidadEnBandeja: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue', 'siguiente', 'enviar-a-bandeja', 'descartar'])

const inputNombreRef = ref(null)
const inputPrecioRef = ref(null)

// Datos internos del formulario (independientes del item prop)
const datosForm = ref({
  nombre: '',
  precio: null,
  moneda: MONEDA_DEFAULT,
})

// v-model del dialog: lo controla el padre
const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Validación: precio obligatorio siempre, nombre obligatorio solo en modo mínimo
const formularioValido = computed(() => {
  const precioOk = datosForm.value.precio > 0
  const nombreOk = props.item?.origenApi || !!datosForm.value.nombre?.trim()
  return precioOk && nombreOk
})

// Sincroniza el formulario cuando llega un nuevo item escaneado
watch(
  () => props.item,
  (nuevoItem) => {
    if (!nuevoItem) return
    datosForm.value = {
      nombre: nuevoItem.nombre || '',
      precio: nuevoItem.precio || null,
      moneda: nuevoItem.moneda || MONEDA_DEFAULT,
    }
  },
  { immediate: true },
)

// Autofocus al campo correcto según el modo
function alAbrir() {
  nextTick(() => {
    if (!props.item?.origenApi) {
      inputNombreRef.value?.focus()
    } else {
      inputPrecioRef.value?.focus()
    }
  })
}

// Resetea el formulario al cerrar
function alCerrar() {
  datosForm.value = { nombre: '', precio: null, moneda: MONEDA_DEFAULT }
}

// Construye el objeto item actualizado con los datos del form
function itemActualizado() {
  return {
    ...props.item,
    nombre: props.item?.origenApi ? props.item.nombre : datosForm.value.nombre.trim(),
    precio: datosForm.value.precio,
    moneda: datosForm.value.moneda,
  }
}

// Guarda el item actual y vuelve al scanner
function emitSiguiente() {
  if (!formularioValido.value) return
  emit('siguiente', itemActualizado())
}

// Guarda el item actual y cierra todo el flujo de escaneo
function emitEnviarABandeja() {
  if (!formularioValido.value) return
  emit('enviar-a-bandeja', itemActualizado())
}

// Descarta el escaneo actual y vuelve al scanner sin guardar
function emitDescartar() {
  emit('descartar')
}
</script>

<style scoped>
.formulario-escaneo-card {
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 100vw;
  padding-bottom: var(--safe-area-bottom);
}
.formulario-escaneo-header {
  padding: 14px 16px;
}
.formulario-escaneo-imagen {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  flex-shrink: 0;
}
.formulario-escaneo-campos {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.formulario-escaneo-footer {
  padding: 10px 16px 14px;
  border-top: 1px solid var(--borde-color);
}
</style>
