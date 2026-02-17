<template>
  <q-card
    class="tarjeta-yugioh"
    :class="{
      'tarjeta-yugioh--producto': tipo === 'producto',
      'tarjeta-yugioh--comercio': tipo === 'comercio',
      'tarjeta-yugioh--expandida': expandido,
      'tarjeta-yugioh--seleccionada': seleccionado,
    }"
    @click="manejarClick"
    v-touch-hold.mouse="manejarLongPress"
  >
    <!-- OVERLAY DE SELECCIÓN -->
    <div v-if="seleccionado" class="tarjeta-yugioh__overlay-seleccion"></div>

    <!-- CHECKBOX DE SELECCIÓN (modo selección) -->
    <transition name="fade">
      <div v-if="modoSeleccion" class="tarjeta-yugioh__checkbox">
        <q-checkbox :model-value="seleccionado" color="secondary" size="md" />
      </div>
    </transition>

    <!-- HEADER (Nombre + Botón flotante) -->
    <div class="tarjeta-yugioh__header">
      <div class="tarjeta-yugioh__nombre">
        <slot name="nombre">{{ nombre }}</slot>
      </div>

      <!-- BOTÓN FLOTANTE (solo productos) -->
      <button
        v-if="tipo === 'producto' && !modoSeleccion"
        class="tarjeta-yugioh__boton-flotante"
        :class="{ 'tarjeta-yugioh__boton-flotante--expandido': expandido }"
        @click.stop="$emit('agregar-precio')"
      >
        <IconPlus :size="16" />
        <transition name="fade-texto">
          <span v-if="expandido" class="tarjeta-yugioh__boton-texto"> Agregar precio </span>
        </transition>
      </button>
    </div>

    <!-- TIPO / DIRECCIÓN (slot personalizable) -->
    <div v-if="$slots.tipo || tipoTexto" class="tarjeta-yugioh__tipo">
      <slot name="tipo">{{ tipoTexto }}</slot>
    </div>

    <!-- MARCO DE IMAGEN -->
    <div class="tarjeta-yugioh__marco-imagen">
      <div class="tarjeta-yugioh__contenedor-imagen">
        <!-- Slot para imagen personalizada -->
        <slot name="imagen">
          <div v-if="!imagen" class="tarjeta-yugioh__placeholder">
            <slot name="placeholder-icono">
              <IconShoppingBag :size="48" class="text-grey-5" />
            </slot>
          </div>
          <q-img v-else :src="imagen" class="tarjeta-yugioh__imagen" fit="cover" />
        </slot>

        <!-- Overlay de info (precio/dirección) -->
        <div v-if="$slots['overlay-info']" class="tarjeta-yugioh__info-overlay">
          <slot name="overlay-info"></slot>
        </div>
      </div>
    </div>

    <!-- INFO INFERIOR (código de barras / direcciones y usos) -->
    <div class="tarjeta-yugioh__info-inferior">
      <slot name="info-inferior">
        <!-- Contenido por defecto si no hay slot -->
      </slot>
    </div>

    <!-- CONTENIDO EXPANDIDO (con transición) -->
    <transition name="expandir">
      <div v-show="expandido && !modoSeleccion" class="tarjeta-yugioh__expandido">
        <!-- Header de sección expandida -->
        <div class="tarjeta-yugioh__expandido-header">
          <slot name="expandido-header">
            <!-- Título de la sección expandida -->
          </slot>
        </div>

        <!-- Contenido de sección expandida -->
        <div class="tarjeta-yugioh__expandido-contenido">
          <slot name="expandido-contenido">
            <!-- Contenido expandido personalizado -->
          </slot>
        </div>

        <!-- Zona de botones estilo ATK/DEF -->
        <div class="tarjeta-yugioh__zona-acciones">
          <slot name="acciones">
            <!-- Botones personalizados por tipo -->
          </slot>
        </div>
      </div>
    </transition>

    <!-- ÍCONO EXPANDIR/COLAPSAR (solo si no está en modo selección) -->
    <div v-if="!modoSeleccion && permiteExpansion" class="tarjeta-yugioh__icono-expandir">
      <q-icon :name="expandido ? 'expand_less' : 'expand_more'" size="24px" color="grey-6" />
    </div>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconPlus, IconShoppingBag } from '@tabler/icons-vue'

/* Props del componente */
const props = defineProps({
  /* Tipo de tarjeta */
  tipo: {
    type: String,
    required: true,
    validator: (valor) => ['producto', 'comercio'].includes(valor),
  },

  /* Nombre del producto/comercio */
  nombre: {
    type: String,
    default: '',
  },

  /* Texto del tipo (comercio/dirección) */
  tipoTexto: {
    type: String,
    default: '',
  },

  /* URL de la imagen */
  imagen: {
    type: String,
    default: null,
  },

  /* Permite expansión */
  permiteExpansion: {
    type: Boolean,
    default: true,
  },

  /* Estado de expansión (controlado desde fuera si se desea) */
  expandidoProp: {
    type: Boolean,
    default: null,
  },

  /* Modo selección activo */
  modoSeleccion: {
    type: Boolean,
    default: false,
  },

  /* Tarjeta seleccionada */
  seleccionado: {
    type: Boolean,
    default: false,
  },
})

/* Emits del componente */
const emit = defineEmits(['toggle-expansion', 'long-press', 'toggle-seleccion', 'agregar-precio'])

/* Estado interno de expansión */
const expandidoInterno = ref(false)

/* Computed para manejar expansión (controlada o interna) */
const expandido = computed({
  get: () => {
    return props.expandidoProp !== null ? props.expandidoProp : expandidoInterno.value
  },
  set: (valor) => {
    expandidoInterno.value = valor
  },
})

/* Manejar click en la tarjeta */
const manejarClick = () => {
  if (props.modoSeleccion) {
    /* En modo selección: toggle selección */
    emit('toggle-seleccion')
  } else if (props.permiteExpansion) {
    /* En modo normal: toggle expansión */
    expandido.value = !expandido.value
    emit('toggle-expansion', expandido.value)
  }
}

/* Manejar long press */
const manejarLongPress = () => {
  if (!props.modoSeleccion) {
    emit('long-press')
  }
}
</script>

<style scoped>
/* ========================================
   TARJETA BASE YUGIOH
   ======================================== */
.tarjeta-yugioh {
  position: relative;
  background: var(--fondo-tarjeta);
  border-radius: var(--borde-carta-radio);
  border: var(--borde-carta-grosor) solid var(--color-carta-borde);
  box-shadow: var(--sombra-carta);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transicion-carta);
  display: flex;
  flex-direction: column;
  gap: var(--carta-gap-secciones);
}
/* Hover effect */
.tarjeta-yugioh:hover {
  transform: translateY(-4px);
  box-shadow: var(--sombra-carta-hover);
}
/* Active effect */
.tarjeta-yugioh:active {
  transform: translateY(-2px) scale(0.99);
}
/* Estado seleccionado */
.tarjeta-yugioh--seleccionada {
  border-color: var(--color-secundario);
  box-shadow: 0 0 0 3px var(--color-secundario-claro);
}
/* ========================================
   OVERLAY Y CHECKBOX DE SELECCIÓN
   ======================================== */
.tarjeta-yugioh__overlay-seleccion {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-secundario-claro);
  opacity: 0.15;
  z-index: 1;
  pointer-events: none;
}
.tarjeta-yugioh__checkbox {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  background: white;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
/* ========================================
   HEADER (Nombre)
   ======================================== */
.tarjeta-yugioh__header {
  position: relative;
  padding: var(--carta-padding-header);
  color: white;
  font-weight: bold;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
}
/* Degradado según tipo */
.tarjeta-yugioh--producto .tarjeta-yugioh__header {
  background: var(--degradado-carta-header);
}
.tarjeta-yugioh--comercio .tarjeta-yugioh__header {
  background: var(--degradado-carta-header-comercio);
}
.tarjeta-yugioh__nombre {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
}
/* ========================================
   BOTÓN FLOTANTE (Agregar Precio)
   ======================================== */
.tarjeta-yugioh__boton-flotante {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: white;
  color: var(--color-primario);
  border: none;
  cursor: pointer;
  box-shadow: var(--sombra-boton-flotante);
  z-index: 3;
  overflow: hidden;
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
  transition: var(--transicion-boton-flotante);
  /* Estado cerrado (solo ícono) */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  padding: 0;
}
/* Estado expandido (con texto) */
.tarjeta-yugioh__boton-flotante--expandido {
  width: auto;
  min-width: 150px;
  border-radius: 20px;
  padding: 10px 16px;
}
.tarjeta-yugioh__boton-flotante:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
}
.tarjeta-yugioh__boton-flotante:active {
  transform: scale(0.95);
}
.tarjeta-yugioh__boton-texto {
  display: inline-block;
}
/* ========================================
   TIPO (Comercio/Dirección)
   ======================================== */
.tarjeta-yugioh__tipo {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--texto-secundario);
  background: var(--color-carta-info-bg);
  border-top: 1px solid var(--color-carta-borde);
  border-bottom: 1px solid var(--color-carta-borde);
}
/* ========================================
   MARCO DE IMAGEN
   ======================================== */
.tarjeta-yugioh__marco-imagen {
  position: relative;
  padding: 8px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
}
.tarjeta-yugioh__contenedor-imagen {
  position: relative;
  width: 100%;
  height: var(--carta-imagen-altura-cerrada);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--sombra-interna-marco);
  transition: height 0.3s ease;
}
.tarjeta-yugioh--expandida .tarjeta-yugioh__contenedor-imagen {
  height: var(--carta-imagen-altura-abierta);
}
.tarjeta-yugioh__imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tarjeta-yugioh__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primario-claro);
}
/* ========================================
   OVERLAY DE INFO (Precio/Dirección)
   ======================================== */
.tarjeta-yugioh__info-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 24px 12px 8px 12px;
  background: var(--degradado-precio-overlay);
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}
/* ========================================
   INFO INFERIOR
   ======================================== */
.tarjeta-yugioh__info-inferior {
  padding: var(--carta-padding-info);
  background: var(--color-carta-info-bg);
  border-top: 1px solid var(--color-carta-borde);
  min-height: 40px;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--texto-secundario);
}
/* ========================================
   CONTENIDO EXPANDIDO
   ======================================== */
.tarjeta-yugioh__expandido {
  border-top: var(--borde-marco-imagen) solid var(--color-carta-borde);
  overflow: hidden;
}
.tarjeta-yugioh__expandido-header {
  padding: 10px 14px;
  font-weight: bold;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
/* Color según tipo */
.tarjeta-yugioh--producto .tarjeta-yugioh__expandido-header {
  background: var(--color-secundario);
  color: white;
}
.tarjeta-yugioh--comercio .tarjeta-yugioh__expandido-header {
  background: var(--color-acento);
  color: white;
}
.tarjeta-yugioh__expandido-contenido {
  padding: var(--carta-padding-expandido);
  background: white;
}
/* ========================================
   ZONA DE ACCIONES (estilo ATK/DEF)
   ======================================== */
.tarjeta-yugioh__zona-acciones {
  padding: 12px 14px;
  background: var(--color-carta-info-bg);
  border-top: 1px solid var(--color-carta-borde);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
/* ========================================
   ÍCONO EXPANDIR/COLAPSAR
   ======================================== */
.tarjeta-yugioh__icono-expandir {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  z-index: 2;
}
/* ========================================
   ANIMACIONES
   ======================================== */
/* Fade para checkbox */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* Fade para texto del botón */
.fade-texto-enter-active,
.fade-texto-leave-active {
  transition: opacity 0.3s ease;
}
.fade-texto-enter-from,
.fade-texto-leave-to {
  opacity: 0;
}
/* Expansión del contenido */
.expandir-enter-active,
.expandir-leave-active {
  transition: var(--transicion-expansion);
}
.expandir-enter-from,
.expandir-leave-to {
  max-height: 0;
  opacity: 0;
}
.expandir-enter-to,
.expandir-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
