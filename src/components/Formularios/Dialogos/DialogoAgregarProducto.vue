<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card style="min-width: 350px; max-width: 500px">
      <!-- HEADER -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Agregar Producto</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cerrarDialogo" />
      </q-card-section>

      <!-- CONTENIDO DEL FORMULARIO -->
      <q-card-section class="q-pt-md" style="max-height: 60vh; overflow-y: auto">
        <div class="formularios-contenedor">
          <!-- Sección: Datos del Producto -->
          <div class="seccion-formulario">
            <div class="seccion-titulo">
              <q-icon name="inventory_2" size="20px" class="q-mr-xs" />
              <span>Datos del Producto</span>
            </div>
            <FormularioProducto v-model="datosProducto" :modo="modo" />
          </div>

          <q-separator class="q-my-lg" />

          <!-- Sección: Primer Precio -->
          <div class="seccion-formulario">
            <div class="seccion-titulo">
              <q-icon name="local_offer" size="20px" class="q-mr-xs" />
              <span>Primer Precio</span>
            </div>
            <FormularioPrecio v-model="datosPrecio" :modo="modo" />
          </div>
        </div>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cerrarDialogo" />
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
</template>

<script setup>
import { ref, computed } from 'vue'
import FormularioProducto from '../FormularioProducto.vue'
import FormularioPrecio from '../FormularioPrecio.vue'
import { useProductosStore } from '../../../almacenamiento/stores/productosStore.js'
import { useQuasar } from 'quasar'

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
})

// Datos del formulario de precio
const datosPrecio = ref({
  comercio: '',
  direccion: '',
  valor: null,
})

// Validación básica del formulario (modo local: sin obligatorios)
const formularioValido = computed(() => {
  if (props.modo === 'comunidad') {
    // Modo comunidad: todos los campos obligatorios
    return (
      datosProducto.value.nombre.trim() !== '' &&
      datosProducto.value.marca.trim() !== '' &&
      datosProducto.value.codigoBarras.trim() !== '' &&
      datosProducto.value.cantidad > 0 &&
      datosProducto.value.unidad !== '' &&
      datosProducto.value.categoria.trim() !== '' &&
      datosPrecio.value.comercio.trim() !== '' &&
      datosPrecio.value.direccion.trim() !== '' &&
      datosPrecio.value.valor > 0
    )
  } else {
    // Modo local: solo verificar que tenga algo mínimo
    return (
      datosProducto.value.nombre.trim() !== '' ||
      datosProducto.value.marca.trim() !== '' ||
      datosPrecio.value.comercio.trim() !== ''
    )
  }
})

// Guardar producto
async function guardarProducto() {
  guardando.value = true

  try {
    // Construir objeto completo del producto
    const nuevoProducto = {
      // Datos del producto
      nombre: datosProducto.value.nombre.trim() || 'Sin nombre',
      marca: datosProducto.value.marca.trim() || '',
      codigoBarras: datosProducto.value.codigoBarras.trim() || '',
      cantidad: datosProducto.value.cantidad || 1,
      unidad: datosProducto.value.unidad || 'unidad',
      categoria: datosProducto.value.categoria.trim() || '',
      imagen: null, // Por ahora null, en etapas futuras vendrá de la API

      // Array de precios (con el primer precio)
      precios: [],
    }

    // Si hay datos de precio, agregarlo
    if (datosPrecio.value.comercio.trim() !== '' || datosPrecio.value.valor !== null) {
      const nombreCompleto = datosPrecio.value.direccion.trim()
        ? `${datosPrecio.value.comercio.trim()} - ${datosPrecio.value.direccion.trim()}`
        : datosPrecio.value.comercio.trim()

      nuevoProducto.precios.push({
        comercio: datosPrecio.value.comercio.trim() || 'Sin comercio',
        nombreCompleto: nombreCompleto || 'Sin datos',
        direccion: datosPrecio.value.direccion.trim() || '',
        valor: datosPrecio.value.valor || 0,
        fecha: new Date().toISOString(),
        confirmaciones: 0,
        usuarioId: 'user_actual_123', // Temporal
      })
    }

    // Guardar en el store
    const productoGuardado = await productosStore.agregarProducto(nuevoProducto)

    if (productoGuardado) {
      $q.notify({
        type: 'positive',
        message: 'Producto agregado exitosamente',
        position: 'top',
        icon: 'check_circle',
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
      position: 'top',
    })
  } finally {
    guardando.value = false
  }
}

// Limpiar formulario
function limpiarFormulario() {
  datosProducto.value = {
    nombre: '',
    marca: '',
    codigoBarras: '',
    cantidad: 1,
    unidad: 'unidad',
    categoria: '',
  }

  datosPrecio.value = {
    comercio: '',
    direccion: '',
    valor: null,
  }
}

// Cerrar diálogo
function cerrarDialogo() {
  dialogoAbierto.value = false
}
</script>

<style scoped>
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
</style>
