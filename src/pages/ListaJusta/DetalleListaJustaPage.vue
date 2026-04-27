<template>
  <q-page class="q-pa-md pagina-detalle-lista">
    <div class="contenedor-pagina">
      <div v-if="!listaActual" class="text-center q-pa-xl">
        <q-icon name="error_outline" size="52px" color="negative" />
        <p class="text-h6 q-mt-md q-mb-sm">No se encontró la lista</p>
        <q-btn
          flat
          no-caps
          color="secondary"
          label="Volver a Lista Justa"
          @click="router.push('/')"
        />
      </div>

      <template v-else>
        <div class="encabezado-detalle q-mb-md">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            color="secondary"
            @click="router.push('/')"
          />
          <div class="encabezado-detalle-texto">
            <h5 class="titulo-pagina">{{ listaActual.nombre }}</h5>
            <div class="fila-contadores">
              <p class="contador-items q-mb-none">
                {{ productosComprados }} de {{ totalProductos }} comprados
              </p>
              <p class="contador-items contador-items-derecha q-mb-none">
                {{ contadorItemsComprados }} de {{ contadorItemsTotales }} ítems
              </p>
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="auto_awesome"
            color="secondary"
            class="boton-lista-inteligente"
            aria-label="Abrir lista inteligente"
            @click="irAListaInteligente"
          />
        </div>

        <div class="fila-filtros-sticky">
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
        </div>

        <q-banner v-if="itemsFiltrados.length === 0" class="q-mb-md" rounded>
          {{ mensajeFiltro }}
        </q-banner>

<q-expansion-item
  class="bloque-comercio q-mb-sm"
  dense
  dense-toggle
  icon="store"
  :label="resumenComercioActual.tieneComercio ? resumenComercioActual.nombre : 'Seleccione comercio aquí'"
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

            <q-card
              flat
              bordered
              class="tarjeta-item"
              :class="{
                'tarjeta-item-comprado': item.comprado,
                'tarjeta-item-editando': itemEditandoId === item.id,
              }"
            >
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

                <div class="columna-info-principal">
                  <div class="fila-nombre">
                    <div class="contenido-nombre-item">
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

                    <div class="fila-botones-nombre">
                      <q-btn
                        v-if="puedeRestaurarPrecios(item)"
                        flat
                        round
                        dense
                        color="grey-7"
                        icon="restart_alt"
                        @click="restaurarPreciosItem(item.id)"
                      />
                      <q-btn
                        flat
                        round
                        dense
                        color="secondary"
                        :icon="itemEditandoId === item.id ? 'check' : 'edit'"
                        @click="toggleEdicionInline(item)"
                      />
                    </div>
                  </div>

                  <div class="fila-precio">
                    <template v-if="itemEditandoId === item.id">
                      <div class="editor-inline-item">
                        <div class="fila-edicion-precio">
                          <q-input
                            v-model="edicionInline.precioTexto"
                            dense
                            outlined
                            type="text"
                            inputmode="decimal"
                            label="Precio"
                            @update:model-value="
                              (valor) => {
                                edicionInline.precioTexto = filtrarInputPrecio(valor)
                              }
                            "
                            @blur="
                              edicionInline.precioTexto = formatearPrecioAlSalir(
                                edicionInline.precioTexto,
                              )
                            "
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
                        <div class="fila-acciones-edicion">
                          <q-btn
                            flat
                            no-caps
                            color="grey-7"
                            label="Cancelar"
                            @click="cancelarEdicionInline"
                          />
                          <q-btn
                            unelevated
                            no-caps
                            color="secondary"
                            label="Guardar"
                            @click="guardarEdicionInline(item.id)"
                          />
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="bloque-precio-item">
                        <span class="precio-item">{{ precioFormateado(item) }}</span>
                      </div>
                    </template>
                  </div>
                </div>

                <div class="contenido-secundario-item">
                  <div
                    v-if="itemEditandoId === item.id"
                    class="bloque-mayoristas-edicion q-mb-sm"
                  >
                    <BloqueEscalasCantidad
                      :ref="asignarRefBloqueEscalasEdicion"
                      v-model="datosEscalasEdicion"
                      :precio-base="precioBaseEdicion"
                    />
                  </div>
                  <q-btn
                    v-if="itemEditandoId !== item.id && tieneMayoristasParaMostrar(item)"
                    unelevated
                    no-caps
                    color="secondary"
                    class="boton-mayoristas-item"
                    :label="textoBotonMayoristas(item)"
                    @click="toggleMayoristasItem(item.id)"
                  />
                  <div
                    v-if="itemEditandoId !== item.id && mostrarDetalleMayoristas(item)"
                    class="detalle-mayoristas-item"
                  >
                    <div
                      v-for="grupo in gruposMayoristasItem(item)"
                      :key="grupo.clave"
                      class="grupo-mayorista-item"
                    >
                      <div v-if="grupo.etiqueta" class="grupo-mayorista-item-etiqueta">
                        {{ grupo.etiqueta }}
                      </div>
                      <div
                        v-for="escala in grupo.escalas"
                        :key="`${grupo.clave}_${escala.cantidadMinima}_${escala.precioUnitario}`"
                        class="fila-mayorista-item"
                        :class="{ 'fila-mayorista-item-activa': escala.activa }"
                      >
                        <span>{{ textoEscalaMayorista(escala) }}</span>
                        <strong>{{ textoPrecioEscalaMayorista(escala, grupo.moneda) }}</strong>
                      </div>
                    </div>
                  </div>

                  <div class="fila-acciones-item">
                    <div class="fila-cantidad-y-subtotal">
                      <div class="control-cantidad">
                        <q-btn
                          flat
                          round
                          dense
                          icon="remove"
                          color="secondary"
                          @click="ajustarCantidad(item.id, -1)"
                        />
                        <span>{{ item.cantidad }}</span>
                        <q-btn
                          flat
                          round
                          dense
                          icon="add"
                          color="secondary"
                          @click="ajustarCantidad(item.id, 1)"
                        />
                      </div>

                      <div v-if="mostrarSubtotalItem(item)" class="subtotal-item">
                        {{ subtotalItemFormateado(item) }}
                      </div>
                    </div>

                    <div class="acciones-secundarias-item">
                      <q-btn
                        v-if="puedeEnviarAMesa(item)"
                        unelevated
                        no-caps
                        color="warning"
                        class="boton-enviar-mesa"
                        label="Enviar a Mesa de trabajo"
                        @click="enviarAMesa(item.id)"
                      />

                      <q-chip
                        v-if="item.estadoDerivacion === 'enMesa'"
                        dense
                        color="orange"
                        text-color="white"
                        class="chip-mesa-trabajo"
                      >
                        En Mesa de trabajo
                      </q-chip>
                    </div>
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
          Hay {{ compradosSinPrecio }} producto{{ compradosSinPrecio > 1 ? 's' : '' }} comprado{{
            compradosSinPrecio > 1 ? 's' : ''
          }}
          sin precio. Se muestra total parcial.
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
            <div class="text-caption text-grey-7">
              Estimación de precios: los valores pueden variar.
            </div>
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
        <q-card-section class="encabezado-dialogo-agregar-item">
          <div class="text-h6">Agregar producto</div>
          <div v-if="modoAlta === 'misProductos'" class="contador-productos-seleccionados">
            <span class="contador-productos-seleccionados-valor">{{
              cantidadProductosSeleccionados
            }}</span>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-sm">
          <q-tabs v-model="modoAlta" dense no-caps class="text-secondary">
            <q-tab name="misProductos" label="Desde Mis Productos" />
            <q-tab name="manual" label="Manual" />
          </q-tabs>

          <div v-if="modoAlta === 'misProductos'" class="q-mt-sm">
            <div class="encabezado-seleccion-productos">
              <q-input
                v-model="textoBusquedaProducto"
                outlined
                dense
                label="Buscar producto"
                class="buscador-productos-dialogo"
              />
            </div>
            <q-list bordered separator class="lista-productos-origen q-mt-sm">
              <q-item
                v-for="producto in productosFiltrados"
                :key="producto.id"
                clickable
                v-ripple
                class="item-producto-seleccionable"
                :class="{ 'producto-seleccionado': productoEstaSeleccionado(producto.id) }"
                @click="alternarSeleccionProducto(producto.id)"
              >
                <q-item-section class="contenido-item-producto-dialogo">
                  <div class="fila-superior-item-dialogo">
                    <span class="precio-producto-dialogo">
                      {{ precioProductoSeleccion(producto) }}
                    </span>
                  </div>
                  <div class="nombre-producto-dialogo">{{ producto.nombre }}</div>
                </q-item-section>
                <q-item-section side>
                  <div class="control-cantidad control-cantidad-dialogo" @click.stop>
                    <q-btn
                      flat
                      round
                      dense
                      icon="remove"
                      color="secondary"
                      @click.stop="ajustarCantidadSeleccion(producto.id, -1)"
                    />
                    <span>{{ cantidadSeleccionadaProducto(producto.id) }}</span>
                    <q-btn
                      flat
                      round
                      dense
                      icon="add"
                      color="secondary"
                      @click.stop="ajustarCantidadSeleccion(producto.id, 1)"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-else class="q-mt-sm q-gutter-sm">
            <FormularioProducto
              ref="refFormularioProductoManual"
              v-model="formularioProductoManual"
              :mostrar-marca="false"
              :mostrar-foto="false"
              @buscar-codigo="buscarManualPorCodigo"
              @buscar-nombre="buscarManualPorNombre"
              @escanear-codigo="activarEscanerManual"
            />
            <FormularioPrecio
              ref="refFormularioPrecioManual"
              v-model="formularioPrecioManual"
              :mostrar-comercio="false"
              :precio-obligatorio="false"
              etiqueta-precio="Precio (opcional)"
            />
          </div>
        </q-card-section>

        <q-card-actions class="acciones-dialogo-agregar acciones-safe-area-publicidad">
          <div
            v-if="modoAlta === 'misProductos' && cantidadProductosSeleccionados > 0"
            class="resumen-total-seleccion"
          >
            <span class="resumen-total-seleccion-etiqueta">{{ etiquetaTotalSeleccionado }}</span>
            <strong class="resumen-total-seleccion-valor">
              {{ textoTotalProductosSeleccionados }}
            </strong>
          </div>
          <q-btn
            flat
            no-caps
            label="Cancelar"
            color="grey-7"
            @click="dialogoAgregarItemAbierto = false"
          />
          <q-btn
            unelevated
            no-caps
            label="Agregar"
            color="secondary"
            :disable="!formularioValido"
            @click="confirmarAgregarItem"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <DialogoResultadosBusqueda
      v-model="dialogoResultadosManualAbierto"
      :resultados="resultadosBusquedaManual"
      :variante-pie="variantePieBusquedaManual"
      :pie-acciones-loading="pieAccionesBusquedaManual"
      @producto-seleccionado="autocompletarFormularioManual"
      @ampliar-busqueda="ampliarBusquedaManual"
    />

    <EscaneadorCodigo
      :activo="escanerManualActivo"
      @codigo-detectado="alDetectarCodigoManual"
      @cerrar="escanerManualActivo = false"
      @no-disponible="alEscanerManualNoDisponible"
    />
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
import BloqueEscalasCantidad from '../../components/Formularios/BloqueEscalasCantidad.vue'
import FormularioProducto from '../../components/Formularios/FormularioProducto.vue'
import FormularioPrecio from '../../components/Formularios/FormularioPrecio.vue'
import DialogoResultadosBusqueda from '../../components/Formularios/Dialogos/DialogoResultadosBusqueda.vue'
import EscaneadorCodigo from '../../components/Scanner/EscaneadorCodigo.vue'
import { useListaJustaStore } from '../../almacenamiento/stores/ListaJustaStore.js'
import { useProductosStore } from '../../almacenamiento/stores/productosStore.js'
import { usePreferenciasStore } from '../../almacenamiento/stores/preferenciasStore.js'
import { useSesionEscaneoStore } from '../../almacenamiento/stores/sesionEscaneoStore.js'
import busquedaProductosHibridaService from '../../almacenamiento/servicios/BusquedaProductosHibridaService.js'
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
const productosSeleccionados = ref({})
const refFormularioProductoManual = ref(null)
const refFormularioPrecioManual = ref(null)
const refBloqueEscalasEdicion = ref(null)
const dialogoResultadosManualAbierto = ref(false)
const resultadosBusquedaManual = ref([])
const variantePieBusquedaManual = ref(null)
const pieAccionesBusquedaManual = ref(false)
const buscandoConsultaManual = ref(false)
const ultimoCodigoBusquedaManual = ref('')
const ultimoNombreBusquedaManual = ref('')
const escanerManualActivo = ref(false)
const itemsMayoristasExpandidos = ref({})

const itemEditandoId = ref(null)
const edicionInline = reactive({
  nombre: '',
  precioTexto: '',
  moneda: 'UYU',
  activarPreciosMayoristas: false,
  escalasPorCantidad: [],
})
const datosEscalasEdicion = computed({
  get() {
    return {
      activarPreciosMayoristas: Boolean(edicionInline.activarPreciosMayoristas),
      escalasPorCantidad: Array.isArray(edicionInline.escalasPorCantidad)
        ? edicionInline.escalasPorCantidad
        : [],
    }
  },
  set(valor) {
    edicionInline.activarPreciosMayoristas = Boolean(valor?.activarPreciosMayoristas)
    edicionInline.escalasPorCantidad = Array.isArray(valor?.escalasPorCantidad)
      ? valor.escalasPorCantidad
      : []
  },
})
const precioBaseEdicion = computed(() => {
  const precio = parseFloat(edicionInline.precioTexto)
  return Number.isFinite(precio) && precio > 0 ? precio : null
})

const formularioProductoManual = ref({
  nombre: '',
  cantidad: 1,
  unidad: 'unidad',
  codigoBarras: '',
  marca: '',
  categoria: '',
  imagen: null,
})
const formularioPrecioManual = ref({
  comercio: '',
  direccion: '',
  valor: null,
  moneda: 'UYU',
  comercioId: null,
  direccionId: null,
  nombreCompleto: '',
  activarPreciosMayoristas: false,
  escalasPorCantidad: [],
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
  return listaActual.value.items.reduce(
    (acumulado, item) => acumulado + Number(item.cantidad || 0),
    0,
  )
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
      return (
        nombre.includes(texto) ||
        marca.includes(texto) ||
        categoria.includes(texto) ||
        codigo.includes(texto)
      )
    })
    .slice(0, 40)
})
const cantidadProductosSeleccionados = computed(
  () =>
    Object.keys(productosSeleccionados.value).filter(
      (productoId) => Number(productosSeleccionados.value[productoId]) > 0,
    ).length,
)
const productosSeleccionadosParaAgregar = computed(() => {
  return productosStore.productosPorInteraccion
    .filter((producto) => Number(productosSeleccionados.value[producto.id]) > 0)
    .map((producto) => ({
      ...producto,
      cantidadSeleccionada: Number(productosSeleccionados.value[producto.id]) || 0,
    }))
})
const monedasProductosSeleccionados = computed(() => {
  const monedas = productosSeleccionadosParaAgregar.value
    .map((producto) => producto.monedaReferencia || preferenciasStore.monedaDefaultEfectiva)
    .filter(Boolean)

  return [...new Set(monedas)]
})
const tieneMultiplesMonedasSeleccionadas = computed(
  () => monedasProductosSeleccionados.value.length > 1,
)
const monedaTotalSeleccionado = computed(() => {
  if (monedasProductosSeleccionados.value.length === 1)
    return monedasProductosSeleccionados.value[0]
  return preferenciasStore.monedaDefaultEfectiva
})
const totalProductosSeleccionados = computed(() => {
  return productosSeleccionadosParaAgregar.value.reduce((acumulado, producto) => {
    const precioBase = Number(
      obtenerPrecioProductoSeleccion(producto, Number(producto.cantidadSeleccionada || 0)).valor ||
        0,
    )
    const cantidad = Number(producto.cantidadSeleccionada || 0)
    if (!Number.isFinite(precioBase) || precioBase <= 0) return acumulado
    if (!Number.isFinite(cantidad) || cantidad <= 0) return acumulado
    return acumulado + precioBase * cantidad
  }, 0)
})
const etiquetaTotalSeleccionado = computed(() => {
  return tieneMultiplesMonedasSeleccionadas.value ? 'Total mixto' : 'Total'
})
const textoTotalProductosSeleccionados = computed(() => {
  return formatearMoneda(totalProductosSeleccionados.value, monedaTotalSeleccionado.value)
})

const formularioValido = computed(() => {
  if (modoAlta.value === 'misProductos') {
    return cantidadProductosSeleccionados.value > 0
  }

  return Boolean(formularioProductoManual.value.nombre.trim())
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

function normalizarEscalasValidas(escalas) {
  return (Array.isArray(escalas) ? escalas : [])
    .map((escala) => ({
      cantidadMinima: Number(escala?.cantidadMinima),
      precioUnitario: Number(escala?.precioUnitario),
    }))
    .filter(
      (escala) =>
        Number.isFinite(escala.cantidadMinima) &&
        escala.cantidadMinima >= 2 &&
        Number.isFinite(escala.precioUnitario) &&
        escala.precioUnitario > 0,
    )
    .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
}

function aplicarPrecioPorCantidad(precioBase, escalas, cantidad) {
  const base = Number(precioBase)
  const cantidadNormalizada = Number(cantidad)
  const escalasValidas = normalizarEscalasValidas(escalas)
  let valor = Number.isFinite(base) && base > 0 ? base : null
  let usaMayorista = false

  if (Number.isFinite(cantidadNormalizada) && cantidadNormalizada > 0) {
    for (const escala of escalasValidas) {
      if (cantidadNormalizada < escala.cantidadMinima) continue
      if (valor === null || escala.precioUnitario < valor) {
        valor = escala.precioUnitario
        usaMayorista = true
      }
    }
  }

  return {
    valor,
    usaMayorista,
    escalas: escalasValidas.map((escala) => ({
      ...escala,
      activa: Number.isFinite(cantidadNormalizada) && cantidadNormalizada >= escala.cantidadMinima,
    })),
  }
}

function obtenerPreciosVigentesProducto(producto) {
  if (!Array.isArray(producto?.precios) || producto.precios.length === 0) return []

  const mapaVigentes = new Map()

  for (const precio of producto.precios) {
    const clave =
      precio?.comercioId && precio?.direccionId
        ? `${precio.comercioId}_${precio.direccionId}`
        : precio?.nombreCompleto || precio?.comercio || precio?.id
    const actual = mapaVigentes.get(clave)
    if (!actual || new Date(precio.fecha) > new Date(actual.fecha)) {
      mapaVigentes.set(clave, precio)
    }
  }

  return [...mapaVigentes.values()]
}

function filtrarPreciosPorComercio(precios) {
  if (!comercioSesionLista.value?.id && !comercioSesionLista.value?.direccionId) {
    return precios
  }

  return precios.filter((precio) => {
    const coincideComercio = comercioSesionLista.value?.id
      ? precio.comercioId === comercioSesionLista.value.id
      : true
    const coincideDireccion = comercioSesionLista.value?.direccionId
      ? precio.direccionId === comercioSesionLista.value.direccionId
      : true
    return coincideComercio && coincideDireccion
  })
}

function construirGrupoMayorista({ clave, etiqueta, moneda, escalas, precioBase, cantidad }) {
  const resultado = aplicarPrecioPorCantidad(precioBase, escalas, cantidad)
  if (resultado.escalas.length === 0) return null

  return {
    clave,
    etiqueta,
    moneda,
    precioBase: Number(precioBase),
    usaMayorista: resultado.usaMayorista,
    escalas: resultado.escalas,
    mejorPrecioGrupo: resultado.valor,
  }
}

function resolverPrecioProducto(producto, cantidad = 1) {
  const preciosVigentes = obtenerPreciosVigentesProducto(producto)
  const preciosFiltrados = filtrarPreciosPorComercio(preciosVigentes)

  if (preciosFiltrados.length === 0) {
    return {
      valor: null,
      precioBase: null,
      moneda: producto?.monedaReferencia || preferenciasStore.monedaDefaultEfectiva,
      usaMayorista: false,
      gruposMayoristas: [],
      activarPreciosMayoristas: false,
      escalasPorCantidad: [],
    }
  }

  const monedaReferencia =
    producto?.monedaReferencia ||
    preciosFiltrados[0]?.moneda ||
    preferenciasStore.monedaDefaultEfectiva
  const comparables = preciosFiltrados.filter(
    (precio) => (precio.moneda || monedaReferencia) === monedaReferencia,
  )
  const candidatos = comparables.length > 0 ? comparables : preciosFiltrados

  const gruposMayoristas = candidatos
    .map((precio) =>
      construirGrupoMayorista({
        clave:
          precio.comercioId && precio.direccionId
            ? `${precio.comercioId}_${precio.direccionId}`
            : precio.nombreCompleto || precio.comercio || precio.id,
        etiqueta:
          comercioSesionLista.value?.id || comercioSesionLista.value?.direccionId
            ? ''
            : precio.nombreCompleto || precio.comercio || 'Sin comercio',
        moneda: precio.moneda || monedaReferencia,
        escalas: precio.escalasPorCantidad,
        precioBase: precio.valor,
        cantidad,
      }),
    )
    .filter(Boolean)

  const mejorCandidato = candidatos
    .map((precio) => {
      const aplicacion = aplicarPrecioPorCantidad(precio.valor, precio.escalasPorCantidad, cantidad)
      return {
        valor: aplicacion.valor,
        precioBase: Number(precio.valor),
        moneda: precio.moneda || monedaReferencia,
        usaMayorista: aplicacion.usaMayorista,
        activarPreciosMayoristas:
          Boolean(precio.activarPreciosMayoristas) &&
          normalizarEscalasValidas(precio.escalasPorCantidad).length > 0,
        escalasPorCantidad: normalizarEscalasValidas(precio.escalasPorCantidad),
      }
    })
    .filter((precio) => Number.isFinite(Number(precio.valor)) && Number(precio.valor) > 0)
    .sort((a, b) => Number(a.valor) - Number(b.valor))[0]

  if (!mejorCandidato) {
    return {
      valor: null,
      precioBase: null,
      moneda: monedaReferencia,
      usaMayorista: false,
      gruposMayoristas,
      activarPreciosMayoristas: false,
      escalasPorCantidad: [],
    }
  }

  return {
    valor: Number(mejorCandidato.valor),
    precioBase: Number(mejorCandidato.precioBase),
    moneda: mejorCandidato.moneda,
    usaMayorista: mejorCandidato.usaMayorista,
    gruposMayoristas,
    activarPreciosMayoristas: mejorCandidato.activarPreciosMayoristas,
    escalasPorCantidad: mejorCandidato.escalasPorCantidad,
  }
}

function resolverPrecioManual(item) {
  const escalasValidas = normalizarEscalasValidas(item.escalasPorCantidad)
  const resultado = aplicarPrecioPorCantidad(
    item.precioManual,
    escalasValidas,
    item.cantidad,
  )

  return {
    valor: resultado.valor,
    precioBase: Number.isFinite(Number(item.precioManual)) ? Number(item.precioManual) : null,
    moneda: item.moneda || preferenciasStore.monedaDefaultEfectiva,
    usaMayorista: resultado.usaMayorista,
    gruposMayoristas:
      resultado.escalas.length > 0
        ? [
            {
              clave: `manual_${item.id}`,
              etiqueta: '',
              moneda: item.moneda || preferenciasStore.monedaDefaultEfectiva,
              precioBase: Number(item.precioManual),
              usaMayorista: resultado.usaMayorista,
              escalas: resultado.escalas,
              mejorPrecioGrupo: resultado.valor,
            },
          ]
        : [],
    activarPreciosMayoristas: Boolean(item.activarPreciosMayoristas) && escalasValidas.length > 0,
    escalasPorCantidad: escalasValidas,
  }
}

function precioVisualDetallado(item) {
  if (!item.productoId || item.usaPreciosLocales) {
    return resolverPrecioManual(item)
  }

  const producto = productosStore.obtenerProductoPorId(item.productoId)
  if (!producto) {
    return {
      valor: null,
      precioBase: null,
      moneda: item.moneda || preferenciasStore.monedaDefaultEfectiva,
      usaMayorista: false,
      gruposMayoristas: [],
      activarPreciosMayoristas: false,
      escalasPorCantidad: [],
    }
  }

  return resolverPrecioProducto(producto, item.cantidad)
}

function precioVisual(item) {
  return precioVisualDetallado(item).valor
}

function precioFormateado(item) {
  const precio = precioVisualDetallado(item)
  if (!Number.isFinite(precio.valor)) return textoSinPrecio(item)
  return formatearMoneda(precio.valor, precio.moneda)
}

function textoSinPrecio(item) {
  if (comercioSesionLista.value?.id || comercioSesionLista.value?.direccionId) {
    return 'Sin precio para este comercio'
  }

  return item.productoId ? 'Sin precio disponible' : 'Sin precio cargado'
}

function textoEscalaMayorista(escala) {
  const cantidadMinima = Number(escala?.cantidadMinima || 0)
  if (!Number.isFinite(cantidadMinima) || cantidadMinima <= 1) return 'Precio mayorista'
  return `Comprando ${cantidadMinima}`
}

function textoPrecioEscalaMayorista(escala, moneda) {
  return `${formatearMoneda(escala?.precioUnitario, moneda)} c/u`
}

function subtotalItem(item) {
  const precio = precioVisualDetallado(item)
  const valor = Number(precio.valor || 0)
  const cantidad = Number(item?.cantidad || 0)

  if (!Number.isFinite(valor) || valor <= 0) return null
  if (!Number.isFinite(cantidad) || cantidad <= 0) return null

  return {
    valor: valor * cantidad,
    moneda: precio.moneda,
  }
}

function mostrarSubtotalItem(item) {
  return Number(item?.cantidad || 0) > 1 && Boolean(subtotalItem(item))
}

function subtotalItemFormateado(item) {
  const subtotal = subtotalItem(item)
  if (!subtotal) return ''
  return formatearMoneda(subtotal.valor, subtotal.moneda)
}

function gruposMayoristasItem(item) {
  return precioVisualDetallado(item).gruposMayoristas || []
}

function tieneMayoristasParaMostrar(item) {
  return gruposMayoristasItem(item).length > 0
}

function mostrarDetalleMayoristas(item) {
  return Boolean(itemsMayoristasExpandidos.value[item.id]) && tieneMayoristasParaMostrar(item)
}

function toggleMayoristasItem(itemId) {
  itemsMayoristasExpandidos.value = {
    ...itemsMayoristasExpandidos.value,
    [itemId]: !itemsMayoristasExpandidos.value[itemId],
  }
}

function textoBotonMayoristas(item) {
  return precioVisualDetallado(item).usaMayorista ? 'Mayorista aplicado' : 'Ver mayorista'
}

function esItemManual(item) {
  return item.origen !== 'misProductos'
}

function puedeEnviarAMesa(item) {
  if (item.estadoDerivacion === 'enMesa') return false
  if (item.productoId) return Boolean(item.usaPreciosLocales)
  if (item.estadoDerivacion === 'enMisProductos') return false
  return true
}

function puedeRestaurarPrecios(item) {
  return Boolean(item.productoId && item.usaPreciosLocales)
}

function productoEstaSeleccionado(productoId) {
  return Number(productosSeleccionados.value[productoId]) > 0
}

function cantidadSeleccionadaProducto(productoId) {
  const cantidad = Number(productosSeleccionados.value[productoId] || 0)
  return cantidad > 0 ? cantidad : 1
}

function alternarSeleccionProducto(productoId) {
  const copia = { ...productosSeleccionados.value }
  if (Number(copia[productoId]) > 0) {
    delete copia[productoId]
  } else {
    copia[productoId] = 1
  }
  productosSeleccionados.value = copia
}

function ajustarCantidadSeleccion(productoId, variacion) {
  const cantidadActual = Number(productosSeleccionados.value[productoId] || 0)
  if (cantidadActual <= 0 && variacion < 0) return

  const cantidadSiguiente = cantidadActual <= 0 ? 1 : cantidadActual + variacion

  const copia = { ...productosSeleccionados.value }
  if (cantidadSiguiente <= 0) {
    delete copia[productoId]
  } else {
    copia[productoId] = cantidadSiguiente
  }
  productosSeleccionados.value = copia
}

function precioProductoSeleccion(producto) {
  const cantidad = cantidadSeleccionadaProducto(producto.id)
  const precio = obtenerPrecioProductoSeleccion(producto, cantidad)
  const total = Number(precio.valor || 0) * cantidad
  return formatearMoneda(
    total,
    precio.moneda || producto.monedaReferencia || preferenciasStore.monedaDefaultEfectiva,
  )
}

function obtenerPrecioProductoSeleccion(producto, cantidad) {
  return resolverPrecioProducto(producto, cantidad)
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

  const precioEditable = precioVisualDetallado(item)
  itemEditandoId.value = item.id
  edicionInline.nombre = item.nombre
  edicionInline.precioTexto = formatearPrecioAlSalir(
    precioEditable.precioBase != null ? String(precioEditable.precioBase) : '',
  )
  edicionInline.moneda = precioEditable.moneda || preferenciasStore.monedaDefaultEfectiva
  edicionInline.activarPreciosMayoristas = Boolean(precioEditable.activarPreciosMayoristas)
  edicionInline.escalasPorCantidad = Array.isArray(precioEditable.escalasPorCantidad)
    ? precioEditable.escalasPorCantidad.map((escala) => ({ ...escala }))
    : []
}

function asignarRefBloqueEscalasEdicion(instancia) {
  refBloqueEscalasEdicion.value = instancia || null
}

function cancelarEdicionInline() {
  itemEditandoId.value = null
}

async function guardarEdicionInline(itemId) {
  if (!listaActual.value) return

  const item = listaActual.value.items.find((actual) => actual.id === itemId)
  if (!item) return

  const precioNumero = parseFloat(edicionInline.precioTexto)
  const escalasValidas = refBloqueEscalasEdicion.value?.validarEscalas?.()
  if (!escalasValidas) return

  const cambios = {
    precioManual: Number.isFinite(precioNumero) && precioNumero > 0 ? precioNumero : null,
    moneda: edicionInline.moneda || preferenciasStore.monedaDefaultEfectiva,
    activarPreciosMayoristas: Boolean(edicionInline.activarPreciosMayoristas),
    escalasPorCantidad: Array.isArray(edicionInline.escalasPorCantidad)
      ? edicionInline.escalasPorCantidad
      : [],
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

async function restaurarPreciosItem(itemId) {
  if (!listaActual.value) return

  const restaurado = await listaJustaStore.restaurarPreciosOriginales(listaActual.value.id, itemId)
  if (!restaurado) {
    quasar.notify({
      type: 'warning',
      message: 'No se pudieron restaurar los precios.',
      position: 'top',
    })
    return
  }

  if (itemEditandoId.value === itemId) {
    cancelarEdicionInline()
  }
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
    quasar.notify({
      type: 'warning',
      message: 'No se pudo enviar a Mesa de trabajo.',
      position: 'top',
    })
    return
  }

  quasar.notify({ type: 'info', message: 'Item enviado a Mesa de trabajo.', position: 'top' })
}

async function confirmarAgregarItem() {
  if (!listaActual.value || !formularioValido.value) return

  if (modoAlta.value === 'misProductos') {
    await confirmarAgregarProductosMultiples()
    return
  }

  const productoValido = refFormularioProductoManual.value?.validarFormulario()
  if (!productoValido) return

  const cantidadNormalizada =
    Number.isFinite(Number(formularioProductoManual.value.cantidad)) &&
    Number(formularioProductoManual.value.cantidad) > 0
      ? Number(formularioProductoManual.value.cantidad)
      : 1

  const payload = {
    productoId: null,
    origen: 'manual',
    nombre: formularioProductoManual.value.nombre,
    cantidad: cantidadNormalizada,
    precioManual: Number.isFinite(Number(formularioPrecioManual.value.valor))
      ? Number(formularioPrecioManual.value.valor)
      : null,
    moneda: formularioPrecioManual.value.moneda || preferenciasStore.monedaDefaultEfectiva,
    codigoBarras: formularioProductoManual.value.codigoBarras,
    marca: '',
    categoria: '',
    gramosOLitros: null,
    comercio: '',
    unidad: formularioProductoManual.value.unidad || 'unidad',
    imagen: formularioProductoManual.value.imagen || null,
    activarPreciosMayoristas: Boolean(formularioPrecioManual.value.activarPreciosMayoristas),
    escalasPorCantidad: Array.isArray(formularioPrecioManual.value.escalasPorCantidad)
      ? formularioPrecioManual.value.escalasPorCantidad
      : [],
    estadoDerivacion: 'ninguno',
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
      message: 'Completá al menos el nombre del producto.',
      position: 'top',
    })
    return
  }

  dialogoAgregarItemAbierto.value = false
  limpiarFormularioItem()
}

async function confirmarAgregarProductosMultiples() {
  let agregados = 0
  let duplicados = 0

  for (const producto of productosSeleccionadosParaAgregar.value) {
    const resultado = await listaJustaStore.agregarItem(listaActual.value.id, {
      productoId: producto.id,
      origen: 'misProductos',
      nombre: producto.nombre,
      cantidad: producto.cantidadSeleccionada,
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
    })

    if (resultado.exito) {
      agregados += 1
      continue
    }

    if (resultado.motivo === 'duplicado') {
      duplicados += 1
    }
  }

  if (agregados === 0 && duplicados > 0) {
    quasar.notify({
      type: 'warning',
      message:
        duplicados === 1
          ? 'Ese producto ya está en la lista.'
          : `${duplicados} productos ya estaban en la lista.`,
      position: 'top',
    })
    return
  }

  if (agregados > 0) {
    quasar.notify({
      type: duplicados > 0 ? 'info' : 'positive',
      message:
        duplicados > 0
          ? `Se agregaron ${agregados} productos. ${duplicados} ya estaban en la lista.`
          : `Se agregaron ${agregados} productos.`,
      position: 'top',
    })
  }

  dialogoAgregarItemAbierto.value = false
  limpiarFormularioItem()
}

function limpiarFormularioItem() {
  modoAlta.value = 'misProductos'
  textoBusquedaProducto.value = ''
  productosSeleccionados.value = {}
  formularioProductoManual.value = {
    nombre: '',
    cantidad: 1,
    unidad: preferenciasStore.unidad || 'unidad',
    codigoBarras: '',
    marca: '',
    categoria: '',
    imagen: null,
  }
  formularioPrecioManual.value = {
    comercio: '',
    direccion: '',
    valor: null,
    moneda: preferenciasStore.monedaDefaultEfectiva,
    comercioId: null,
    direccionId: null,
    nombreCompleto: '',
    activarPreciosMayoristas: false,
    escalasPorCantidad: [],
  }
  dialogoResultadosManualAbierto.value = false
  resultadosBusquedaManual.value = []
  variantePieBusquedaManual.value = null
  pieAccionesBusquedaManual.value = false
  buscandoConsultaManual.value = false
  ultimoCodigoBusquedaManual.value = ''
  ultimoNombreBusquedaManual.value = ''
  escanerManualActivo.value = false
  itemsMayoristasExpandidos.value = {}
}

async function buscarManualPorCodigo(codigo, callbackFinalizar) {
  try {
    const codigoLimpio = String(codigo || '').trim()
    ultimoCodigoBusquedaManual.value = codigoLimpio
    if (!codigoLimpio) return

    const respuesta = await busquedaProductosHibridaService.buscarPorCodigoConPolitica(
      codigoLimpio,
      {
        forzarApi: false,
        onAntesLlamadaApi: () => {
          buscandoConsultaManual.value = true
        },
      },
    )

    resultadosBusquedaManual.value = respuesta.itemsParaDialogo
    variantePieBusquedaManual.value = respuesta.puedeEnriquecerConApi ? 'codigo-local' : null

    if (respuesta.itemsParaDialogo.length > 0) {
      dialogoResultadosManualAbierto.value = true
      return
    }

    quasar.notify({
      type: 'warning',
      message: 'No se encontró el producto.',
      position: 'top',
    })
  } catch (error) {
    console.error('Error al buscar por código en Lista Justa:', error)
    quasar.notify({
      type: 'negative',
      message: 'Error al buscar producto.',
      position: 'top',
    })
  } finally {
    buscandoConsultaManual.value = false
    if (callbackFinalizar) callbackFinalizar()
  }
}

async function buscarManualPorNombre(nombre, callbackFinalizar) {
  try {
    const nombreLimpio = String(nombre || '').trim()
    ultimoNombreBusquedaManual.value = nombreLimpio
    if (!nombreLimpio) return

    const respuesta = await busquedaProductosHibridaService.buscarPorNombreConPolitica(
      nombreLimpio,
      {
        ampliarOpenFoodFacts: false,
        onAntesLlamadaApi: () => {
          buscandoConsultaManual.value = true
        },
      },
    )

    resultadosBusquedaManual.value = respuesta.itemsParaDialogo
    variantePieBusquedaManual.value = respuesta.puedeAmpliarOpenFoodFacts ? 'nombre-local' : null

    if (respuesta.itemsParaDialogo.length > 0) {
      dialogoResultadosManualAbierto.value = true
      return
    }

    quasar.notify({
      type: 'warning',
      message: 'No se encontraron productos.',
      position: 'top',
    })
  } catch (error) {
    console.error('Error al buscar por nombre en Lista Justa:', error)
    quasar.notify({
      type: 'negative',
      message: 'Error al buscar producto.',
      position: 'top',
    })
  } finally {
    buscandoConsultaManual.value = false
    if (callbackFinalizar) callbackFinalizar()
  }
}

async function ampliarBusquedaManual() {
  const tipo = variantePieBusquedaManual.value
  if (!tipo) return

  pieAccionesBusquedaManual.value = true
  buscandoConsultaManual.value = true
  try {
    if (tipo === 'codigo-local') {
      const respuesta = await busquedaProductosHibridaService.buscarPorCodigoConPolitica(
        ultimoCodigoBusquedaManual.value,
        {
          forzarApi: true,
          onAntesLlamadaApi: () => {},
        },
      )
      resultadosBusquedaManual.value = respuesta.itemsParaDialogo
      variantePieBusquedaManual.value = null
    }

    if (tipo === 'nombre-local') {
      const respuesta = await busquedaProductosHibridaService.buscarPorNombreConPolitica(
        ultimoNombreBusquedaManual.value,
        {
          ampliarOpenFoodFacts: true,
          onAntesLlamadaApi: () => {},
        },
      )
      resultadosBusquedaManual.value = respuesta.itemsParaDialogo
      variantePieBusquedaManual.value = null
    }
  } catch (error) {
    console.error('Error al ampliar búsqueda en Lista Justa:', error)
    quasar.notify({
      type: 'negative',
      message: 'Error al consultar fuentes externas.',
      position: 'top',
    })
  } finally {
    pieAccionesBusquedaManual.value = false
    buscandoConsultaManual.value = false
  }
}

function autocompletarFormularioManual(producto) {
  formularioProductoManual.value = {
    ...formularioProductoManual.value,
    nombre: producto.nombre || formularioProductoManual.value.nombre,
    codigoBarras: producto.codigoBarras || formularioProductoManual.value.codigoBarras,
    cantidad: producto.cantidad || formularioProductoManual.value.cantidad,
    unidad: producto.unidad || formularioProductoManual.value.unidad,
    marca: producto.marca || formularioProductoManual.value.marca,
    categoria: producto.categoria || formularioProductoManual.value.categoria,
    imagen: producto.imagen || formularioProductoManual.value.imagen,
  }
}

function activarEscanerManual() {
  escanerManualActivo.value = true
}

function alEscanerManualNoDisponible() {
  escanerManualActivo.value = false
  quasar.notify({
    type: 'info',
    message: 'En web escribí el código de barras manualmente.',
    position: 'top',
  })
}

async function alDetectarCodigoManual(codigo) {
  escanerManualActivo.value = false
  formularioProductoManual.value = {
    ...formularioProductoManual.value,
    codigoBarras: codigo,
  }
  await buscarManualPorCodigo(codigo)
}

function irAListaInteligente() {
  if (!listaActual.value?.id) return
  router.push(`/lista-justa/${listaActual.value.id}/inteligente`)
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
  formularioProductoManual.value = {
    ...formularioProductoManual.value,
    unidad: preferenciasStore.unidad || 'unidad',
  }
  formularioPrecioManual.value = {
    ...formularioPrecioManual.value,
    moneda: preferenciasStore.monedaDefaultEfectiva,
  }
})
</script>

<style scoped>
.pagina-detalle-lista {
  padding-bottom: calc(84px + var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px));
}
.encabezado-detalle {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
}
.encabezado-detalle-texto {
  min-width: 0;
}
.boton-lista-inteligente {
  align-self: flex-start;
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
.fila-filtros-sticky {
  position: sticky;
  top: calc(var(--safe-area-top, 0px) + 56px + 4px);
  z-index: 24;
  margin-bottom: 10px;
  padding-top: 2px;
  background: var(--fondo-app);
}
.fila-filtros {
  margin-bottom: 0;
}
.fila-filtros :deep(.q-btn-toggle) {
  border: 1px solid var(--borde-color);
  border-radius: 10px;
  background: var(--fondo-tarjeta);
  box-shadow: var(--sombra-ligera);
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
.columna-info-principal {
  min-width: 0;
  grid-column: 2;
  grid-row: 1;
}
.contenido-secundario-item {
  min-width: 0;
  grid-column: 2;
  grid-row: 2;
}
.fila-nombre {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  align-items: center;
}
.fila-botones-nombre {
  display: flex;
  align-items: center;
  gap: 2px;
}
.contenido-nombre-item {
  min-width: 0;
}
.nombre-item {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.2;
}
.fila-precio {
  margin-top: 4px;
}
.bloque-precio-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}
.editor-inline-item {
  display: grid;
  gap: 8px;
}
.bloque-mayoristas-edicion {
  width: 100%;
}
.fila-edicion-precio {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 8px;
}
.fila-acciones-edicion {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.precio-item {
  display: block;
  font-weight: 700;
  font-size: 22px;
  color: var(--color-secundario);
  line-height: 1.2;
}
.boton-mayoristas-item {
  width: 100%;
  min-height: 38px;
  padding: 0 14px;
  margin-top: 8px;
  border: 1px solid color-mix(in srgb, var(--color-secundario) 24%, var(--borde-color));
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-secundario) 10%, var(--fondo-app-secundario));
  font-size: 13px;
  font-weight: 700;
}
.detalle-mayoristas-item {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--borde-color);
  border-radius: 10px;
  background: color-mix(in srgb, var(--fondo-app-secundario) 88%, transparent);
}
.tarjeta-item-editando .contenido-secundario-item {
  grid-column: 1 / 4;
}
.grupo-mayorista-item + .grupo-mayorista-item {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--borde-color);
}
.grupo-mayorista-item-etiqueta {
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--texto-secundario);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.fila-mayorista-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 12px;
  color: var(--texto-secundario);
}
.fila-mayorista-item + .fila-mayorista-item {
  margin-top: 6px;
}
.fila-mayorista-item span {
  min-width: 0;
}
.fila-mayorista-item strong {
  flex-shrink: 0;
  text-align: right;
}
.fila-mayorista-item-activa {
  color: var(--texto-primario);
}
.fila-acciones-item {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}
.fila-cantidad-y-subtotal {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.acciones-secundarias-item {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 8px;
}
.subtotal-item {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--color-secundario) 24%, var(--borde-color));
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-secundario) 8%, var(--fondo-app-secundario));
  font-size: 13px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-secundario);
  white-space: nowrap;
}
.boton-enviar-mesa {
  width: 100%;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  font-weight: 700;
}
.chip-mesa-trabajo {
  min-height: 30px;
  border-radius: 10px;
}
.control-cantidad {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--borde-color);
  border-radius: 999px;
  padding: 2px 6px;
  margin-right: auto;
}
.columna-check {
  grid-column: 3;
  grid-row: 1;
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
  margin-bottom: 12px;
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
.encabezado-dialogo-agregar-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.encabezado-seleccion-productos {
  display: flex;
  align-items: stretch;
  width: 100%;
}
.buscador-productos-dialogo {
  min-width: 0;
  width: 100%;
}
.contador-productos-seleccionados {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  min-width: 42px;
  margin-left: auto;
}
.contador-productos-seleccionados-valor {
  min-width: 42px;
  text-align: right;
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  color: var(--color-secundario);
}
.lista-productos-origen {
  max-height: 320px;
  overflow: auto;
  border-radius: 10px;
}
.item-producto-seleccionable {
  align-items: center;
  gap: 10px;
  padding-left: 10px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}
.contenido-item-producto-dialogo {
  min-width: 0;
}
.fila-superior-item-dialogo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}
.nombre-producto-dialogo {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.2;
  color: var(--texto-primario);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-wrap: balance;
}
.precio-producto-dialogo {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--color-secundario);
}
.producto-seleccionado {
  background: color-mix(in srgb, var(--color-secundario) 14%, transparent);
  border-left: 3px solid var(--color-secundario);
}
.control-cantidad-dialogo {
  min-width: 88px;
  justify-content: center;
}
.bloque-cantidad-manual {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-app-secundario);
}
.etiqueta-cantidad-manual {
  font-weight: 700;
  color: var(--texto-primario);
}
.control-cantidad-manual {
  min-width: 104px;
  justify-content: center;
}
.acciones-dialogo-agregar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
}
.resumen-total-seleccion {
  margin-right: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.resumen-total-seleccion-etiqueta {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--texto-secundario);
  text-transform: uppercase;
}
.resumen-total-seleccion-valor {
  font-size: 15px;
  line-height: 1.2;
  color: var(--color-secundario);
  white-space: nowrap;
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
  .columna-info-principal {
    grid-column: 2;
    grid-row: 1;
  }
  .contenido-secundario-item {
    grid-column: 1 / -1;
    grid-row: 2;
    margin-top: 10px;
  }
  .fila-edicion-precio {
    grid-template-columns: 1fr;
  }
  .encabezado-dialogo-agregar-item {
    align-items: center;
  }
  .item-producto-seleccionable {
    align-items: flex-start;
  }
  .fila-superior-item-dialogo {
    gap: 8px;
  }
  .precio-producto-dialogo {
    font-size: 13px;
  }
  .control-cantidad-dialogo {
    min-width: 82px;
  }
  .fila-acciones-item {
    align-items: stretch;
  }
  .fila-cantidad-y-subtotal {
    width: 100%;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
    flex-wrap: nowrap;
  }
  .acciones-secundarias-item {
    width: 100%;
  }
  .subtotal-item {
    flex-shrink: 1;
    min-width: 0;
    padding: 6px 8px;
    font-size: 12px;
    text-align: center;
  }
  .acciones-dialogo-agregar {
    gap: 6px;
  }
  .resumen-total-seleccion-etiqueta {
    font-size: 10px;
  }
  .resumen-total-seleccion-valor {
    font-size: 14px;
  }
  .precio-item {
    font-size: 20px;
  }
  .imagen-item {
    width: 56px;
    height: 56px;
  }
}
</style>
