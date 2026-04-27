<template>
  <div class="formulario-precio">
    <!-- COMERCIO (Selector con autocompletado) -->
    <q-select
      v-if="mostrarComercio"
      v-model="comercioSeleccionado"
      :options="comerciosFiltrados"
      :display-value="textoVisibleComercio"
      option-label="nombre"
      label="Comercio"
      outlined
      dense
      use-input
      clearable
      :rules="modo === 'comunidad' ? [requerido] : []"
      @filter="filtrarComercios"
      @update:model-value="alSeleccionarComercio"
      @input-value="alEscribirComercio"
      @focus="alEnfocarComercio"
      @blur="guardarComercioEscrito"
      behavior="menu"
      :menu-props="{ maxHeight: '180px', autoClose: true }"
    >
      <template #prepend>
        <q-icon name="store" />
      </template>

      <!-- Opciones personalizadas: muestra sucursales si es cadena, direcciones si no -->
      <template #option="{ itemProps, opt }">
        <q-item v-bind="itemProps">
          <q-item-section>
            <q-item-label>{{ opt.nombre }}</q-item-label>
            <q-item-label caption>
              {{
                opt.esCadena
                  ? opt.totalSucursales + ' sucursales'
                  : opt.direcciones.length + ' ' + (opt.direcciones.length === 1 ? 'dirección' : 'direcciones')
              }}
            </q-item-label>
          </q-item-section>
        </q-item>
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
      v-if="mostrarComercio"
      v-model="direccionSeleccionada"
      :options="direccionesDisponibles"
      :display-value="textoVisibleDireccion"
      option-label="nombreCompleto"
      label="Dirección / Sucursal"
      outlined
      dense
      use-input
      clearable
      :disable="!tieneComercioValido"
      :hint="
        !tieneComercioValido
          ? 'Escribí al menos 1 caracter en el nombre del comercio'
          : esComercioExistente
            ? 'Opcional: ayuda a identificar la sucursal específica'
            : 'Escribí una dirección para este comercio nuevo'
      "
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="alSeleccionarDireccion"
      @input-value="alEscribirDireccion"
      @focus="alEnfocarDireccion"
      @blur="guardarDireccionEscrita"
      behavior="menu"
      :menu-props="{ maxHeight: '150px', autoClose: true }"
    >
      <template #prepend>
        <q-icon name="place" />
      </template>

      <!-- Sin resultados -->
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{
              esComercioExistente
                ? 'No hay direcciones para este comercio'
                : 'Escribí una dirección para el comercio nuevo'
            }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- Botón para agregar nuevo comercio -->
    <q-btn
      v-if="mostrarComercio"
      flat
      dense
      no-caps
      color="primary"
      icon="add_circle"
      label="Agregar comercio rápido"
      class="q-mt-xs"
      style="margin-top: -8px"
      @click="abrirDialogoNuevoComercio"
    />

    <!-- PRECIO Y MONEDA -->
    <div class="row q-col-gutter-md">
      <div class="col-8">
        <q-input
          ref="qInputPrecioRef"
          :model-value="valorPrecioTexto"
          :label="etiquetaPrecio"
          outlined
          dense
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          :error="!!errorPrecioMsg"
          :error-message="errorPrecioMsg"
          :class="{ 'shake': animarShake }"
          :rules="modo === 'comunidad' ? [requerido, precioValido] : [precioValido]"
          @update:model-value="alCambiarPrecio"
          @blur="alSalirPrecio"
          @keydown="soloNumerosDecimales"
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

    <BloqueEscalasCantidad
      ref="refBloqueEscalas"
      :model-value="datosEscalas"
      :precio-base="datosInternos.valor"
      @update:model-value="alCambiarEscalas"
    />

    <!-- DIÁLOGO: Agregar Nuevo Comercio Rápido -->
    <DialogoAgregarComercioRapido
      v-model="dialogoNuevoComercioAbierto"
      :nombre-inicial="comercioEscrito"
      :direccion-inicial="direccionEscrita"
      @comercio-creado="alCrearComercio"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'
import { usePreferenciasStore } from '../../almacenamiento/stores/preferenciasStore.js'
import { MONEDAS } from '../../almacenamiento/constantes/Monedas.js'
import DialogoAgregarComercioRapido from './Dialogos/DialogoAgregarComercioRapido.vue'
import BloqueEscalasCantidad from './BloqueEscalasCantidad.vue'
import { filtrarInputPrecio, formatearPrecioAlSalir, soloNumerosDecimales } from '../../utils/PrecioUtils.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      comercio: '',
      direccion: '',
      valor: null,
      moneda: 'UYU',
      activarPreciosMayoristas: false,
      escalasPorCantidad: [],
    }),
  },
  modo: {
    type: String,
    default: 'local',
    validator: (value) => ['local', 'comunidad'].includes(value),
  },
  mostrarComercio: {
    type: Boolean,
    default: true,
  },
  precioObligatorio: {
    type: Boolean,
    default: true,
  },
  etiquetaPrecio: {
    type: String,
    default: 'Precio',
  },
})

const emit = defineEmits(['update:modelValue'])

// Stores
const comerciosStore = useComerciStore()
const preferenciasStore = usePreferenciasStore()

// Opciones de moneda (importadas desde constantes)
const opcionesMoneda = MONEDAS

// Estado interno del formulario
const datosInternos = ref({
  comercio: props.modelValue.comercio || '',
  direccion: props.modelValue.direccion || '',
  valor: props.modelValue.valor || null,
  moneda: props.modelValue.moneda || preferenciasStore.monedaDefaultEfectiva,
})

// Estado del selector de comercios
const comercioSeleccionado = ref(null)
const comerciosFiltrados = ref([])
const comercioId = ref(null)
const comercioEscrito = ref('') // Texto que el usuario escribió
const textoTemporalComercio = ref('') // Texto mientras escribe
const comercioTieneFoco = ref(false) // Si el input tiene foco

// Estado del selector de direcciones
const direccionSeleccionada = ref(null)
const direccionId = ref(null)
const direccionEscrita = ref('') // Texto que el usuario escribió
const textoTemporalDireccion = ref('') // Texto mientras escribe
const direccionTieneFoco = ref(false) // Si el input tiene foco

// Ref del input de precio (para validación programática)
const qInputPrecioRef = ref(null)
const refBloqueEscalas = ref(null)
// Texto string del precio para preservar ceros finales (ej: "3.30")
const valorPrecioTexto = ref(formatearPrecioAlSalir(props.modelValue.valor != null ? String(props.modelValue.valor) : ''))
// Mensaje de error manual del precio (para casos que las rules no cubren, ej: valor null)
const errorPrecioMsg = ref('')
const animarShake = ref(false)
const datosEscalas = ref({
  activarPreciosMayoristas: Boolean(props.modelValue.activarPreciosMayoristas),
  escalasPorCantidad: Array.isArray(props.modelValue.escalasPorCantidad)
    ? props.modelValue.escalasPorCantidad
    : [],
})
const sincronizandoDesdePadre = ref(false)
const actualizacionInternaPendiente = ref(false)

// Estado del diálogo de nuevo comercio
const dialogoNuevoComercioAbierto = ref(false)

// Flag para detectar si es comercio nuevo
const esComercioNuevo = ref(false)

// ========================================
// COMPUTED PROPERTIES
// ========================================

/**
 * Verificar si el comercio seleccionado es un objeto existente
 */
const esComercioExistente = computed(() => {
  return comercioSeleccionado.value !== null && typeof comercioSeleccionado.value === 'object'
})

/**
 * Verificar si hay un comercio válido
 */
const tieneComercioValido = computed(() => {
  if (esComercioExistente.value) return true
  if (comercioEscrito.value.length >= 1) return true
  if (textoTemporalComercio.value.length >= 1) return true
  return false
})

/**
 * Direcciones disponibles según comercio seleccionado
 */
const direccionesDisponibles = computed(() => {
  if (!esComercioExistente.value) return []
  return comercioSeleccionado.value.direcciones || []
})

/**
 * Texto visible en el selector de comercio
 */
const textoVisibleComercio = computed(() => {
  // Si está escribiendo (tiene foco), dejar que q-select maneje el display
  if (comercioTieneFoco.value) {
    return undefined // No interferir con el input del q-select
  }

  // Si hay comercio seleccionado (objeto)
  if (esComercioExistente.value) {
    return comercioSeleccionado.value.nombre
  }

  // Si hay texto guardado (escrito anteriormente)
  if (comercioEscrito.value) {
    return comercioEscrito.value
  }

  return ''
})

/**
 * Texto visible en el selector de dirección
 */
const textoVisibleDireccion = computed(() => {
  // Si está escribiendo (tiene foco), dejar que q-select maneje el display
  if (direccionTieneFoco.value) {
    return undefined // No interferir con el input del q-select
  }

  // Si hay dirección seleccionada (objeto)
  if (typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null) {
    return direccionSeleccionada.value.nombreCompleto || direccionSeleccionada.value.calle
  }

  // Si hay texto guardado
  if (direccionEscrita.value) {
    return direccionEscrita.value
  }

  return ''
})

// ========================================
// LIFECYCLE
// ========================================

onMounted(async () => {
  await comerciosStore.cargarComercios()
})

// ========================================
// FUNCIONES
// ========================================

/**
 * Resuelve el comercioId del branch al que pertenece una dirección.
 * Necesario cuando el comercio seleccionado es un grupo (cadena) con varios branches.
 * @param {Object} comercioOGrupo - Objeto comercio individual o grupo agrupado
 * @param {string} idDireccion - ID de la dirección seleccionada
 * @returns {string} ID del branch dueño de la dirección, o ID del grupo como fallback
 */
function resolverComercioId(comercioOGrupo, idDireccion) {
  if (!comercioOGrupo.comerciosOriginales) return comercioOGrupo.id
  const sucursal = comercioOGrupo.comerciosOriginales.find((c) =>
    c.direcciones.some((d) => d.id === idDireccion),
  )
  return sucursal ? sucursal.id : comercioOGrupo.id
}

/**
 * Filtrar comercios mientras el usuario escribe
 */
function filtrarComercios(val, update) {
  update(() => {
    if (val === '') {
      // Solo top 3 más recientes para no abrumar al usuario
      comerciosFiltrados.value = comerciosStore.comerciosAgrupados.slice(0, 3)
    } else {
      const needle = val.toLowerCase()
      comerciosFiltrados.value = comerciosStore.comerciosAgrupados.filter(
        (c) => c.nombre.toLowerCase().indexOf(needle) > -1,
      )
    }
  })
}

/**
 * Cuando el input de comercio recibe foco
 */
function alEnfocarComercio() {
  comercioTieneFoco.value = true
}

/**
 * Capturar lo que el usuario escribe en el selector de comercio (mientras escribe)
 */
function alEscribirComercio(val) {
  textoTemporalComercio.value = val || ''
  if (!comercioSeleccionado.value) {
    comercioEscrito.value = textoTemporalComercio.value
    emitirCambios()
  }
}

/**
 * Guardar el texto cuando el usuario sale del input de comercio
 */
function guardarComercioEscrito() {
  comercioTieneFoco.value = false
  if (textoTemporalComercio.value && !comercioSeleccionado.value) {
    comercioEscrito.value = textoTemporalComercio.value
    console.log('💾 Comercio guardado:', comercioEscrito.value)
  }
}

/**
 * Cuando el input de dirección recibe foco
 */
function alEnfocarDireccion() {
  direccionTieneFoco.value = true
}

/**
 * Capturar lo que el usuario escribe en el selector de dirección (mientras escribe)
 */
function alEscribirDireccion(val) {
  textoTemporalDireccion.value = val || ''
}

/**
 * Guardar el texto cuando el usuario sale del input de dirección
 */
function guardarDireccionEscrita() {
  direccionTieneFoco.value = false
  if (textoTemporalDireccion.value && !direccionSeleccionada.value) {
    direccionEscrita.value = textoTemporalDireccion.value
    console.log('💾 Dirección guardada:', direccionEscrita.value)
  }
}

/**
 * Al seleccionar un comercio del dropdown
 */
function alSeleccionarComercio(comercio) {
  if (!comercio) {
    // Usuario borró la selección
    comercioId.value = null
    comercioSeleccionado.value = null
    direccionSeleccionada.value = null
    direccionId.value = null
    esComercioNuevo.value = false
    comercioEscrito.value = ''
    textoTemporalComercio.value = ''
    emitirCambios()
    return
  }

  comercioSeleccionado.value = comercio
  esComercioNuevo.value = false
  comercioEscrito.value = ''
  textoTemporalComercio.value = ''

  // Auto-seleccionar la dirección principal (ya ordenada por uso reciente en el getter)
  if (comercio.direcciones && comercio.direcciones.length > 0) {
    const direccionAuto = comercio.direccionPrincipal || comercio.direcciones[0]
    direccionSeleccionada.value = direccionAuto
    direccionId.value = direccionAuto.id
    // Resolver el branch dueño de esta dirección para guardar el comercioId correcto
    comercioId.value = resolverComercioId(comercio, direccionAuto.id)
  } else {
    direccionSeleccionada.value = null
    direccionId.value = null
    comercioId.value = comercio.id
  }

  emitirCambios()
}

/**
 * Al seleccionar una dirección del dropdown
 */
function alSeleccionarDireccion(direccion) {
  if (!direccion) {
    // Usuario borró la selección
    direccionId.value = null
    direccionSeleccionada.value = null
    direccionEscrita.value = ''
    textoTemporalDireccion.value = ''
    emitirCambios()
    return
  }

  direccionId.value = direccion.id
  direccionSeleccionada.value = direccion
  direccionEscrita.value = ''
  textoTemporalDireccion.value = ''

  // Actualizar comercioId al branch dueño de esta dirección (por si es una cadena)
  if (esComercioExistente.value) {
    comercioId.value = resolverComercioId(comercioSeleccionado.value, direccion.id)
  }

  emitirCambios()
}

/**
 * Abrir diálogo de nuevo comercio con datos pre-llenados
 */
function abrirDialogoNuevoComercio() {
  console.log('🔍 Nombre:', comercioEscrito.value)
  console.log('🔍 Dirección:', direccionEscrita.value)
  dialogoNuevoComercioAbierto.value = true
}

/**
 * Al crear un comercio desde el diálogo
 */
function alCrearComercio(comercioCreado) {
  // Auto-seleccionar el comercio recién creado
  comercioSeleccionado.value = comercioCreado
  comercioId.value = comercioCreado.id

  // Limpiar textos escritos
  comercioEscrito.value = ''
  textoTemporalComercio.value = ''
  direccionEscrita.value = ''
  textoTemporalDireccion.value = ''

  // Auto-seleccionar la primera dirección (si se agregó)
  if (comercioCreado.direcciones && comercioCreado.direcciones.length > 0) {
    direccionSeleccionada.value = comercioCreado.direcciones[0]
    direccionId.value = comercioCreado.direcciones[0].id
  }

  esComercioNuevo.value = true

  // Emitir cambios
  emitirCambios()
}

// Al cambiar moneda local del registro actual.
function alCambiarMoneda() {
  emitirCambios()
}

// Sincronizar con props externos
watch(
  () => props.modelValue,
  (nuevoValor) => {
    if (actualizacionInternaPendiente.value) {
      actualizacionInternaPendiente.value = false
      return
    }

    sincronizandoDesdePadre.value = true
    datosInternos.value = {
      comercio: nuevoValor.comercio || '',
      direccion: nuevoValor.direccion || '',
      valor: nuevoValor.valor || null,
      moneda: nuevoValor.moneda || preferenciasStore.monedaDefaultEfectiva,
    }
    datosEscalas.value = {
      activarPreciosMayoristas: Boolean(nuevoValor.activarPreciosMayoristas),
      escalasPorCantidad: Array.isArray(nuevoValor.escalasPorCantidad)
        ? nuevoValor.escalasPorCantidad
        : [],
    }
    valorPrecioTexto.value = formatearPrecioAlSalir(nuevoValor.valor != null ? String(nuevoValor.valor) : '')
    sincronizandoDesdePadre.value = false
  },
  { deep: true },
)

function alCambiarEscalas(valor) {
  datosEscalas.value = {
    activarPreciosMayoristas: Boolean(valor?.activarPreciosMayoristas),
    escalasPorCantidad: Array.isArray(valor?.escalasPorCantidad) ? valor.escalasPorCantidad : [],
  }
  if (sincronizandoDesdePadre.value) return
  emitirCambios()
}

// Emitir cambios al padre
function emitirCambios() {
  if (sincronizandoDesdePadre.value) return

  const nombreComercio = esComercioExistente.value
    ? comercioSeleccionado.value.nombre
    : comercioEscrito.value

  const nombreDireccion =
    typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null
      ? direccionSeleccionada.value.calle
      : direccionEscrita.value

  const nombreCompleto =
    typeof direccionSeleccionada.value === 'object' && direccionSeleccionada.value !== null
      ? direccionSeleccionada.value.nombreCompleto
      : ''

  actualizacionInternaPendiente.value = true
  emit('update:modelValue', {
    ...datosInternos.value,
    comercioId: comercioId.value,
    direccionId: direccionId.value,
    comercio: nombreComercio,
    direccion: nombreDireccion,
    nombreCompleto: nombreCompleto,
    activarPreciosMayoristas: Boolean(datosEscalas.value.activarPreciosMayoristas),
    escalasPorCantidad: Array.isArray(datosEscalas.value.escalasPorCantidad)
      ? datosEscalas.value.escalasPorCantidad
      : [],
  })
}

// Desplaza el input de precio a la vista, lo enfoca y aplica animación
function enfocarYNavegar() {
  const el = qInputPrecioRef.value?.$el
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  qInputPrecioRef.value?.focus()

  animarShake.value = false
  setTimeout(() => {
    animarShake.value = true
    setTimeout(() => {
      animarShake.value = false
    }, 500)
  }, 10)
}

// Al cambiar el precio: filtrar letras, actualizar valor numérico y emitir
function alCambiarPrecio(val) {
  valorPrecioTexto.value = filtrarInputPrecio(val)
  const floatVal = parseFloat(valorPrecioTexto.value)
  datosInternos.value.valor = isNaN(floatVal) ? null : floatVal
  errorPrecioMsg.value = ''
  emitirCambios()
}

// Al salir del campo: formatear a 2 decimales si corresponde (ej: "3.3" → "3.30")
function alSalirPrecio() {
  valorPrecioTexto.value = formatearPrecioAlSalir(valorPrecioTexto.value)
}

/**
 * Valida el precio programáticamente (llamado desde el padre al intentar guardar).
 * Muestra error en rojo y enfoca el campo si el precio es inválido.
 * @returns {boolean} true si el precio es válido
 */
function validarPrecio() {
  if (!props.precioObligatorio && (!valorPrecioTexto.value || valorPrecioTexto.value.trim() === '')) {
    return refBloqueEscalas.value?.validarEscalas() ?? true
  }

  const val = valorPrecioTexto.value
  errorPrecioMsg.value = ''

  // Precio vacío/nulo → error manual (las rules no lo capturan en modo local)
  if (!val || val.trim() === '') {
    errorPrecioMsg.value = 'Ingresá el precio del producto'
    enfocarYNavegar()
    return false
  }

  // Precio 0 o negativo → dejar que las rules de Quasar muestren el error
  const resultado = qInputPrecioRef.value?.validate()
  if (!resultado) {
    enfocarYNavegar()
    return false
  }

  if (!refBloqueEscalas.value?.validarEscalas()) {
    enfocarYNavegar()
    return false
  }

  return true
}

defineExpose({ validarPrecio })

// Reglas de validación
function requerido(val) {
  return (val && val.length > 0) || 'Este campo es requerido'
}

function precioValido(val) {
  if (val === null || val === undefined || val === '') return true
  return parseFloat(val) >= 1 || 'El precio debe ser al menos de 1'
}
</script>

<style scoped>
.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.formulario-precio {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
