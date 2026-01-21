<template>
  <div class="formulario-precio">
    <!-- COMERCIO -->
    <q-input
      v-model="datosInternos.comercio"
      label="Comercio"
      outlined
      dense
      placeholder="Ej: TATA, DISCO, Almacén del barrio"
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="emitirCambios"
    />

    <!-- DIRECCIÓN / SUCURSAL -->
    <q-input
      v-model="datosInternos.direccion"
      label="Dirección / Sucursal"
      outlined
      dense
      placeholder="Ej: Av. Brasil 2550"
      hint="Opcional: ayuda a identificar la sucursal específica"
      :rules="modo === 'comunidad' ? [requerido] : []"
      @update:model-value="emitirCambios"
    />

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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import preferenciasService from '../../almacenamiento/servicios/PreferenciasService.js'

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

// Cargar moneda guardada al montar
onMounted(async () => {
  const preferencias = await preferenciasService.obtenerPreferencias()
  datosInternos.value.moneda = preferencias.moneda
  emitirCambios()
})

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
  emit('update:modelValue', { ...datosInternos.value })
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
