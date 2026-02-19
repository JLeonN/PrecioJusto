<template>
  <div class="buscador-centrado">
    <div class="buscador-inner">
      <q-input
        v-model="textoBusqueda"
        placeholder="Buscar por nombre, marca o código..."
        outlined
        dense
        clearable
        @focus="onFocus"
        @blur="onBlur"
        @keyup.enter="onBuscar"
        @clear="onLimpiar"
      >
        <template #prepend>
          <IconSearch :size="18" class="text-grey-6" />
        </template>
      </q-input>

      <!-- Dropdown de sugerencias -->
      <q-card v-if="mostrarSugerencias" class="sugerencias-dropdown" flat bordered>
        <q-list dense>
          <!-- Sin coincidencias -->
          <q-item v-if="sugerencias.length === 0">
            <q-item-section class="text-grey-6 text-caption">Sin coincidencias</q-item-section>
          </q-item>

          <!-- Sugerencias -->
          <q-item
            v-for="{ producto, tipoMatch } in sugerencias"
            :key="producto.id"
            clickable
            v-ripple
            @mousedown.prevent
            @click="onSeleccionar(producto)"
          >
            <q-item-section>
              <q-item-label>{{ producto.nombre }}</q-item-label>
              <q-item-label v-if="producto.marca" caption>{{ producto.marca }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip dense :color="colorChip(tipoMatch)" text-color="white" size="sm">
                {{ tipoMatch }}
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IconSearch } from '@tabler/icons-vue'

const props = defineProps({
  productos: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['seleccionar', 'buscar', 'limpiar'])

const textoBusqueda = ref('')
const sugerenciasAbiertas = ref(false)

// Normaliza texto: minúsculas + sin tildes
function normalizarTexto(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Calcula sugerencias para el texto actual (mínimo 3 caracteres)
const sugerencias = computed(() => {
  const texto = textoBusqueda.value?.trim() || ''
  if (texto.length < 3) return []

  const textoNorm = normalizarTexto(texto)
  const palabras = textoNorm.split(/\s+/).filter(Boolean)
  const esNumerico = /^\d+$/.test(texto)

  const resultados = []

  for (const producto of props.productos) {
    // Buscar por código de barras (solo cuando el texto es numérico)
    if (esNumerico && producto.codigoBarras?.includes(texto)) {
      resultados.push({ producto, tipoMatch: 'Código' })
      continue
    }

    // Buscar por nombre: todas las palabras deben estar presentes en cualquier orden
    const nombreNorm = normalizarTexto(producto.nombre || '')
    if (palabras.every((p) => nombreNorm.includes(p))) {
      resultados.push({ producto, tipoMatch: 'Nombre' })
      continue
    }

    // Buscar por marca: substring simple
    const marcaNorm = normalizarTexto(producto.marca || '')
    if (marcaNorm && marcaNorm.includes(textoNorm)) {
      resultados.push({ producto, tipoMatch: 'Marca' })
    }
  }

  // Ordenar por última interacción o fecha de actualización (más reciente primero)
  resultados.sort((a, b) => {
    const fechaA = a.producto.ultimaInteraccion || a.producto.fechaActualizacion || 0
    const fechaB = b.producto.ultimaInteraccion || b.producto.fechaActualizacion || 0
    return new Date(fechaB) - new Date(fechaA)
  })

  return resultados.slice(0, 3)
})

// Muestra el dropdown solo si hay foco Y >= 3 caracteres escritos
const mostrarSugerencias = computed(
  () => sugerenciasAbiertas.value && (textoBusqueda.value?.trim() || '').length >= 3,
)

// Al recuperar el foco, abrir sugerencias si ya hay texto suficiente
function onFocus() {
  if ((textoBusqueda.value?.trim() || '').length >= 3) sugerenciasAbiertas.value = true
}

// Cerrar con delay para que el click en una sugerencia se registre antes del blur
function onBlur() {
  setTimeout(() => {
    sugerenciasAbiertas.value = false
  }, 150)
}

function onBuscar() {
  const texto = textoBusqueda.value?.trim() || ''
  if (texto) {
    sugerenciasAbiertas.value = false
    emit('buscar', texto)
  }
}

function onSeleccionar(producto) {
  textoBusqueda.value = producto.nombre
  sugerenciasAbiertas.value = false
  emit('seleccionar', producto)
}

function onLimpiar() {
  textoBusqueda.value = ''
  sugerenciasAbiertas.value = false
  emit('limpiar')
}

// Abrir/cerrar sugerencias automáticamente según la longitud del texto
watch(textoBusqueda, (nuevoTexto) => {
  sugerenciasAbiertas.value = (nuevoTexto?.trim() || '').length >= 3
})

function colorChip(tipoMatch) {
  if (tipoMatch === 'Nombre') return 'primary'
  if (tipoMatch === 'Código') return 'secondary'
  return 'accent' // Marca
}
</script>

<style scoped>
.buscador-inner {
  position: relative;
}
.sugerencias-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1000;
}
</style>
