<template>
  <div class="bloque-escalas">
    <div class="row items-center justify-between q-gutter-sm">
      <div class="text-body2 text-weight-medium">Activar precios mayoristas</div>
      <q-toggle
        :model-value="estadoLocal.activarPreciosMayoristas"
        color="primary"
        @update:model-value="alCambiarSwitch"
      />
    </div>

    <div class="text-caption text-grey-7 q-mt-xs">
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
              :model-value="escala.cantidadMinima"
              label="Desde"
              type="number"
              min="2"
              outlined
              dense
              @update:model-value="(valor) => alCambiarCantidad(indice, valor)"
            />
          </div>
          <div class="col-5">
            <q-input
              :model-value="escala.precioUnitario"
              label="Precio"
              type="number"
              min="0"
              step="0.01"
              outlined
              dense
              @update:model-value="(valor) => alCambiarPrecio(indice, valor)"
            />
          </div>
          <div class="col-3 columna-acciones">
            <q-chip
              dense
              :color="colorEstadoEscala(escala.estadoEscala)"
              text-color="white"
              class="chip-estado"
            >
              {{ etiquetaEstadoEscala(escala.estadoEscala) }}
            </q-chip>
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
          label="+ Agregar escalón"
          @click="agregarEscala"
        />

        <q-banner
          v-if="erroresEscalas.length > 0"
          dense
          inline-actions
          class="q-mt-sm bg-orange-1 text-orange-10"
        >
          {{ erroresEscalas[0] }}
        </q-banner>
      </div>
    </q-slide-transition>

    <q-slide-transition>
      <div v-show="confirmacionDesactivarActiva" class="confirmacion-desactivar q-mt-sm">
        <q-btn
          unelevated
          no-caps
          color="negative"
          label="Confirmar borrado"
          @click="confirmarDesactivar"
        />
        <q-btn
          flat
          no-caps
          color="grey-8"
          icon="close"
          aria-label="Cancelar desactivación"
          @click="cancelarDesactivar"
        />
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

watch(
  () => props.modelValue,
  (valor) => {
    estadoLocal.value = crearEstado(valor)
    if (!estadoLocal.value.activarPreciosMayoristas) {
      confirmacionDesactivarActiva.value = false
    }
  },
  { deep: true },
)

const erroresEscalas = computed(() => obtenerErroresEscalas(estadoLocal.value.escalasPorCantidad))

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

  const tieneCambios = huboEdicion.value || estadoLocal.value.escalasPorCantidad.length > 0
  if (!tieneCambios) {
    estadoLocal.value.activarPreciosMayoristas = false
    emitirCambios()
    return
  }

  confirmacionDesactivarActiva.value = true
}

function confirmarDesactivar() {
  estadoLocal.value.activarPreciosMayoristas = false
  estadoLocal.value.escalasPorCantidad = []
  huboEdicion.value = false
  confirmacionDesactivarActiva.value = false
  emitirCambios()
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
  const cantidadMinima = Math.trunc(Number(valor))
  estadoLocal.value.escalasPorCantidad[indice].cantidadMinima = Number.isFinite(cantidadMinima)
    ? cantidadMinima
    : 3
  huboEdicion.value = true
  recalcularEstados(estadoLocal.value)
  emitirCambios()
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

function colorEstadoEscala(estadoEscala) {
  if (estadoEscala === 'mejora') return 'positive'
  if (estadoEscala === 'sospechosa') return 'negative'
  return 'grey-7'
}

function etiquetaEstadoEscala(estadoEscala) {
  if (estadoEscala === 'mejora') return 'Mejora'
  if (estadoEscala === 'sospechosa') return 'Sospechosa'
  return 'Neutral'
}

function validarEscalas() {
  if (!estadoLocal.value.activarPreciosMayoristas) return true
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
.fila-escala {
  align-items: center;
}
.columna-acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.chip-estado {
  margin-right: 2px;
}
.confirmacion-desactivar {
  border: 1px solid var(--color-error-borde);
  border-radius: 8px;
  background: var(--color-error-fondo-suave);
  padding: 6px;
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
}
</style>
