<template>
  <q-card
    class="tarjeta-comercio"
    :class="{
      'tarjeta-seleccionada': seleccionado,
      'tarjeta-expandida': expandido,
    }"
    @click="handleClick"
    v-touch-hold.mouse="handleLongPress"
  >
    <!-- OVERLAY DE SELECCIÓN -->
    <div v-if="seleccionado" class="overlay-seleccion"></div>

    <!-- CHECKBOX DE SELECCIÓN (modo selección) -->
    <transition name="fade">
      <div v-if="modoSeleccion" class="checkbox-seleccion">
        <q-checkbox :model-value="seleccionado" color="secondary" size="md" />
      </div>
    </transition>

    <!-- FOTO / PLACEHOLDER -->
    <q-card-section class="foto-seccion">
      <div class="foto-contenedor">
        <div v-if="!comercio.foto" class="foto-placeholder">
          <IconBuilding :size="48" class="text-grey-6" />
        </div>
        <q-img v-else :src="comercio.foto" class="foto-comercio" />
      </div>
    </q-card-section>

    <!-- CONTENIDO PRINCIPAL -->
    <q-card-section class="contenido-principal">
      <!-- NOMBRE DEL COMERCIO -->
      <div class="nombre-comercio">{{ comercio.nombre }}</div>

      <!-- TIPO DE COMERCIO -->
      <div class="tipo-comercio">
        <q-chip dense size="sm" color="primary" text-color="white" class="q-ma-none">
          {{ comercio.tipo }}
        </q-chip>
      </div>

      <!-- ESTADÍSTICAS RÁPIDAS -->
      <div class="estadisticas-rapidas q-mt-sm">
        <div class="estadistica-item">
          <IconMapPin :size="16" class="text-grey-6" />
          <span class="text-caption text-grey-7">
            {{ comercio.direcciones.length }}
            {{ comercio.direcciones.length === 1 ? 'dirección' : 'direcciones' }}
          </span>
        </div>

        <div v-if="comercio.cantidadUsos > 0" class="estadistica-item">
          <IconShoppingCart :size="16" class="text-grey-6" />
          <span class="text-caption text-grey-7">{{ comercio.cantidadUsos }} usos</span>
        </div>
      </div>

      <!-- ÍCONO EXPANDIR/COLAPSAR (solo si no está en modo selección) -->
      <div v-if="!modoSeleccion" class="icono-expandir">
        <q-icon :name="expandido ? 'expand_less' : 'expand_more'" size="24px" color="primary" />
      </div>
    </q-card-section>

    <!-- SECCIÓN EXPANDIDA: DIRECCIONES -->
    <q-slide-transition>
      <div v-show="expandido && !modoSeleccion" class="seccion-direcciones">
        <q-separator />

        <q-card-section>
          <div class="titulo-direcciones">
            <IconMapPin :size="18" />
            <span>Direcciones</span>
          </div>

          <q-list class="lista-direcciones">
            <q-item
              v-for="(direccion, index) in comercio.direcciones"
              :key="direccion.id"
              class="direccion-item"
            >
              <q-item-section avatar>
                <q-avatar color="grey-3" text-color="primary" size="32px">
                  {{ index + 1 }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="texto-direccion">{{ direccion.calle }}</q-item-label>
                <q-item-label caption v-if="direccion.barrio || direccion.ciudad">
                  {{ direccion.barrio }}
                  <span v-if="direccion.barrio && direccion.ciudad"> - </span>
                  {{ direccion.ciudad }}
                </q-item-label>
                <q-item-label caption class="text-grey-6">
                  <span v-if="direccion.fechaUltimoUso">
                    Último uso: {{ formatearFechaRelativa(direccion.fechaUltimoUso) }}
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- BOTÓN EDITAR -->
          <div class="acciones-expandidas q-mt-md">
            <q-btn
              unelevated
              color="primary"
              label="Editar comercio"
              icon="edit"
              class="boton-editar"
              @click.stop="handleEditar"
            />
          </div>
        </q-card-section>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { IconBuilding, IconMapPin, IconShoppingCart } from '@tabler/icons-vue'

const props = defineProps({
  comercio: {
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

const emit = defineEmits(['long-press', 'toggle-seleccion', 'editar'])

// Estado local
const expandido = ref(false)

/**
 * Maneja el click en la tarjeta
 */
function handleClick() {
  if (props.modoSeleccion) {
    // Modo selección: toggle selección
    emit('toggle-seleccion', props.comercio.id)
  } else {
    // Modo normal: toggle expandir
    expandido.value = !expandido.value
  }
}

/**
 * Maneja long-press para activar modo selección
 */
function handleLongPress() {
  if (!props.modoSeleccion) {
    emit('long-press', props.comercio.id)
  }
}

/**
 * Maneja el click en editar
 */
function handleEditar() {
  emit('editar', props.comercio)
}

/**
 * Formatea fecha en modo relativo (hace X días/horas)
 */
function formatearFechaRelativa(fechaISO) {
  const ahora = new Date()
  const fecha = new Date(fechaISO)
  const diferencia = ahora - fecha

  const segundos = Math.floor(diferencia / 1000)
  const minutos = Math.floor(segundos / 60)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)
  const semanas = Math.floor(dias / 7)
  const meses = Math.floor(dias / 30)

  if (meses > 0) return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
  if (semanas > 0) return `Hace ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`
  if (dias > 0) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`
  if (horas > 0) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  if (minutos > 0) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  return 'Hace un momento'
}
</script>

<style scoped>
.tarjeta-comercio {
  position: relative;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}
.tarjeta-comercio:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
.tarjeta-comercio:active {
  transform: scale(0.98);
}
/* ESTADO SELECCIONADO */
.tarjeta-seleccionada {
  border: 2px solid #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}
/* OVERLAY DE SELECCIÓN */
.overlay-seleccion {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4caf50;
  opacity: 0.15;
  z-index: 1;
  pointer-events: none;
}
/* CHECKBOX DE SELECCIÓN */
.checkbox-seleccion {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* FOTO / PLACEHOLDER */
.foto-seccion {
  padding: 16px 16px 0 16px;
}
.foto-contenedor {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.foto-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
}
.foto-comercio {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* CONTENIDO PRINCIPAL */
.contenido-principal {
  padding: 16px;
  position: relative;
}
.nombre-comercio {
  font-size: 18px;
  font-weight: bold;
  color: #1d1d1d;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.tipo-comercio {
  margin-bottom: 8px;
}
.estadisticas-rapidas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.estadistica-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.icono-expandir {
  position: absolute;
  bottom: 8px;
  right: 8px;
}
/* SECCIÓN DIRECCIONES */
.seccion-direcciones {
  background-color: #fafafa;
}
.titulo-direcciones {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 12px;
}
.lista-direcciones {
  padding: 0;
}
.direccion-item {
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}
.direccion-item:last-child {
  border-bottom: none;
}
.texto-direccion {
  font-weight: 500;
  color: #1d1d1d;
}
.acciones-expandidas {
  display: flex;
  justify-content: flex-end;
}
.boton-editar {
  width: 100%;
}
/* Responsive */
@media (max-width: 599px) {
  .nombre-comercio {
    font-size: 16px;
  }
}
</style>
