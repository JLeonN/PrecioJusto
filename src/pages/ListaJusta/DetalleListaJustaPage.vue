<template>
  <q-page class="q-pa-md pagina-detalle-lista">
    <div class="contenedor-pagina">
      <div v-if="!listaActual" class="text-center q-pa-xl">
        <q-icon name="error_outline" size="52px" color="negative" />
        <p class="text-h6 q-mt-md q-mb-sm">No se encontró la lista</p>
        <q-btn flat no-caps color="secondary" label="Volver a Lista Justa" @click="router.push('/lista-justa')" />
      </div>

      <template v-else>
        <div class="encabezado-detalle q-mb-md">
          <q-btn flat round dense icon="arrow_back" color="secondary" @click="router.push('/lista-justa')" />
          <div class="encabezado-detalle-texto">
            <h5 class="titulo-pagina">{{ listaActual.nombre }}</h5>
            <div class="fila-contadores">
              <p class="contador-items q-mb-none">{{ productosComprados }} de {{ totalProductos }} comprados</p>
              <p class="contador-items contador-items-derecha q-mb-none">
                {{ contadorItemsComprados }} de {{ contadorItemsTotales }} ítems
              </p>
            </div>
          </div>
        </div>

        <div class="q-mb-sm fila-filtros">
          <q-btn-toggle
            v-model="filtroEstado"
            spread
            unelevated
            no-caps
            toggle-color="secondary"
            :options="opcionesFiltro"
          />
        </div>

        <q-banner v-if="itemsFiltrados.length === 0" class="q-mb-md" rounded>
          {{ mensajeFiltro }}
        </q-banner>

        <q-expansion-item
          class="bloque-comercio q-mb-sm"
          dense
          dense-toggle
          icon="store"
          label="Comercio actual (opcional)"
        >
          <div class="q-pa-sm">
            <div v-if="resumenComercioActual.tieneComercio" class="resumen-comercio-actual q-mb-sm">
              <div class="resumen-comercio-actual-nombre">{{ resumenComercioActual.nombre }}</div>
              <div v-if="resumenComercioActual.direccion" class="resumen-comercio-actual-direccion">
                {{ resumenComercioActual.direccion }}
              </div>
            </div>
            <SelectorComercioDireccion
              v-model="comercioSesionLista"
              label-comercio="Comercio actual"
              label-direccion="Dirección actual (opcional)"
            />
          </div>
        </q-expansion-item>

        <div class="lista-items">
          <q-slide-item
            v-for="item in itemsFiltrados"
            :key="item.id"
            right-color="negative"
            class="slide-item"
            @right="onSwipeLargoItem(item.id, $event)"
          >
            <template #right>
              <div class="swipe-destruccion">
                <IconTrash :size="20" />
                <span>¿Borrar?</span>
                <q-btn
                  flat
                  dense
                  round
                  color="white"
                  icon="delete"
                  @click.stop="eliminarItem(item.id)"
                />
              </div>
            </template>

            <q-card flat bordered class="tarjeta-item" :class="{ 'tarjeta-item-comprado': item.comprado }">
              <q-card-section class="q-pa-sm fila-item">
                <div class="columna-imagen">
                  <q-img
                    v-if="item.imagen"
                    :src="item.imagen"
                    :alt="item.nombre"
                    class="imagen-item"
                    fit="cover"
                  />
                  <div v-else class="imagen-item imagen-item-vacia">
                    <IconShoppingBag :size="18" />
                  </div>
                </div>

                <div class="columna-info">
                  <div class="fila-nombre">
                    <div class="contenido-nombre-item">
                      <span class="chip-tipo-item">{{ etiquetaTipoItem(item) }}</span>
                      <template v-if="itemEditandoId === item.id && esItemManual(item)">
                        <q-input
                          v-model="edicionInline.nombre"
                          dense
                          outlined
                          label="Nombre"
                          @keyup.enter="guardarEdicionInline(item.id)"
                        />
                      </template>
                      <template v-else>
                        <div class="nombre-item">{{ item.nombre || 'Sin nombre' }}</div>
                      </template>
                    </div>

                    <q-btn
                      flat
                      round
                      dense
                      color="secondary"
                      :icon="itemEditandoId === item.id ? 'check' : 'edit'"
                      @click="toggleEdicionInline(item)"
                    />
                  </div>

                  <div class="fila-precio">
                    <template v-if="itemEditandoId === item.id">
                      <div class="fila-edicion-precio">
                        <q-input
                          v-model="edicionInline.precioTexto"
                          dense
                          outlined
                          type="text"
                          inputmode="decimal"
                          label="Precio"
                          @update:model-value="(valor) => { edicionInline.precioTexto = filtrarInputPrecio(valor) }"
                          @blur="edicionInline.precioTexto = formatearPrecioAlSalir(edicionInline.precioTexto)"
                          @keydown="soloNumerosDecimales"
                          @keyup.enter="guardarEdicionInline(item.id)"
                        />
                        <q-select
                          v-model="edicionInline.moneda"
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Moneda"
                          :options="opcionesMoneda"
                        />
                      </div>
                    </template>
                    <template v-else>
                      <span class="precio-item">{{ precioFormateado(item) }}</span>
                    </template>
                  </div>

                  <div v-if="mostrarAvisoFaltantes(item)" class="texto-faltante">
                    Faltan datos importantes para completar este producto.
                  </div>

                  <div class="fila-acciones-item">
                    <div class="control-cantidad">
                      <q-btn flat round dense icon="remove" color="secondary" @click="ajustarCantidad(item.id, -1)" />
                      <span>{{ item.cantidad }}</span>
                      <q-btn flat round dense icon="add" color="secondary" @click="ajustarCantidad(item.id, 1)" />
                    </div>

                    <q-btn
                      v-if="puedeEnviarAMesa(item)"
                      flat
                      no-caps
                      color="warning"
                      label="Enviar a Mesa de trabajo"
                      @click="enviarAMesa(item.id)"
                    />

                    <q-chip
                      v-if="item.estadoDerivacion === 'enMesa'"
                      dense
                      color="orange"
                      text-color="white"
                    >
                      En Mesa de trabajo
                    </q-chip>
                  </div>
                </div>

                <div class="columna-check">
                  <q-checkbox
                    :model-value="item.comprado"
                    color="positive"
                    checked-icon="check_circle"
                    unchecked-icon="radio_button_unchecked"
                    @update:model-value="alternarComprado(item.id)"
                  />
                </div>
              </q-card-section>
            </q-card>
          </q-slide-item>
        </div>

        <q-banner v-if="compradosSinPrecio > 0" class="q-mt-md" rounded>
          Hay {{ compradosSinPrecio }} producto{{ compradosSinPrecio > 1 ? 's' : '' }} comprado{{ compradosSinPrecio > 1 ? 's' : '' }} sin precio. Se muestra total parcial.
        </q-banner>

        <q-banner v-if="tieneMultiplesMonedasCompradas" class="q-mt-md" rounded>
          Hay productos comprados con distintas monedas. El total mezcla valores sin conversión.
        </q-banner>

        <q-card flat bordered class="resumen-gasto q-mt-md">
          <q-card-section>
            <div class="fila-resumen-gasto">
              <span>{{ etiquetaTotalCalculada }}</span>
              <strong>{{ formatearMoneda(totalCompradoCalculado, monedaTotalCalculada) }}</strong>
            </div>
            <div class="text-caption text-grey-7">Estimación de precios: los valores pueden variar.</div>
          </q-card-section>
        </q-card>
      </template>
    </div>

    <BotonAccionSticky
      v-if="listaActual"
      etiqueta="Agregar producto"
      icono="add"
      @click="dialogoAgregarItemAbierto = true"
    />

    <q-dialog v-model="dialogoAgregarItemAbierto" @hide="limpiarFormularioItem">
      <q-card class="dialogo-agregar-item">
        <q-card-section>
          <div class="text-h6">Agregar producto</div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-sm">
          <q-tabs v-model="modoAlta" dense no-caps class="text-secondary">
            <q-tab name="misProductos" label="Desde Mis Productos" />
            <q-tab name="manual" label="Manual" />
          </q-tabs>

          <div v-if="modoAlta === 'misProductos'" class="q-mt-sm">
            <q-input v-model="textoBusquedaProducto" outlined dense label="Buscar producto" />
            <q-list bordered separator class="lista-productos-origen q-mt-sm">
              <q-item
                v-for="producto in productosFiltrados"
                :key="producto.id"
                clickable
                v-ripple
                @click="seleccionarProductoOrigen(producto)"
                :class="{ 'producto-seleccionado': productoSeleccionado?.id === producto.id }"
              >
                <q-item-section>
                  <q-item-label>{{ producto.nombre }}</q-item-label>
                  <q-item-label caption>{{ producto.marca || 'Sin marca' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <span class="text-caption text-grey-7">
                    {{ formatearMoneda(producto.precioMejor || 0, producto.monedaReferencia || preferenciasStore.monedaDefaultEfectiva) }}
                  </span>
                </q-item-section>
              </q-item>
            </q-list>
            <q-input
              v-model.number="formularioItem.cantidad"
              outlined
              dense
              type="number"
              min="1"
              step="1"
              label="Cantidad"
              class="q-mt-sm"
            />
          </div>

          <div v-else class="q-mt-sm q-gutter-sm">
            <q-input v-model="formularioItem.nombre" outlined dense label="Nombre *" />
            <q-input v-model.number="formularioItem.cantidad" outlined dense type="number" min="1" step="1" label="Cantidad *" />
            <div class="fila-edicion-precio">
              <q-input
                v-model="formularioItem.precioTexto"
                outlined
                dense
                type="text"
                inputmode="decimal"
                label="Precio (opcional)"
                @update:model-value="(valor) => { formularioItem.precioTexto = filtrarInputPrecio(valor) }"
                @blur="formularioItem.precioTexto = formatearPrecioAlSalir(formularioItem.precioTexto)"
                @keydown="soloNumerosDecimales"
              />
              <q-select
                v-model="formularioItem.moneda"
                outlined
                dense
                emit-value
                map-options
                label="Moneda"
                :options="opcionesMoneda"
              />
            </div>
            <q-input v-model="formularioItem.marca" outlined dense label="Marca" />
            <q-input v-model="formularioItem.categoria" outlined dense label="Categoría" />
            <q-input v-model="formularioItem.codigoBarras" outlined dense label="Código de barras" />
            <q-input v-model="formularioItem.gramosOLitros" outlined dense label="Gramos o litros" />
            <q-input v-model="formularioItem.comercio" outlined dense label="Comercio" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="acciones-safe-area-publicidad">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="dialogoAgregarItemAbierto = false" />
          <q-btn unelevated no-caps label="Agregar" color="secondary" :disable="!formularioValido" @click="confirmarAgregarItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { IconShoppingBag, IconTrash } from '@tabler/icons-vue'
import { MONEDAS } from '../../almacenamiento/constantes/Monedas.js'
import SelectorComercioDireccion from '../../components/Compartidos/SelectorComercioDireccion.vue'
import BotonAccionSticky from '../../components/Compartidos/BotonAccionSticky.vue'
import { useListaJustaStore } from '../../almacenamiento/stores/ListaJustaStore.js'
import { useProductosStore } from '../../almacenamiento/stores/productosStore.js'
import { usePreferenciasStore } from '../../almacenamiento/stores/preferenciasStore.js'
import { useSesionEscaneoStore } from '../../almacenamiento/stores/sesionEscaneoStore.js'
import {
  filtrarInputPrecio,
  formatearPrecioAlSalir,
  formatearPrecioConCodigo,
  soloNumerosDecimales,
} from '../../utils/PrecioUtils.js'

const route = useRoute()
const router = useRouter()
const quasar = useQuasar()

const listaJustaStore = useListaJustaStore()
const productosStore = useProductosStore()
const preferenciasStore = usePreferenciasStore()
const sesionEscaneoStore = useSesionEscaneoStore()

const filtroEstado = ref('pendientes')

const dialogoAgregarItemAbierto = ref(false)
const modoAlta = ref('misProductos')
const textoBusquedaProducto = ref('')
const productoSeleccionado = ref(null)

const itemEditandoId = ref(null)
const edicionInline = reactive({
  nombre: '',
  precioTexto: '',
  moneda: 'UYU',
})

const formularioItem = reactive({
  nombre: '',
  cantidad: 1,
  precioTexto: '',
  moneda: 'UYU',
  marca: '',
  categoria: '',
  codigoBarras: '',
  gramosOLitros: '',
  comercio: '',
})

const opcionesFiltro = [
  { label: 'Pendientes', value: 'pendientes' },
  { label: 'Comprados', value: 'comprados' },
  { label: 'Todos', value: 'todos' },
]
const opcionesMoneda = MONEDAS

const listaActual = computed(() => listaJustaStore.obtenerListaPorId(route.params.id))
const comercioSesionLista = computed({
  get() {
    return listaActual.value?.comercioActual || null
  },
  set(valor) {
    if (!listaActual.value) return
    listaJustaStore.actualizarComercioLista(listaActual.value.id, valor)
  },
})
const resumenComercioActual = computed(() => {
  const nombre = String(comercioSesionLista.value?.nombre || '').trim()
  const direccion = String(comercioSesionLista.value?.direccionNombre || '').trim()

  return {
    tieneComercio: Boolean(nombre),
    nombre,
    direccion,
  }
})

const totalProductos = computed(() => (listaActual.value ? listaActual.value.items.length : 0))
const productosComprados = computed(() => {
  if (!listaActual.value) return 0
  return listaActual.value.items.filter((item) => item.comprado).length
})
const contadorItemsTotales = computed(() => {
  if (!listaActual.value) return 0
  return listaActual.value.items.reduce((acumulado, item) => acumulado + Number(item.cantidad || 0), 0)
})
const contadorItemsComprados = computed(() => {
  if (!listaActual.value) return 0
  return listaActual.value.items
    .filter((item) => item.comprado)
    .reduce((acumulado, item) => acumulado + Number(item.cantidad || 0), 0)
})
const totalCompradoCalculado = computed(() => {
  if (!listaActual.value) return 0

  return listaActual.value.items.reduce((acumulado, item) => {
    if (!item.comprado) return acumulado

    const precio = Number(precioVisual(item))
    if (!Number.isFinite(precio) || precio <= 0) return acumulado

    const cantidad = Number(item.cantidad || 0)
    return acumulado + precio * cantidad
  }, 0)
})
const compradosSinPrecio = computed(() => {
  if (!listaActual.value) return 0

  return listaActual.value.items.filter((item) => {
    if (!item.comprado) return false
    const precio = Number(precioVisual(item))
    return !Number.isFinite(precio) || precio <= 0
  }).length
})
const etiquetaTotalCalculada = computed(() => {
  if (tieneMultiplesMonedasCompradas.value) return 'Total mixto'
  return compradosSinPrecio.value > 0 ? 'Total parcial' : 'Total'
})

const itemsOrdenados = computed(() => {
  if (!listaActual.value) return []

  const pendientes = listaActual.value.items.filter((item) => !item.comprado)
  const comprados = listaActual.value.items.filter((item) => item.comprado)
  return [...pendientes, ...comprados]
})

const itemsFiltrados = computed(() => {
  if (filtroEstado.value === 'pendientes') {
    return itemsOrdenados.value.filter((item) => !item.comprado)
  }

  if (filtroEstado.value === 'comprados') {
    return itemsOrdenados.value.filter((item) => item.comprado)
  }

  return itemsOrdenados.value
})

const mensajeFiltro = computed(() => {
  if (!listaActual.value) return ''

  if (listaActual.value.items.length === 0) {
    return 'La lista está vacía. Usá “Agregar producto” para empezar.'
  }

  if (filtroEstado.value === 'pendientes') {
    return 'No hay pendientes en este momento.'
  }

  if (filtroEstado.value === 'comprados') {
    return 'Todavía no marcaste productos como comprados.'
  }

  return 'No hay items para mostrar.'
})

const productosFiltrados = computed(() => {
  const texto = textoBusquedaProducto.value.trim().toLowerCase()

  if (!texto) return productosStore.productosPorInteraccion.slice(0, 40)

  return productosStore.productosPorInteraccion
    .filter((producto) => {
      const nombre = String(producto.nombre || '').toLowerCase()
      const marca = String(producto.marca || '').toLowerCase()
      const categoria = String(producto.categoria || '').toLowerCase()
      const codigo = String(producto.codigoBarras || '').toLowerCase()
      return nombre.includes(texto) || marca.includes(texto) || categoria.includes(texto) || codigo.includes(texto)
    })
    .slice(0, 40)
})

const formularioValido = computed(() => {
  if (modoAlta.value === 'misProductos') {
    return Boolean(productoSeleccionado.value?.id) && Number(formularioItem.cantidad) > 0
  }

  return Boolean(formularioItem.nombre.trim()) && Number(formularioItem.cantidad) > 0
})
const monedasCompradas = computed(() => {
  if (!listaActual.value) return []

  const monedas = listaActual.value.items
    .filter((item) => item.comprado)
    .map((item) => precioVisualDetallado(item).moneda)
    .filter(Boolean)

  return [...new Set(monedas)]
})
const tieneMultiplesMonedasCompradas = computed(() => monedasCompradas.value.length > 1)
const monedaTotalCalculada = computed(() => {
  if (monedasCompradas.value.length === 1) return monedasCompradas.value[0]
  return preferenciasStore.monedaDefaultEfectiva
})

function formatearMoneda(valor, moneda = preferenciasStore.monedaDefaultEfectiva) {
  return formatearPrecioConCodigo(valor, moneda)
}

function precioVisualDetallado(item) {
  if (comercioSesionLista.value?.id || comercioSesionLista.value?.direccionId) {
    const producto = item.productoId ? productosStore.obtenerProductoPorId(item.productoId) : null
    const precioComercioActivo = producto?.precios?.find((precio) => {
      const coincideComercio = comercioSesionLista.value?.id
        ? precio.comercioId === comercioSesionLista.value.id
        : true
      const coincideDireccion = comercioSesionLista.value?.direccionId
        ? precio.direccionId === comercioSesionLista.value.direccionId
        : true
      return coincideComercio && coincideDireccion
    })

    if (precioComercioActivo?.valor) {
      return {
        valor: Number(precioComercioActivo.valor),
        moneda: precioComercioActivo.moneda || producto?.monedaReferencia || item.moneda || preferenciasStore.monedaDefaultEfectiva,
      }
    }
  }

  if (Number.isFinite(Number(item.precioManual)) && Number(item.precioManual) > 0) {
    return {
      valor: Number(item.precioManual),
      moneda: item.moneda || preferenciasStore.monedaDefaultEfectiva,
    }
  }

  if (!item.productoId) {
    return {
      valor: null,
      moneda: item.moneda || preferenciasStore.monedaDefaultEfectiva,
    }
  }

  const producto = productosStore.obtenerProductoPorId(item.productoId)
  const precioProducto = listaJustaStore.obtenerPrecioVisualItem(item)

  return {
    valor: precioProducto,
    moneda: producto?.monedaReferencia || item.moneda || preferenciasStore.monedaDefaultEfectiva,
  }
}

function precioVisual(item) {
  return precioVisualDetallado(item).valor
}

function precioFormateado(item) {
  const precio = precioVisualDetallado(item)
  if (!Number.isFinite(precio.valor)) return 'Sin precio'
  return formatearMoneda(precio.valor, precio.moneda)
}

function mostrarAvisoFaltantes(item) {
  return !item.nombre || !Number.isFinite(precioVisual(item))
}

function esItemManual(item) {
  return item.origen !== 'misProductos'
}

function etiquetaTipoItem(item) {
  return esItemManual(item) ? 'Manual' : 'Mis Productos'
}

function puedeEnviarAMesa(item) {
  if (!esItemManual(item)) return false
  if (item.estadoDerivacion === 'enMesa') return false
  if (item.estadoDerivacion === 'enMisProductos') return false
  return true
}

async function alternarComprado(itemId) {
  if (!listaActual.value) return

  const ok = await listaJustaStore.alternarComprado(listaActual.value.id, itemId)
  if (!ok) return

  const item = listaActual.value.items.find((actual) => actual.id === itemId)
  if (!item || !item.comprado) return

  quasar.notify({
    type: 'positive',
    message: 'Marcado como comprado.',
    position: 'top',
    timeout: 1800,
    actions: [
      {
        label: 'Deshacer',
        color: 'white',
        handler: () => {
          listaJustaStore.alternarComprado(listaActual.value.id, itemId)
        },
      },
    ],
  })
}

async function ajustarCantidad(itemId, variacion) {
  if (!listaActual.value) return
  await listaJustaStore.ajustarCantidad(listaActual.value.id, itemId, variacion)
}

function toggleEdicionInline(item) {
  if (itemEditandoId.value === item.id) {
    guardarEdicionInline(item.id)
    return
  }

  itemEditandoId.value = item.id
  edicionInline.nombre = item.nombre
  edicionInline.precioTexto = formatearPrecioAlSalir(
    item.precioManual != null ? String(item.precioManual) : String(precioVisual(item) || ''),
  )
  edicionInline.moneda = precioVisualDetallado(item).moneda || preferenciasStore.monedaDefaultEfectiva
}

async function guardarEdicionInline(itemId) {
  if (!listaActual.value) return

  const item = listaActual.value.items.find((actual) => actual.id === itemId)
  if (!item) return

  const precioNumero = parseFloat(edicionInline.precioTexto)

  const cambios = {
    precioManual: Number.isFinite(precioNumero) && precioNumero > 0 ? precioNumero : null,
    moneda: edicionInline.moneda || preferenciasStore.monedaDefaultEfectiva,
  }

  if (esItemManual(item)) {
    cambios.nombre = edicionInline.nombre
  }

  const actualizado = await listaJustaStore.actualizarItem(listaActual.value.id, itemId, cambios)
  if (!actualizado) {
    quasar.notify({
      type: 'warning',
      message: 'No se pudo guardar la edición rápida.',
      position: 'top',
    })
    return
  }

  itemEditandoId.value = null
}

async function eliminarItem(itemId) {
  if (!listaActual.value) return
  await listaJustaStore.eliminarItem(listaActual.value.id, itemId)
}

async function onSwipeLargoItem(itemId, detalles) {
  detalles?.reset?.()
  await eliminarItem(itemId)
}

async function enviarAMesa(itemId) {
  if (!listaActual.value) return

  const enviado = await listaJustaStore.enviarItemAMesaTrabajo(listaActual.value.id, itemId)

  if (!enviado) {
    quasar.notify({ type: 'warning', message: 'No se pudo enviar a Mesa de trabajo.', position: 'top' })
    return
  }

  quasar.notify({ type: 'info', message: 'Item enviado a Mesa de trabajo.', position: 'top' })
}

function seleccionarProductoOrigen(producto) {
  productoSeleccionado.value = producto
}

async function confirmarAgregarItem() {
  if (!listaActual.value || !formularioValido.value) return

  let payload

  if (modoAlta.value === 'misProductos') {
    const producto = productoSeleccionado.value
    payload = {
      productoId: producto.id,
      origen: 'misProductos',
      nombre: producto.nombre,
      cantidad: formularioItem.cantidad,
      precioManual: null,
      moneda: producto.monedaReferencia || preferenciasStore.monedaDefaultEfectiva,
      codigoBarras: producto.codigoBarras,
      marca: producto.marca,
      categoria: producto.categoria,
      gramosOLitros: producto.gramosOLitros,
      comercio: producto.comercioMejor,
      unidad: producto.unidad || 'unidad',
      imagen: producto.imagen,
      estadoDerivacion: 'enMisProductos',
    }
  } else {
    payload = {
      productoId: null,
      origen: 'manual',
      nombre: formularioItem.nombre,
      cantidad: formularioItem.cantidad,
      precioManual: parseFloat(formularioItem.precioTexto) || null,
      moneda: formularioItem.moneda || preferenciasStore.monedaDefaultEfectiva,
      codigoBarras: formularioItem.codigoBarras,
      marca: formularioItem.marca,
      categoria: formularioItem.categoria,
      gramosOLitros: formularioItem.gramosOLitros,
      comercio: formularioItem.comercio,
      unidad: 'unidad',
      imagen: null,
      estadoDerivacion: 'ninguno',
    }
  }

  const resultado = await listaJustaStore.agregarItem(listaActual.value.id, payload)

  if (!resultado.exito) {
    if (resultado.motivo === 'duplicado') {
      quasar.notify({
        type: 'warning',
        message: 'Ese producto ya está en la lista.',
        position: 'top',
      })
      return
    }

    quasar.notify({
      type: 'warning',
      message: 'Completá al menos nombre y cantidad.',
      position: 'top',
    })
    return
  }

  dialogoAgregarItemAbierto.value = false
  limpiarFormularioItem()
}

function limpiarFormularioItem() {
  modoAlta.value = 'misProductos'
  textoBusquedaProducto.value = ''
  productoSeleccionado.value = null
  formularioItem.nombre = ''
  formularioItem.cantidad = 1
  formularioItem.precioTexto = ''
  formularioItem.moneda = preferenciasStore.monedaDefaultEfectiva
  formularioItem.marca = ''
  formularioItem.categoria = ''
  formularioItem.codigoBarras = ''
  formularioItem.gramosOLitros = ''
  formularioItem.comercio = ''
}

watch(
  () => productosStore.productos,
  async () => {
    await listaJustaStore.sincronizarRelacionConMisProductos()
  },
  { deep: true },
)

watch(
  () => sesionEscaneoStore.items,
  async () => {
    await listaJustaStore.sincronizarEstadosMesaTrabajo()
  },
  { deep: true },
)

onMounted(async () => {
  await Promise.all([
    listaJustaStore.cargarListas(),
    productosStore.cargarProductos(),
    preferenciasStore.inicializar(),
    sesionEscaneoStore.cargarSesion(),
  ])
  await listaJustaStore.registrarUsoLista(route.params.id)
  await listaJustaStore.sincronizarRelacionConMisProductos()
  await listaJustaStore.sincronizarEstadosMesaTrabajo()
  formularioItem.moneda = preferenciasStore.monedaDefaultEfectiva
})
</script>

<style scoped>
.pagina-detalle-lista {
  padding-bottom: calc(104px + var(--safe-area-bottom));
}
.encabezado-detalle {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
}
.encabezado-detalle-texto {
  min-width: 0;
}
.fila-contadores {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.contador-items-derecha {
  margin-left: auto;
  text-align: right;
}
.fila-filtros {
  margin-bottom: 10px;
}
.bloque-comercio {
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-tarjeta);
}
.resumen-comercio-actual {
  padding: 8px 10px;
  border: 1px solid var(--borde-color);
  border-radius: 10px;
  background: var(--fondo-app-secundario);
}
.resumen-comercio-actual-nombre {
  font-size: 14px;
  font-weight: 700;
  color: var(--texto-primario);
  line-height: 1.25;
}
.resumen-comercio-actual-direccion {
  margin-top: 2px;
  font-size: 12px;
  color: var(--texto-secundario);
  line-height: 1.2;
}
.lista-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.slide-item {
  border-radius: 14px;
}
.tarjeta-item {
  border-radius: 14px;
  border-color: var(--borde-color);
  background: var(--fondo-tarjeta);
  transition: opacity 0.2s ease;
}
.tarjeta-item-comprado {
  opacity: 0.72;
}
.fila-item {
  display: grid;
  grid-template-columns: 68px 1fr auto;
  gap: 10px;
  align-items: start;
}
.columna-imagen {
  width: 68px;
}
.imagen-item {
  width: 68px;
  height: 68px;
  border-radius: 10px;
}
.imagen-item-vacia {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--borde-color);
  color: var(--texto-secundario);
  background: var(--fondo-app-secundario);
}
.columna-info {
  min-width: 0;
}
.fila-nombre {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  align-items: center;
}
.contenido-nombre-item {
  min-width: 0;
}
.chip-tipo-item {
  display: inline-flex;
  margin-bottom: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: var(--texto-secundario);
  background: var(--fondo-app-secundario);
  border: 1px solid var(--borde-color);
}
.nombre-item {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.2;
}
.fila-precio {
  margin-top: 4px;
}
.fila-edicion-precio {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 8px;
}
.precio-item {
  font-weight: 700;
  color: var(--color-secundario);
}
.texto-faltante {
  margin-top: 6px;
  color: var(--color-advertencia);
  font-size: 12px;
}
.fila-acciones-item {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.control-cantidad {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--borde-color);
  border-radius: 999px;
  padding: 2px 6px;
}
.columna-check {
  padding-top: 2px;
}
.swipe-destruccion {
  height: 100%;
  width: 136px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--texto-sobre-primario);
  font-weight: 600;
}
.resumen-gasto {
  border-radius: 12px;
  border-color: var(--borde-color);
  margin-bottom: calc(96px + var(--safe-area-bottom));
}
.fila-resumen-gasto {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}
.dialogo-agregar-item {
  width: min(92vw, 620px);
  border-radius: 14px;
}
.lista-productos-origen {
  max-height: 220px;
  overflow: auto;
  border-radius: 10px;
}
.producto-seleccionado {
  background: color-mix(in srgb, var(--color-secundario) 14%, transparent);
}
@media (max-width: 760px) {
  .contador-items-derecha {
    margin-left: 0;
    width: 100%;
    text-align: left;
  }
  .fila-item {
    grid-template-columns: 56px 1fr auto;
  }
  .fila-edicion-precio {
    grid-template-columns: 1fr;
  }
  .imagen-item {
    width: 56px;
    height: 56px;
  }
}
</style>
