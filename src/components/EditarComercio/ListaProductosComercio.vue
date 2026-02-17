<template>
  <div class="lista-productos-comercio">
    <!-- Sin productos -->
    <div v-if="productos.length === 0" class="sin-productos">
      <IconShoppingBag :size="32" class="text-grey-4" />
      <span class="text-grey-5">No hay productos registrados en este comercio</span>
    </div>

    <!-- Lista de productos -->
    <template v-else>
      <q-item
        v-for="producto in productosVisibles"
        :key="producto.id"
        clickable
        v-ripple
        class="item-producto"
        @click="$emit('ver-producto', producto.id)"
      >
        <q-item-section avatar>
          <q-avatar color="orange-1" text-color="orange">
            <IconShoppingBag :size="20" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ producto.nombre }}</q-item-label>
          <q-item-label caption>
            {{ producto.ultimoPrecioTexto }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-5" />
        </q-item-section>
      </q-item>

      <!-- Botón ver todos -->
      <q-btn
        v-if="productos.length > limite"
        flat
        dense
        color="orange"
        class="full-width q-mt-sm"
        @click="mostrandoTodos = !mostrandoTodos"
      >
        {{ mostrandoTodos ? 'Mostrar menos' : `Ver todos (${productos.length})` }}
      </q-btn>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconShoppingBag } from '@tabler/icons-vue'

const props = defineProps({
  productos: {
    type: Array,
    required: true,
  },
  limite: {
    type: Number,
    default: 3,
  },
})

defineEmits(['ver-producto'])

const mostrandoTodos = ref(false)

const productosVisibles = computed(() => {
  if (mostrandoTodos.value) return props.productos
  return props.productos.slice(0, props.limite)
})
</script>

<style scoped>
.lista-productos-comercio {
  display: flex;
  flex-direction: column;
}
.sin-productos {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  font-size: 13px;
}
.item-producto {
  border-radius: 8px;
  margin-bottom: 4px;
}
</style>
