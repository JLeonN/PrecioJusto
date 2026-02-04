<template>
  <div class="formulario-precio">
    <!-- COMERCIO (Selector con autocompletado) -->
    <q-select
      v-model="comercioSeleccionado"
      :options="comerciosFiltrados"
      option-label="nombre"
      label="Comercio"
      outlined
      dense
      use-input
      clearable
      :rules="modo === 'comunidad' ? [requerido] : []"
      @filter="filtrarComercios"
      @update:model-value="alSeleccionarComercio"
    >
      <template #prepend>
        <q-icon name="store" />
      </template>

      <!-- Opciones personalizadas con cantidad de direcciones -->
      <template #option="{ itemProps, opt }">
        <q-item v-bind="itemProps">
          <q-item-section>
            <q-item-label>{{ opt.nombre }}</q-item-label>
            <q-item-label caption>
              {{ opt.direcciones.length }}
              {{ opt.direcciones.length === 1 ? 'dirección' : 'direcciones' }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- Opción "Agregar nuevo comercio" -->
      <template #before-options>
        <q-item clickable @click="abrirDialogoNuevoComercio">
          <q-item-section avatar>
            <q-icon name="add_circle" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-primary text-weight-medium">
              Agregar nuevo comercio
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-separator />
      </template>

      <!-- Sin resultados -->
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey"> No se encontraron comercios </q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- DIRECCIÓN / SUCURSAL (Selector dinámico) -->
    <q-select
      v-model="direccionSeleccionada"
      :options="direccionesDisponibles"
      option-label="nombreCompleto"
      label="Dirección / Sucursal"
      outlined
      dense
      use-input
      clearable
      :disable="!comercioSeleccionado"
      :hint="
        !comercioSeleccionado
          ? 'Seleccioná primero un comercio'
          : 'Opcional: ayuda a identificar la sucursal específica'
      "
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="alSeleccionarDireccion"
      @input-value="alEscribirDireccion"
    >
      <template #prepend>
        <q-icon name="location_on" />
      </template>

      <!-- Sin resultados -->
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            Este comercio no tiene direcciones registradas
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- PRECIO Y MONEDA -->
    <div class="row q-col-gutter-md">
      <div class="col-8">
        <q-input
          v-model.number="datosInternos.valor"
          label="Precio"
          outlined
          dense
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          :rules="modo === 'comunidad' ? [requerido, precioValido] : [precioValido]"
          @update:model-value="emitirCambios"
        />
      </div>

      <div class="col-4">
        <q-select
          v-model="datosInternos.moneda"
          label="Moneda"
          outlined
          dense
          :options="opcionesMoneda"
          emit-value
          map-options
          @update:model-value="alCambiarMoneda"
        />
      </div>
    </div>

    <!-- Diálogo de dirección nueva -->
    <DialogoDireccionNueva
      v-model="dialogoDireccionNuevaAbierto"
      :comercio="comercioSeleccionado"
      :direccion-escrita="direccionEscritaManual"
      @agregar-a-existente="agregarDireccionAExistente"
      @crear-nuevo="crearComercioNuevo"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'
import preferenciasService from '../../almacenamiento/servicios/PreferenciasService.js'
import DialogoDireccionNueva from './Dialogos/DialogoDireccionNueva.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      comercio: '',
      direccion: '',
      valor: null,
      moneda: 'UYU',
    }),
  },
  modo: {
    type: String,
    default: 'local',
    validator: (value) => ['local', 'comunidad'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

// Store de comercios
const comerciosStore = useComerciStore()

// Opciones de moneda (principales del mundo)
const opcionesMoneda = [
  // América
  { label: 'UYU - Peso Uruguayo ($)', value: 'UYU' },
  { label: 'ARS - Peso Argentino ($)', value: 'ARS' },
  { label: 'USD - Dólar Estadounidense ($)', value: 'USD' },
  { label: 'BRL - Real Brasileño (R$)', value: 'BRL' },
  { label: 'CLP - Peso Chileno ($)', value: 'CLP' },
  { label: 'COP - Peso Colombiano ($)', value: 'COP' },
  { label: 'MXN - Peso Mexicano ($)', value: 'MXN' },
  { label: 'PYG - Guaraní Paraguayo (₲)', value: 'PYG' },
  { label: 'PEN - Sol Peruano (S/)', value: 'PEN' },
  { label: 'CAD - Dólar Canadiense ($)', value: 'CAD' },

  // Europa
  { label: 'EUR - Euro (€)', value: 'EUR' },
  { label: 'GBP - Libra Esterlina (£)', value: 'GBP' },
  { label: 'CHF - Franco Suizo (Fr)', value: 'CHF' },
  { label: 'SEK - Corona Sueca (kr)', value: 'SEK' },
  { label: 'NOK - Corona Noruega (kr)', value: 'NOK' },
  { label: 'DKK - Corona Danesa (kr)', value: 'DKK' },
  { label: 'PLN - Zloty Polaco (zł)', value: 'PLN' },
  { label: 'CZK - Corona Checa (Kč)', value: 'CZK' },
  { label: 'HUF - Forinto Húngaro (Ft)', value: 'HUF' },
  { label: 'RON - Leu Rumano (lei)', value: 'RON' },

  // Asia
  { label: 'JPY - Yen Japonés (¥)', value: 'JPY' },
  { label: 'CNY - Yuan Chino (¥)', value: 'CNY' },
  { label: 'INR - Rupia India (₹)', value: 'INR' },
  { label: 'KRW - Won Surcoreano (₩)', value: 'KRW' },
  { label: 'SGD - Dólar de Singapur ($)', value: 'SGD' },
  { label: 'HKD - Dólar de Hong Kong ($)', value: 'HKD' },
  { label: 'THB - Baht Tailandés (฿)', value: 'THB' },
  { label: 'MYR - Ringgit Malasio (RM)', value: 'MYR' },
  { label: 'IDR - Rupia Indonesia (Rp)', value: 'IDR' },
  { label: 'PHP - Peso Filipino (₱)', value: 'PHP' },
  { label: 'VND - Dong Vietnamita (₫)', value: 'VND' },

  // Oceanía
  { label: 'AUD - Dólar Australiano ($)', value: 'AUD' },
  { label: 'NZD - Dólar Neozelandés ($)', value: 'NZD' },

  // África
  { label: 'ZAR - Rand Sudafricano (R)', value: 'ZAR' },
  { label: 'EGP - Libra Egipcia (£)', value: 'EGP' },
  { label: 'NGN - Naira Nigeriana (₦)', value: 'NGN' },

  // Medio Oriente
  { label: 'AED - Dirham de EAU (د.إ)', value: 'AED' },
  { label: 'SAR - Riyal Saudí (﷼)', value: 'SAR' },
  { label: 'ILS - Nuevo Shekel (₪)', value: 'ILS' },
  { label: 'TRY - Lira Turca (₺)', value: 'TRY' },
]

// Estado interno
const datosInternos = ref({
  comercio: props.modelValue.comercio || '',
  direccion: props.modelValue.direccion || '',
  valor: props.modelValue.valor || null,
  moneda: props.modelValue.moneda || 'UYU',
})

// Estado para comercio y dirección seleccionados
const comercioSeleccionado = ref(null)
const direccionSeleccionada = ref(null)

// IDs finales (para guardar en el producto)
const comercioId = ref(null)
const direccionId = ref(null)

// Control de comercio nuevo
const esComercioNuevo = ref(false)
const dialogoDireccionNuevaAbierto = ref(false)
const direccionEscritaManual = ref('')

// Filtrado de comercios
const comerciosFiltrados = ref([])

// Computed: Comercios ordenados por uso (top 3 primero)
const comerciosOrdenados = computed(() => {
  return comerciosStore.comerciosPorUso
})

// Computed: Direcciones disponibles del comercio seleccionado
const direccionesDisponibles = computed(() => {
  if (!comercioSeleccionado.value) return []

  return [...comercioSeleccionado.value.direcciones] // ✅ Agregar spread [...]
    .sort((a, b) => new Date(b.fechaUltimoUso) - new Date(a.fechaUltimoUso))
    .map((dir) => ({
      ...dir,
      nombreCompleto: dir.nombreCompleto || `${dir.calle}`,
    }))
})

// Cargar moneda guardada al montar
onMounted(async () => {
  const preferencias = await preferenciasService.obtenerPreferencias()
  datosInternos.value.moneda = preferencias.moneda

  // Cargar comercios
  await comerciosStore.cargarComercios()
  comerciosFiltrados.value = comerciosOrdenados.value

  emitirCambios()
})

/**
 * Filtrar comercios al escribir en el q-select
 */
function filtrarComercios(val, update) {
  update(() => {
    if (val === '') {
      comerciosFiltrados.value = comerciosOrdenados.value
    } else {
      const texto = val.toLowerCase()
      comerciosFiltrados.value = comerciosOrdenados.value.filter((c) =>
        c.nombre.toLowerCase().includes(texto),
      )
    }
  })
}

/**
 * Al seleccionar comercio del dropdown
 */
function alSeleccionarComercio(comercio) {
  if (!comercio) {
    // Usuario borró la selección
    comercioId.value = null
    direccionId.value = null
    direccionSeleccionada.value = null
    esComercioNuevo.value = false
    emitirCambios()
    return
  }

  comercioId.value = comercio.id
  esComercioNuevo.value = false

  // Auto-seleccionar primera dirección (última usada)
  if (comercio.direcciones.length > 0) {
    direccionSeleccionada.value = direccionesDisponibles.value[0]
    direccionId.value = direccionSeleccionada.value.id
  }

  emitirCambios()
}

/**
 * Al seleccionar dirección del dropdown
 */
function alSeleccionarDireccion(direccion) {
  if (!direccion) {
    // Usuario borró la selección
    direccionId.value = null
    emitirCambios()
    return
  }

  // Verificar si existe en el comercio
  const existe = comercioSeleccionado.value.direcciones.find((d) => d.id === direccion.id)

  if (existe) {
    // ✅ Dirección existe
    direccionId.value = direccion.id
    esComercioNuevo.value = false
  }

  emitirCambios()
}

/**
 * Al escribir dirección manualmente
 */
function alEscribirDireccion(val) {
  if (!val || !comercioSeleccionado.value) return

  direccionEscritaManual.value = val

  // Verificar si coincide con alguna existente
  const coincide = comercioSeleccionado.value.direcciones.some(
    (d) => d.calle.toLowerCase() === val.toLowerCase(),
  )

  // Si no coincide y tiene más de 3 caracteres, abrir diálogo
  if (!coincide && val.length > 3) {
    dialogoDireccionNuevaAbierto.value = true
  }
}

/**
 * OPCIÓN A del diálogo: Agregar dirección a comercio existente
 */
async function agregarDireccionAExistente() {
  try {
    await comerciosStore.agregarDireccion(comercioId.value, {
      calle: direccionEscritaManual.value,
      barrio: '',
      ciudad: '',
    })

    // Recargar comercios para actualizar
    await comerciosStore.cargarComercios()

    // Actualizar comercio seleccionado con los nuevos datos
    const comercioActualizado = comerciosStore.comercios.find((c) => c.id === comercioId.value)
    if (comercioActualizado) {
      comercioSeleccionado.value = comercioActualizado

      // Buscar la dirección recién agregada (será la última)
      const nuevaDireccion =
        comercioActualizado.direcciones[comercioActualizado.direcciones.length - 1]
      direccionSeleccionada.value = nuevaDireccion
      direccionId.value = nuevaDireccion.id
    }

    esComercioNuevo.value = false
    dialogoDireccionNuevaAbierto.value = false

    emitirCambios()
  } catch (error) {
    console.error('Error al agregar dirección:', error)
  }
}

/**
 * OPCIÓN B del diálogo: Crear comercio nuevo
 */
async function crearComercioNuevo() {
  try {
    const nuevoComercio = await comerciosStore.agregarComercio({
      nombre: comercioSeleccionado.value.nombre,
      tipo: 'Otro',
      calle: direccionEscritaManual.value,
      barrio: '',
      ciudad: '',
    })

    // Usar nuevo comercio + nueva dirección
    comercioSeleccionado.value = nuevoComercio
    comercioId.value = nuevoComercio.id
    direccionSeleccionada.value = nuevoComercio.direcciones[0]
    direccionId.value = nuevoComercio.direcciones[0].id
    esComercioNuevo.value = true

    dialogoDireccionNuevaAbierto.value = false

    emitirCambios()
  } catch (error) {
    console.error('Error al crear comercio nuevo:', error)
  }
}

/**
 * Abrir diálogo para agregar nuevo comercio
 */
function abrirDialogoNuevoComercio() {
  // Emitir evento para que el padre abra DialogoAgregarComercio
  // (esto se maneja en DialogoAgregarProducto.vue)
  console.log('TODO: Abrir diálogo de agregar comercio')
}

// Al cambiar moneda, guardarla
async function alCambiarMoneda() {
  await preferenciasService.guardarMoneda(datosInternos.value.moneda)
  emitirCambios()
}

// Sincronizar con props externos
watch(
  () => props.modelValue,
  (nuevoValor) => {
    datosInternos.value = {
      comercio: nuevoValor.comercio || '',
      direccion: nuevoValor.direccion || '',
      valor: nuevoValor.valor || null,
      moneda: nuevoValor.moneda || 'UYU',
    }
  },
  { deep: true },
)

// Emitir cambios al padre
function emitirCambios() {
  emit('update:modelValue', {
    ...datosInternos.value,
    comercioId: comercioId.value,
    direccionId: direccionId.value,
    comercio: comercioSeleccionado.value?.nombre || '',
    direccion: direccionSeleccionada.value?.calle || '',
    nombreCompleto: direccionSeleccionada.value?.nombreCompleto || '',
  })
}

// Reglas de validación
function requerido(val) {
  return (val && val.length > 0) || 'Este campo es requerido'
}

function precioValido(val) {
  if (val === null || val === undefined || val === '') return true
  return val > 0 || 'El precio debe ser mayor a 0'
}
</script>

<style scoped>
.formulario-precio {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
