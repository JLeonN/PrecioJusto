<template>
  <div class="selector-comercio-direccion">
    <!-- COMERCIO -->
    <q-select
      ref="refSelectComercio"
      v-model="comercioSeleccionado"
      :options="comerciosFiltrados"
      :display-value="textoVisibleComercio"
      option-label="nombre"
      :label="labelComercio"
      outlined
      dense
      use-input
      clearable
      @filter="filtrarComercios"
      @update:model-value="alSeleccionarComercio"
      @input-value="alEscribirComercio"
      @focus="comercioTieneFoco = true"
      @blur="guardarComercioEscrito"
    >
      <template #prepend>
        <IconBuildingStore :size="18" />
      </template>
      <template #option="{ itemProps, opt }">
        <q-item v-bind="itemProps">
          <q-item-section>
            <q-item-label>{{ opt.nombre }}</q-item-label>
            <q-item-label caption>
              {{
                opt.esCadena
                  ? opt.totalSucursales + ' sucursales'
                  : opt.direcciones.length + ' ' + (opt.direcciones.length === 1 ? 'dirección' : 'direcciones')
              }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">No se encontraron comercios</q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- DIRECCIÓN / SUCURSAL -->
    <q-select
      v-model="direccionSeleccionada"
      :options="direccionesDisponibles"
      :display-value="textoVisibleDireccion"
      option-label="nombreCompleto"
      :label="labelDireccion"
      outlined
      dense
      use-input
      clearable
      :disable="!tieneComercioValido"
      :hint="!tieneComercioValido ? 'Seleccioná primero un comercio' : 'Opcional: identificá la sucursal'"
      @update:model-value="alSeleccionarDireccion"
      @input-value="textoTemporalDireccion = $event || ''"
      @focus="direccionTieneFoco = true"
      @blur="guardarDireccionEscrita"
    >
      <template #prepend>
        <IconMapPin :size="18" />
      </template>
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{ esComercioExistente ? 'No hay direcciones para este comercio' : 'Escribí una dirección' }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'
import { IconBuildingStore, IconMapPin } from '@tabler/icons-vue'

defineProps({
  // { id, nombre, direccionId, direccionNombre } | null
  modelValue: {
    type: Object,
    default: () => null,
  },
  labelComercio: {
    type: String,
    default: 'Comercio',
  },
  labelDireccion: {
    type: String,
    default: 'Dirección / Sucursal',
  },
})

const emit = defineEmits(['update:modelValue'])

const comerciosStore = useComerciStore()

const refSelectComercio = ref(null)
defineExpose({ focus: () => refSelectComercio.value?.focus() })

// Estado del selector de comercio
const comercioSeleccionado = ref(null)
const comerciosFiltrados = ref([])
const comercioId = ref(null)
const comercioEscrito = ref('')
const textoTemporalComercio = ref('')
const comercioTieneFoco = ref(false)

// Estado del selector de dirección
const direccionSeleccionada = ref(null)
const direccionId = ref(null)
const direccionEscrita = ref('')
const textoTemporalDireccion = ref('')
const direccionTieneFoco = ref(false)

onMounted(async () => {
  await comerciosStore.cargarComercios()
  // Muestra top 3 más recientes por defecto
  comerciosFiltrados.value = comerciosStore.comerciosAgrupados.slice(0, 3)
})

// ========================================
// COMPUTED
// ========================================

const esComercioExistente = computed(
  () => comercioSeleccionado.value !== null && typeof comercioSeleccionado.value === 'object',
)

const tieneComercioValido = computed(() => {
  if (esComercioExistente.value) return true
  if (comercioEscrito.value.length >= 1) return true
  if (textoTemporalComercio.value.length >= 1) return true
  return false
})

const direccionesDisponibles = computed(() => {
  if (!esComercioExistente.value) return []
  return comercioSeleccionado.value.direcciones || []
})

const textoVisibleComercio = computed(() => {
  if (comercioTieneFoco.value) return undefined
  if (esComercioExistente.value) return comercioSeleccionado.value.nombre
  if (comercioEscrito.value) return comercioEscrito.value
  return ''
})

const textoVisibleDireccion = computed(() => {
  if (direccionTieneFoco.value) return undefined
  if (typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null) {
    return direccionSeleccionada.value.nombreCompleto || direccionSeleccionada.value.calle || ''
  }
  if (direccionEscrita.value) return direccionEscrita.value
  return ''
})

// ========================================
// FUNCIONES COMERCIO
// ========================================

function filtrarComercios(val, update) {
  update(() => {
    if (!val) {
      comerciosFiltrados.value = comerciosStore.comerciosAgrupados.slice(0, 3)
    } else {
      const needle = val.toLowerCase()
      comerciosFiltrados.value = comerciosStore.comerciosAgrupados.filter((c) =>
        c.nombre.toLowerCase().includes(needle),
      )
    }
  })
}

function resolverComercioId(comercioOGrupo, idDireccion) {
  if (!comercioOGrupo.comerciosOriginales) return comercioOGrupo.id
  const sucursal = comercioOGrupo.comerciosOriginales.find((c) =>
    c.direcciones.some((d) => d.id === idDireccion),
  )
  return sucursal ? sucursal.id : comercioOGrupo.id
}

function alSeleccionarComercio(comercio) {
  if (!comercio) {
    comercioId.value = null
    comercioSeleccionado.value = null
    direccionSeleccionada.value = null
    direccionId.value = null
    comercioEscrito.value = ''
    textoTemporalComercio.value = ''
    emitir()
    return
  }
  comercioSeleccionado.value = comercio
  comercioEscrito.value = ''
  textoTemporalComercio.value = ''
  // Auto-selecciona la dirección principal
  if (comercio.direcciones?.length > 0) {
    const dir = comercio.direccionPrincipal || comercio.direcciones[0]
    direccionSeleccionada.value = dir
    direccionId.value = dir.id
    comercioId.value = resolverComercioId(comercio, dir.id)
  } else {
    direccionSeleccionada.value = null
    direccionId.value = null
    comercioId.value = comercio.id
  }
  emitir()
}

function alEscribirComercio(val) {
  textoTemporalComercio.value = val || ''
}

function guardarComercioEscrito() {
  comercioTieneFoco.value = false
  if (textoTemporalComercio.value && !comercioSeleccionado.value) {
    comercioEscrito.value = textoTemporalComercio.value
  }
}

// ========================================
// FUNCIONES DIRECCIÓN
// ========================================

function alSeleccionarDireccion(direccion) {
  if (!direccion) {
    direccionId.value = null
    direccionSeleccionada.value = null
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    emitir()
    return
  }
  direccionId.value = direccion.id
  direccionSeleccionada.value = direccion
  direccionEscrita.value = ''
  textoTemporalDireccion.value = ''
  if (esComercioExistente.value) {
    comercioId.value = resolverComercioId(comercioSeleccionado.value, direccion.id)
  }
  emitir()
}

function guardarDireccionEscrita() {
  direccionTieneFoco.value = false
  if (textoTemporalDireccion.value && !direccionSeleccionada.value) {
    direccionEscrita.value = textoTemporalDireccion.value
  }
}

// ========================================
// EMIT
// ========================================

function emitir() {
  const nombre = esComercioExistente.value
    ? comercioSeleccionado.value.nombre
    : comercioEscrito.value
  const direccionNombre =
    typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null
      ? direccionSeleccionada.value.calle || direccionSeleccionada.value.nombreCompleto || ''
      : direccionEscrita.value

  if (!nombre && !comercioId.value) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', {
    id: comercioId.value,
    nombre,
    direccionId: direccionId.value,
    direccionNombre,
  })
}
</script>

<style scoped>
.selector-comercio-direccion {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
