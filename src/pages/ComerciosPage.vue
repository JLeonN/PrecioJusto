<template>
  <q-page class="q-pa-md">
    <!-- BARRA DE BÚSQUEDA -->
    <div class="q-mb-md">
      <q-input
        v-model="textoBusqueda"
        outlined
        dense
        placeholder="Buscar comercio..."
        clearable
        @update:model-value="buscarComercios"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- BARRA DE SELECCIÓN (sticky debajo del header) -->
    <!-- TODO: Agregar BarraSeleccion cuando esté en Compartidos -->

    <!-- Contenedor con ancho máximo -->
    <div class="contenedor-comercios">
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
      <!-- TODO: Agregar ListaComercios cuando esté creado -->
      <div v-else>
        <p class="text-grey-7">{{ comerciosFiltrados.length }} comercios encontrados</p>
        <!-- ListaComercios irá aquí -->
      </div>
    </div>

    <!-- BOTÓN FLOTANTE AGREGAR (oculto en modo selección) -->
    <q-page-sticky v-if="!seleccion.modoSeleccion.value" position="bottom-right" :offset="[18, 18]">
      <q-btn fab color="primary" icon="add" size="lg" @click="abrirDialogoAgregar" />
    </q-page-sticky>

    <!-- BARRA DE ACCIONES (fixed bottom en modo selección) -->
    <!-- TODO: Agregar BarraAccionesSeleccion cuando esté en Compartidos -->

    <!-- DIÁLOGO AGREGAR COMERCIO -->
    <!-- TODO: Agregar DialogoAgregarComercio cuando esté creado -->

    <!-- DIÁLOGO CONFIRMACIÓN ELIMINACIÓN -->
    <q-dialog v-model="dialogoConfirmacionAbierto" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="32px" class="q-mr-md" />
          <div>
            <div class="text-h6">Confirmar eliminación</div>
            <div class="text-body2 text-grey-7 q-mt-xs">
              ¿Estás seguro de eliminar {{ seleccion.cantidadSeleccionados.value }}
              {{ seleccion.cantidadSeleccionados.value === 1 ? 'comercio' : 'comercios' }}?
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              Los precios asociados mantendrán el nombre del comercio
            </div>
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useComerciStore } from '../almacenamiento/stores/comerciosStore.js'
import { useSeleccionMultiple } from '../composables/useSeleccionMultiple.js'

const comerciosStore = useComerciStore()
const $q = useQuasar()

// Estado de búsqueda
const textoBusqueda = ref('')

// Estado de diálogos
const dialogoAgregarAbierto = ref(false)
const dialogoConfirmacionAbierto = ref(false)

// Estado de eliminación
const eliminando = ref(false)

// Composable de selección múltiple
const seleccion = useSeleccionMultiple()

// Comercios eliminados (para deshacer)
const comerciosEliminadosParaDeshacer = ref([])

// Comercios filtrados por búsqueda
const comerciosFiltrados = computed(() => {
  if (!textoBusqueda.value) {
    return comerciosStore.comerciosPorUso
  }

  const textoNormalizado = textoBusqueda.value.toLowerCase()
  return comerciosStore.comerciosPorUso.filter((comercio) => {
    return (
      comercio.nombre.toLowerCase().includes(textoNormalizado) ||
      comercio.tipo.toLowerCase().includes(textoNormalizado) ||
      comercio.direcciones.some((dir) =>
        dir.nombreCompleto.toLowerCase().includes(textoNormalizado),
      )
    )
  })
})

/**
 * Carga comercios desde el store
 */
async function cargarComercios() {
  await comerciosStore.cargarComercios()
  seleccion.actualizarItems(comerciosStore.comercios)
}

/**
 * Busca comercios (debounce podría agregarse aquí)
 */
function buscarComercios() {
  // Por ahora la búsqueda es reactiva con el computed
  // En el futuro se podría agregar debounce
}

/**
 * Abre diálogo para agregar comercio
 */
function abrirDialogoAgregar() {
  dialogoAgregarAbierto.value = true
}

/**
 * Activa modo selección con un comercio inicial
 * TODO: Descomentar cuando ListaComercios esté integrado
 */
// function activarSeleccionConItem(comercioId) {
//   seleccion.activarModoSeleccion(comercioId)
// }

/**
 * Confirmar eliminación de comercios
 * TODO: Descomentar cuando BarraAccionesSeleccion esté integrado
 */
// function confirmarEliminacion() {
//   if (!seleccion.haySeleccionados.value) return
//   dialogoConfirmacionAbierto.value = true
// }

/**
 * Elimina comercios seleccionados
 */
async function eliminarSeleccionados() {
  eliminando.value = true

  try {
    const idsAEliminar = seleccion.arraySeleccionados.value

    // Guardar comercios para deshacer
    comerciosEliminadosParaDeshacer.value = idsAEliminar.map((id) =>
      comerciosStore.comercios.find((c) => c.id === id),
    )

    console.log(`🗑️ Eliminando ${idsAEliminar.length} comercios...`)

    // Eliminar comercios
    const resultado = await comerciosStore.eliminarComercios(idsAEliminar)

    // Cerrar diálogo
    dialogoConfirmacionAbierto.value = false

    // Desactivar modo selección
    seleccion.limpiarDespuesDeEliminar()

    // Notificación con botón deshacer
    $q.notify({
      type: 'positive',
      message: `${resultado.exitosos.length} ${resultado.exitosos.length === 1 ? 'comercio eliminado' : 'comercios eliminados'}`,
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
 * Deshacer eliminación de comercios
 */
async function deshacerEliminacion() {
  if (comerciosEliminadosParaDeshacer.value.length === 0) return

  console.log('↩️ Deshaciendo eliminación...')

  let restauradosExitosos = 0

  for (const comercio of comerciosEliminadosParaDeshacer.value) {
    const resultado = await comerciosStore.agregarComercio(comercio)
    if (resultado.exito) {
      restauradosExitosos++
    }
  }

  // Limpiar comercios guardados
  comerciosEliminadosParaDeshacer.value = []

  // Notificación
  $q.notify({
    type: 'info',
    message: `${restauradosExitosos} ${restauradosExitosos === 1 ? 'comercio restaurado' : 'comercios restaurados'}`,
    position: 'top',
    icon: 'undo',
  })
}

onMounted(async () => {
  await cargarComercios()
})
</script>

<style scoped>
.contenedor-comercios {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
