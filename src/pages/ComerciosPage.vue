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
        <h5 class="titulo-pagina">Mis Comercios</h5>
        <p class="contador-items">
          {{ comerciosStore.comerciosAgrupados.length }} comercios
          <span
            v-if="comerciosStore.totalDirecciones > comerciosStore.comercios.length"
            class="text-grey-6"
          >
            ({{ comerciosStore.totalDirecciones }} sucursales)
          </span>
        </p>
      </div>

      <!-- BARRA DE BÚSQUEDA CENTRADA -->
      <div class="buscador-centrado">
        <InputBusqueda v-model="textoBusqueda" placeholder="Buscar comercio..." color="orange" />
      </div>

      <!-- INDICADOR DE CARGA -->
      <div v-if="comerciosStore.cargando" class="text-center q-pa-xl">
        <q-spinner color="primary" size="50px" />
        <p class="text-grey-7 q-mt-md">Cargando comercios...</p>
      </div>

      <!-- MENSAJE DE ERROR -->
      <q-banner v-else-if="comerciosStore.error" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ comerciosStore.error }}
        <template #action>
          <q-btn flat label="Reintentar" @click="cargarComercios" />
        </template>
      </q-banner>

      <!-- MENSAJE SI NO HAY COMERCIOS -->
      <div
        v-else-if="comerciosFiltrados.length === 0 && !textoBusqueda"
        class="text-center q-pa-xl"
      >
        <q-icon name="store" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-7 q-mt-md">No tienes comercios guardados</p>
        <p class="text-grey-6">Presiona el botón + para agregar tu primer comercio</p>
      </div>

      <!-- MENSAJE SI NO HAY RESULTADOS DE BÚSQUEDA -->
      <div v-else-if="comerciosFiltrados.length === 0 && textoBusqueda" class="text-center q-pa-xl">
        <q-icon name="search_off" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-7 q-mt-md">No se encontraron comercios</p>
        <p class="text-grey-6">Intenta con otro término de búsqueda</p>
      </div>

      <!-- LISTA DE COMERCIOS -->
      <ListaComercios
        v-else
        :comercios="comerciosFiltrados"
        :modo-seleccion="seleccion.modoSeleccion.value"
        :seleccionados="seleccion.seleccionados.value"
        @long-press="activarSeleccionConItem"
        @toggle-seleccion="seleccion.toggleSeleccion($event)"
        @editar="editarComercio"
      />
    </div>

    <!-- BOTÓN FLOTANTE AGREGAR (oculto en modo selección) -->
    <q-page-sticky v-if="!seleccion.modoSeleccion.value" position="bottom-right" :offset="[18, 18]">
      <q-btn fab color="primary" icon="add" size="lg" @click="abrirDialogoAgregar" />
    </q-page-sticky>

    <!-- BARRA DE ACCIONES (fixed bottom en modo selección) -->
    <BarraAccionesSeleccion
      :visible="seleccion.modoSeleccion.value"
      :cantidad-seleccionados="seleccion.cantidadSeleccionados.value"
      :hay-seleccionados="seleccion.haySeleccionados.value"
      @eliminar="confirmarEliminacion"
      @cancelar="seleccion.desactivarModoSeleccion()"
    />

    <!-- DIÁLOGO AGREGAR COMERCIO -->
    <DialogoAgregarComercio
      v-model="dialogoAgregarAbierto"
      @comercio-guardado="onComercioGuardado"
    />

    <!-- DIÁLOGO MOTIVO ELIMINACIÓN -->
    <DialogoMotivoEliminacion
      v-model="dialogoMotivoAbierto"
      :cantidad-comercios="seleccion.cantidadSeleccionados.value"
      :cantidad-productos-afectados="productosAfectados"
      @confirmar="eliminarSeleccionados"
      @cancelar="dialogoMotivoAbierto = false"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useComerciStore } from '../almacenamiento/stores/comerciosStore.js'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import { useSeleccionMultiple } from '../composables/useSeleccionMultiple.js'
import InputBusqueda from '../components/Compartidos/InputBusqueda.vue'
import DialogoAgregarComercio from '../components/Formularios/Dialogos/DialogoAgregarComercio.vue'
import DialogoMotivoEliminacion from '../components/Formularios/Dialogos/DialogoMotivoEliminacion.vue'
import ListaComercios from '../components/Comercios/ListaComercios.vue'
import BarraSeleccion from '../components/Compartidos/BarraSeleccion.vue'
import BarraAccionesSeleccion from '../components/Compartidos/BarraAccionesSeleccion.vue'
import ComerciosService from '../almacenamiento/servicios/ComerciosService.js'

const router = useRouter()
const comerciosStore = useComerciStore()
const productosStore = useProductosStore()
const $q = useQuasar()

// Estado de búsqueda
const textoBusqueda = ref('')

// Estado de diálogos
const dialogoAgregarAbierto = ref(false)
const dialogoMotivoAbierto = ref(false)

// Estado de eliminación
const eliminando = ref(false)
const productosAfectados = ref(0)

// Composable de selección múltiple
const seleccion = useSeleccionMultiple()

// Comercios y productos eliminados (para deshacer)
const datosParaDeshacer = ref(null)

// Comercios filtrados por búsqueda
const comerciosFiltrados = computed(() => {
  const comercios = comerciosStore.comerciosAgrupados

  if (!textoBusqueda.value) {
    return comercios
  }

  const textoNormalizado = textoBusqueda.value.toLowerCase()
  return comercios.filter((comercio) => {
    return (
      comercio.nombre.toLowerCase().includes(textoNormalizado) ||
      comercio.tipo.toLowerCase().includes(textoNormalizado) ||
      comercio.direcciones.some((dir) =>
        dir.nombreCompleto?.toLowerCase().includes(textoNormalizado),
      )
    )
  })
})

/**
 * Carga comercios desde el store
 */
async function cargarComercios() {
  await comerciosStore.cargarComercios()
  await productosStore.cargarProductos()
  seleccion.actualizarItems(comerciosStore.comercios)
}

/**
 * Abre diálogo para agregar comercio
 */
function abrirDialogoAgregar() {
  dialogoAgregarAbierto.value = true
}

/**
 * Activa modo selección con un comercio inicial
 */
function activarSeleccionConItem(comercioId) {
  seleccion.activarModoSeleccion(comercioId)
}

/**
 * Cuenta cuántos productos tienen precios asociados a los comercios seleccionados
 */
function contarProductosAfectados() {
  const idsComerciosSeleccionados = seleccion.arraySeleccionados.value
  let contadorProductos = 0

  // Recorrer todos los productos
  productosStore.productos.forEach((producto) => {
    // Verificar si algún precio del producto está asociado a los comercios seleccionados
    const tienePrecios = producto.precios.some((precio) =>
      idsComerciosSeleccionados.includes(precio.comercioId),
    )

    if (tienePrecios) {
      contadorProductos++
    }
  })

  return contadorProductos
}

/**
 * Confirmar eliminación de comercios
 * Cuenta productos afectados y abre diálogo de motivo
 */
function confirmarEliminacion() {
  if (!seleccion.haySeleccionados.value) return

  // Contar productos afectados
  productosAfectados.value = contarProductosAfectados()

  // Abrir diálogo de motivo
  dialogoMotivoAbierto.value = true
}

/**
 * Callback cuando se guarda un comercio
 */
function onComercioGuardado() {
  cargarComercios()
}

// Navega a la página de edición del comercio
function editarComercio(comercioId) {
  const comercioAgrupado = comerciosStore.comerciosAgrupados.find(
    (c) => c.comerciosOriginales.some((co) => co.id === comercioId) || c.id === comercioId,
  )
  if (comercioAgrupado) {
    const nombreNormalizado = ComerciosService.normalizar(comercioAgrupado.nombre)
    router.push(`/comercios/${encodeURIComponent(nombreNormalizado)}`)
  }
}

/**
 * Elimina comercios seleccionados según el motivo
 */
async function eliminarSeleccionados(motivo) {
  eliminando.value = true

  try {
    const idsAEliminar = seleccion.arraySeleccionados.value

    // Guardar comercios y productos afectados para deshacer
    const comerciosEliminados = idsAEliminar.map((id) =>
      comerciosStore.comercios.find((c) => c.id === id),
    )

    // Guardar productos afectados (para deshacer)
    const productosAfectadosData = []
    productosStore.productos.forEach((producto) => {
      const preciosAfectados = producto.precios.filter((precio) =>
        idsAEliminar.includes(precio.comercioId),
      )

      if (preciosAfectados.length > 0) {
        productosAfectadosData.push({
          productoId: producto.id,
          preciosOriginales: preciosAfectados.map((p) => ({ ...p })), // Copia profunda
        })
      }
    })

    datosParaDeshacer.value = {
      comercios: comerciosEliminados,
      productos: productosAfectadosData,
      motivo: motivo,
    }

    console.log(`🗑️ Eliminando ${idsAEliminar.length} comercios con motivo: ${motivo.tipo}`)

    // APLICAR LÓGICA SEGÚN MOTIVO
    await aplicarLogicaSegunMotivo(idsAEliminar, motivo)

    // Eliminar comercios del store
    const resultado = await comerciosStore.eliminarComercios(idsAEliminar)

    // Cerrar diálogo
    dialogoMotivoAbierto.value = false

    // Desactivar modo selección
    seleccion.limpiarDespuesDeEliminar()

    // Notificación con botón deshacer
    $q.notify({
      type: 'positive',
      message: `${resultado.exitosos.length} ${resultado.exitosos.length === 1 ? 'comercio eliminado' : 'comercios eliminados'}`,
      timeout: 5000,
      position: 'bottom',
      actions: [
        {
          label: 'Deshacer',
          color: 'white',
          handler: () => deshacerEliminacion(),
        },
      ],
    })

    // Después de 5 segundos, limpiar datos de deshacer
    setTimeout(() => {
      if (datosParaDeshacer.value) {
        datosParaDeshacer.value = null
      }
    }, 5000)
  } catch (error) {
    console.error('❌ Error al eliminar comercios:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al eliminar comercios',
      position: 'top',
    })
  } finally {
    eliminando.value = false
  }
}

/**
 * Aplica la lógica de eliminación según el motivo seleccionado
 */
async function aplicarLogicaSegunMotivo(idsComerciosEliminar, motivo) {
  // Obtener nombres de los comercios para los casos que lo necesiten
  const nombresComerciosMap = {}
  idsComerciosEliminar.forEach((id) => {
    const comercio = comerciosStore.comercios.find((c) => c.id === id)
    if (comercio) {
      nombresComerciosMap[id] = comercio.nombre
    }
  })

  // Recorrer todos los productos y sus precios
  for (const producto of productosStore.productos) {
    let preciosModificados = false

    producto.precios = producto.precios.map((precio) => {
      // Si este precio pertenece a uno de los comercios a eliminar
      if (idsComerciosEliminar.includes(precio.comercioId)) {
        preciosModificados = true

        switch (motivo.tipo) {
          case 'cerro':
            // MOTIVO: CERRÓ - Marcar con flag pero mantener linkeo
            return {
              ...precio,
              comercioCerrado: true,
            }

          case 'duplicado':
            // MOTIVO: DUPLICADO - Convertir a legacy (deslinkeado)
            return {
              ...precio,
              comercioId: undefined,
              direccionId: undefined,
              comercio: precio.comercio || nombresComerciosMap[precio.comercioId] || 'Desconocido',
              direccion: precio.direccion || 'Sin dirección',
            }

          case 'otro':
            // MOTIVO: OTRO - Convertir a legacy (deslinkeado)
            return {
              ...precio,
              comercioId: undefined,
              direccionId: undefined,
              comercio: precio.comercio || nombresComerciosMap[precio.comercioId] || 'Desconocido',
              direccion: precio.direccion || 'Sin dirección',
            }

          default:
            return precio
        }
      }

      return precio
    })

    // Si se modificaron precios, actualizar el producto
    if (preciosModificados) {
      await productosStore.actualizarProducto(producto.id, {
        precios: producto.precios,
      })
    }
  }
}

/**
 * Deshacer eliminación de comercios
 */
async function deshacerEliminacion() {
  if (!datosParaDeshacer.value) return

  try {
    console.log('↩️ Deshaciendo eliminación...')

    // 1. Restaurar comercios
    for (const comercio of datosParaDeshacer.value.comercios) {
      await comerciosStore.agregarComercio(comercio)
    }

    // 2. Restaurar precios modificados en productos
    for (const productoAfectado of datosParaDeshacer.value.productos) {
      const producto = productosStore.productos.find((p) => p.id === productoAfectado.productoId)

      if (producto) {
        // Reemplazar los precios afectados con sus versiones originales
        producto.precios = producto.precios.map((precio) => {
          const precioOriginal = productoAfectado.preciosOriginales.find(
            (po) => po.id === precio.id,
          )
          return precioOriginal || precio
        })

        await productosStore.actualizarProducto(producto.id, {
          precios: producto.precios,
        })
      }
    }

    // Limpiar datos de deshacer
    datosParaDeshacer.value = null

    $q.notify({
      type: 'info',
      message: 'Eliminación revertida',
      position: 'top',
    })
  } catch (error) {
    console.error('❌ Error al deshacer eliminación:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al restaurar datos',
      position: 'top',
    })
  }
}

// Cargar datos al montar
onMounted(() => {
  cargarComercios()
})
</script>
