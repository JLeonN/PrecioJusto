<template>
  <TarjetaBase
    tipo="comercio"
    :nombre="comercio.nombre"
    :imagen="comercio.foto"
    :modo-seleccion="modoSeleccion"
    :seleccionado="seleccionado"
    @toggle-expansion="manejarExpansion"
    @long-press="$emit('long-press')"
    @toggle-seleccion="$emit('toggle-seleccion')"
  >
    <template #tipo>
      <div class="tipo-badge">
        <q-chip dense size="sm" color="orange" text-color="white" class="q-ma-none">
          {{ comercio.tipo }}
        </q-chip>
      </div>
    </template>
    <template #placeholder-icono>
      <IconBuilding :size="48" class="text-grey-5" />
    </template>
    <template #overlay-info>
      <div v-if="comercio.direccionPrincipal" class="direccion-overlay">
        <div class="direccion-overlay__icono">
          <IconMapPin :size="16" />
        </div>
        <div class="direccion-overlay__texto">
          <div class="direccion-overlay__calle">{{ comercio.direccionPrincipal.calle }}</div>
          <div v-if="comercio.direccionPrincipal.barrio" class="direccion-overlay__barrio">
            {{ comercio.direccionPrincipal.barrio }}
          </div>
        </div>
      </div>
    </template>
    <template #info-inferior>
      <!-- Info comercio -->
      <div class="info-comercio">
        <div class="info-item">
          <IconMapPin :size="16" class="text-grey-6" />
          <span>
            {{ comercio.totalSucursales || comercio.direcciones.length }}
            {{
              (comercio.totalSucursales || comercio.direcciones.length) === 1
                ? 'sucursal'
                : 'sucursales'
            }}
          </span>
        </div>
        <div v-if="comercio.cantidadUsos > 0" class="info-item">
          <IconShoppingCart :size="16" class="text-grey-6" />
          <span>
            {{ obtenerUsosActuales() }} usos
            <span v-if="comercio.esCadena" class="text-grey-5">
              ({{ comercio.cantidadUsos }} total)
            </span>
          </span>
        </div>
      </div>
    </template>
    <template #expandido-header>
      <div class="expandido-titulo">
        <IconMapPin :size="18" />
        <span>{{ comercio.esCadena ? 'SUCURSALES' : 'DIRECCIONES' }}</span>
      </div>
    </template>
    <template #expandido-contenido>
      <div class="lista-direcciones">
        <div
          v-for="direccion in comercio.direccionesTop3 || comercio.direcciones"
          :key="direccion.id"
          class="item-direccion"
        >
          <div class="item-direccion__icono">
            <IconMapPin :size="20" class="text-orange" />
          </div>
          <div class="item-direccion__info">
            <div class="item-direccion__texto">{{ direccion.calle }}</div>
            <div v-if="direccion.barrio" class="item-direccion__barrio">
              {{ direccion.barrio }}
            </div>
            <div class="item-direccion__fecha">
              {{ formatearUltimoUso(direccion) }}
            </div>
          </div>
        </div>

        <!-- Indicador de más sucursales -->
        <div v-if="comercio.direcciones.length > 3" class="mas-direcciones">
          <IconAlertCircle :size="16" class="text-orange" />
          <span>Y {{ comercio.direcciones.length - 3 }} sucursales más...</span>
        </div>

        <div v-if="comercio.direcciones.length === 0" class="sin-direcciones">
          <IconAlertCircle :size="20" class="text-grey-5" />
          <span class="text-grey-6">No hay direcciones registradas</span>
        </div>
      </div>
    </template>
    <template #acciones>
      <q-btn
        flat
        dense
        color="orange"
        icon-right="edit"
        label="Editar"
        class="boton-editar"
        @click.stop="$emit('editar')"
      />
    </template>
  </TarjetaBase>
</template>

<script setup>
import TarjetaBase from './TarjetaBase.vue'
import { IconBuilding, IconMapPin, IconShoppingCart, IconAlertCircle } from '@tabler/icons-vue'
import { formatearUltimoUso as formatearUltimoUsoFecha } from '../../composables/useFechaRelativa.js'

/* Props del componente */
const props = defineProps({
  comercio: {
    type: Object,
    required: true,
    validator: (valor) => {
      return valor.id && valor.nombre && valor.tipo && Array.isArray(valor.direcciones)
    },
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

/* Emits del componente */
defineEmits(['long-press', 'toggle-seleccion', 'editar'])

/* Obtener usos de la sucursal actual */
const obtenerUsosActuales = () => {
  if (!props.comercio.esCadena) {
    return props.comercio.cantidadUsos
  }

  // Si es cadena, obtener usos de la sucursal principal
  const direccionPrincipal = props.comercio.direccionPrincipal
  if (!direccionPrincipal) return props.comercio.cantidadUsos

  // Buscar comercio original de esta dirección
  const comercioOriginal = props.comercio.comerciosOriginales?.find((c) =>
    c.direcciones.some((d) => d.id === direccionPrincipal.id),
  )

  return comercioOriginal?.cantidadUsos || 0
}

// Formatea último uso usando composable compartido
const formatearUltimoUso = (direccion) => formatearUltimoUsoFecha(direccion.fechaUltimoUso)

/* Manejar expansión */
const manejarExpansion = (expandido) => {
  console.log('Comercio expandido:', expandido)
}
</script>

<style scoped>
.tipo-badge {
  display: flex;
  align-items: center;
}
.direccion-overlay {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
}
.direccion-overlay__icono {
  flex-shrink: 0;
  margin-top: 2px;
}
.direccion-overlay__texto {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.direccion-overlay__calle {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}
.direccion-overlay__barrio {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.3;
}
.info-comercio {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--texto-secundario);
}
.expandido-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lista-direcciones {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-direccion {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--fondo-drawer);
  border-radius: 8px;
  border-left: 3px solid var(--color-acento);
}
.item-direccion__icono {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-acento-claro);
  border-radius: 50%;
}
.item-direccion__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item-direccion__texto {
  font-size: 14px;
  font-weight: 500;
  color: var(--texto-primario);
  line-height: 1.4;
}
.item-direccion__barrio {
  font-size: 12px;
  color: var(--texto-secundario);
}
.item-direccion__fecha {
  font-size: 11px;
  color: var(--texto-deshabilitado);
}
.mas-direcciones {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--fondo-drawer);
  border-radius: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--texto-secundario);
  font-style: italic;
}
.sin-direcciones {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  font-size: 13px;
}
.boton-editar {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
