<template>
  <div class="pie-atribucion">
    <!-- Estado vacío -->
    <p v-if="!tieneFuentes" class="pie-sin-info">Sin información de fuentes disponible</p>

    <template v-else>
      <!-- Sección APIs -->
      <div v-if="fuentesApi.length > 0" class="pie-seccion">
        <span class="pie-titulo">📡 Fuentes de API</span>
        <p v-for="(fuente, i) in fuentesApi" :key="i" class="pie-item">
          <span class="pie-bullet">•</span>
          <span class="pie-nombre">{{ fuente.api }}</span>
          <span class="pie-flecha">→</span>
          <span>{{ fuente.campos.join(', ') }}</span>
        </p>
      </div>

      <!-- Sección Usuario -->
      <div v-if="fuentesUsuario.length > 0" class="pie-seccion">
        <span class="pie-titulo">👤 Aportado por vos</span>
        <p v-for="(fuente, i) in fuentesUsuario" :key="i" class="pie-item">
          <span class="pie-bullet">•</span>
          <span class="pie-nombre">Tus registros</span>
          <span class="pie-flecha">→</span>
          <span>{{ fuente.campos.join(', ') }}</span>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fuentesApi: {
    type: Array,
    default: () => [],
  },
  fuentesUsuario: {
    type: Array,
    default: () => [],
  },
})

const tieneFuentes = computed(
  () => props.fuentesApi.length > 0 || props.fuentesUsuario.length > 0,
)
</script>

<style scoped>
.pie-atribucion {
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  margin-top: 16px;
}
.pie-sin-info {
  font-size: 11px;
  color: #bdbdbd;
  margin: 0;
  text-align: center;
}
.pie-seccion {
  margin-bottom: 8px;
}
.pie-seccion:last-child {
  margin-bottom: 0;
}
.pie-titulo {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #bdbdbd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
}
.pie-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 11px;
  color: #9e9e9e;
  margin: 0 0 2px 0;
  flex-wrap: wrap;
}
.pie-bullet {
  color: #bdbdbd;
  flex-shrink: 0;
}
.pie-nombre {
  font-weight: 600;
  flex-shrink: 0;
}
.pie-flecha {
  color: #bdbdbd;
  flex-shrink: 0;
}
</style>
