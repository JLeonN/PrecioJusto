<template>
  <q-card class="tarjeta-producto" clickable @click="toggleExpandir">
    <q-card-section class="tarjeta-contenido" :class="clasesResponsivas">
      <!-- IMAGEN DEL PRODUCTO -->
      <div class="tarjeta-imagen">
        <q-img v-if="producto.imagen" :src="producto.imagen" :ratio="1" class="rounded-borders" />
        <div v-else class="placeholder-imagen">
          <IconShoppingBag :size="32" class="text-grey-5" />
        </div>
      </div>

      <!-- INFORMACIÓN DEL PRODUCTO -->
      <div class="tarjeta-info">
        <!-- Nombre -->
        <div class="text-subtitle1 text-weight-bold ellipsis-2-lines">
          {{ producto.nombre }}
        </div>

        <!-- Precio y comercio -->
        <div class="tarjeta-precio-comercio">
          <div>
            <div class="text-h5 text-weight-bold text-primary">${{ producto.precioMejor }}</div>
            <div class="text-caption text-grey-7 row items-center q-gutter-xs no-wrap">
              <IconMapPin :size="16" />
              <span class="ellipsis">{{ producto.comercioMejor }}</span>
            </div>
          </div>
        </div>

        <!-- Botón agregar precio (ahora fuera del contenedor) -->
        <div class="contenedor-boton-agregar">
          <q-btn
            :round="!expandida"
            dense
            color="primary"
            size="sm"
            class="boton-agregar-precio"
            :class="{ 'boton-expandido': expandida }"
            @click.stop="$emit('agregar-precio')"
          >
            <IconPlus :size="18" />
            <transition name="fade-texto">
              <span v-if="expandida" class="q-ml-xs">Agregar precio</span>
            </transition>
          </q-btn>
        </div>
      </div>

      <!-- Ícono para indicar expandir/colapsar -->
      <div class="tarjeta-icono-mas">
        <IconChevronDown v-if="!expandida" :size="20" class="text-grey-5" />
        <IconChevronUp v-else :size="20" class="text-grey-5" />
      </div>
    </q-card-section>

    <!-- INFORMACIÓN EXPANDIDA -->
    <q-slide-transition>
      <div v-show="expandida">
        <q-separator />
        <q-card-section>
          <!-- TOP 3 precios más bajos -->
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Top 3 mejores precios</div>

          <q-list separator>
            <q-item v-for="(precio, index) in top3Precios" :key="index" class="q-px-none">
              <q-item-section avatar>
                <q-avatar
                  :color="precio.esMejor ? 'positive' : 'grey-4'"
                  text-color="white"
                  size="32px"
                >
                  {{ index + 1 }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ precio.comercio }}</q-item-label>
                <q-item-label caption>{{ precio.fecha }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div
                  class="text-subtitle1 text-weight-bold"
                  :class="precio.esMejor ? 'text-positive' : ''"
                >
                  ${{ precio.valor }}
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Botón ver historial -->
          <q-btn
            flat
            color="primary"
            label="Ver historial completo"
            class="full-width q-mt-md"
            :to="`/producto/${producto.id}`"
            @click="console.log('ID del producto:', producto.id)"
          >
            <IconChartLine :size="18" class="q-mr-xs" />
          </q-btn>
        </q-card-section>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import {
  IconMapPin,
  IconShoppingBag,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconChartLine,
} from '@tabler/icons-vue'

const $q = useQuasar()

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
})

defineEmits(['agregar-precio', 'ver-detalle'])

const expandida = ref(false)

const toggleExpandir = () => {
  expandida.value = !expandida.value
}

// Obtener top 3 precios más bajos
const top3Precios = computed(() => {
  const preciosOrdenados = [...props.producto.precios].sort((a, b) => a.valor - b.valor).slice(0, 3)
  return preciosOrdenados
})

// Clases responsivas según tamaño de pantalla
const clasesResponsivas = computed(() => {
  return {
    'tarjeta-horizontal': $q.screen.gt.xs,
    'tarjeta-vertical': $q.screen.xs,
  }
})
</script>

<style scoped>
.tarjeta-producto {
  border-left: 4px solid var(--color-primario);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.tarjeta-producto:active {
  transform: scale(0.98);
}
/* BOTÓN AGREGAR PRECIO EXPANDIBLE */
.boton-agregar-precio {
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
}
.boton-expandido {
  border-radius: 16px;
  padding-left: 12px;
  padding-right: 12px;
}
/* Contenedor del botón */
.contenedor-boton-agregar {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
}
/* Transición del texto */
.fade-texto-enter-active,
.fade-texto-leave-active {
  transition: opacity 0.3s ease;
}
.fade-texto-enter-from,
.fade-texto-leave-to {
  opacity: 0;
}
/* DISEÑO VERTICAL (Móvil) */
.tarjeta-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tarjeta-vertical .tarjeta-imagen {
  width: 100%;
  height: 120px;
}
.tarjeta-vertical .tarjeta-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tarjeta-vertical .tarjeta-precio-comercio {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* DISEÑO HORIZONTAL (Tablet/PC) */
.tarjeta-horizontal {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 16px;
  align-items: start;
}
.tarjeta-horizontal .tarjeta-imagen {
  width: 80px;
  height: 80px;
}
.tarjeta-horizontal .tarjeta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tarjeta-horizontal .tarjeta-precio-comercio {
  display: flex;
  align-items: center;
  gap: 16px;
}
.tarjeta-horizontal .contenedor-boton-agregar {
  margin-top: 0;
}
/* IMAGEN Y PLACEHOLDER */
.tarjeta-imagen {
  flex-shrink: 0;
}
.placeholder-imagen {
  width: 100%;
  height: 100%;
  background-color: var(--color-primario-claro);
  border-radius: var(--borde-radio);
  display: flex;
  align-items: center;
  justify-content: center;
}
/* TEXTO */
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 3em;
  line-height: 1.5;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
