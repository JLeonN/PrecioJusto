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
    <template #info-inferior>
      <div class="info-comercio">
        <div class="info-item">
          <IconMapPin :size="16" class="text-grey-6" />
          <span>
            {{ comercio.direcciones.length }}
            {{ comercio.direcciones.length === 1 ? 'dirección' : 'direcciones' }}
          </span>
        </div>
        <div v-if="comercio.cantidadUsos > 0" class="info-item">
          <IconShoppingCart :size="16" class="text-grey-6" />
          <span>{{ comercio.cantidadUsos }} usos</span>
        </div>
      </div>
    </template>
    <template #expandido-header>
      <div class="expandido-titulo">
        <IconMapPin :size="18" />
        <span>DIRECCIONES</span>
      </div>
    </template>
    <template #expandido-contenido>
      <div class="lista-direcciones">
        <div v-for="direccion in comercio.direcciones" :key="direccion.id" class="item-direccion">
          <div class="item-direccion__icono">
            <IconMapPin :size="20" class="text-orange" />
          </div>
          <div class="item-direccion__info">
            <div class="item-direccion__texto">{{ direccion.direccion }}</div>
            <div class="item-direccion__fecha">
              {{ formatearUltimoUso(direccion) }}
            </div>
          </div>
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

/* Props del componente */
defineProps({
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

/* Formatear último uso de dirección */
const formatearUltimoUso = (direccion) => {
  if (!direccion.ultimoUso) {
    return 'Sin uso registrado'
  }

  const fecha = new Date(direccion.ultimoUso)
  const ahora = new Date()
  const diferencia = Math.floor((ahora - fecha) / 1000)

  if (diferencia < 60) return 'Última vez: Hace un momento'
  if (diferencia < 3600) return `Última vez: Hace ${Math.floor(diferencia / 60)} minutos`
  if (diferencia < 86400) return `Última vez: Hace ${Math.floor(diferencia / 3600)} horas`
  if (diferencia < 604800) return `Última vez: Hace ${Math.floor(diferencia / 86400)} días`
  if (diferencia < 2592000) return `Última vez: Hace ${Math.floor(diferencia / 604800)} semanas`
  return `Última vez: Hace ${Math.floor(diferencia / 2592000)} meses`
}

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
.item-direccion__fecha {
  font-size: 11px;
  color: var(--texto-deshabilitado);
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
