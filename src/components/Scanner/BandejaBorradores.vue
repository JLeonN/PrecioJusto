<template>
  <q-dialog v-model="abierta" position="bottom">
    <q-card class="bandeja-card">

      <!-- HEADER -->
      <q-card-section class="bandeja-header row items-center no-wrap">
        <div class="col">
          <div class="text-subtitle1 text-weight-bold">Bandeja de borradores</div>
          <div v-if="sesionEscaneoStore.comercioActivo" class="text-caption text-grey-6">
            {{ sesionEscaneoStore.comercioActivo.nombre }}
            <span v-if="sesionEscaneoStore.comercioActivo.direccionNombre">
              — {{ sesionEscaneoStore.comercioActivo.direccionNombre }}
            </span>
          </div>
        </div>
        <q-chip
          v-if="sesionEscaneoStore.cantidadItems > 0"
          color="primary"
          text-color="white"
          dense
          class="q-mr-sm"
        >
          {{ sesionEscaneoStore.cantidadItems }}
        </q-chip>
        <q-btn flat round dense icon="close" @click="abierta = false" />
      </q-card-section>

      <q-separator />

      <!-- LISTA DE ITEMS -->
      <q-scroll-area class="bandeja-scroll">
        <q-list v-if="sesionEscaneoStore.items.length > 0" separator>
          <q-item
            v-for="item in sesionEscaneoStore.items"
            :key="item.id"
            class="bandeja-item q-py-sm"
          >
            <!-- Imagen o ícono fallback -->
            <q-item-section avatar>
              <q-img v-if="item.imagen" :src="item.imagen" class="bandeja-imagen" fit="cover" />
              <q-avatar v-else color="grey-2" text-color="grey-5" size="44px">
                <IconPackage :size="22" />
              </q-avatar>
            </q-item-section>

            <!-- Datos del producto -->
            <q-item-section>
              <q-item-label class="text-weight-medium ellipsis">{{ item.nombre }}</q-item-label>
              <q-item-label v-if="item.marca" caption>{{ item.marca }}</q-item-label>
              <!-- Precio editable inline -->
              <div class="row items-center q-mt-xs">
                <template v-if="editandoId === item.id">
                  <q-input
                    v-model.number="precioEditado"
                    type="number"
                    min="0"
                    step="0.01"
                    dense
                    outlined
                    class="bandeja-input-precio"
                    autofocus
                    @keyup.enter="confirmarEdicion(item)"
                    @keyup.esc="cancelarEdicion"
                  />
                  <q-btn flat round dense icon="check" color="positive" size="sm" @click="confirmarEdicion(item)" />
                  <q-btn flat round dense icon="close" color="grey" size="sm" @click="cancelarEdicion" />
                </template>
                <template v-else>
                  <span class="text-primary text-weight-bold q-mr-xs">${{ item.precio }}</span>
                  <span class="text-caption text-grey-6">{{ item.moneda }}</span>
                  <q-btn
                    flat round dense
                    icon="edit"
                    color="grey-6"
                    size="xs"
                    class="q-ml-xs"
                    @click="iniciarEdicion(item)"
                  />
                </template>
              </div>
            </q-item-section>

            <!-- Botón eliminar -->
            <q-item-section side>
              <q-btn flat round dense color="negative" size="sm" @click="sesionEscaneoStore.eliminarItem(item.id)">
                <IconTrash :size="18" />
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Estado vacío -->
        <div v-else class="bandeja-vacia column items-center justify-center">
          <IconPackage :size="48" class="text-grey-4" />
          <div class="text-grey-5 q-mt-sm">No hay productos en la bandeja</div>
        </div>
      </q-scroll-area>

      <!-- FOOTER CON ACCIONES -->
      <q-card-section v-if="sesionEscaneoStore.items.length > 0" class="bandeja-footer">
        <div class="row q-gutter-sm">
          <q-btn
            outline
            no-caps
            color="negative"
            class="col"
            :disable="guardando"
            @click="limpiarTodo"
          >
            Limpiar todo
          </q-btn>
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="col"
            :loading="guardando"
            @click="guardarTodo"
          >
            <IconCheck :size="18" class="q-mr-xs" />
            Guardar todos
          </q-btn>
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { IconPackage, IconTrash, IconCheck } from '@tabler/icons-vue'
import { useSesionEscaneoStore } from '../../almacenamiento/stores/sesionEscaneoStore.js'
import { useProductosStore } from '../../almacenamiento/stores/productosStore.js'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'guardado'])

const sesionEscaneoStore = useSesionEscaneoStore()
const productosStore = useProductosStore()
const comerciosStore = useComerciStore()
const $q = useQuasar()

const abierta = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const guardando = ref(false)

// Edición inline de precio
const editandoId = ref(null)
const precioEditado = ref(null)

function iniciarEdicion(item) {
  editandoId.value = item.id
  precioEditado.value = item.precio
}

function confirmarEdicion(item) {
  if (precioEditado.value > 0) {
    sesionEscaneoStore.actualizarItem(item.id, { precio: precioEditado.value })
  }
  cancelarEdicion()
}

function cancelarEdicion() {
  editandoId.value = null
  precioEditado.value = null
}

async function limpiarTodo() {
  await sesionEscaneoStore.limpiarTodo()
  abierta.value = false
}

async function guardarTodo() {
  if (sesionEscaneoStore.items.length === 0) return
  guardando.value = true

  const comercio = sesionEscaneoStore.comercioActivo
  let guardados = 0
  let errores = 0

  for (const item of [...sesionEscaneoStore.items]) {
    try {
      const datoPrecio = {
        comercioId: comercio?.id || null,
        direccionId: comercio?.direccionId || null,
        comercio: comercio?.nombre || 'Sin comercio',
        nombreCompleto: comercio?.direccionNombre
          ? `${comercio.nombre} — ${comercio.direccionNombre}`
          : comercio?.nombre || 'Sin datos',
        direccion: comercio?.direccionNombre || '',
        valor: item.precio,
        moneda: item.moneda,
        fecha: new Date().toISOString(),
        confirmaciones: 0,
        usuarioId: 'user_actual_123',
      }

      if (item.productoExistenteId) {
        await productosStore.agregarPrecioAProducto(item.productoExistenteId, datoPrecio)
      } else {
        await productosStore.agregarProducto({
          nombre: item.nombre,
          marca: item.marca || '',
          codigoBarras: item.codigoBarras || '',
          cantidad: item.cantidad || 1,
          unidad: item.unidad || 'unidad',
          categoria: '',
          imagen: item.imagen || null,
          precios: [datoPrecio],
        })
      }

      guardados++
    } catch (error) {
      console.error('Error al guardar item de bandeja:', error)
      errores++
    }
  }

  // Registrar uso del comercio una sola vez al final
  if (comercio?.id && comercio?.direccionId && guardados > 0) {
    await comerciosStore.registrarUso(comercio.id, comercio.direccionId)
  }

  if (guardados > 0) {
    await sesionEscaneoStore.limpiarTodo()
    emit('guardado')
    $q.notify({
      type: 'positive',
      message: `${guardados} producto${guardados > 1 ? 's' : ''} guardado${guardados > 1 ? 's' : ''} en Mis Productos`,
      position: 'top',
      icon: 'check_circle',
      timeout: 2500,
    })
    abierta.value = false
  }

  if (errores > 0) {
    $q.notify({
      type: 'negative',
      message: `${errores} producto${errores > 1 ? 's' : ''} no se pudo${errores > 1 ? 'n' : ''} guardar`,
      position: 'top',
    })
  }

  guardando.value = false
}
</script>

<style scoped>
.bandeja-card {
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  padding-bottom: var(--safe-area-bottom);
}
.bandeja-header {
  padding: 14px 16px 10px;
}
.bandeja-scroll {
  height: min(48vh, 420px);
}
.bandeja-item {
  align-items: flex-start;
}
.bandeja-imagen {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  flex-shrink: 0;
}
.bandeja-input-precio {
  width: 100px;
}
.bandeja-vacia {
  padding: 40px 0;
}
.bandeja-footer {
  padding: 10px 16px 14px;
  border-top: 1px solid var(--borde-color);
}
</style>
