<template>
  <q-page class="mesa-trabajo-pagina">

    <!-- Estado vacío: llegó a la ruta con mesa vacía -->
    <div v-if="mesaVaciaAlMontar" class="col flex flex-center column q-pa-xl">
      <IconShoppingBag :size="64" class="text-grey-4" />
      <div class="text-h6 text-grey-5 q-mt-md text-center">La mesa está vacía</div>
      <div class="text-body2 text-grey-5 q-mb-xl text-center">
        Escaneá productos para agregarlos a la mesa de trabajo
      </div>
      <div class="column q-gutter-sm estado-vacio-botones">
        <q-btn unelevated no-caps color="primary" @click="router.push('/')">
          <IconHome :size="18" class="q-mr-xs" />
          Mis Productos
        </q-btn>
        <q-btn unelevated no-caps color="orange" @click="router.push('/comercios')">
          <IconMapPin :size="18" class="q-mr-xs" />
          Comercios
        </q-btn>
      </div>
    </div>

    <!-- Contenido normal -->
    <template v-else>

      <!-- Cabecera -->
      <div class="mesa-trabajo-barra">
      <div class="contenedor-pagina row items-center no-wrap q-px-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-bold">Mesa de trabajo</div>
          <div class="text-caption text-grey-6">
            {{ cantidadListos }} / {{ sesionStore.items.length }} artículos listos
          </div>
        </div>
      </div>
      </div>

      <!-- Barra modo selección -->
      <div v-if="seleccion.modoSeleccion.value" class="seleccion-barra">
        <div class="contenedor-pagina row items-center no-wrap q-px-md q-py-xs">
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
      </div>

      <!-- Filtro de ordenamiento -->
      <div v-else>
        <div class="contenedor-pagina q-px-md q-pt-sm q-pb-xs">
          <q-select
            v-model="ordenActual"
            dense outlined
            :options="OPCIONES_ORDEN"
            emit-value map-options
            style="max-width: 280px"
          />
        </div>
      </div>

      <!-- Lista de borradores -->
      <div class="mesa-lista-scroll">
        <div class="contenedor-pagina q-px-md q-pt-sm q-pb-md">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in itemsOrdenados"
              :key="item.id"
              class="col-12 col-sm-6 col-md-4 col-xl-3"
            >
              <TarjetaProductoBorrador
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
          </div>
        </div>
      </div>

      <q-separator />

      <!-- Footer -->
      <div class="mesa-trabajo-footer">
        <div class="contenedor-pagina row items-center no-wrap">
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
      </div>

    </template>

    <!-- Bottom sheet: asignar comercio en bloque -->
    <q-dialog v-model="dialogoAsignarComercio" position="bottom">
      <q-card style="border-radius: 16px 16px 0 0; width: 100%; max-width: 100vw; padding-bottom: var(--safe-area-bottom, 0px)">
        <q-card-section class="q-pb-sm">
          <div class="text-subtitle2">
            Asignar comercio a {{ seleccion.cantidadSeleccionados.value }} ítem(s)
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none q-pb-sm">
          <SelectorComercioDireccion
            v-model="comercioParaAsignar"
          />
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

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import TarjetaProductoBorrador from '../components/Scanner/TarjetaProductoBorrador.vue'
import SelectorComercioDireccion from '../components/Compartidos/SelectorComercioDireccion.vue'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import { useComerciStore } from '../almacenamiento/stores/comerciosStore.js'
import { useSeleccionMultiple } from '../composables/useSeleccionMultiple.js'
import {
  IconShoppingBag,
  IconSend,
  IconHome,
  IconMapPin,
} from '@tabler/icons-vue'

const OPCIONES_ORDEN = [
  { label: 'Menos completo primero', value: 'menos-a-mas' },
  { label: 'Más completo primero', value: 'mas-a-menos' },
  { label: 'Por comercio', value: 'por-comercio' },
  { label: 'Sin comercio asignado', value: 'sin-comercio' },
  { label: 'Alfabético', value: 'alfabetico' },
]

const router = useRouter()
const $q = useQuasar()
const sesionStore = useSesionEscaneoStore()
const productosStore = useProductosStore()
const comerciosStore = useComerciStore()
const seleccion = useSeleccionMultiple()

const ordenActual = ref('menos-a-mas')
const guardando = ref(false)
const dialogoAsignarComercio = ref(false)
const comercioParaAsignar = ref(null)

// Si la mesa estaba vacía al montar → muestra estado vacío (no auto-navega)
const mesaVaciaAlMontar = ref(!sesionStore.tieneItemsPendientes)

onMounted(async () => {
  await comerciosStore.cargarComercios()
  seleccion.actualizarItems(sesionStore.items)
})

// Si la mesa se vacía durante la sesión → navega a inicio
watch(() => sesionStore.tieneItemsPendientes, (tieneItems) => {
  if (!tieneItems && !mesaVaciaAlMontar.value) router.push('/')
})

// Mantiene itemsDisponibles del composable sincronizado
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
  if (ordenActual.value === 'por-comercio')
    return lista.sort((a, b) => (a.comercio?.nombre || '').localeCompare(b.comercio?.nombre || ''))
  if (ordenActual.value === 'alfabetico')
    return lista.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
  return lista
})

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
  }).onOk(() => sesionStore.limpiarTodo())
}

function abrirAsignarComercio() {
  comercioParaAsignar.value = null
  dialogoAsignarComercio.value = true
}

function confirmarAsignarComercio() {
  if (!comercioParaAsignar.value) return
  sesionStore.asignarComercio(seleccion.arraySeleccionados.value, comercioParaAsignar.value)
  dialogoAsignarComercio.value = false
  seleccion.desactivarModoSeleccion()
}
</script>

<style scoped>
.mesa-trabajo-pagina {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.estado-vacio-botones {
  width: 100%;
  max-width: 280px;
}
.mesa-lista-scroll {
  flex: 1;
  overflow-y: auto;
}
.mesa-trabajo-barra {
  border-bottom: 1px solid #e0e0e0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}
.mesa-trabajo-barra .contenedor-pagina {
  min-height: 60px;
}
.seleccion-barra {
  background: #e3f2fd;
  border-bottom: 1px solid #bbdefb;
}
.seleccion-barra .contenedor-pagina {
  min-height: 44px;
}
.mesa-trabajo-footer {
  background: white;
  position: sticky;
  bottom: 0;
}
.mesa-trabajo-footer .contenedor-pagina {
  padding: 10px 16px;
  padding-bottom: calc(10px + var(--safe-area-bottom, 0px));
}
</style>
