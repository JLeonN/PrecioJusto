<template>
  <q-dialog v-model="dialogoAbierto" @before-hide="alCerrar">
    <q-card class="dialogo-agregar" :class="clasesResponsivas" :style="estiloTarjeta">
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
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cancelar" />
        <q-btn
          unelevated
          label="Guardar Producto"
          color="primary"
          :loading="guardando"
          :disable="!formularioValido"
          @click="guardarProducto"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- DIÁLOGO DE RESULTADOS DE BÚSQUEDA -->
  <DialogoResultadosBusqueda
    v-model="dialogoResultadosAbierto"
    :resultados="resultadosBusqueda"
    @producto-seleccionado="autoCompletarFormulario"
  />

  <!-- ESCÁNER UNITARIO (solo llena el campo código de barras) -->
  <EscaneadorCodigo
    :activo="escanerUnitarioActivo"
    @codigo-detectado="alDetectarCodigo"
    @cerrar="escanerUnitarioActivo = false"
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
import buscadorProductosService from '../../../almacenamiento/servicios/BuscadorProductosService.js'
import openFoodFactsService from '../../../almacenamiento/servicios/OpenFoodFactsService.js'
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

// Ref al formulario de precio (para validación programática)
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
  moneda: preferenciasStore.moneda,
  comercioId: null,
  direccionId: null,
  nombreCompleto: '',
})

// Estados de búsqueda API
const dialogoResultadosAbierto = ref(false)
const resultadosBusqueda = ref([])
const fuenteDatoActual = ref(null)
const fotoFuenteActual = ref(null)

// Clases responsivas
const clasesResponsivas = computed(() => {
  return {
    'dialogo-landscape': $q.screen.width > $q.screen.height && $q.screen.lt.sm,
  }
})

// Validación básica del formulario (modo local: sin obligatorios)
const formularioValido = computed(() => {
  if (props.modo === 'comunidad') {
    // Modo comunidad: todos los campos obligatorios
    return (
      (datosProducto.value.nombre || '').trim() !== '' &&
      (datosProducto.value.marca || '').trim() !== '' &&
      (datosProducto.value.codigoBarras || '').trim() !== '' &&
      (datosPrecio.value.comercio || '').trim() !== '' &&
      datosPrecio.value.valor !== null &&
      datosPrecio.value.valor > 0
    )
  }

  // Modo local: solo nombre obligatorio
  return (datosProducto.value.nombre || '').trim() !== ''
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

// Buscar por código de barras usando el orquestador de APIs
async function buscarPorCodigo(codigo, callbackFinalizar) {
  try {
    console.log(`🔍 Buscando producto por código: ${codigo}`)

    const resultado = await buscadorProductosService.buscarPorCodigo(codigo)

    if (resultado) {
      resultadosBusqueda.value = [{ ...resultado.producto, fuenteDato: resultado.fuenteDato }]
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
    if (callbackFinalizar) callbackFinalizar()
  }
}

// Buscar por nombre en OpenFoodFacts
async function buscarPorNombre(texto, callbackFinalizar) {
  try {
    console.log(`🔍 Buscando productos por nombre: ${texto}`)

    const resultados = await openFoodFactsService.buscarPorTexto(texto)

    if (resultados.length > 0) {
      resultadosBusqueda.value = resultados
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
    if (callbackFinalizar) callbackFinalizar()
  }
}

// Auto-completar formulario con datos de API
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
  // Si la API trajo imagen, la foto es de la API; si no, no hay foto de API
  fotoFuenteActual.value = producto.imagen ? 'api' : null
  console.log('✅ Formulario auto-completado')
}

// Guardar producto
async function guardarProducto() {
  guardando.value = true

  // Validar precio: si hay comercio o se ingresó un valor, debe ser > 0
  const valorPrecio = datosPrecio.value.valor
  const hayComercio = (datosPrecio.value.comercio || '').trim() !== ''
  const hayDatosPrecio = hayComercio || valorPrecio !== null
  if (hayDatosPrecio && !(valorPrecio > 0)) {
    refFormularioPrecio.value?.validarPrecio()
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

    console.log('🆕 Creando producto nuevo...')

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
    moneda: preferenciasStore.moneda,
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
}
.dialogo-landscape {
  max-width: 90vw;
  max-height: 90vh;
}
.contenido-scroll {
  flex: 1;
  overflow-y: auto;
}
.dialogo-landscape .contenido-scroll {
  max-height: 50vh;
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
