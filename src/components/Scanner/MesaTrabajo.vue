<template>
  <q-dialog v-model="abierto" full-screen>
    <q-card class="mesa-trabajo-card column no-wrap">

      <!-- Cabecera -->
      <div class="mesa-trabajo-barra row items-center no-wrap q-px-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-bold">Mesa de trabajo</div>
          <div class="text-caption text-grey-6">
            {{ cantidadListos }} / {{ sesionStore.items.length }} artículos listos
          </div>
        </div>
        <q-btn flat round dense @click="abierto = false">
          <IconX :size="20" />
        </q-btn>
      </div>

      <!-- Barra modo selección -->
      <div v-if="seleccion.modoSeleccion.value" class="seleccion-barra row items-center no-wrap q-px-md q-py-xs">
        <q-btn flat dense no-caps size="sm" color="grey-8" @click="seleccion.desactivarModoSeleccion()">
          Cancelar
        </q-btn>
        <span class="q-ml-sm text-caption text-grey-7">
          {{ seleccion.cantidadSeleccionados.value }} seleccionados
        </span>
        <q-space />
        <q-btn
          unelevated dense no-caps size="sm" color="primary"
          :disable="!seleccion.haySeleccionados.value"
          @click="abrirAsignarComercio"
        >
          Asignar comercio
        </q-btn>
      </div>

      <!-- Filtro de ordenamiento -->
      <div v-else class="q-px-md q-pt-sm q-pb-xs">
        <q-select
          v-model="ordenActual"
          dense outlined
          :options="OPCIONES_ORDEN"
          emit-value map-options
          style="max-width: 280px"
        />
      </div>

      <!-- Lista de borradores -->
      <q-scroll-area class="col">
        <div v-if="itemsOrdenados.length === 0" class="flex flex-center column q-pa-xl text-grey-5">
          <IconShoppingBag :size="52" />
          <div class="q-mt-sm text-body2">La mesa está vacía</div>
        </div>
        <div v-else class="q-pa-sm lista-borradores">
          <TarjetaProductoBorrador
            v-for="item in itemsOrdenados"
            :key="item.id"
            :item="item"
            :modo-seleccion="seleccion.modoSeleccion.value"
            :seleccionado="seleccion.estaSeleccionado(item.id)"
            @long-press="seleccion.activarModoSeleccion(item.id)"
            @toggle-seleccion="seleccion.toggleSeleccion(item.id)"
            @update:item="(v) => sesionStore.actualizarItem(item.id, v)"
            @eliminar="sesionStore.eliminarItem(item.id)"
            @enviar="enviarItem(item)"
          />
        </div>
      </q-scroll-area>

      <q-separator />

      <!-- Footer -->
      <div class="mesa-trabajo-footer row items-center no-wrap">
        <q-btn
          flat no-caps color="negative" size="sm"
          :disable="sesionStore.items.length === 0"
          @click="confirmarLimpiar"
        >
          Limpiar todo
        </q-btn>
        <q-space />
        <q-btn
          unelevated no-caps color="primary"
          :disable="cantidadListos === 0 || guardando"
          :loading="guardando"
          @click="guardarCompletos"
        >
          <IconSend :size="16" class="q-mr-xs" />
          Enviar listos ({{ cantidadListos }})
        </q-btn>
      </div>

    </q-card>
  </q-dialog>

  <!-- Bottom sheet: asignar comercio en bloque -->
  <q-dialog v-model="dialogoAsignarComercio" position="bottom">
    <q-card style="border-radius: 16px 16px 0 0; width: 100%; max-width: 100vw; padding-bottom: var(--safe-area-bottom, 0px)">
      <q-card-section class="q-pb-sm">
        <div class="text-subtitle2">
          Asignar comercio a {{ seleccion.cantidadSeleccionados.value }} ítem(s)
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none q-pb-sm">
        <q-select
          v-model="comercioParaAsignar"
          label="Comercio"
          outlined dense
          :options="opcionesComercios"
          option-label="nombre"
          clearable use-input
          @filter="filtrarComercios"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">Sin comercios</q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>
      <q-card-section class="q-pt-xs">
        <div class="row justify-end q-gutter-xs">
          <q-btn flat no-caps color="grey-7" v-close-popup>Cancelar</q-btn>
          <q-btn
            unelevated no-caps color="primary"
            :disable="!comercioParaAsignar"
            @click="confirmarAsignarComercio"
          >
            Asignar
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import TarjetaProductoBorrador from './TarjetaProductoBorrador.vue'
import { useSesionEscaneoStore } from '../../almacenamiento/stores/sesionEscaneoStore.js'
import { useProductosStore } from '../../almacenamiento/stores/productosStore.js'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'
import { useSeleccionMultiple } from '../../composables/useSeleccionMultiple.js'
import {
  IconShoppingBag,
  IconSend,
  IconX,
} from '@tabler/icons-vue'

const OPCIONES_ORDEN = [
  { label: 'Menos completo primero', value: 'menos-a-mas' },
  { label: 'Más completo primero', value: 'mas-a-menos' },
  { label: 'Por comercio', value: 'por-comercio' },
  { label: 'Sin comercio asignado', value: 'sin-comercio' },
  { label: 'Alfabético', value: 'alfabetico' },
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'guardado'])

const $q = useQuasar()
const sesionStore = useSesionEscaneoStore()
const productosStore = useProductosStore()
const comerciosStore = useComerciStore()
const seleccion = useSeleccionMultiple()

const ordenActual = ref('menos-a-mas')
const guardando = ref(false)
const dialogoAsignarComercio = ref(false)
const comercioParaAsignar = ref(null)
const opcionesComercios = ref([])

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Sincroniza opciones de comercios
watch(() => comerciosStore.comerciosAgrupados, (v) => { opcionesComercios.value = v }, { immediate: true })

// Mantiene itemsDisponibles del composable sincronizado (para seleccionarTodos / todoSeleccionado)
watch(() => sesionStore.items, (v) => seleccion.actualizarItems(v), { immediate: true, deep: true })

const cantidadListos = computed(() =>
  sesionStore.items.filter(
    (i) => !!i.nombre?.trim() && i.precio > 0 && !!i.comercio,
  ).length,
)

const itemsOrdenados = computed(() => {
  const lista = [...sesionStore.items]

  if (ordenActual.value === 'sin-comercio') return lista.filter((i) => !i.comercio)

  const puntaje = (i) =>
    [!!i.nombre?.trim(), i.precio > 0, !!i.comercio].filter(Boolean).length

  if (ordenActual.value === 'menos-a-mas') return lista.sort((a, b) => puntaje(a) - puntaje(b))
  if (ordenActual.value === 'mas-a-menos') return lista.sort((a, b) => puntaje(b) - puntaje(a))
  if (ordenActual.value === 'por-comercio') {
    return lista.sort((a, b) =>
      (a.comercio?.nombre || '').localeCompare(b.comercio?.nombre || ''),
    )
  }
  if (ordenActual.value === 'alfabetico') {
    return lista.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
  }
  return lista
})

// Guarda un ítem en el store de productos y lo elimina de la sesión
async function _guardarItem(item) {
  const comercio = item.comercio
  const datoPrecio = {
    comercioId: comercio?.id || null,
    direccionId: comercio?.direccionId || null,
    comercio: comercio?.nombre || 'Sin comercio',
    nombreCompleto: comercio?.direccionNombre
      ? `${comercio.nombre} — ${comercio.direccionNombre}`
      : comercio?.nombre,
    direccion: comercio?.direccionNombre || '',
    valor: item.precio,
    moneda: item.moneda,
    fecha: new Date().toISOString(),
    confirmaciones: 0,
    usuarioId: 'user_actual_123',
  }

  if (item.productoExistenteId) {
    await productosStore.agregarPrecioAProducto(item.productoExistenteId, datoPrecio)
    await productosStore.actualizarProducto(item.productoExistenteId, {
      nombre: item.nombre,
      imagen: item.imagen,
      marca: item.marca,
      cantidad: item.cantidad,
      unidad: item.unidad,
    })
  } else {
    await productosStore.agregarProducto({
      codigoBarras: item.codigoBarras,
      nombre: item.nombre,
      imagen: item.imagen,
      marca: item.marca,
      cantidad: item.cantidad,
      unidad: item.unidad,
      precios: [datoPrecio],
    })
  }

  if (comercio?.id) comerciosStore.registrarUso(comercio.id, comercio.direccionId)
  sesionStore.eliminarItem(item.id)
}

async function guardarCompletos() {
  const completos = sesionStore.items.filter(
    (i) => !!i.nombre?.trim() && i.precio > 0 && !!i.comercio,
  )
  if (!completos.length) return
  guardando.value = true
  try {
    for (const item of completos) await _guardarItem(item)
    $q.notify({ type: 'positive', message: `${completos.length} artículo(s) guardado(s)` })
    emit('guardado')
    if (sesionStore.items.length === 0) abierto.value = false
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar' })
  } finally {
    guardando.value = false
  }
}

async function enviarItem(item) {
  guardando.value = true
  try {
    await _guardarItem(item)
    $q.notify({ type: 'positive', message: 'Artículo guardado' })
    emit('guardado')
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar' })
  } finally {
    guardando.value = false
  }
}

function confirmarLimpiar() {
  $q.dialog({
    title: 'Limpiar mesa',
    message: '¿Eliminar todos los ítems de la mesa de trabajo?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    sesionStore.limpiarTodo()
    abierto.value = false
  })
}

function abrirAsignarComercio() {
  comercioParaAsignar.value = null
  opcionesComercios.value = comerciosStore.comerciosAgrupados
  dialogoAsignarComercio.value = true
}

function confirmarAsignarComercio() {
  if (!comercioParaAsignar.value) return
  const comercio = {
    id: comercioParaAsignar.value.id,
    nombre: comercioParaAsignar.value.nombre,
    direccionId: null,
    direccionNombre: null,
  }
  sesionStore.asignarComercio(seleccion.arraySeleccionados.value, comercio)
  dialogoAsignarComercio.value = false
  seleccion.desactivarModoSeleccion()
}

function filtrarComercios(val, update) {
  update(() => {
    const needle = val?.toLowerCase() || ''
    opcionesComercios.value = needle
      ? comerciosStore.comerciosAgrupados.filter((c) =>
          c.nombre.toLowerCase().includes(needle),
        )
      : comerciosStore.comerciosAgrupados
  })
}
</script>

<style scoped>
.mesa-trabajo-card {
  height: 100vh;
  max-width: 100vw;
  border-radius: 0;
}
.mesa-trabajo-barra {
  min-height: 60px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}
.seleccion-barra {
  min-height: 44px;
  background: #e3f2fd;
  border-bottom: 1px solid #bbdefb;
}
.lista-borradores {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mesa-trabajo-footer {
  padding: 10px 16px;
  padding-bottom: calc(10px + var(--safe-area-bottom, 0px));
  background: white;
}
</style>
