<template>
  <q-dialog v-model="dialogoAbierto" @before-hide="alCerrar">
    <q-card class="dialogo-agregar relative-position" :class="clasesResponsivas" :style="estiloTarjeta">
      <q-inner-loading :showing="buscandoConsultaExterna" color="primary">
        <div class="column items-center q-gutter-sm">
          <q-spinner color="primary" size="40px" />
          <span class="text-caption text-grey-7">Consultando fuentes externas…</span>
        </div>
      </q-inner-loading>
      <!-- HEADER -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Agregar Producto</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cancelar" />
      </q-card-section>

      <!-- CONTENIDO DEL FORMULARIO -->
      <q-card-section class="q-pt-md contenido-scroll">
        <div class="formularios-contenedor">
          <!-- Sección: Datos del Producto -->
          <div class="seccion-formulario">
            <div class="seccion-titulo">
              <q-icon name="inventory_2" size="20px" class="q-mr-xs" />
              <span>Datos del Producto</span>
            </div>
            <FormularioProducto
              ref="refFormularioProducto"
              v-model="datosProducto"
              :modo="modo"
              @buscar-codigo="buscarPorCodigo"
              @buscar-nombre="buscarPorNombre"
              @escanear-codigo="alEscanearCodigo"
            />
          </div>

          <q-separator class="q-my-lg" />

          <!-- Sección: Datos del Comercio -->
          <div class="seccion-formulario">
            <div class="seccion-titulo">
              <q-icon name="store" size="20px" class="q-mr-xs" />
              <span>Datos del Comercio</span>
            </div>
            <FormularioPrecio ref="refFormularioPrecio" v-model="datosPrecio" :modo="modo" />
          </div>
        </div>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions
        align="right"
        class="q-px-md q-pb-md acciones-safe-area acciones-safe-area-publicidad"
      >
        <q-btn flat label="Cancelar" color="grey-7" @click="cancelar" />
        <q-btn
          unelevated
          label="Guardar Producto"
          color="primary"
          :loading="guardando"
          @click="guardarProducto"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- DIÁLOGO DE RESULTADOS DE BÚSQUEDA -->
  <DialogoResultadosBusqueda
    v-model="dialogoResultadosAbierto"
    :resultados="resultadosBusqueda"
    :variante-pie="variantePieResultados"
    :pie-acciones-loading="pieAccionesLoading"
    @producto-seleccionado="autoCompletarFormulario"
    @ampliar-busqueda="onAmpliarBusqueda"
  />

  <!-- ESCÁNER UNITARIO (solo llena el campo código de barras) -->
  <EscaneadorCodigo
    :activo="escanerUnitarioActivo"
    @codigo-detectado="alDetectarCodigo"
    @cerrar="escanerUnitarioActivo = false"
    @no-disponible="alEscanerNoDisponible"
  />
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import FormularioProducto from '../FormularioProducto.vue'
import FormularioPrecio from '../FormularioPrecio.vue'
import DialogoResultadosBusqueda from './DialogoResultadosBusqueda.vue'
import EscaneadorCodigo from '../../Scanner/EscaneadorCodigo.vue'
import { useProductosStore } from '../../../almacenamiento/stores/productosStore.js'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'
import productosService from '../../../almacenamiento/servicios/ProductosService.js'
import busquedaProductosHibridaService, {
  FUENTE_DATO_LOCAL,
} from '../../../almacenamiento/servicios/BusquedaProductosHibridaService.js'
import { usePreferenciasStore } from '../../../almacenamiento/stores/preferenciasStore.js'
import { useTecladoVirtual } from '../../../composables/useTecladoVirtual.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  modo: {
    type: String,
    default: 'local',
    validator: (value) => ['local', 'comunidad'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'producto-guardado'])

const productosStore = useProductosStore()
const comerciosStore = useComerciStore()
const preferenciasStore = usePreferenciasStore()
const $q = useQuasar()
const { estiloTarjeta } = useTecladoVirtual()

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Ref a los formularios (para validación programática)
const refFormularioProducto = ref(null)
const refFormularioPrecio = ref(null)

// Estado de carga
const guardando = ref(false)

// Escáner unitario (solo llena el campo de código de barras)
const escanerUnitarioActivo = ref(false)

// Datos del formulario de producto
const datosProducto = ref({
  nombre: '',
  marca: '',
  codigoBarras: '',
  cantidad: 1,
  unidad: 'unidad',
  categoria: '',
  imagen: null,
})

// Datos del formulario de precio
const datosPrecio = ref({
  comercio: '',
  direccion: '',
  valor: null,
  moneda: preferenciasStore.monedaDefaultEfectiva,
  comercioId: null,
  direccionId: null,
  nombreCompleto: '',
})

// Estados de búsqueda API / híbrida
const dialogoResultadosAbierto = ref(false)
const resultadosBusqueda = ref([])
const fuenteDatoActual = ref(null)
const fotoFuenteActual = ref(null)
const buscandoConsultaExterna = ref(false)
const variantePieResultados = ref(null)
const pieAccionesLoading = ref(false)
const ultimoCodigoBusqueda = ref('')
const ultimoTextoNombreBusqueda = ref('')

watch(dialogoResultadosAbierto, (abierto) => {
  if (!abierto) {
    variantePieResultados.value = null
    pieAccionesLoading.value = false
  }
})

// Clases responsivas
const clasesResponsivas = computed(() => {
  return {
    'dialogo-landscape': $q.screen.width > $q.screen.height && $q.screen.lt.sm,
  }
})

// Watchers para sincronizar datos
watch(
  () => datosProducto.value,
  () => {
    console.log('📝 Datos producto actualizados:', datosProducto.value)
  },
  { deep: true },
)

watch(
  () => datosPrecio.value,
  () => {
    console.log('💰 Datos precio actualizados:', datosPrecio.value)
  },
  { deep: true },
)

// Buscar por código: local primero (plan BusquedaLocalPrimeroYEstadosCarga)
async function buscarPorCodigo(codigo, callbackFinalizar) {
  try {
    const c = (codigo || '').trim()
    ultimoCodigoBusqueda.value = c
    console.log(`🔍 Buscando producto por código: ${c}`)

    const res = await busquedaProductosHibridaService.buscarPorCodigoConPolitica(c, {
      forzarApi: false,
      onAntesLlamadaApi: () => {
        buscandoConsultaExterna.value = true
      },
    })

    variantePieResultados.value = res.puedeEnriquecerConApi ? 'codigo-local' : null
    resultadosBusqueda.value = res.itemsParaDialogo

    if (res.itemsParaDialogo.length > 0) {
      dialogoResultadosAbierto.value = true
    } else {
      $q.notify({
        type: 'warning',
        message: 'No se encontró el producto',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('❌ Error al buscar:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al buscar producto',
      position: 'top',
    })
  } finally {
    buscandoConsultaExterna.value = false
    if (callbackFinalizar) callbackFinalizar()
  }
}

// Buscar por nombre: local primero; OFF si no hay locales o por pie del diálogo
async function buscarPorNombre(texto, callbackFinalizar) {
  try {
    const t = (texto || '').trim()
    ultimoTextoNombreBusqueda.value = t
    if (!t) {
      if (callbackFinalizar) callbackFinalizar()
      return
    }
    console.log(`🔍 Buscando productos por nombre: ${t}`)

    const res = await busquedaProductosHibridaService.buscarPorNombreConPolitica(t, {
      ampliarOpenFoodFacts: false,
      onAntesLlamadaApi: () => {
        buscandoConsultaExterna.value = true
      },
    })

    variantePieResultados.value = res.puedeAmpliarOpenFoodFacts ? 'nombre-local' : null
    resultadosBusqueda.value = res.itemsParaDialogo

    if (res.itemsParaDialogo.length > 0) {
      dialogoResultadosAbierto.value = true
    } else {
      $q.notify({
        type: 'warning',
        message: 'No se encontraron productos',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('❌ Error al buscar:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al buscar producto',
      position: 'top',
    })
  } finally {
    buscandoConsultaExterna.value = false
    if (callbackFinalizar) callbackFinalizar()
  }
}

async function onAmpliarBusqueda() {
  const tipo = variantePieResultados.value
  if (!tipo) return

  pieAccionesLoading.value = true
  buscandoConsultaExterna.value = true
  try {
    if (tipo === 'codigo-local') {
      const res = await busquedaProductosHibridaService.buscarPorCodigoConPolitica(ultimoCodigoBusqueda.value, {
        forzarApi: true,
        onAntesLlamadaApi: () => {},
      })
      variantePieResultados.value = null
      resultadosBusqueda.value = res.itemsParaDialogo
      if (res.itemsParaDialogo.length === 0) {
        $q.notify({
          type: 'warning',
          message: 'No se encontró en fuentes externas',
          position: 'top',
        })
      }
    } else if (tipo === 'nombre-local') {
      const res = await busquedaProductosHibridaService.buscarPorNombreConPolitica(ultimoTextoNombreBusqueda.value, {
        ampliarOpenFoodFacts: true,
        onAntesLlamadaApi: () => {},
      })
      variantePieResultados.value = null
      resultadosBusqueda.value = res.itemsParaDialogo
      if (res.itemsParaDialogo.length === 0) {
        $q.notify({
          type: 'warning',
          message: 'No se encontraron productos en Open Food Facts',
          position: 'top',
        })
      }
    }
  } catch (error) {
    console.error('❌ Error al ampliar búsqueda:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al consultar fuentes externas',
      position: 'top',
    })
  } finally {
    pieAccionesLoading.value = false
    buscandoConsultaExterna.value = false
  }
}

// Auto-completar formulario (local o API)
function autoCompletarFormulario(producto) {
  datosProducto.value = {
    nombre: producto.nombre || datosProducto.value.nombre,
    marca: producto.marca || datosProducto.value.marca,
    codigoBarras: producto.codigoBarras || datosProducto.value.codigoBarras,
    cantidad: producto.cantidad || datosProducto.value.cantidad,
    unidad: producto.unidad || datosProducto.value.unidad,
    categoria: producto.categoria || datosProducto.value.categoria,
    imagen: producto.imagen || datosProducto.value.imagen,
  }
  fuenteDatoActual.value = producto.fuenteDato || null
  if (producto.fuenteDato === FUENTE_DATO_LOCAL) {
    fotoFuenteActual.value = producto.fotoFuente ?? (producto.imagen ? 'usuario' : null)
  } else {
    fotoFuenteActual.value = producto.imagen ? 'api' : null
  }
  console.log('✅ Formulario auto-completado')
}

// Guardar producto
async function guardarProducto() {
  guardando.value = true

  // 1. Validar datos del producto (nombre obligatorio en local)
  if (props.modo === 'comunidad' || (datosProducto.value.nombre || '').trim() === '') {
    const productoValido = refFormularioProducto.value?.validarFormulario()
    if (!productoValido) {
      guardando.value = false
      return
    }
  }

  // 2. Validar precio: obligatorio siempre (>= $1) para evitar productos sin precio ($0)
  const precioValido = refFormularioPrecio.value?.validarPrecio()
  if (!precioValido) {
    guardando.value = false
    return
  }

  try {
    let productoExistente = null

    // Solo buscar si hay código de barras
    if ((datosProducto.value.codigoBarras || '').trim() !== '') {
      productoExistente = await productosService.buscarPorCodigoBarras(
        (datosProducto.value.codigoBarras || '').trim(),
      )
    }

    if (productoExistente) {
      console.log(`🎯 Producto existente encontrado: ${productoExistente.nombre}`)

      const nombreCompleto =
        datosPrecio.value.nombreCompleto ||
        (datosPrecio.value.direccion?.trim()
          ? `${datosPrecio.value.comercio?.trim()} - ${datosPrecio.value.direccion?.trim()}`
          : datosPrecio.value.comercio?.trim())

      const nuevoPrecio = {
        comercioId: datosPrecio.value.comercioId || null,
        direccionId: datosPrecio.value.direccionId || null,
        comercio: datosPrecio.value.comercio?.trim() || 'Sin comercio',
        nombreCompleto: nombreCompleto || 'Sin datos',
        direccion: datosPrecio.value.direccion?.trim() || '',
        valor: datosPrecio.value.valor || 0,
        moneda: datosPrecio.value.moneda || 'UYU',
        fecha: new Date().toISOString(),
        confirmaciones: 0,
        usuarioId: 'user_actual_123',
      }

      const productoActualizado = await productosStore.agregarPrecioAProducto(
        productoExistente.id,
        nuevoPrecio,
      )

      if (productoActualizado) {
        if (nuevoPrecio.comercioId && nuevoPrecio.direccionId) {
          await comerciosStore.registrarUso(nuevoPrecio.comercioId, nuevoPrecio.direccionId)
        }

        $q.notify({
          type: 'positive',
          message: `Precio agregado a "${productoExistente.nombre}"`,
          caption: `${datosPrecio.value.comercio} - $${datosPrecio.value.valor}`,
          position: 'top',
          icon: 'add_circle',
          timeout: 3000,
        })

        emit('producto-guardado', productoActualizado)
        limpiarFormulario()
        cerrarDialogo()
      } else {
        throw new Error('No se pudo agregar el precio al producto existente')
      }

      return
    }

    console.log('Creando producto nuevo...')

    const nuevoProducto = {
      nombre: datosProducto.value.nombre?.trim() || 'Sin nombre',
      marca: datosProducto.value.marca?.trim() || '',
      codigoBarras: datosProducto.value.codigoBarras?.trim() || '',
      cantidad: datosProducto.value.cantidad || 1,
      unidad: datosProducto.value.unidad || 'unidad',
      categoria: datosProducto.value.categoria?.trim() || '',
      imagen: datosProducto.value.imagen || null,
      fuenteDato: fuenteDatoActual.value || null,
      fotoFuente: fotoFuenteActual.value || null,
      precios: [],
    }

    if ((datosPrecio.value.comercio || '').trim() !== '' || datosPrecio.value.valor !== null) {
      const nombreCompleto =
        datosPrecio.value.nombreCompleto ||
        (datosPrecio.value.direccion?.trim()
          ? `${datosPrecio.value.comercio?.trim()} - ${datosPrecio.value.direccion?.trim()}`
          : datosPrecio.value.comercio?.trim())

      nuevoProducto.precios.push({
        comercioId: datosPrecio.value.comercioId || null,
        direccionId: datosPrecio.value.direccionId || null,
        comercio: datosPrecio.value.comercio?.trim() || 'Sin comercio',
        nombreCompleto: nombreCompleto || 'Sin datos',
        direccion: datosPrecio.value.direccion?.trim() || '',
        valor: datosPrecio.value.valor || 0,
        moneda: datosPrecio.value.moneda || 'UYU',
        fecha: new Date().toISOString(),
        confirmaciones: 0,
        usuarioId: 'user_actual_123',
      })
    }

    const productoGuardado = await productosStore.agregarProducto(nuevoProducto)

    if (productoGuardado) {
      if (
        nuevoProducto.precios.length > 0 &&
        nuevoProducto.precios[0].comercioId &&
        nuevoProducto.precios[0].direccionId
      ) {
        await comerciosStore.registrarUso(
          nuevoProducto.precios[0].comercioId,
          nuevoProducto.precios[0].direccionId,
        )
      }

      $q.notify({
        type: 'positive',
        message: 'Producto agregado exitosamente',
        caption: datosProducto.value.nombre,
        position: 'top',
        icon: 'check_circle',
        timeout: 2500,
      })

      emit('producto-guardado', productoGuardado)
      limpiarFormulario()
      cerrarDialogo()
    } else {
      throw new Error('No se pudo guardar el producto')
    }
  } catch (error) {
    console.error('❌ Error al guardar producto:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el producto',
      caption: error.message,
      position: 'top',
      timeout: 3000,
    })
  } finally {
    guardando.value = false
  }
}

// Limpiar formulario (mantiene moneda y unidad guardadas)
function limpiarFormulario() {
  datosProducto.value = {
    nombre: '',
    marca: '',
    codigoBarras: '',
    cantidad: 1,
    unidad: preferenciasStore.unidad,
    categoria: '',
    imagen: null,
  }
  fuenteDatoActual.value = null
  fotoFuenteActual.value = null

  datosPrecio.value = {
    comercio: '',
    direccion: '',
    valor: null,
    moneda: preferenciasStore.monedaDefaultEfectiva,
    comercioId: null,
    direccionId: null,
    nombreCompleto: '',
  }
}

// Cancelar (limpiar y cerrar)
function cancelar() {
  limpiarFormulario()
  cerrarDialogo()
}

// Al cerrar (click fuera o ESC)
function alCerrar() {
  limpiarFormulario()
}

// Cerrar diálogo
function cerrarDialogo() {
  dialogoAbierto.value = false
}

// Activa el escáner unitario (solo llena el campo de código de barras)
function alEscanearCodigo() {
  escanerUnitarioActivo.value = true
}

function alEscanerNoDisponible() {
  escanerUnitarioActivo.value = false
  $q.notify({
    type: 'info',
    message: 'En web escribí el código de barras manualmente.',
    position: 'top',
    timeout: 2500,
  })
}

// Al detectar un código: llena el campo y dispara búsqueda API automáticamente.
// nextTick espera que el webview se restaure antes de abrir el diálogo de resultados.
async function alDetectarCodigo(codigo) {
  escanerUnitarioActivo.value = false
  datosProducto.value.codigoBarras = codigo
  await nextTick()
  await buscarPorCodigo(codigo)
}
</script>

<style scoped>
.dialogo-agregar {
  min-width: 350px;
  max-width: 500px;
  max-height: calc(
    100dvh - var(--safe-area-top, 0px) - var(--safe-area-bottom, 0px) - var(--espacio-publicidad, 0px) - 24px
  );
  display: flex;
  flex-direction: column;
  margin-bottom: calc(var(--espacio-publicidad, 0px) + 8px);
}
.dialogo-landscape {
  max-width: 90vw;
  max-height: 90vh;
}
.contenido-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.dialogo-landscape .contenido-scroll {
  max-height: 50vh;
}
.acciones-safe-area {
  padding-bottom: calc(16px + var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px)) !important;
}
.formularios-contenedor {
  padding: 0 4px;
}
.seccion-formulario {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.seccion-titulo {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
  color: var(--color-primario);
  margin-bottom: 8px;
}
.dialogo-agregar {
  transition: all 0.3s ease;
}
</style>
