<template>
  <q-dialog v-model="dialogoAbierto" @before-hide="alCerrar">
    <q-card class="dialogo-agregar" :class="clasesResponsivas">
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
            />
          </div>

          <q-separator class="q-my-lg" />

          <!-- Sección: Datos del Comercio -->
          <div class="seccion-formulario">
            <div class="seccion-titulo">
              <q-icon name="store" size="20px" class="q-mr-xs" />
              <span>Datos del Comercio</span>
            </div>
            <FormularioPrecio v-model="datosPrecio" :modo="modo" />
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormularioProducto from '../FormularioProducto.vue'
import FormularioPrecio from '../FormularioPrecio.vue'
import DialogoResultadosBusqueda from './DialogoResultadosBusqueda.vue'
import { useProductosStore } from '../../../almacenamiento/stores/productosStore.js'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'
import productosService from '../../../almacenamiento/servicios/ProductosService.js'
import openFoodFactsService from '../../../almacenamiento/servicios/OpenFoodFactsService.js'
import preferenciasService from '../../../almacenamiento/servicios/PreferenciasService.js'

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
const $q = useQuasar()

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Estado de carga
const guardando = ref(false)

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
  moneda: 'UYU',
  comercioId: null,
  direccionId: null,
  nombreCompleto: '',
})

// Estados de búsqueda API
const dialogoResultadosAbierto = ref(false)
const resultadosBusqueda = ref([])

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
      datosProducto.value.nombre.trim() !== '' &&
      datosProducto.value.marca.trim() !== '' &&
      datosProducto.value.codigoBarras.trim() !== '' &&
      datosPrecio.value.comercio.trim() !== '' &&
      datosPrecio.value.valor !== null &&
      datosPrecio.value.valor > 0
    )
  }

  // Modo local: solo nombre obligatorio
  return datosProducto.value.nombre.trim() !== ''
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

// Buscar por código de barras en OpenFoodFacts
async function buscarPorCodigo(codigo, callbackFinalizar) {
  try {
    console.log(`🔍 Buscando producto por código: ${codigo}`)

    const producto = await openFoodFactsService.buscarPorCodigoBarras(codigo)

    if (producto) {
      resultadosBusqueda.value = [producto]
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

  console.log('✅ Formulario auto-completado')
}

// Guardar producto
async function guardarProducto() {
  guardando.value = true

  try {
    let productoExistente = null

    // Solo buscar si hay código de barras
    if (datosProducto.value.codigoBarras.trim() !== '') {
      productoExistente = await productosService.buscarPorCodigoBarras(
        datosProducto.value.codigoBarras.trim(),
      )
    }

    if (productoExistente) {
      console.log(`🎯 Producto existente encontrado: ${productoExistente.nombre}`)

      const nombreCompleto =
        datosPrecio.value.nombreCompleto ||
        (datosPrecio.value.direccion.trim()
          ? `${datosPrecio.value.comercio.trim()} - ${datosPrecio.value.direccion.trim()}`
          : datosPrecio.value.comercio.trim())

      const nuevoPrecio = {
        comercioId: datosPrecio.value.comercioId || null,
        direccionId: datosPrecio.value.direccionId || null,
        comercio: datosPrecio.value.comercio.trim() || 'Sin comercio',
        nombreCompleto: nombreCompleto || 'Sin datos',
        direccion: datosPrecio.value.direccion.trim() || '',
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
      nombre: datosProducto.value.nombre.trim() || 'Sin nombre',
      marca: datosProducto.value.marca.trim() || '',
      codigoBarras: datosProducto.value.codigoBarras.trim() || '',
      cantidad: datosProducto.value.cantidad || 1,
      unidad: datosProducto.value.unidad || 'unidad',
      categoria: datosProducto.value.categoria.trim() || '',
      imagen: datosProducto.value.imagen || null,
      precios: [],
    }

    if (datosPrecio.value.comercio.trim() !== '' || datosPrecio.value.valor !== null) {
      const nombreCompleto =
        datosPrecio.value.nombreCompleto ||
        (datosPrecio.value.direccion.trim()
          ? `${datosPrecio.value.comercio.trim()} - ${datosPrecio.value.direccion.trim()}`
          : datosPrecio.value.comercio.trim())

      nuevoProducto.precios.push({
        comercioId: datosPrecio.value.comercioId || null,
        direccionId: datosPrecio.value.direccionId || null,
        comercio: datosPrecio.value.comercio.trim() || 'Sin comercio',
        nombreCompleto: nombreCompleto || 'Sin datos',
        direccion: datosPrecio.value.direccion.trim() || '',
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

// Limpiar formulario (mantiene moneda y unidad)
async function limpiarFormulario() {
  const preferencias = await preferenciasService.obtenerPreferencias()

  datosProducto.value = {
    nombre: '',
    marca: '',
    codigoBarras: '',
    cantidad: 1,
    unidad: preferencias.unidad,
    categoria: '',
    imagen: null,
  }

  datosPrecio.value = {
    comercio: '',
    direccion: '',
    valor: null,
    moneda: preferencias.moneda,
    comercioId: null,
    direccionId: null,
    nombreCompleto: '',
  }
}

// Cancelar (limpiar y cerrar)
async function cancelar() {
  await limpiarFormulario()
  cerrarDialogo()
}

// Al cerrar (click fuera o ESC)
async function alCerrar() {
  await limpiarFormulario()
}

// Cerrar diálogo
function cerrarDialogo() {
  dialogoAbierto.value = false
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
  max-height: 60vh;
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
