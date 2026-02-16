<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card style="min-width: 350px; max-width: 500px">
      <!-- Header con nombre del producto -->
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="add_circle" color="primary" size="24px" class="q-mr-sm" />
        <div class="text-h6 ellipsis" style="max-width: 280px">
          {{ productoActual?.nombre || 'Agregar precio' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cerrar" />
      </q-card-section>

      <!-- Precio actual del producto -->
      <q-card-section v-if="productoActual" class="q-pt-sm q-pb-none">
        <div class="text-caption text-grey-7">
          Precio actual más bajo:
          <span class="text-weight-bold text-primary"> ${{ productoActual.precioMejor }} </span>
        </div>
      </q-card-section>

      <!-- Formulario -->
      <q-card-section>
        <!-- Input precio nuevo (pre-seleccionado) -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-8">
            <q-input
              ref="inputPrecioRef"
              v-model.number="precioNuevo"
              label="Nuevo precio"
              outlined
              dense
              type="number"
              inputmode="decimal"
              :rules="[(val) => val > 0 || 'El precio debe ser mayor a 0']"
              @focus="seleccionarTextoPrecio"
            />
          </div>
          <div class="col-4">
            <q-select
              v-model="monedaSeleccionada"
              label="Moneda"
              outlined
              dense
              :options="opcionesMoneda"
              emit-value
              map-options
            />
          </div>
        </div>

        <!-- Selector de comercio -->
        <q-select
          v-model="comercioSeleccionado"
          label="Comercio"
          outlined
          dense
          use-input
          input-debounce="200"
          :options="opcionesComercios"
          option-label="label"
          option-value="value"
          :display-value="textoVisibleComercio"
          class="q-mb-md"
          @filter="filtrarComercios"
          @update:model-value="alSeleccionarComercio"
          @input-value="alEscribirComercio"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">Sin resultados</q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Selector de dirección -->
        <q-select
          v-model="direccionSeleccionada"
          label="Dirección"
          outlined
          dense
          use-input
          input-debounce="200"
          :options="opcionesDirecciones"
          option-label="label"
          option-value="value"
          :disable="!comercioSeleccionado"
          :hint="hintDireccion"
          class="q-mb-sm"
          @filter="filtrarDirecciones"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">Sin direcciones</q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Botón agregar comercio nuevo -->
        <div class="text-center q-mt-sm">
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            label="+ Agregar nuevo comercio"
            @click="abrirDialogoComercioRapido"
          />
        </div>
      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cerrar" />
        <q-btn
          unelevated
          label="Guardar precio"
          color="primary"
          :loading="guardando"
          :disable="!puedeGuardar"
          @click="guardarPrecio"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Diálogo comercio rápido -->
  <DialogoAgregarComercioRapido
    v-model="dialogoComercioRapidoAbierto"
    :nombre-inicial="textoComercioEscrito"
    @comercio-creado="alCrearComercioNuevo"
  />
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useProductosStore } from '../../../almacenamiento/stores/productosStore.js'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'
import { MONEDAS, MONEDA_DEFAULT } from '../../../almacenamiento/constantes/Monedas.js'
import DialogoAgregarComercioRapido from './DialogoAgregarComercioRapido.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  productoId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'precio-guardado'])

/* Stores */
const productosStore = useProductosStore()
const comerciosStore = useComerciStore()
const $q = useQuasar()

/* Estado del diálogo */
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

/* Refs del formulario */
const inputPrecioRef = ref(null)
const precioNuevo = ref(null)
const monedaSeleccionada = ref(MONEDA_DEFAULT)
const comercioSeleccionado = ref(null)
const direccionSeleccionada = ref(null)
const textoComercioEscrito = ref('')
const guardando = ref(false)
const dialogoComercioRapidoAbierto = ref(false)

/* Opciones de moneda */
const opcionesMoneda = MONEDAS

/* Producto actual */
const productoActual = computed(() => {
  if (!props.productoId) return null
  return productosStore.obtenerProductoPorId(props.productoId)
})

/* Opciones de comercios para el selector */
const opcionesComerciosBase = computed(() => {
  return comerciosStore.comerciosPorUso.map((comercio) => ({
    label: `${comercio.nombre} (${comercio.direcciones?.length || 0} dir.)`,
    value: comercio.id,
    comercio: comercio,
  }))
})

const opcionesComercios = ref([])

/* Opciones de direcciones del comercio seleccionado */
const opcionesDireccionesBase = computed(() => {
  if (!comercioSeleccionado.value) return []

  const comercio = comerciosStore.obtenerComercioPorId(comercioSeleccionado.value.value)
  if (!comercio || !comercio.direcciones) return []

  return comercio.direcciones.map((dir) => ({
    label: dir.calle || dir.nombreCompleto || 'Sin dirección',
    value: dir.id,
    direccion: dir,
  }))
})

const opcionesDirecciones = ref([])

/* Texto visible en selector comercio */
const textoVisibleComercio = computed(() => {
  if (comercioSeleccionado.value) {
    return comercioSeleccionado.value.label
  }
  return textoComercioEscrito.value || ''
})

/* Hint dinámico para dirección */
const hintDireccion = computed(() => {
  if (!comercioSeleccionado.value) return 'Seleccioná un comercio primero'
  const total = opcionesDireccionesBase.value.length
  return `${total} ${total === 1 ? 'dirección disponible' : 'direcciones disponibles'}`
})

/* Validación para guardar */
const puedeGuardar = computed(() => {
  return precioNuevo.value > 0
})

/* Obtener último comercio usado en este producto */
const obtenerUltimoComercioUsado = () => {
  if (!productoActual.value?.precios || productoActual.value.precios.length === 0) return null

  const preciosOrdenados = [...productoActual.value.precios].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  )

  const ultimoPrecio = preciosOrdenados[0]
  if (!ultimoPrecio.comercioId) return null

  const opcion = opcionesComerciosBase.value.find((op) => op.value === ultimoPrecio.comercioId)

  return opcion || null
}

/* Obtener dirección más usada del comercio seleccionado */
const obtenerDireccionMasUsada = () => {
  if (opcionesDireccionesBase.value.length === 0) return null

  const direccionesOrdenadas = [...opcionesDireccionesBase.value].sort((a, b) => {
    const fechaA = new Date(a.direccion.fechaUltimoUso || '2000-01-01')
    const fechaB = new Date(b.direccion.fechaUltimoUso || '2000-01-01')
    return fechaB - fechaA
  })

  return direccionesOrdenadas[0]
}

/* Watch: al abrir el diálogo, pre-llenar datos */
watch(
  () => props.modelValue,
  async (abierto) => {
    if (abierto) {
      /* Cargar comercios si no están cargados */
      if (comerciosStore.comercios.length === 0) {
        await comerciosStore.cargarComercios()
      }

      /* Pre-llenar precio actual */
      if (productoActual.value) {
        precioNuevo.value = productoActual.value.precioMejor || null
      }

      /* Pre-seleccionar último comercio usado */
      const ultimoComercio = obtenerUltimoComercioUsado()
      if (ultimoComercio) {
        comercioSeleccionado.value = ultimoComercio

        /* Pre-seleccionar dirección más usada */
        await nextTick()
        direccionSeleccionada.value = obtenerDireccionMasUsada()
      }

      /* Focus en input precio */
      await nextTick()
      seleccionarTextoPrecio()
    }
  },
)

/* Filtrar comercios en el buscador */
function filtrarComercios(val, update) {
  update(() => {
    if (!val) {
      opcionesComercios.value = opcionesComerciosBase.value
    } else {
      const busqueda = val.toLowerCase()
      opcionesComercios.value = opcionesComerciosBase.value.filter((op) =>
        op.label.toLowerCase().includes(busqueda),
      )
    }
  })
}

/* Filtrar direcciones en el buscador */
function filtrarDirecciones(val, update) {
  update(() => {
    if (!val) {
      opcionesDirecciones.value = opcionesDireccionesBase.value
    } else {
      const busqueda = val.toLowerCase()
      opcionesDirecciones.value = opcionesDireccionesBase.value.filter((op) =>
        op.label.toLowerCase().includes(busqueda),
      )
    }
  })
}

/* Al seleccionar un comercio, auto-seleccionar dirección */
async function alSeleccionarComercio(opcion) {
  if (!opcion) {
    direccionSeleccionada.value = null
    return
  }

  await nextTick()
  direccionSeleccionada.value = obtenerDireccionMasUsada()
}

/* Capturar texto escrito en comercio */
function alEscribirComercio(val) {
  textoComercioEscrito.value = val
}

/* Seleccionar texto del input precio al hacer focus */
function seleccionarTextoPrecio() {
  nextTick(() => {
    const input = inputPrecioRef.value?.$el?.querySelector('input')
    if (input) {
      input.select()
    }
  })
}

/* Abrir diálogo comercio rápido */
function abrirDialogoComercioRapido() {
  dialogoComercioRapidoAbierto.value = true
}

/* Al crear comercio nuevo desde diálogo rápido */
function alCrearComercioNuevo(comercioCreado) {
  /* Auto-seleccionar el comercio recién creado */
  const nuevaOpcion = {
    label: `${comercioCreado.nombre} (${comercioCreado.direcciones?.length || 0} dir.)`,
    value: comercioCreado.id,
    comercio: comercioCreado,
  }

  comercioSeleccionado.value = nuevaOpcion

  /* Auto-seleccionar primera dirección si existe */
  nextTick(() => {
    direccionSeleccionada.value = obtenerDireccionMasUsada()
  })
}

/* Guardar precio */
async function guardarPrecio() {
  if (!puedeGuardar.value || !productoActual.value) return

  guardando.value = true

  try {
    /* Construir datos del precio */
    const comercio = comercioSeleccionado.value?.comercio || null
    const direccion = direccionSeleccionada.value?.direccion || null

    const nombreComercio = comercio?.nombre || textoComercioEscrito.value.trim() || 'Sin comercio'
    const calleDireccion = direccion?.calle || ''
    const nombreCompleto = calleDireccion ? `${nombreComercio} - ${calleDireccion}` : nombreComercio

    const nuevoPrecio = {
      comercioId: comercioSeleccionado.value?.value || null,
      direccionId: direccionSeleccionada.value?.value || null,
      comercio: nombreComercio,
      nombreCompleto: nombreCompleto,
      direccion: calleDireccion,
      valor: precioNuevo.value,
      moneda: monedaSeleccionada.value,
      fecha: new Date().toISOString(),
      confirmaciones: 0,
      usuarioId: 'user_actual_123',
    }

    /* Guardar en el store */
    const productoActualizado = await productosStore.agregarPrecioAProducto(
      productoActual.value.id,
      nuevoPrecio,
    )

    if (productoActualizado) {
      /* Registrar uso del comercio */
      if (nuevoPrecio.comercioId && nuevoPrecio.direccionId) {
        await comerciosStore.registrarUso(nuevoPrecio.comercioId, nuevoPrecio.direccionId)
      }

      $q.notify({
        type: 'positive',
        message: `Precio $${precioNuevo.value} guardado`,
        caption: nombreCompleto,
        position: 'top',
        timeout: 3000,
      })

      emit('precio-guardado', productoActualizado)
      cerrar()
    } else {
      throw new Error('No se pudo guardar el precio')
    }
  } catch (error) {
    console.error('Error al guardar precio:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el precio',
      position: 'top',
    })
  } finally {
    guardando.value = false
  }
}

/* Cerrar y limpiar */
function cerrar() {
  dialogoAbierto.value = false
  precioNuevo.value = null
  monedaSeleccionada.value = MONEDA_DEFAULT
  comercioSeleccionado.value = null
  direccionSeleccionada.value = null
  textoComercioEscrito.value = ''
}
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
