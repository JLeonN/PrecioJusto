<template>
  <div class="bloque-escalas">
    <div class="encabezado-bloque-escalas">
      <div
        class="titulo-bloque-escalas"
        :class="{ 'titulo-bloque-escalas-compacto': confirmacionDesactivarActiva }"
      >
        Activar precios mayoristas
      </div>
      <transition name="fadeControl" mode="out-in">
        <div
          v-if="confirmacionDesactivarActiva"
          key="confirmacionInline"
          class="confirmacionInline"
        >
          <q-btn
            flat
            dense
            no-caps
            color="negative"
            icon="delete"
            class="botonConfirmacionInline"
            label="Confirmar"
            @click="confirmarDesactivar"
          />
          <q-btn
            flat
            dense
            size="sm"
            color="grey-8"
            icon="close"
            class="botonCancelarInline"
            aria-label="Cancelar desactivación"
            @click="cancelarDesactivar"
          />
        </div>
        <q-toggle
          v-else
          key="switchMayorista"
          :model-value="estadoLocal.activarPreciosMayoristas"
          color="primary"
          @update:model-value="alCambiarSwitch"
        />
      </transition>
    </div>
    <div v-if="estadoLocal.activarPreciosMayoristas" class="text-caption text-grey-7 q-mt-xs">
      Agrega escalones de precio para compras por cantidad.
    </div>
    <q-slide-transition>
      <div v-show="estadoLocal.activarPreciosMayoristas" class="q-mt-sm">
        <div
          v-for="(escala, indice) in estadoLocal.escalasPorCantidad"
          :key="`escala_${indice}`"
          class="fila-escala row q-col-gutter-sm q-mb-sm"
        >
          <div class="col-4">
            <q-input
              class="inputCantidadEscala"
              :model-value="escala.cantidadMinima"
              label="Desde"
              type="number"
              min="2"
              outlined
              dense
              @update:model-value="(valor) => alCambiarCantidad(indice, valor)"
            >
              <template #append>
                <div class="controlInput">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="keyboard_arrow_up"
                    class="botonControlInput"
                    @click.stop="incrementarCantidad(indice)"
                  />
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="keyboard_arrow_down"
                    class="botonControlInput"
                    @click.stop="decrementarCantidad(indice)"
                  />
                </div>
              </template>
            </q-input>
          </div>
          <div class="col-5">
            <q-input
              class="inputPrecioEscala"
              :model-value="escala.precioUnitario"
              label="Precio"
              type="number"
              min="0"
              step="0.01"
              outlined
              dense
              @update:model-value="(valor) => alCambiarPrecio(indice, valor)"
            >
              <template #append>
                <div class="controlInput">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="keyboard_arrow_up"
                    class="botonControlInput"
                    @click.stop="incrementarPrecio(indice)"
                  />
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="keyboard_arrow_down"
                    class="botonControlInput"
                    @click.stop="decrementarPrecio(indice)"
                  />
                </div>
              </template>
            </q-input>
          </div>
          <div class="col-3 columna-acciones">
            <q-btn
              flat
              dense
              round
              color="negative"
              icon="delete"
              @click="eliminarEscala(indice)"
            />
          </div>
        </div>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="add_circle"
          label="Agregar escalón"
          class="full-width q-mt-xs boton-agregar-masivo"
          @click="agregarEscala"
        />
        <q-banner
          v-if="mostrarErroresEscalas"
          dense
          inline-actions
          class="q-mt-sm bg-orange-1 text-orange-10"
        >
          {{ erroresEscalas[0] }}
        </q-banner>
      </div>
    </q-slide-transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      activarPreciosMayoristas: false,
      escalasPorCantidad: [],
    }),
  },
  precioBase: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const estadoLocal = ref(crearEstado(props.modelValue))
const confirmacionDesactivarActiva = ref(false)
const huboEdicion = ref(false)
const forzarMostrarErrores = ref(false)
const habiaEscalasPersistidas = ref(tieneEscalasPersistidas(props.modelValue))

watch(
  () => props.modelValue,
  (valor) => {
    estadoLocal.value = crearEstado(valor)
    habiaEscalasPersistidas.value = tieneEscalasPersistidas(valor)
    huboEdicion.value = false
    forzarMostrarErrores.value = false
    if (!estadoLocal.value.activarPreciosMayoristas) {
      confirmacionDesactivarActiva.value = false
    }
  },
  { deep: true },
)

const erroresEscalas = computed(() => obtenerErroresEscalas(estadoLocal.value.escalasPorCantidad))
const mostrarErroresEscalas = computed(
  () =>
    estadoLocal.value.activarPreciosMayoristas &&
    erroresEscalas.value.length > 0 &&
    (huboEdicion.value || forzarMostrarErrores.value),
)

function crearEstado(valor) {
  const activarPreciosMayoristas = Boolean(valor?.activarPreciosMayoristas)
  const escalasPorCantidad = Array.isArray(valor?.escalasPorCantidad)
    ? valor.escalasPorCantidad.map((escala) => ({
        cantidadMinima: Number(escala?.cantidadMinima) || 3,
        precioUnitario: escala?.precioUnitario ?? null,
        estadoEscala: escala?.estadoEscala || 'neutral',
      }))
    : []

  const estado = { activarPreciosMayoristas, escalasPorCantidad }
  recalcularEstados(estado)
  return estado
}

function emitirCambios() {
  emit('update:modelValue', {
    activarPreciosMayoristas: estadoLocal.value.activarPreciosMayoristas,
    escalasPorCantidad: estadoLocal.value.escalasPorCantidad.map((escala) => ({
      cantidadMinima: escala.cantidadMinima,
      precioUnitario: escala.precioUnitario,
      estadoEscala: escala.estadoEscala,
    })),
  })
}

function tieneEscalasPersistidas(valor) {
  const escalas = Array.isArray(valor?.escalasPorCantidad) ? valor.escalasPorCantidad : []
  if (!valor?.activarPreciosMayoristas || escalas.length === 0) return false
  return escalas.some((escala) => {
    const cantidad = Number(escala?.cantidadMinima)
    const precio = Number(escala?.precioUnitario)
    return Number.isFinite(cantidad) && cantidad >= 2 && Number.isFinite(precio) && precio > 0
  })
}

function alCambiarSwitch(valor) {
  if (valor) {
    estadoLocal.value.activarPreciosMayoristas = true
    if (estadoLocal.value.escalasPorCantidad.length === 0) {
      estadoLocal.value.escalasPorCantidad.push({
        cantidadMinima: 3,
        precioUnitario: null,
        estadoEscala: 'neutral',
      })
    }
    confirmacionDesactivarActiva.value = false
    emitirCambios()
    return
  }

  const tieneCambios = huboEdicion.value || habiaEscalasPersistidas.value
  if (!tieneCambios) {
    desactivarSinConfirmacion()
    return
  }

  confirmacionDesactivarActiva.value = true
}

function desactivarSinConfirmacion() {
  estadoLocal.value.activarPreciosMayoristas = false
  estadoLocal.value.escalasPorCantidad = []
  huboEdicion.value = false
  forzarMostrarErrores.value = false
  confirmacionDesactivarActiva.value = false
  emitirCambios()
}

function confirmarDesactivar() {
  desactivarSinConfirmacion()
}

function cancelarDesactivar() {
  confirmacionDesactivarActiva.value = false
}

function agregarEscala() {
  const ultima = estadoLocal.value.escalasPorCantidad.at(-1)
  const siguienteCantidad = ultima?.cantidadMinima ? ultima.cantidadMinima * 2 : 3
  estadoLocal.value.escalasPorCantidad.push({
    cantidadMinima: siguienteCantidad,
    precioUnitario: null,
    estadoEscala: 'neutral',
  })
  huboEdicion.value = true
  recalcularEstados(estadoLocal.value)
  emitirCambios()
}

function eliminarEscala(indice) {
  estadoLocal.value.escalasPorCantidad.splice(indice, 1)
  huboEdicion.value = true
  recalcularEstados(estadoLocal.value)
  emitirCambios()
}

function alCambiarCantidad(indice, valor) {
  estadoLocal.value.escalasPorCantidad[indice].cantidadMinima = normalizarCantidadMinima(valor)
  huboEdicion.value = true
  recalcularEstados(estadoLocal.value)
  emitirCambios()
}

function incrementarCantidad(indice) {
  const actual = normalizarCantidadMinima(estadoLocal.value.escalasPorCantidad[indice]?.cantidadMinima)
  alCambiarCantidad(indice, actual + 1)
}

function decrementarCantidad(indice) {
  const actual = normalizarCantidadMinima(estadoLocal.value.escalasPorCantidad[indice]?.cantidadMinima)
  alCambiarCantidad(indice, Math.max(2, actual - 1))
}

function normalizarCantidadMinima(valor) {
  const cantidadMinima = Math.trunc(Number(valor))
  if (!Number.isFinite(cantidadMinima) || cantidadMinima < 2) return 3
  return cantidadMinima
}

function alCambiarPrecio(indice, valor) {
  const numero = Number(valor)
  estadoLocal.value.escalasPorCantidad[indice].precioUnitario = Number.isFinite(numero)
    ? numero
    : null
  huboEdicion.value = true
  recalcularEstados(estadoLocal.value)
  emitirCambios()
}

function incrementarPrecio(indice) {
  const actual = Number(estadoLocal.value.escalasPorCantidad[indice]?.precioUnitario)
  const base = Number.isFinite(actual) ? actual : 0
  alCambiarPrecio(indice, (base + 1).toFixed(2))
}

function decrementarPrecio(indice) {
  const actual = Number(estadoLocal.value.escalasPorCantidad[indice]?.precioUnitario)
  const base = Number.isFinite(actual) ? actual : 0
  alCambiarPrecio(indice, Math.max(0, base - 1).toFixed(2))
}

function recalcularEstados(estado) {
  const base = Number(props.precioBase)
  const precioBase = Number.isFinite(base) ? base : null

  estado.escalasPorCantidad.sort((a, b) => a.cantidadMinima - b.cantidadMinima)

  let precioAnterior = null
  estado.escalasPorCantidad.forEach((escala) => {
    escala.estadoEscala = clasificarEscala(precioBase, escala.precioUnitario, precioAnterior)
    if (Number.isFinite(Number(escala.precioUnitario))) {
      precioAnterior = Number(escala.precioUnitario)
    }
  })
}

function clasificarEscala(precioBase, precioUnitario, precioAnterior) {
  const precio = Number(precioUnitario)
  if (!Number.isFinite(precio) || precio <= 0) return 'sospechosa'
  if (precioBase !== null && precio > precioBase) return 'sospechosa'
  if (precioAnterior !== null && precio > precioAnterior) return 'sospechosa'
  if (precioBase !== null && precio === precioBase) return 'neutral'
  if (precioAnterior !== null && precio === precioAnterior) return 'neutral'
  return 'mejora'
}

function obtenerErroresEscalas(escalas) {
  if (!Array.isArray(escalas) || escalas.length === 0) return ['Debes agregar al menos un escalón.']

  const repetidos = new Set()
  const vistas = new Set()
  for (const escala of escalas) {
    const cantidad = Number(escala.cantidadMinima)
    const precio = Number(escala.precioUnitario)
    if (!Number.isFinite(cantidad) || cantidad < 2) {
      return ['La cantidad mínima de cada escalón debe ser 2 o mayor.']
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      return ['Cada escalón debe tener un precio válido mayor a 0.']
    }
    if (vistas.has(cantidad)) repetidos.add(cantidad)
    vistas.add(cantidad)
  }
  if (repetidos.size > 0) {
    return ['No puedes repetir cantidades mínimas en los escalones.']
  }
  return []
}

function validarEscalas() {
  if (!estadoLocal.value.activarPreciosMayoristas) return true
  forzarMostrarErrores.value = true
  return erroresEscalas.value.length === 0
}

defineExpose({ validarEscalas })
</script>

<style scoped>
.bloque-escalas {
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  padding: 10px;
  background: var(--fondo-tarjeta);
}
.encabezado-bloque-escalas {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
}
.titulo-bloque-escalas {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    font-size 0.18s ease,
    letter-spacing 0.18s ease,
    opacity 0.18s ease;
}
.titulo-bloque-escalas-compacto {
  font-size: 14px;
  letter-spacing: -0.01em;
}
.confirmacionInline {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  flex: 0 0 auto;
  min-width: 0;
  white-space: nowrap;
}
.botonConfirmacionInline {
  min-width: auto;
  padding: 0 6px;
}
.botonCancelarInline {
  min-width: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
}
.fila-escala {
  align-items: center;
}
.columna-acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.controlInput {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 6px;
  overflow: hidden;
}
.botonControlInput {
  color: var(--texto-secundario);
  min-width: 18px;
  width: 18px;
  height: 18px;
  padding: 0;
}
:deep(.inputCantidadEscala .q-field__append),
:deep(.inputPrecioEscala .q-field__append) {
  padding-left: 4px;
}
:deep(.inputCantidadEscala .q-btn),
:deep(.inputPrecioEscala .q-btn) {
  border-radius: 4px;
}
:deep(.inputCantidadEscala input[type='number']) {
  -moz-appearance: textfield;
}
:deep(.inputCantidadEscala input::-webkit-outer-spin-button),
:deep(.inputCantidadEscala input::-webkit-inner-spin-button),
:deep(.inputPrecioEscala input::-webkit-outer-spin-button),
:deep(.inputPrecioEscala input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
:deep(.inputPrecioEscala input[type='number']) {
  -moz-appearance: textfield;
}
.boton-agregar-masivo {
  border-radius: 12px;
  transition: all 0.2s ease;
  font-weight: 600;
}
.boton-agregar-masivo:hover {
  background: color-mix(in srgb, var(--color-primario) 8%, transparent) !important;
}
.fadeControl-enter-active,
.fadeControl-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fadeControl-enter-from,
.fadeControl-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
