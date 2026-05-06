<template>
  <q-input
    ref="inputReutilizableRef"
    class="input-formulario-reutilizable"
    :class="{
      'input-enfocado': inputEnfocado,
      'input-saliendo': animacionSalidaActiva,
    }"
    :style="estiloDesplazamiento"
    :model-value="modelValue"
    :label="label"
    :type="type"
    :autocomplete="autocomplete"
    :placeholder="placeholderEfectivo"
    :disable="disable"
    :readonly="readonly"
    :filled="filled"
    :outlined="outlined"
    :dense="dense"
    v-bind="atributosEntrada"
    @focus="alEnfocarInput"
    @blur="alQuitarFocoInput"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </q-input>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useAttrs } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  autocomplete: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  filled: {
    type: Boolean,
    default: true,
  },
  outlined: {
    type: Boolean,
    default: false,
  },
  dense: {
    type: Boolean,
    default: true,
  },
  colorFoco: {
    type: String,
    default: 'var(--color-primario)',
  },
  desactivarAutoAjusteTeclado: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
const atributosEntrada = useAttrs()

const inputReutilizableRef = ref(null)
const desplazamientoVertical = ref(0)
const inputEnfocado = ref(false)
const animacionSalidaActiva = ref(false)
let temporizadorSalida = null

const estiloDesplazamiento = computed(() => ({
  transform: `translateY(-${desplazamientoVertical.value}px)`,
  '--color-foco-input': props.colorFoco,
}))

const placeholderEfectivo = computed(() => {
  if (!props.placeholder) return ''
  if (!props.label) return props.placeholder

  const valor = props.modelValue
  const tieneValor = valor !== null && valor !== undefined && String(valor).length > 0

  // Evita superposición label/placeholder cuando está en reposo.
  return inputEnfocado.value || tieneValor ? props.placeholder : ''
})

function obtenerElementoCampo() {
  return inputReutilizableRef.value?.$el?.querySelector('.q-field') || null
}

function limpiarAjusteVertical() {
  desplazamientoVertical.value = 0
}

function calcularDesplazamientoNecesario() {
  if (props.desactivarAutoAjusteTeclado) return 0
  const viewportVisual = window.visualViewport
  if (!viewportVisual) return 0
  const elementoCampo = obtenerElementoCampo()
  if (!elementoCampo) return 0

  const rectanguloCampo = elementoCampo.getBoundingClientRect()
  const limiteSuperiorTeclado = viewportVisual.offsetTop + viewportVisual.height
  const margenSeguroInferior = 20
  const excesoInferior = rectanguloCampo.bottom + margenSeguroInferior - limiteSuperiorTeclado

  if (excesoInferior <= 0) return 0

  const margenSeguroSuperior = 12
  const maximoPermitido = Math.max(rectanguloCampo.top - margenSeguroSuperior, 0)
  return Math.min(excesoInferior, maximoPermitido)
}

function ajustarInputPorTeclado() {
  if (!inputEnfocado.value || props.desactivarAutoAjusteTeclado) return
  desplazamientoVertical.value = calcularDesplazamientoNecesario()
}

function agregarEventosViewport() {
  const viewportVisual = window.visualViewport
  if (!viewportVisual) return
  viewportVisual.addEventListener('resize', ajustarInputPorTeclado)
  viewportVisual.addEventListener('scroll', ajustarInputPorTeclado)
}

function quitarEventosViewport() {
  const viewportVisual = window.visualViewport
  if (!viewportVisual) return
  viewportVisual.removeEventListener('resize', ajustarInputPorTeclado)
  viewportVisual.removeEventListener('scroll', ajustarInputPorTeclado)
}

function alEnfocarInput() {
  if (props.desactivarAutoAjusteTeclado) return
  if (temporizadorSalida) {
    clearTimeout(temporizadorSalida)
    temporizadorSalida = null
  }
  animacionSalidaActiva.value = false
  inputEnfocado.value = true
  agregarEventosViewport()
  nextTick(() => {
    setTimeout(() => {
      ajustarInputPorTeclado()
    }, 80)
  })
}

function alQuitarFocoInput() {
  inputEnfocado.value = false
  animacionSalidaActiva.value = true
  if (temporizadorSalida) {
    clearTimeout(temporizadorSalida)
  }
  temporizadorSalida = setTimeout(() => {
    animacionSalidaActiva.value = false
    temporizadorSalida = null
  }, 1200)
  quitarEventosViewport()
  limpiarAjusteVertical()
}

onBeforeUnmount(() => {
  if (temporizadorSalida) {
    clearTimeout(temporizadorSalida)
    temporizadorSalida = null
  }
  quitarEventosViewport()
})
</script>

<style scoped>
.input-formulario-reutilizable {
  transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform;
}
.input-formulario-reutilizable :deep(.q-field__control) {
  background: var(--fondo-tarjeta) !important;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-primario) 28%, var(--borde-color));
  min-height: 44px;
  overflow: hidden;
  position: relative;
  background-clip: padding-box;
  padding-left: 0;
  padding-right: 0;
}
.input-formulario-reutilizable :deep(.q-field__control::before),
.input-formulario-reutilizable :deep(.q-field__control::after) {
  border: 0 !important;
}
.input-formulario-reutilizable :deep(.q-field__control::before) {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 9px;
  padding: 1px;
  opacity: 0;
  background: conic-gradient(
    from 180deg at 50% 50%,
    color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 0%, transparent) 0deg,
    color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 0%, transparent) 110deg,
    color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 94%, white 6%) 166deg,
    color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 100%, white 0%) 180deg,
    color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 94%, white 6%) 194deg,
    color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 0%, transparent) 250deg,
    color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 0%, transparent) 360deg
  );
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 44%, transparent));
  pointer-events: none;
}
.input-formulario-reutilizable :deep(.q-field__control::after) {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--color-foco-input, var(--color-primario));
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 220ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.input-formulario-reutilizable :deep(.q-field:hover .q-field__control),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__control),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__control) {
  background: var(--fondo-tarjeta) !important;
}
.input-formulario-reutilizable :deep(.q-field__control-container),
.input-formulario-reutilizable :deep(.q-field__native),
.input-formulario-reutilizable :deep(.q-field__append),
.input-formulario-reutilizable :deep(.q-field__prepend),
.input-formulario-reutilizable :deep(.q-field__marginal) {
  background: var(--fondo-tarjeta) !important;
}
.input-formulario-reutilizable :deep(.q-field:hover .q-field__control-container),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__control-container),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__control-container),
.input-formulario-reutilizable :deep(.q-field:hover .q-field__native),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__native),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__native),
.input-formulario-reutilizable :deep(.q-field:hover .q-field__append),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__append),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__append),
.input-formulario-reutilizable :deep(.q-field:hover .q-field__marginal),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__marginal),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__marginal) {
  background: var(--fondo-tarjeta) !important;
}
.input-formulario-reutilizable :deep(.q-field__native),
.input-formulario-reutilizable :deep(.q-field__label) {
  color: var(--texto-primario);
}
.input-formulario-reutilizable :deep(.q-field__native::placeholder) {
  color: color-mix(in srgb, var(--texto-secundario) 86%, transparent);
  opacity: 1;
}
.input-formulario-reutilizable :deep(.q-field__native) {
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 14px;
  padding-right: 14px;
  line-height: 1.25;
}
.input-formulario-reutilizable :deep(.q-field__label) {
  opacity: 0.8;
  left: 14px;
}
.input-formulario-reutilizable :deep(.q-field--labeled .q-field__label) {
  top: 7px;
  font-size: 12px;
}
.input-formulario-reutilizable :deep(.q-field--labeled .q-field__native) {
  padding-top: 24px !important;
  padding-bottom: 6px !important;
}
.input-formulario-reutilizable :deep(.q-field--labeled.q-field--float .q-field__native) {
  padding-top: 20px !important;
  padding-bottom: 0 !important;
  line-height: 1.3 !important;
}
.input-formulario-reutilizable :deep(.q-field--labeled.q-field--dense .q-field__native) {
  padding-top: 24px !important;
  padding-bottom: 6px !important;
}
.input-formulario-reutilizable :deep(.q-field--labeled.q-field--dense.q-field--float .q-field__native) {
  padding-top: 20px !important;
  padding-bottom: 0 !important;
  line-height: 1.3 !important;
}
.input-formulario-reutilizable :deep(.q-field--stacked .q-field__native),
.input-formulario-reutilizable :deep(.q-field--stacked.q-field--dense .q-field__native) {
  padding-top: 20px !important;
  padding-bottom: 0 !important;
  line-height: 1.3 !important;
}
.input-formulario-reutilizable :deep(input.q-field__native) {
  line-height: 1.3 !important;
}
.input-formulario-reutilizable :deep(.q-field__append) {
  padding-left: 6px;
  padding-right: 6px;
}
.input-formulario-reutilizable.input-enfocado :deep(.q-field__control),
.input-formulario-reutilizable.input-saliendo :deep(.q-field__control),
.input-formulario-reutilizable.q-field--focused :deep(.q-field__control) {
  border-color: var(--color-foco-input, var(--color-primario));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 55%, transparent),
    0 0 14px color-mix(in srgb, var(--color-foco-input, var(--color-primario)) 26%, transparent);
}
.input-formulario-reutilizable.input-enfocado :deep(.q-field__control::before),
.input-formulario-reutilizable.input-saliendo :deep(.q-field__control::before),
.input-formulario-reutilizable.q-field--focused :deep(.q-field__control::before) {
  opacity: 1;
  animation: recorridoLuzBorde 2500ms cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
}
.input-formulario-reutilizable.input-saliendo :deep(.q-field__control::before) {
  animation: recorridoLuzBordeReversa 1150ms cubic-bezier(0.22, 0.61, 0.36, 1) 1 forwards;
}
.input-formulario-reutilizable.input-enfocado :deep(.q-field__control::after),
.input-formulario-reutilizable.input-saliendo :deep(.q-field__control::after),
.input-formulario-reutilizable.q-field--focused :deep(.q-field__control::after) {
  transform: scaleX(1);
  transition-duration: 180ms;
}
.input-formulario-reutilizable.input-saliendo :deep(.q-field__control::after) {
  transform: scaleX(0);
  transition-duration: 300ms;
}
.input-formulario-reutilizable :deep(.q-btn.q-btn--round) {
  background: color-mix(in srgb, var(--color-primario) 14%, transparent);
  color: var(--texto-primario);
  border: 1px solid color-mix(in srgb, var(--color-primario) 34%, var(--borde-color));
}
.input-formulario-reutilizable :deep(.q-field__append .q-btn) {
  margin: 0;
}
.input-formulario-reutilizable :deep(.q-btn.q-btn--round .q-icon) {
  font-size: 18px;
}
.input-formulario-reutilizable :deep(.q-focus-helper) {
  display: none;
}
.input-formulario-reutilizable :deep(input:-webkit-autofill),
.input-formulario-reutilizable :deep(input:-webkit-autofill:hover),
.input-formulario-reutilizable :deep(input:-webkit-autofill:focus) {
  -webkit-text-fill-color: var(--texto-primario);
  -webkit-box-shadow: 0 0 0 1000px var(--fondo-tarjeta) inset;
  transition: background-color 9999s ease-out 0s;
}
@keyframes recorridoLuzBorde {
  0% {
    transform: rotate(0deg);
    opacity: 0.38;
  }
  18% {
    transform: rotate(35deg);
    opacity: 0.95;
  }
  55% {
    transform: rotate(210deg);
    opacity: 0.95;
  }
  100% {
    transform: rotate(360deg);
    opacity: 0.38;
  }
}
@keyframes recorridoLuzBordeReversa {
  0% {
    transform: rotate(360deg);
    opacity: 0.92;
  }
  100% {
    transform: rotate(0deg);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .input-formulario-reutilizable.input-enfocado :deep(.q-field__control::before),
  .input-formulario-reutilizable.input-saliendo :deep(.q-field__control::before),
  .input-formulario-reutilizable.q-field--focused :deep(.q-field__control::before) {
    animation: none;
    opacity: 0.75;
  }
}
</style>
