<template>
  <q-page class="q-pa-md">
    <!-- BARRA DE SELECCIÓN (sticky debajo del header) -->
    <BarraSeleccion
      :visible="seleccion.modoSeleccion.value"
      :cantidad-seleccionados="seleccion.cantidadSeleccionados.value"
      :total-items="seleccion.totalItems.value"
      :todo-seleccionado="seleccion.todoSeleccionado.value"
      @toggle-seleccionar-todos="seleccion.toggleSeleccionarTodos()"
    />

    <!-- Contenedor con ancho máximo -->
    <div class="contenedor-pagina">
      <!-- HEADER DE LA PÁGINA -->
      <div class="header-pagina">
        <h5 class="titulo-pagina">Mis Productos</h5>
        <p class="contador-items">{{ productosStore.productos.length }} productos guardados</p>
      </div>

      <!-- INDICADOR DE CARGA -->
      <div v-if="productosStore.cargando" class="text-center q-pa-xl">
        <q-spinner color="primary" size="50px" />
        <p class="text-grey-7 q-mt-md">Cargando productos...</p>
      </div>

      <!-- MENSAJE DE ERROR -->
      <q-banner v-else-if="productosStore.error" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ productosStore.error }}
        <template #action>
          <q-btn flat label="Reintentar" @click="cargarProductos" />
        </template>
      </q-banner>

      <!-- MENSAJE SI NO HAY PRODUCTOS -->
      <div v-else-if="!productosStore.tieneProductos" class="text-center q-pa-xl">
        <q-icon name="inventory_2" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-7 q-mt-md">No tienes productos guardados</p>
        <p class="text-grey-6">Presiona el botón + para agregar tu primer producto</p>
      </div>

      <!-- BUSCADOR + LISTA (cuando hay productos) -->
      <template v-else>
        <InputBusqueda
          v-model="textoBusqueda"
          placeholder="Buscar por nombre, marca, categoría o código..."
          class="q-mb-md"
        />

        <!-- Sin resultados de búsqueda -->
        <div v-if="productosFiltrados.length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="64px" color="grey-5" />
          <p class="text-h6 text-grey-7 q-mt-md">Sin resultados</p>
          <p class="text-grey-6">No hay productos para "{{ textoBusqueda }}"</p>
        </div>

        <ListaProductos
          v-else
          :productos="productosFiltrados"
          :modo-seleccion="seleccion.modoSeleccion.value"
          :seleccionados="seleccion.seleccionados.value"
          @long-press="activarSeleccionConItem"
          @toggle-seleccion="seleccion.toggleSeleccion($event)"
          @agregar-precio="abrirModalPrecio"
        />
      </template>
    </div>

    <!-- BOTÓN FLOTANTE AGREGAR (oculto en modo selección) -->
    <FabAcciones
      v-if="!seleccion.modoSeleccion.value"
      :acciones="accionesFab"
      color="primary"
    />

    <!-- BARRA DE ACCIONES (fixed bottom en modo selección) -->
    <BarraAccionesSeleccion
      :visible="seleccion.modoSeleccion.value"
      :cantidad-seleccionados="seleccion.cantidadSeleccionados.value"
      :hay-seleccionados="seleccion.haySeleccionados.value"
      @eliminar="confirmarEliminacion"
      @cancelar="seleccion.desactivarModoSeleccion()"
    />

    <!-- DIÁLOGO AGREGAR PRODUCTO -->
    <DialogoAgregarProducto
      v-model="dialogoAgregarAbierto"
      modo="local"
      @producto-guardado="onProductoGuardado"
    />

    <!-- ESCANEADOR DE CÓDIGO DE BARRAS -->
    <EscaneadorCodigo
      :activo="scannerActivo"
      @codigo-detectado="procesarCodigoEscaneado"
      @cerrar="alCerrarScanner"
    />

    <!-- TARJETA POST-ESCANEO (solo modo A: escaneo rápido) -->
    <TarjetaEscaneo
      v-model="tarjetaEscaneoAbierta"
      :item="itemActual"
      @siguiente="alSiguiente"
      @ir-a-mesa="alIrAMesa"
      @descartar="alDescartarItem"
    />

    <!-- MODAL AGREGAR PRECIO -->
    <DialogoAgregarPrecio
      v-model="dialogoPrecioAbierto"
      :producto-id="productoParaPrecioId"
      @precio-guardado="alGuardarPrecio"
    />

    <!-- DIÁLOGO CONFIRMACIÓN ELIMINACIÓN -->
    <q-dialog v-model="dialogoConfirmacionAbierto" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="32px" class="q-mr-md" />
          <div>
            <div class="text-h6">Confirmar eliminación</div>
            <div class="text-body2 text-grey-7 q-mt-xs">
              ¿Estás seguro de eliminar {{ seleccion.cantidadSeleccionados.value }}
              {{ seleccion.cantidadSeleccionados.value === 1 ? 'producto' : 'productos' }}?
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Esta acción no se puede deshacer</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" @click="dialogoConfirmacionAbierto = false" />
          <q-btn
            unelevated
            label="Eliminar"
            color="negative"
            :loading="eliminando"
            @click="eliminarSeleccionados"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { IconPlus, IconScan, IconBolt } from '@tabler/icons-vue'
import ListaProductos from '../components/MisProductos/ListaProductos.vue'
import InputBusqueda from '../components/Compartidos/InputBusqueda.vue'
import DialogoAgregarProducto from '../components/Formularios/Dialogos/DialogoAgregarProducto.vue'
import DialogoAgregarPrecio from '../components/Formularios/Dialogos/DialogoAgregarPrecio.vue'
import BarraSeleccion from '../components/Compartidos/BarraSeleccion.vue'
import BarraAccionesSeleccion from '../components/Compartidos/BarraAccionesSeleccion.vue'
import FabAcciones from '../components/Compartidos/FabAcciones.vue'
import EscaneadorCodigo from '../components/Scanner/EscaneadorCodigo.vue'
import TarjetaEscaneo from '../components/Scanner/TarjetaEscaneo.vue'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'
import { useSeleccionMultiple } from '../composables/useSeleccionMultiple.js'
import { useDialogoAgregarPrecio } from '../composables/useDialogoAgregarPrecio.js'
import buscadorProductosService from '../almacenamiento/servicios/BuscadorProductosService.js'
import productosService from '../almacenamiento/servicios/ProductosService.js'
import { useQuasar } from 'quasar'

const productosStore = useProductosStore()
const sesionEscaneoStore = useSesionEscaneoStore()
const $q = useQuasar()

// ========================================
// ESTADO DEL FLUJO DE ESCANEO
// ========================================

const scannerActivo = ref(false)
const modoEscaneo = ref(null) // 'rapido' | 'rafaga' | null
const tarjetaEscaneoAbierta = ref(false)
const itemActual = ref(null)

function iniciarEscaneoRapido() {
  modoEscaneo.value = 'rapido'
  scannerActivo.value = true
}

function iniciarRafaga() {
  modoEscaneo.value = 'rafaga'
  scannerActivo.value = true
}

// Procesa el código escaneado según el modo activo
async function procesarCodigoEscaneado(codigo) {
  const yaEnSesion = sesionEscaneoStore.items.some((i) => i.codigoBarras === codigo)

  if (yaEnSesion) {
    const encontrado = sesionEscaneoStore.items.find((i) => i.codigoBarras === codigo)
    $q.notify({
      type: 'warning',
      message: encontrado?.nombre ? `"${encontrado.nombre}" ya está en la mesa` : `Código ${codigo} ya está en la mesa`,
      position: 'top',
      timeout: 2000,
    })
    // En modo rápido: reiniciar scanner; en ráfaga: la cámara nunca se detuvo
    if (modoEscaneo.value === 'rapido') {
      scannerActivo.value = false
      await nextTick()
      scannerActivo.value = true
    }
    return
  }

  // Buscar en BD local y API
  const existente = await productosService.buscarPorCodigoBarras(codigo)
  const resultadoApi = await buscadorProductosService.buscarPorCodigo(codigo)
  const productoApi = resultadoApi?.producto || null

  const nuevoItem = {
    codigoBarras: codigo,
    productoExistenteId: existente?.id || null,
    nombre: productoApi?.nombre || existente?.nombre || '',
    marca: productoApi?.marca || existente?.marca || null,
    cantidad: productoApi?.cantidad || existente?.cantidad || 1,
    unidad: productoApi?.unidad || existente?.unidad || 'unidad',
    imagen: productoApi?.imagen || existente?.imagen || null,
    precio: null,
    moneda: 'UYU',
    origenApi: !!productoApi,
    fuenteDato: resultadoApi?.fuenteDato || null,
  }

  if (modoEscaneo.value === 'rafaga') {
    // Modo B: agregar directo a la mesa, cámara sigue activa
    sesionEscaneoStore.agregarItem(nuevoItem)
    $q.notify({
      message: nuevoItem.nombre || codigo,
      caption: nuevoItem.nombre ? codigo : '',
      color: 'grey-8',
      position: 'top',
      timeout: 1500,
    })
    return
  }

  // Modo A: pausar cámara y mostrar TarjetaEscaneo
  scannerActivo.value = false
  itemActual.value = nuevoItem
  tarjetaEscaneoAbierta.value = true
}

// Guarda en la mesa y reactiva la cámara para el siguiente escaneo
function alSiguiente(itemActualizado) {
  sesionEscaneoStore.agregarItem(itemActualizado)
  tarjetaEscaneoAbierta.value = false
  itemActual.value = null
  scannerActivo.value = true
}

// Guarda en la mesa y cierra el flujo de escaneo
function alIrAMesa(itemActualizado) {
  sesionEscaneoStore.agregarItem(itemActualizado)
  tarjetaEscaneoAbierta.value = false
  itemActual.value = null
  scannerActivo.value = false
  modoEscaneo.value = null
}

// Descarta el item y vuelve a la cámara (solo en modo rápido)
function alDescartarItem() {
  tarjetaEscaneoAbierta.value = false
  itemActual.value = null
  if (modoEscaneo.value === 'rapido') scannerActivo.value = true
}

// El usuario cerró el scanner manualmente
function alCerrarScanner() {
  scannerActivo.value = false
  itemActual.value = null
  modoEscaneo.value = null
}

/* Texto de búsqueda activo */
const textoBusqueda = ref('')

/* Normaliza texto: minúsculas + sin tildes */
function normalizarTexto(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/* Productos filtrados por texto (o todos, ordenados por última interacción) */
const productosFiltrados = computed(() => {
  const base = productosStore.productosPorInteraccion
  const texto = textoBusqueda.value?.trim() || ''
  if (!texto) return base
  const textoNorm = normalizarTexto(texto)
  const palabras = textoNorm.split(/\s+/).filter(Boolean)
  const esNumerico = /^\d+$/.test(texto)
  return base.filter((p) => {
    if (esNumerico && p.codigoBarras?.includes(texto)) return true
    const nombreNorm = normalizarTexto(p.nombre || '')
    if (palabras.every((palabra) => nombreNorm.includes(palabra))) return true
    const marcaNorm = normalizarTexto(p.marca || '')
    if (marcaNorm && marcaNorm.includes(textoNorm)) return true
    const categoriaNorm = normalizarTexto(p.categoria || '')
    if (categoriaNorm && categoriaNorm.includes(textoNorm)) return true
    return false
  })
})

/* Estado del diálogo agregar */
const dialogoAgregarAbierto = ref(false)

/* Estado del diálogo confirmación */
const dialogoConfirmacionAbierto = ref(false)

/* Estado de eliminación */
const eliminando = ref(false)

/* Composable de selección múltiple */
const seleccion = useSeleccionMultiple()

/* Productos eliminados (para deshacer) */
const productosEliminadosParaDeshacer = ref([])

/* Composable agregar precio (reemplaza lógica manual) */
const { dialogoPrecioAbierto, productoParaPrecioId, abrirModalPrecio, alGuardarPrecio } =
  useDialogoAgregarPrecio()

async function cargarProductos() {
  await productosStore.cargarProductos()
}

function abrirDialogoAgregar() {
  dialogoAgregarAbierto.value = true
}

// Acciones del FAB expandible (3 opciones)
const accionesFab = [
  { icono: IconBolt, label: 'Ráfaga', color: 'orange', accion: iniciarRafaga },
  { icono: IconScan, label: 'Escaneo rápido', color: 'secondary', accion: iniciarEscaneoRapido },
  { icono: IconPlus, label: 'Agregar manual', color: 'primary', accion: abrirDialogoAgregar },
]

function onProductoGuardado() {
  cargarProductos()
}

/* Activar modo selección con un item inicial */
function activarSeleccionConItem(productoId) {
  seleccion.activarModoSeleccion(productoId)
}

/* Confirmar eliminación */
function confirmarEliminacion() {
  if (!seleccion.haySeleccionados.value) return
  dialogoConfirmacionAbierto.value = true
}

/* Eliminar productos seleccionados */
async function eliminarSeleccionados() {
  eliminando.value = true

  try {
    const idsAEliminar = seleccion.arraySeleccionados.value

    productosEliminadosParaDeshacer.value = idsAEliminar.map((id) =>
      productosStore.productos.find((p) => p.id === id),
    )

    console.log(`🗑️ Eliminando ${idsAEliminar.length} productos...`)

    let eliminadosExitosos = 0
    for (const id of idsAEliminar) {
      const eliminado = await productosStore.eliminarProducto(id)
      if (eliminado) {
        eliminadosExitosos++
      }
    }

    dialogoConfirmacionAbierto.value = false
    seleccion.limpiarDespuesDeEliminar()

    $q.notify({
      type: 'positive',
      message: `${eliminadosExitosos} ${eliminadosExitosos === 1 ? 'producto eliminado' : 'productos eliminados'}`,
      position: 'top',
      icon: 'delete',
      timeout: 5000,
      actions: [
        {
          label: 'Deshacer',
          color: 'white',
          handler: () => {
            deshacerEliminacion()
          },
        },
      ],
    })
  } catch (error) {
    console.error('❌ Error al eliminar productos:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al eliminar productos',
      position: 'top',
    })
  } finally {
    eliminando.value = false
  }
}

/* Deshacer eliminación */
async function deshacerEliminacion() {
  if (productosEliminadosParaDeshacer.value.length === 0) return

  console.log('↩️ Deshaciendo eliminación...')

  let restauradosExitosos = 0

  for (const producto of productosEliminadosParaDeshacer.value) {
    const restaurado = await productosStore.agregarProducto(producto)
    if (restaurado) {
      restauradosExitosos++
    }
  }

  productosEliminadosParaDeshacer.value = []

  $q.notify({
    type: 'info',
    message: `${restauradosExitosos} ${restauradosExitosos === 1 ? 'producto restaurado' : 'productos restaurados'}`,
    position: 'top',
    icon: 'undo',
  })
}

/* Actualizar items disponibles cuando cambien los productos */
watch(
  () => productosStore.productos,
  (nuevosProductos) => {
    seleccion.actualizarItems(nuevosProductos)
  },
  { deep: true },
)

onMounted(async () => {
  await cargarProductos()
  seleccion.actualizarItems(productosStore.productos)
})
</script>

<style scoped>
</style>
