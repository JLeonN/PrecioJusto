<template>
  <q-page class="q-pa-md pagina-lista-justa">
    <div class="contenedor-pagina">
      <div class="header-pagina">
        <h5 class="titulo-pagina">Lista Justa</h5>
        <p class="contador-items">{{ listaJustaStore.totalListas }} listas guardadas</p>
      </div>

      <div v-if="listaJustaStore.cargando" class="text-center q-pa-xl">
        <q-spinner color="secondary" size="42px" />
        <p class="text-grey-7 q-mt-md">Cargando listas...</p>
      </div>

      <q-banner v-else-if="listaJustaStore.error" class="bg-negative text-white" rounded>
        {{ listaJustaStore.error }}
      </q-banner>

      <div v-else-if="!listaJustaStore.tieneListas" class="estado-vacio q-pa-xl">
        <IconListDetails :size="56" class="text-grey-5" />
        <p class="text-h6 q-mt-md q-mb-xs">Todavía no tenés listas</p>
        <p class="text-grey-6 q-mb-md">Creá una lista para usarla en tus compras diarias.</p>
        <q-btn unelevated color="secondary" no-caps label="Crear mi primera lista" @click="abrirDialogoLista()" />
      </div>

      <div v-else class="columna-listas">
        <q-slide-item
          v-for="lista in listaJustaStore.listasOrdenadas"
          :key="lista.id"
          right-color="negative"
          class="slide-lista"
          @right="onSwipeLargoLista(lista.id, $event)"
        >
          <template #right>
            <div class="swipe-destruccion">
              <IconTrash :size="20" />
              <span>¿Borrar?</span>
            </div>
          </template>

          <q-card flat bordered class="tarjeta-lista">
            <q-card-section class="q-pb-sm">
              <div class="fila-superior-lista">
                <div>
                  <div class="text-h6 text-weight-bold">{{ lista.nombre }}</div>
                  <div class="text-caption text-grey-7">
                    {{ lista.items.length }} {{ lista.items.length === 1 ? 'producto' : 'productos' }}
                  </div>
                  <div v-if="resumenComercioLista(lista).tieneComercio" class="resumen-comercio-lista q-mt-xs">
                    <div class="resumen-comercio-lista-nombre">{{ resumenComercioLista(lista).nombre }}</div>
                    <div v-if="resumenComercioLista(lista).direccion" class="resumen-comercio-lista-direccion">
                      {{ resumenComercioLista(lista).direccion }}
                    </div>
                  </div>
                </div>

                <div class="acciones-superiores-lista">
                  <BotonConfirmacionEliminar
                    icono="reiniciar"
                    texto-confirmacion="Reiniciar"
                    tooltip-inicial="Reiniciar lista"
                    @confirmar="reiniciarLista(lista.id)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    color="secondary"
                    aria-label="Editar lista"
                    @click="abrirDialogoLista(lista)"
                  >
                    <IconEdit :size="18" />
                  </q-btn>
                </div>
              </div>
            </q-card-section>

            <q-card-section class="q-pt-none q-pb-sm">
              <div class="fila-estimado">
                <span class="etiqueta-estimado">{{ estimadoDeLista(lista).etiqueta }}</span>
                <span class="monto-estimado">{{ formatearMoneda(estimadoDeLista(lista).total) }}</span>
              </div>
              <div v-if="estimadoDeLista(lista).parcial" class="text-caption text-warning">
                Faltan precios para completar el total.
              </div>
              <div v-if="estimadoDeLista(lista).etiqueta === 'Sin precios'" class="text-caption text-grey-7">
                Ningún item tiene precio cargado.
              </div>
            </q-card-section>

            <q-card-actions align="between" class="q-pt-none q-pb-sm acciones-lista">
              <q-btn flat no-caps color="secondary" label="Abrir" @click="abrirLista(lista.id)" />
            </q-card-actions>
          </q-card>
        </q-slide-item>
      </div>
    </div>

    <BotonAccionSticky
      etiqueta="Crear lista"
      icono="add"
      class="boton-crear-lista-sticky"
      @click="abrirDialogoLista()"
    />

    <q-dialog v-model="dialogoListaAbierto" @hide="limpiarDialogo">
      <q-card class="dialogo-lista">
        <q-card-section>
          <div class="text-h6">{{ listaEnEdicion ? 'Editar lista' : 'Nueva lista' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="nombreLista"
            outlined
            dense
            autofocus
            label="Nombre"
            :placeholder="placeholderNombre"
            @keyup.enter="guardarLista"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps color="grey-7" label="Cancelar" @click="dialogoListaAbierto = false" />
          <q-btn
            unelevated
            no-caps
            color="secondary"
            :label="listaEnEdicion ? 'Guardar' : 'Crear'"
            :disable="!nombreLista.trim()"
            @click="guardarLista"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { IconEdit, IconListDetails, IconTrash } from '@tabler/icons-vue'
import { useListaJustaStore } from '../../almacenamiento/stores/ListaJustaStore.js'
import BotonConfirmacionEliminar from '../../components/Compartidos/BotonConfirmacionEliminar.vue'
import BotonAccionSticky from '../../components/Compartidos/BotonAccionSticky.vue'

const router = useRouter()
const quasar = useQuasar()
const listaJustaStore = useListaJustaStore()

const dialogoListaAbierto = ref(false)
const nombreLista = ref('')
const listaEnEdicion = ref(null)

const placeholderNombre = computed(() => {
  const ejemplos = ['Compra semanal', 'Asado del sábado', 'Cumple de Leo']
  const indice = Math.floor(Math.random() * ejemplos.length)
  return ejemplos[indice]
})

function abrirDialogoLista(lista = null) {
  listaEnEdicion.value = lista
  nombreLista.value = lista?.nombre || ''
  dialogoListaAbierto.value = true
}

function limpiarDialogo() {
  listaEnEdicion.value = null
  nombreLista.value = ''
}

async function guardarLista() {
  const nombre = nombreLista.value.trim()
  if (!nombre) return

  try {
    if (listaEnEdicion.value) {
      await listaJustaStore.actualizarNombreLista(listaEnEdicion.value.id, nombre)
    } else {
      const nuevaLista = await listaJustaStore.crearLista(nombre)
      await router.push(`/lista-justa/${nuevaLista.id}`)
    }

    dialogoListaAbierto.value = false
  } catch {
    quasar.notify({
      type: 'negative',
      message: 'No se pudo guardar la lista.',
      position: 'top',
    })
  }
}

async function abrirLista(listaId) {
  await listaJustaStore.registrarUsoLista(listaId)
  router.push(`/lista-justa/${listaId}`)
}

function estimadoDeLista(lista) {
  return listaJustaStore.estimadoLista(lista)
}
function resumenComercioLista(lista) {
  const nombre = String(lista?.comercioActual?.nombre || '').trim()
  const direccion = String(lista?.comercioActual?.direccionNombre || '').trim()

  return {
    tieneComercio: Boolean(nombre),
    nombre,
    direccion,
  }
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0))
}

async function reiniciarLista(listaId) {
  await listaJustaStore.reiniciarLista(listaId)
  quasar.notify({
    type: 'info',
    message: 'Lista reiniciada.',
    position: 'top',
  })
}

async function eliminarLista(listaId) {
  await listaJustaStore.eliminarLista(listaId)
  quasar.notify({
    type: 'positive',
    message: 'Lista eliminada.',
    position: 'top',
  })
}

async function onSwipeLargoLista(listaId, detalles) {
  detalles?.reset?.()
  await eliminarLista(listaId)
}

onMounted(async () => {
  await listaJustaStore.cargarListas()
})
</script>

<style scoped>
.pagina-lista-justa {
  padding-bottom: calc(84px + var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px));
}
.estado-vacio {
  text-align: center;
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-color);
  border-radius: 14px;
}
.columna-listas {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.slide-lista {
  border-radius: 14px;
}
.tarjeta-lista {
  border-radius: 14px;
  background: var(--fondo-tarjeta);
  border-color: var(--borde-color);
}
.fila-superior-lista {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.acciones-superiores-lista {
  display: flex;
  align-items: center;
  gap: 6px;
}
.resumen-comercio-lista {
  margin-top: 2px;
}
.resumen-comercio-lista-nombre {
  font-size: 12px;
  font-weight: 700;
  color: var(--texto-primario);
  line-height: 1.2;
}
.resumen-comercio-lista-direccion {
  margin-top: 1px;
  font-size: 11px;
  color: var(--texto-secundario);
  line-height: 1.2;
}
.fila-estimado {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.etiqueta-estimado {
  color: var(--texto-secundario);
  font-size: 13px;
}
.monto-estimado {
  font-weight: 700;
  color: var(--texto-primario);
}
.acciones-lista {
  gap: 4px;
  align-items: center;
}
.swipe-destruccion {
  height: 100%;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--texto-sobre-primario);
  font-weight: 600;
}
.dialogo-lista {
  width: min(92vw, 420px);
  border-radius: 14px;
}
.boton-crear-lista-sticky {
  margin-top: 8px;
}
</style>
