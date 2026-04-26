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
      behavior="menu"
      :menu-props="{ maxHeight: '180px', autoClose: true }"
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
      behavior="menu"
      :menu-props="{ maxHeight: '150px', autoClose: true }"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'
import { IconBuildingStore, IconMapPin } from '@tabler/icons-vue'

const props = defineProps({
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
  autoSeleccionarDireccion: {
    type: Boolean,
    default: true,
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
  sincronizarDesdeModelValue(props.modelValue)
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

function encontrarComercioAgrupado(modelValue) {
  if (!modelValue) return null

  return comerciosStore.comerciosAgrupados.find((comercio) => {
    if (modelValue.id && comercio.id === modelValue.id) return true

    if (Array.isArray(comercio.comerciosOriginales)) {
      return comercio.comerciosOriginales.some((original) => original.id === modelValue.id)
    }

    return comercio.nombre === modelValue.nombre
  }) || null
}

function sincronizarDesdeModelValue(modelValue) {
  if (!modelValue) {
    comercioSeleccionado.value = null
    comercioId.value = null
    comercioEscrito.value = ''
    textoTemporalComercio.value = ''
    direccionSeleccionada.value = null
    direccionId.value = null
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    return
  }

  const comercioAgrupado = encontrarComercioAgrupado(modelValue)
  const nombre = String(modelValue.nombre || '').trim()
  const direccionNombre = String(modelValue.direccionNombre || '').trim()

  if (comercioAgrupado) {
    comercioSeleccionado.value = comercioAgrupado
    comercioId.value = String(modelValue.id || '').trim() || comercioAgrupado.id || null
    comercioEscrito.value = ''
    textoTemporalComercio.value = ''

    const direccion = (comercioAgrupado.direcciones || []).find(
      (actual) =>
        actual.id === modelValue.direccionId ||
        actual.calle === direccionNombre ||
        actual.nombreCompleto === direccionNombre,
    )

    if (direccion) {
      direccionSeleccionada.value = direccion
      direccionId.value = direccion.id
      direccionEscrita.value = ''
      textoTemporalDireccion.value = ''
      comercioId.value = resolverComercioId(comercioAgrupado, direccion.id)
    } else {
      direccionSeleccionada.value = null
      direccionId.value = String(modelValue.direccionId || '').trim() || null
      direccionEscrita.value = direccionNombre
      textoTemporalDireccion.value = ''
    }

    return
  }

  comercioSeleccionado.value = null
  comercioId.value = String(modelValue.id || '').trim() || null
  comercioEscrito.value = nombre
  textoTemporalComercio.value = ''
  direccionSeleccionada.value = null
  direccionId.value = String(modelValue.direccionId || '').trim() || null
  direccionEscrita.value = direccionNombre
  textoTemporalDireccion.value = ''
}

function alSeleccionarComercio(comercio) {
  if (!comercio) {
    comercioId.value = null
    comercioSeleccionado.value = null
    direccionSeleccionada.value = null
    direccionId.value = null
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    comercioEscrito.value = ''
    textoTemporalComercio.value = ''
    emitir({ direccionSeleccionadaManual: false })
    return
  }
  comercioSeleccionado.value = comercio
  comercioEscrito.value = ''
  textoTemporalComercio.value = ''
  // Auto-selecciona la dirección principal
  if (props.autoSeleccionarDireccion && comercio.direcciones?.length > 0) {
    const dir = comercio.direccionPrincipal || comercio.direcciones[0]
    direccionSeleccionada.value = dir
    direccionId.value = dir.id
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    comercioId.value = resolverComercioId(comercio, dir.id)
  } else if (comercio.direcciones?.length > 0) {
    direccionSeleccionada.value = null
    direccionId.value = null
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    comercioId.value = comercio.id
  } else {
    direccionSeleccionada.value = null
    direccionId.value = null
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    comercioId.value = comercio.id
  }
  emitir({ direccionSeleccionadaManual: false })
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
    emitir({ direccionSeleccionadaManual: false })
    return
  }
  direccionId.value = direccion.id
  direccionSeleccionada.value = direccion
  direccionEscrita.value = ''
  textoTemporalDireccion.value = ''
  if (esComercioExistente.value) {
    comercioId.value = resolverComercioId(comercioSeleccionado.value, direccion.id)
  }
  emitir({ direccionSeleccionadaManual: true })
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

function emitir(meta = {}) {
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
    tieneMultiplesDirecciones: Boolean(
      esComercioExistente.value &&
      Array.isArray(comercioSeleccionado.value?.direcciones) &&
      comercioSeleccionado.value.direcciones.length > 1,
    ),
    direccionSeleccionadaManual: Boolean(meta.direccionSeleccionadaManual),
  })
}

watch(
  () => props.modelValue,
  (valor) => {
    sincronizarDesdeModelValue(valor)
  },
  { deep: true },
)
</script>

<style scoped>
.selector-comercio-direccion {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
