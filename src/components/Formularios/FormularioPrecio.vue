<template>
  <div class="formulario-precio">
    <!-- COMERCIO (Selector con autocompletado) -->
    <q-select
      v-model="comercioSeleccionado"
      :options="comerciosFiltrados"
      :display-value="textoVisibleComercio"
      option-label="nombre"
      label="Comercio"
      outlined
      dense
      use-input
      clearable
      :rules="modo === 'comunidad' ? [requerido] : []"
      @filter="filtrarComercios"
      @update:model-value="alSeleccionarComercio"
      @input-value="alEscribirComercio"
      @focus="alEnfocarComercio"
      @blur="guardarComercioEscrito"
    >
      <template #prepend>
        <q-icon name="store" />
      </template>

      <!-- Opciones personalizadas con cantidad de direcciones -->
      <template #option="{ itemProps, opt }">
        <q-item v-bind="itemProps">
          <q-item-section>
            <q-item-label>{{ opt.nombre }}</q-item-label>
            <q-item-label caption>
              {{ opt.direcciones.length }}
              {{ opt.direcciones.length === 1 ? 'dirección' : 'direcciones' }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- Sin resultados -->
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey"> No se encontraron comercios </q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- DIRECCIÓN / SUCURSAL (Selector dinámico) -->
    <q-select
      v-model="direccionSeleccionada"
      :options="direccionesDisponibles"
      :display-value="textoVisibleDireccion"
      option-label="nombreCompleto"
      label="Dirección / Sucursal"
      outlined
      dense
      use-input
      clearable
      :disable="!tieneComercioValido"
      :hint="
        !tieneComercioValido
          ? 'Escribí al menos 1 caracter en el nombre del comercio'
          : esComercioExistente
            ? 'Opcional: ayuda a identificar la sucursal específica'
            : 'Escribí una dirección para este comercio nuevo'
      "
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="alSeleccionarDireccion"
      @input-value="alEscribirDireccion"
      @focus="alEnfocarDireccion"
      @blur="guardarDireccionEscrita"
    >
      <template #prepend>
        <q-icon name="place" />
      </template>

      <!-- Sin resultados -->
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{
              esComercioExistente
                ? 'No hay direcciones para este comercio'
                : 'Escribí una dirección para el comercio nuevo'
            }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- Botón para agregar nuevo comercio -->
    <q-btn
      flat
      dense
      no-caps
      color="primary"
      icon="add_circle"
      label="Agregar nuevo comercio"
      class="q-mt-xs"
      style="margin-top: -8px"
      @click="abrirDialogoNuevoComercio"
    />

    <!-- PRECIO Y MONEDA -->
    <div class="row q-col-gutter-md">
      <div class="col-8">
        <q-input
          v-model.number="datosInternos.valor"
          label="Precio"
          outlined
          dense
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          :rules="modo === 'comunidad' ? [requerido, precioValido] : [precioValido]"
          @update:model-value="emitirCambios"
        />
      </div>

      <div class="col-4">
        <q-select
          v-model="datosInternos.moneda"
          label="Moneda"
          outlined
          dense
          :options="opcionesMoneda"
          emit-value
          map-options
          @update:model-value="alCambiarMoneda"
        />
      </div>
    </div>

    <!-- DIÁLOGO: Agregar Nuevo Comercio Rápido -->
    <DialogoAgregarComercioRapido
      v-model="dialogoNuevoComercioAbierto"
      :nombre-inicial="comercioEscrito"
      :direccion-inicial="direccionEscrita"
      @comercio-creado="alCrearComercio"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'
import preferenciasService from '../../almacenamiento/servicios/PreferenciasService.js'
import { MONEDAS, MONEDA_DEFAULT } from '../../almacenamiento/constantes/Monedas.js'
import DialogoAgregarComercioRapido from './Dialogos/DialogoAgregarComercioRapido.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      comercio: '',
      direccion: '',
      valor: null,
      moneda: 'UYU',
    }),
  },
  modo: {
    type: String,
    default: 'local',
    validator: (value) => ['local', 'comunidad'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

// Store de comercios
const comerciosStore = useComerciStore()

// Opciones de moneda (importadas desde constantes)
const opcionesMoneda = MONEDAS

// Estado interno del formulario
const datosInternos = ref({
  comercio: props.modelValue.comercio || '',
  direccion: props.modelValue.direccion || '',
  valor: props.modelValue.valor || null,
  moneda: props.modelValue.moneda || MONEDA_DEFAULT,
})

// Estado del selector de comercios
const comercioSeleccionado = ref(null)
const comerciosFiltrados = ref([])
const comercioId = ref(null)
const comercioEscrito = ref('') // Texto que el usuario escribió
const textoTemporalComercio = ref('') // Texto mientras escribe
const comercioTieneFoco = ref(false) // Si el input tiene foco

// Estado del selector de direcciones
const direccionSeleccionada = ref(null)
const direccionId = ref(null)
const direccionEscrita = ref('') // Texto que el usuario escribió
const textoTemporalDireccion = ref('') // Texto mientras escribe
const direccionTieneFoco = ref(false) // Si el input tiene foco

// Estado del diálogo de nuevo comercio
const dialogoNuevoComercioAbierto = ref(false)

// Flag para detectar si es comercio nuevo
const esComercioNuevo = ref(false)

// ========================================
// COMPUTED PROPERTIES
// ========================================

/**
 * Verificar si el comercio seleccionado es un objeto existente
 */
const esComercioExistente = computed(() => {
  return comercioSeleccionado.value !== null && typeof comercioSeleccionado.value === 'object'
})

/**
 * Verificar si hay un comercio válido
 */
const tieneComercioValido = computed(() => {
  if (esComercioExistente.value) return true
  if (comercioEscrito.value.length >= 1) return true
  if (textoTemporalComercio.value.length >= 1) return true
  return false
})

/**
 * Direcciones disponibles según comercio seleccionado
 */
const direccionesDisponibles = computed(() => {
  if (!esComercioExistente.value) return []
  return comercioSeleccionado.value.direcciones || []
})

/**
 * Texto visible en el selector de comercio
 */
const textoVisibleComercio = computed(() => {
  // Si está escribiendo (tiene foco), dejar que q-select maneje el display
  if (comercioTieneFoco.value) {
    return undefined // No interferir con el input del q-select
  }

  // Si hay comercio seleccionado (objeto)
  if (esComercioExistente.value) {
    return comercioSeleccionado.value.nombre
  }

  // Si hay texto guardado (escrito anteriormente)
  if (comercioEscrito.value) {
    return comercioEscrito.value
  }

  return ''
})

/**
 * Texto visible en el selector de dirección
 */
const textoVisibleDireccion = computed(() => {
  // Si está escribiendo (tiene foco), dejar que q-select maneje el display
  if (direccionTieneFoco.value) {
    return undefined // No interferir con el input del q-select
  }

  // Si hay dirección seleccionada (objeto)
  if (typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null) {
    return direccionSeleccionada.value.nombreCompleto || direccionSeleccionada.value.calle
  }

  // Si hay texto guardado
  if (direccionEscrita.value) {
    return direccionEscrita.value
  }

  return ''
})

// ========================================
// LIFECYCLE
// ========================================

// Cargar moneda guardada al montar
onMounted(async () => {
  const preferencias = await preferenciasService.obtenerPreferencias()
  datosInternos.value.moneda = preferencias.moneda
  emitirCambios()

  // Cargar comercios
  await comerciosStore.cargarComercios()
})

// ========================================
// FUNCIONES
// ========================================

/**
 * Filtrar comercios mientras el usuario escribe
 */
function filtrarComercios(val, update) {
  update(() => {
    if (val === '') {
      comerciosFiltrados.value = comerciosStore.comerciosPorUso
    } else {
      const needle = val.toLowerCase()
      comerciosFiltrados.value = comerciosStore.comerciosPorUso.filter(
        (c) => c.nombre.toLowerCase().indexOf(needle) > -1,
      )
    }
  })
}

/**
 * Cuando el input de comercio recibe foco
 */
function alEnfocarComercio() {
  comercioTieneFoco.value = true
}

/**
 * Capturar lo que el usuario escribe en el selector de comercio (mientras escribe)
 */
function alEscribirComercio(val) {
  textoTemporalComercio.value = val || ''
}

/**
 * Guardar el texto cuando el usuario sale del input de comercio
 */
function guardarComercioEscrito() {
  comercioTieneFoco.value = false
  if (textoTemporalComercio.value && !comercioSeleccionado.value) {
    comercioEscrito.value = textoTemporalComercio.value
    console.log('💾 Comercio guardado:', comercioEscrito.value)
  }
}

/**
 * Cuando el input de dirección recibe foco
 */
function alEnfocarDireccion() {
  direccionTieneFoco.value = true
}

/**
 * Capturar lo que el usuario escribe en el selector de dirección (mientras escribe)
 */
function alEscribirDireccion(val) {
  textoTemporalDireccion.value = val || ''
}

/**
 * Guardar el texto cuando el usuario sale del input de dirección
 */
function guardarDireccionEscrita() {
  direccionTieneFoco.value = false
  if (textoTemporalDireccion.value && !direccionSeleccionada.value) {
    direccionEscrita.value = textoTemporalDireccion.value
    console.log('💾 Dirección guardada:', direccionEscrita.value)
  }
}

/**
 * Al seleccionar un comercio del dropdown
 */
function alSeleccionarComercio(comercio) {
  if (!comercio) {
    // Usuario borró la selección
    comercioId.value = null
    comercioSeleccionado.value = null
    direccionSeleccionada.value = null
    direccionId.value = null
    esComercioNuevo.value = false
    comercioEscrito.value = ''
    textoTemporalComercio.value = ''
    emitirCambios()
    return
  }

  // Guardar comercio seleccionado
  comercioId.value = comercio.id
  comercioSeleccionado.value = comercio
  esComercioNuevo.value = false
  comercioEscrito.value = '' // Limpiar texto escrito
  textoTemporalComercio.value = ''

  // Auto-seleccionar dirección más usada si existe
  if (comercio.direcciones && comercio.direcciones.length > 0) {
    // Ordenar por ultimoUso y tomar la primera
    const direccionesOrdenadas = [...comercio.direcciones].sort((a, b) => {
      const fechaA = a.ultimoUso ? new Date(a.ultimoUso) : new Date(0)
      const fechaB = b.ultimoUso ? new Date(b.ultimoUso) : new Date(0)
      return fechaB - fechaA
    })

    direccionSeleccionada.value = direccionesOrdenadas[0]
    direccionId.value = direccionesOrdenadas[0].id
  } else {
    direccionSeleccionada.value = null
    direccionId.value = null
  }

  emitirCambios()
}

/**
 * Al seleccionar una dirección del dropdown
 */
function alSeleccionarDireccion(direccion) {
  if (!direccion) {
    // Usuario borró la selección
    direccionId.value = null
    direccionSeleccionada.value = null
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    emitirCambios()
    return
  }

  // Guardar dirección seleccionada
  direccionId.value = direccion.id
  direccionSeleccionada.value = direccion
  direccionEscrita.value = '' // Limpiar texto escrito
  textoTemporalDireccion.value = ''
  emitirCambios()
}

/**
 * Abrir diálogo de nuevo comercio con datos pre-llenados
 */
function abrirDialogoNuevoComercio() {
  console.log('🔍 Nombre:', comercioEscrito.value)
  console.log('🔍 Dirección:', direccionEscrita.value)
  dialogoNuevoComercioAbierto.value = true
}

/**
 * Al crear un comercio desde el diálogo
 */
function alCrearComercio(comercioCreado) {
  // Auto-seleccionar el comercio recién creado
  comercioSeleccionado.value = comercioCreado
  comercioId.value = comercioCreado.id

  // Limpiar textos escritos
  comercioEscrito.value = ''
  textoTemporalComercio.value = ''
  direccionEscrita.value = ''
  textoTemporalDireccion.value = ''

  // Auto-seleccionar la primera dirección (si se agregó)
  if (comercioCreado.direcciones && comercioCreado.direcciones.length > 0) {
    direccionSeleccionada.value = comercioCreado.direcciones[0]
    direccionId.value = comercioCreado.direcciones[0].id
  }

  esComercioNuevo.value = true

  // Emitir cambios
  emitirCambios()
}

// Al cambiar moneda, guardarla
async function alCambiarMoneda() {
  await preferenciasService.guardarMoneda(datosInternos.value.moneda)
  emitirCambios()
}

// Sincronizar con props externos
watch(
  () => props.modelValue,
  (nuevoValor) => {
    datosInternos.value = {
      comercio: nuevoValor.comercio || '',
      direccion: nuevoValor.direccion || '',
      valor: nuevoValor.valor || null,
      moneda: nuevoValor.moneda || MONEDA_DEFAULT,
    }
  },
  { deep: true },
)

// Emitir cambios al padre
function emitirCambios() {
  const nombreComercio = esComercioExistente.value
    ? comercioSeleccionado.value.nombre
    : comercioEscrito.value

  const nombreDireccion =
    typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null
      ? direccionSeleccionada.value.calle
      : direccionEscrita.value

  const nombreCompleto =
    typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null
      ? direccionSeleccionada.value.nombreCompleto
      : ''

  emit('update:modelValue', {
    ...datosInternos.value,
    comercioId: comercioId.value,
    direccionId: direccionId.value,
    comercio: nombreComercio,
    direccion: nombreDireccion,
    nombreCompleto: nombreCompleto,
  })
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
