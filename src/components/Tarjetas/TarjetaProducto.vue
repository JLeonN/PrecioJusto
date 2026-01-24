<template>
  <q-card
    class="tarjeta-producto"
    :class="{ 'tarjeta-seleccionada': seleccionado }"
    clickable
    @click="manejarClick"
    v-touch-hold:1000.mouse="manejarLongPress"
  >
    <!-- OVERLAY DE SELECCIÓN -->
    <div v-if="seleccionado" class="overlay-seleccion"></div>

    <!-- CHECKBOX DE SELECCIÓN -->
    <transition name="fade">
      <div v-if="modoSeleccion" class="checkbox-seleccion">
        <q-icon
          :name="seleccionado ? 'check_circle' : 'radio_button_unchecked'"
          :color="seleccionado ? 'positive' : 'grey-5'"
          size="28px"
        />
      </div>
    </transition>

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

        <!-- Código de barras -->
        <div
          v-if="producto.codigoBarras"
          class="codigo-barras"
          @click.stop="copiarCodigoBarras(producto.codigoBarras)"
        >
          <IconBarcode :size="14" class="text-grey-6" />
          <span class="text-caption text-grey-6">{{ producto.codigoBarras }}</span>
          <q-tooltip>Click para copiar</q-tooltip>
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

        <!-- Botón agregar precio (solo visible si NO está en modo selección) -->
        <div v-if="!modoSeleccion" class="contenedor-boton-agregar">
          <q-btn
            :round="!expandida"
            dense
            color="primary"
            size="sm"
            class="boton-agregar-precio"
            :class="{ 'boton-expandido': expandida }"
            @click.stop="emit('agregar-precio')"
          >
            <IconPlus :size="18" />
            <transition name="fade-texto">
              <span v-if="expandida" class="q-ml-xs">Agregar precio</span>
            </transition>
          </q-btn>
        </div>
      </div>

      <!-- Ícono para indicar expandir/colapsar (solo si NO está en modo selección) -->
      <div v-if="!modoSeleccion" class="tarjeta-icono-mas">
        <IconChevronDown v-if="!expandida" :size="20" class="text-grey-5" />
        <IconChevronUp v-else :size="20" class="text-grey-5" />
      </div>
    </q-card-section>

    <!-- INFORMACIÓN EXPANDIDA (solo visible si NO está en modo selección) -->
    <q-slide-transition>
      <div v-show="expandida && !modoSeleccion">
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
                <q-item-label caption>{{ formatearFecha(precio.fecha) }}</q-item-label>
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
  IconBarcode,
} from '@tabler/icons-vue'

const $q = useQuasar()

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
  modoSeleccion: {
    type: Boolean,
    default: false,
  },
  seleccionado: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['agregar-precio', 'ver-detalle', 'long-press', 'toggle-seleccion'])

const expandida = ref(false)

// Copiar código de barras al portapapeles
const copiarCodigoBarras = async (codigo) => {
  try {
    await navigator.clipboard.writeText(codigo)
    $q.notify({
      type: 'positive',
      message: 'Código copiado',
      caption: codigo,
      position: 'top',
      timeout: 1500,
      icon: 'content_copy',
    })
  } catch (error) {
    console.error('Error al copiar:', error)
    $q.notify({
      type: 'negative',
      message: 'No se pudo copiar el código',
      position: 'top',
      timeout: 1500,
    })
  }
}

// Manejar click según modo
const manejarClick = () => {
  if (props.modoSeleccion) {
    emit('toggle-seleccion', props.producto.id)
  } else {
    toggleExpandir()
  }
}

// Manejar long press
const manejarLongPress = () => {
  if (!props.modoSeleccion) {
    if ($q.platform.is.mobile && navigator.vibrate) {
      navigator.vibrate(50)
    }
    emit('long-press', props.producto.id)
  }
}

const toggleExpandir = () => {
  expandida.value = !expandida.value
}

// Obtener top 3 precios más bajos
const top3Precios = computed(() => {
  const preciosOrdenados = [...props.producto.precios].sort((a, b) => a.valor - b.valor).slice(0, 3)
  return preciosOrdenados
})

// 👇 NUEVO: Formatear fecha de forma relativa
const formatearFecha = (fechaISO) => {
  const ahora = new Date()
  const fechaPrecio = new Date(fechaISO)
  const diferencia = ahora - fechaPrecio
  const minutos = Math.floor(diferencia / (1000 * 60))
  const horas = Math.floor(diferencia / (1000 * 60 * 60))
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

  if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`
  if (dias < 30) {
    const semanas = Math.floor(dias / 7)
    return `Hace ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`
  }
  if (dias < 365) {
    const meses = Math.floor(dias / 30)
    return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
  }
  const años = Math.floor(dias / 365)
  return `Hace ${años} ${años === 1 ? 'año' : 'años'}`
}

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
  position: relative;
  overflow: visible;
}
.tarjeta-producto:active {
  transform: scale(0.98);
}
/* MODO SELECCIÓN */
.tarjeta-seleccionada {
  border-left: 4px solid var(--color-secundario);
  box-shadow: 0 0 0 2px var(--color-secundario);
}
/* OVERLAY DE SELECCIÓN */
.overlay-seleccion {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-secundario-claro);
  opacity: 0.2;
  pointer-events: none;
  z-index: 1;
}
/* CHECKBOX DE SELECCIÓN */
.checkbox-seleccion {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background-color: var(--fondo-tarjeta);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sombra-ligera);
}
/* Animación fade para checkbox */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
  width: 140px;
  height: 140px;
  margin: 0 auto;
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
/* Código de barras */
.codigo-barras {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: -4px;
  margin-bottom: 4px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  width: fit-content;
}
/* Hover effect */
.codigo-barras:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
/* Active effect (cuando hace click) */
.codigo-barras:active {
  background-color: rgba(0, 0, 0, 0.1);
}
.codigo-barras span {
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.5px;
  font-family: 'Courier New', monospace;
}
</style>
