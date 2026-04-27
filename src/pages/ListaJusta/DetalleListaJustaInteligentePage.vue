<template>
  <q-page class="q-pa-md pagina-lista-justa-inteligente">
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
            @click="router.push(`/lista-justa/${listaActual.id}`)"
          />
          <div class="encabezado-detalle-texto">
            <h5 class="titulo-pagina">Lista Justa Inteligente</h5>
            <p class="contador-items q-mb-none">{{ listaActual.nombre }}</p>
          </div>
        </div>

        <q-card flat bordered class="bloque-inteligente q-mb-md">
          <q-card-section>
            <div class="fila-encabezado-bloque">
              <div>
                <div class="bloque-titulo">Comercios a comparar</div>
                <q-slide-transition>
                  <div
                    v-show="descripcionComparacionVisible"
                    class="descripcion-comparacion-inteligente"
                  >
                    Esta sección es para comparar precios entre comercios y ayudarte a elegir dónde comprar de forma más inteligente según los precios disponibles.
                  </div>
                </q-slide-transition>
                <div class="text-caption text-grey-7">
                  Elegí los otros comercios que querés poner frente al comercio base.
                </div>
              </div>
              <q-btn
                v-if="puedeColapsarDescripcionComparacion"
                flat
                no-caps
                dense
                color="grey-7"
                class="boton-toggle-descripcion-comparacion"
                :icon="descripcionComparacionExpandida ? 'expand_less' : 'expand_more'"
                :label="descripcionComparacionExpandida ? 'Ocultar ayuda' : 'Mostrar ayuda'"
                @click="toggleDescripcionComparacion"
              />
            </div>

            <div
              v-if="false"
              class="estado-vacio-comparacion"
            >
              <q-icon name="storefront" size="26px" color="secondary" />
              <span>Agregá al menos un comercio más para comparar precios.</span>
            </div>

            <div
              v-if="esComercioValido(comercioBase) || mostrarEditorComercioBase || filasComparacion.length > 0"
              class="columna-comparacion"
            >
              <div
                v-if="esComercioValido(comercioBase) || mostrarEditorComercioBase"
                class="tarjeta-comercio-comparacion"
              >
                <template v-if="esComercioValido(comercioBase) && !mostrarEditorComercioBase">
                  <div class="encabezado-comercio-base">
                    <div class="bloque-titulo">{{ textoEncabezadoComercioBase }}</div>
                    <div v-if="textoDireccionComercioBase" class="bloque-subtitulo">
                      {{ textoDireccionComercioBase }}
                    </div>
                  </div>
                  <div class="fila-acciones-comercio-comparacion">
                    <q-btn
                      flat
                      no-caps
                      color="secondary"
                      class="boton-cambiar-comercio-base"
                      icon="edit_location_alt"
                      label="Cambiar comercio elegido"
                      @click="toggleEditorComercioBase"
                    />
                    <q-btn
                      flat
                      no-caps
                      color="negative"
                      icon="delete"
                      label="Quitar comercio"
                      @click="eliminarComercioBase"
                    />
                  </div>
                </template>
                <template v-else>
                  <SelectorComercioDireccion
                    :model-value="comercioBase"
                    label-comercio="Primer comercio"
                    label-direccion="Sucursal"
                    :auto-seleccionar-direccion="true"
                    @update:model-value="actualizarComercioBase"
                  />
                  <div
                    v-if="esComercioValido(comercioBase)"
                    class="fila-acciones-comercio-comparacion fila-acciones-comercio-comparacion-editor"
                  >
                    <q-btn
                      flat
                      no-caps
                      color="grey-7"
                      icon="expand_less"
                      label="Ocultar selector"
                      @click="toggleEditorComercioBase"
                    />
                    <q-btn
                      flat
                      no-caps
                      color="negative"
                      icon="delete"
                      label="Quitar comercio"
                      @click="eliminarComercioBase"
                    />
                  </div>
                </template>
              </div>

              <div
                v-for="fila in filasComparacion"
                :key="fila.id"
                class="tarjeta-comercio-comparacion"
              >
                <template v-if="esComercioValido(fila.comercio) && !fila.mostrarEditor">
                  <div class="encabezado-comercio-base">
                    <div class="bloque-titulo">{{ obtenerNombreComercio(fila.comercio) }}</div>
                    <div
                      v-if="obtenerDireccionComercio(fila.comercio)"
                      class="bloque-subtitulo"
                    >
                      {{ obtenerDireccionComercio(fila.comercio) }}
                    </div>
                  </div>
                  <div class="fila-acciones-comercio-comparacion">
                    <q-btn
                      flat
                      no-caps
                      color="secondary"
                      class="boton-cambiar-comercio-base"
                      icon="edit_location_alt"
                      label="Cambiar comercio elegido"
                      @click="toggleEditorComercioComparacion(fila.id)"
                    />
                    <q-btn
                      flat
                      no-caps
                      color="negative"
                      icon="delete"
                      label="Quitar comercio"
                      @click="eliminarFilaComparacion(fila.id)"
                    />
                  </div>
                </template>
                <template v-else>
                  <SelectorComercioDireccion
                    :model-value="fila.comercio"
                    label-comercio="Comercio a comparar"
                    label-direccion="Sucursal a comparar"
                    :auto-seleccionar-direccion="true"
                    @update:model-value="(valor) => actualizarFilaComparacion(fila.id, valor)"
                  />
                  <div class="fila-acciones-comercio-comparacion fila-acciones-comercio-comparacion-editor">
                    <q-btn
                      v-if="esComercioValido(fila.comercio)"
                      flat
                      no-caps
                      color="grey-7"
                      icon="expand_less"
                      label="Ocultar selector"
                      @click="toggleEditorComercioComparacion(fila.id)"
                    />
                    <q-btn
                      flat
                      no-caps
                      color="negative"
                      icon="delete"
                      label="Quitar comercio"
                      @click="eliminarFilaComparacion(fila.id)"
                    />
                  </div>
                </template>
              </div>

              <q-btn
                flat
                no-caps
                color="secondary"
                label="Agregar comercio"
                icon="add"
                class="boton-agregar-comercio-inferior"
                :disable="!puedeAgregarComercioComparacion"
                @click="agregarFilaComparacion"
              />
            </div>
            <q-btn
              v-else
              flat
              no-caps
              color="secondary"
              label="Agregar comercio"
              icon="add"
              class="boton-agregar-comercio-inicial q-mt-md"
              :disable="!puedeAgregarComercioComparacion"
              @click="agregarFilaComparacion"
            />

            <q-banner
              v-if="mensajeComparacionInteligente"
              rounded
              class="q-mt-md bg-warning text-black"
            >
              {{ mensajeComparacionInteligente }}
            </q-banner>
          </q-card-section>
        </q-card>

        <q-card v-if="comerciosSeleccionados.length > 0" flat bordered class="bloque-inteligente q-mb-md">
          <q-card-section>
            <div class="fila-encabezado-ayuda">
              <div class="bloque-titulo">Resumen general</div>
              <q-btn
                flat
                no-caps
                dense
                color="grey-7"
                class="boton-toggle-ayuda-seccion"
                :icon="mostrarAyudaResumen ? 'expand_less' : 'expand_more'"
                :label="mostrarAyudaResumen ? 'Ocultar ayuda' : 'Mostrar ayuda'"
                @click="mostrarAyudaResumen = !mostrarAyudaResumen"
              />
            </div>
            <q-slide-transition>
              <div v-show="mostrarAyudaResumen" class="descripcion-bloque-inteligente">
                Esta sección compara cuánto te costaría comprar toda la lista en cada comercio.
                Te ayuda a elegir rápido la opción más barata para resolver todo en un solo lugar.
              </div>
            </q-slide-transition>

            <div v-if="resultadoInteligente.resumen.mezclaMonedas" class="text-caption text-warning q-mb-sm">
              Hay monedas mezcladas en la comparación. Los totales se muestran, pero no se calcula ahorro global.
            </div>

            <div class="columna-ranking">
              <div
                v-for="resultado in resultadoInteligente.rankingTodoEnUno"
                :key="resultado.clave"
                class="fila-ranking"
              >
                <div class="fila-ranking-texto">
                  <div class="fila-ranking-nombre">{{ resultado.nombreComercio }}</div>
                  <div
                    v-if="resultado.mostrarDireccion && resultado.direccionComercio"
                    class="fila-ranking-direccion"
                  >
                    {{ resultado.direccionComercio }}
                  </div>
                  <div class="fila-ranking-detalle">
                    {{
                      resultado.faltantes > 0
                        ? `Sin precio en ${resultado.faltantes} producto${resultado.faltantes === 1 ? '' : 's'}.`
                        : 'Tiene precio para todos los productos comparables.'
                    }}
                  </div>
                </div>
                <strong class="fila-ranking-total">{{ resultado.totalTexto }}</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card v-if="comerciosSeleccionados.length > 0" flat bordered class="bloque-inteligente q-mb-md">
          <q-card-section>
            <div class="fila-encabezado-ayuda">
              <div class="bloque-titulo">Compra optimizada por producto</div>
              <q-btn
                flat
                no-caps
                dense
                color="grey-7"
                class="boton-toggle-ayuda-seccion"
                :icon="mostrarAyudaOptimizacion ? 'expand_less' : 'expand_more'"
                :label="mostrarAyudaOptimizacion ? 'Ocultar ayuda' : 'Mostrar ayuda'"
                @click="mostrarAyudaOptimizacion = !mostrarAyudaOptimizacion"
              />
            </div>
            <q-slide-transition>
              <div v-show="mostrarAyudaOptimizacion" class="descripcion-bloque-inteligente">
                Esta sección te muestra en qué comercio conviene comprar cada producto para bajar el total de la lista.
                Te ayuda a decidir rápido si te conviene optimizar el ahorro o priorizar comodidad.
              </div>
            </q-slide-transition>
            <div class="resumen-ahorro-optimizacion q-mt-sm q-mb-sm">
              <span class="resumen-ahorro-optimizacion-etiqueta">
                Ahorro estimado vs comprar todo en el primer comercio:
              </span>
              <strong class="resumen-ahorro-optimizacion-valor">
                {{ resultadoInteligente.resumen.ahorroTexto }}
              </strong>
            </div>
            <div
              v-if="resultadoInteligente.recomendacionesAgrupadas.length === 0"
              class="estado-vacio-comparacion"
            >
              <q-icon name="analytics" size="26px" color="secondary" />
              <span>No hay productos comparables todavía con los comercios elegidos.</span>
            </div>
            <div v-else class="columna-recomendaciones">
              <div
                v-for="grupo in resultadoInteligente.recomendacionesAgrupadas"
                :key="grupo.clave"
                class="grupo-recomendacion"
              >
                <div class="grupo-recomendacion-titulo">{{ grupo.etiqueta }}</div>
                <div class="grupo-recomendacion-items">
                  <q-chip
                    v-for="item in grupo.items"
                    :key="item.id"
                    dense
                    color="secondary"
                    text-color="white"
                    class="chip-producto"
                  >
                    {{ item.nombre }} · {{ item.totalTexto }}
                  </q-chip>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card v-if="comerciosSeleccionados.length > 0" flat bordered class="bloque-inteligente">
          <q-card-section>
            <div class="fila-encabezado-ayuda">
              <div class="bloque-titulo">Detalle por producto</div>
              <q-btn
                flat
                no-caps
                dense
                color="grey-7"
                class="boton-toggle-ayuda-seccion"
                :icon="mostrarAyudaDetalle ? 'expand_less' : 'expand_more'"
                :label="mostrarAyudaDetalle ? 'Ocultar ayuda' : 'Mostrar ayuda'"
                @click="mostrarAyudaDetalle = !mostrarAyudaDetalle"
              />
            </div>
            <q-slide-transition>
              <div v-show="mostrarAyudaDetalle" class="descripcion-bloque-inteligente">
                Esta sección muestra el detalle completo por producto, con precios disponibles por comercio y la recomendación puntual.
                Te permite ver rápido qué datos faltan y en qué casos conviene ajustar la compra.
              </div>
            </q-slide-transition>
            <div class="columna-detalle-productos">
              <div
                v-for="item in resultadoInteligente.items"
                :key="item.id"
                class="tarjeta-detalle-producto"
                :class="claseTarjetaDetalle(item.estado)"
              >
                <div class="fila-detalle-superior">
                  <div>
                    <div class="detalle-producto-nombre">{{ item.nombre }}</div>
                  </div>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="grey-7"
                    class="boton-toggle-detalle-producto"
                    :icon="estaTarjetaColapsada(item.id) ? 'expand_more' : 'expand_less'"
                    :label="estaTarjetaColapsada(item.id) ? 'Ver detalles' : 'Ocultar detalles'"
                    @click="toggleTarjetaDetalle(item.id)"
                  />
                </div>

                <div v-if="estaTarjetaColapsada(item.id)" class="resumen-tarjeta-colapsada q-mt-xs">
                  <div v-if="item.recomendacion" class="detalle-recomendacion-cerrada">
                    <strong>Recomendación:</strong>
                    {{ item.recomendacion.etiqueta }} · {{ item.recomendacion.totalTexto }}
                  </div>
                  <div
                    v-if="item.mensaje && item.estado !== 'completo'"
                    class="detalle-producto-mensaje q-mt-xs"
                  >
                    {{ item.mensaje }}
                  </div>
                  <div
                    v-if="obtenerTextoMayorista(item)"
                    class="detalle-mayorista q-mt-xs"
                  >
                    {{ obtenerTextoMayorista(item) }}
                  </div>
                </div>

                <q-slide-transition>
                  <div v-show="!estaTarjetaColapsada(item.id)">
                    <div
                      v-if="item.mensaje"
                      class="detalle-producto-mensaje q-mt-xs"
                    >
                      {{ item.mensaje }}
                    </div>
                    <div
                      v-if="obtenerTextoMayorista(item)"
                      class="detalle-mayorista q-mt-xs"
                    >
                      {{ obtenerTextoMayorista(item) }}
                    </div>

                    <div class="detalle-precios-comercio q-mt-sm">
                      <div
                        v-for="precio in item.preciosPorComercio"
                        :key="precio.clave"
                        class="fila-precio-comercio"
                        :class="precio.disponible ? 'fila-precio-comercio-con-precio' : 'fila-precio-comercio-sin-precio'"
                      >
                        <div class="fila-precio-comercio-info">
                          <span class="fila-precio-comercio-nombre">{{ precio.nombreComercio }}</span>
                          <span
                            v-if="precio.mostrarDireccion && precio.direccionComercio"
                            class="fila-precio-comercio-direccion"
                          >
                            {{ precio.direccionComercio }}
                          </span>
                        </div>
                        <strong>{{ precio.totalTexto }}</strong>
                      </div>
                    </div>
                  </div>
                </q-slide-transition>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </div>

    <BotonAccionSticky
      v-if="listaActual"
      class="boton-volver-lista-inteligente"
      etiqueta="Volver a la lista"
      icono="arrow_back"
      @click="router.push(`/lista-justa/${listaActual.id}`)"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListaJustaStore } from '../../almacenamiento/stores/ListaJustaStore.js'
import { usePreferenciasStore } from '../../almacenamiento/stores/preferenciasStore.js'
import { useProductosStore } from '../../almacenamiento/stores/productosStore.js'
import SelectorComercioDireccion from '../../components/Compartidos/SelectorComercioDireccion.vue'
import BotonAccionSticky from '../../components/Compartidos/BotonAccionSticky.vue'
import { formatearPrecioConCodigo } from '../../utils/PrecioUtils.js'
import {
  obtenerClaveComercioSeleccionado,
  obtenerEtiquetaComercio,
  resolverPrecioProductoPorComercio,
} from '../../utils/ListaJustaInteligenteUtils.js'

const route = useRoute()
const router = useRouter()
const listaJustaStore = useListaJustaStore()
const productosStore = useProductosStore()
const preferenciasStore = usePreferenciasStore()

const filasComparacion = ref([])
const mostrarEditorComercioBase = ref(false)
const descripcionComparacionExpandida = ref(true)
const mostrarAyudaResumen = ref(true)
const mostrarAyudaOptimizacion = ref(true)
const mostrarAyudaDetalle = ref(true)
const estadoTarjetasDetalle = ref({})
let contadorFilaComparacion = 0

const listaActual = computed(() => listaJustaStore.obtenerListaPorId(route.params.id))
const comercioBase = computed(() => listaActual.value?.configuracionInteligente?.comercioBase || null)
const comerciosComparacionGuardados = computed(
  () => listaActual.value?.configuracionInteligente?.comerciosComparacion || [],
)
const textoEncabezadoComercioBase = computed(() => {
  const nombre = String(comercioBase.value?.nombre || '').trim()
  return nombre || 'Elegí un comercio'
})
const textoDireccionComercioBase = computed(() =>
  String(comercioBase.value?.direccionNombre || '').trim(),
)
const puedeAgregarComercioComparacion = computed(() => {
  if (!esComercioValido(comercioBase.value)) return true
  return filasComparacion.value.every((fila) => esComercioValido(fila.comercio))
})
const puedeColapsarDescripcionComparacion = computed(() => comerciosSeleccionados.value.length >= 2)
const descripcionComparacionVisible = computed(
  () => !puedeColapsarDescripcionComparacion.value || descripcionComparacionExpandida.value,
)

const comerciosSeleccionados = computed(() => {
  const mapa = new Map()
  const base = comercioBase.value

  if (esComercioValido(base)) {
    mapa.set(obtenerClaveComercioSeleccionado(base), base)
  }

  for (const fila of filasComparacion.value) {
    if (!esComercioValido(fila.comercio)) continue
    const clave = obtenerClaveComercioSeleccionado(fila.comercio)
    if (!clave || mapa.has(clave)) continue
    mapa.set(clave, fila.comercio)
  }

  return [...mapa.values()]
})

const mensajeComparacionIncompleta = computed(() => {
  if (!esComercioValido(comercioBase.value)) {
    return 'Elegí un comercio base para activar la comparación inteligente.'
  }

  if (comerciosSeleccionados.value.length < 2) {
    return 'Agregá al menos un comercio más para comparar contra el comercio base.'
  }

  return ''
})

const mensajeComparacionInteligente = computed(() => {
  if (!esComercioValido(comercioBase.value)) {
    return 'Elegí el primer comercio para activar la comparación inteligente.'
  }

  if (comerciosSeleccionados.value.length < 2) {
    return `Agregá al menos otro comercio para comparar con ${obtenerNombreComercio(comercioBase.value)}.`
  }

  return ''
})
void mensajeComparacionIncompleta.value

const resultadoInteligente = computed(() => {
  if (!listaActual.value) {
    return {
      resumen: {
        textoComercioBase: 'Sin definir',
        totalBaseTexto: 'Sin datos',
        totalOptimizadoTexto: 'Sin datos',
        ahorroTexto: 'Sin datos',
        productosComparables: 0,
        productosConFaltantes: 0,
        mezclaMonedas: false,
      },
      rankingTodoEnUno: [],
      recomendacionesAgrupadas: [],
      items: [],
    }
  }

  const comercios = comerciosSeleccionados.value
  const base = comercioBase.value
  const conteoPorNombreComercio = new Map()

  for (const comercio of comercios) {
    const claveNombre = String(comercio?.nombre || '').trim().toLowerCase()
    if (!claveNombre) continue
    conteoPorNombreComercio.set(claveNombre, (conteoPorNombreComercio.get(claveNombre) || 0) + 1)
  }

  const itemsAnalizados = listaActual.value.items.map((item) =>
    construirAnalisisItem(item, comercios, conteoPorNombreComercio),
  )

  const rankingTodoEnUno = comercios.map((comercio) => {
    const clave = obtenerClaveComercioSeleccionado(comercio)
    const nombreComercio = String(comercio?.nombre || '').trim() || 'Comercio sin nombre'
    const direccionComercio = String(comercio?.direccionNombre || '').trim()
    const claveNombre = nombreComercio.toLowerCase()
    const itemsComparables = itemsAnalizados.filter(
      (item) => item.estado !== 'sinDatos' && item.estado !== 'sinProducto',
    )
    const totalesDisponibles = itemsComparables
      .map((item) => item.mapaPreciosPorComercio.get(clave))
      .filter(Boolean)
    const faltantes = itemsComparables.length - totalesDisponibles.length
    const monedas = [...new Set(totalesDisponibles.map((precio) => precio.moneda).filter(Boolean))]
    const mezclaMonedas = monedas.length > 1
    const total = mezclaMonedas
      ? null
      : totalesDisponibles.reduce((suma, precio) => suma + Number(precio.valorTotal || 0), 0)

    return {
      clave,
      nombreComercio,
      direccionComercio,
      mostrarDireccion: Boolean(direccionComercio) && (conteoPorNombreComercio.get(claveNombre) || 0) > 1,
      etiqueta: obtenerEtiquetaComercio(comercio),
      faltantes,
      mezclaMonedas,
      total,
      moneda: monedas[0] || preferenciasStore.monedaDefaultEfectiva,
      totalTexto: mezclaMonedas
        ? 'Monedas mezcladas'
        : total === null
          ? 'Sin datos'
          : formatearPrecioConCodigo(total, monedas[0] || preferenciasStore.monedaDefaultEfectiva),
    }
  }).sort((a, b) => {
    const totalA = Number.isFinite(a.total) ? Number(a.total) : Number.POSITIVE_INFINITY
    const totalB = Number.isFinite(b.total) ? Number(b.total) : Number.POSITIVE_INFINITY
    if (totalA !== totalB) return totalA - totalB
    if (a.faltantes !== b.faltantes) return a.faltantes - b.faltantes
    return a.nombreComercio.localeCompare(b.nombreComercio, 'es')
  })

  const itemsRecomendados = itemsAnalizados.filter((item) => item.recomendacion)
  const grupos = new Map()

  for (const item of itemsRecomendados) {
    const clave = item.recomendacion.clave
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        clave,
        etiqueta: item.recomendacion.etiqueta,
        items: [],
      })
    }

    grupos.get(clave).items.push(item)
  }

  const recomendacionesAgrupadas = [...grupos.values()]
  const productosComparables = itemsAnalizados.filter((item) => item.recomendacion).length
  const productosConFaltantes = itemsAnalizados.filter(
    (item) => item.estado === 'sinDatos' || item.estado === 'unicoPrecio' || item.estado === 'parcial',
  ).length

  const itemBase = rankingTodoEnUno.find(
    (resultado) => resultado.clave === obtenerClaveComercioSeleccionado(base),
  )
  const totalesOptimizados = itemsRecomendados.map((item) => item.recomendacion)
  const monedasOptimizadas = [...new Set(totalesOptimizados.map((item) => item.moneda).filter(Boolean))]
  const mezclaMonedasOptimizadas = monedasOptimizadas.length > 1
  const totalOptimizado = mezclaMonedasOptimizadas
    ? null
    : totalesOptimizados.reduce((suma, item) => suma + Number(item.valorTotal || 0), 0)
  const ahorro =
    !mezclaMonedasOptimizadas &&
    itemBase &&
    Number.isFinite(itemBase.total) &&
    Number.isFinite(totalOptimizado)
      ? itemBase.total - totalOptimizado
      : null

  const itemsOrdenados = ordenarItemsDetalle(itemsAnalizados)

  return {
    resumen: {
      textoComercioBase: esComercioValido(base) ? obtenerEtiquetaComercio(base) : 'Sin definir',
      totalBaseTexto: itemBase
        ? itemBase.totalTexto
        : 'Elegí un comercio base',
      totalOptimizadoTexto:
        mezclaMonedasOptimizadas || totalOptimizado === null
          ? mezclaMonedasOptimizadas
            ? 'Monedas mezcladas'
            : 'Sin datos'
          : formatearPrecioConCodigo(
              totalOptimizado,
              monedasOptimizadas[0] || preferenciasStore.monedaDefaultEfectiva,
            ),
      ahorroTexto:
        ahorro === null
          ? 'Sin cálculo exacto'
          : formatearPrecioConCodigo(
              ahorro,
              monedasOptimizadas[0] || preferenciasStore.monedaDefaultEfectiva,
            ),
      productosComparables,
      productosConFaltantes,
      mezclaMonedas: Boolean(
        rankingTodoEnUno.some((resultado) => resultado.mezclaMonedas) || mezclaMonedasOptimizadas,
      ),
    },
    rankingTodoEnUno,
    recomendacionesAgrupadas,
    items: itemsOrdenados,
  }
})

function esComercioValido(comercio) {
  return Boolean(comercio && (comercio.id || String(comercio.nombre || '').trim()))
}

function crearFilaComparacion(comercio = null) {
  contadorFilaComparacion += 1
  return {
    id: `filaComparacion${contadorFilaComparacion}`,
    comercio,
    mostrarEditor: !(esComercioValido(comercio) && comercio?.direccionId),
  }
}

function sincronizarFilasComparacion() {
  const filasGuardadas = comerciosComparacionGuardados.value.map((comercio) => crearFilaComparacion(comercio))
  filasComparacion.value = filasGuardadas
}

async function actualizarComercioBase(valor) {
  await listaJustaStore.actualizarConfiguracionInteligente(listaActual.value.id, {
    comercioBase: valor,
    heredarComercioActual: esComercioValido(valor),
  })

  if (debeColapsarSelectorPorSeleccion(valor)) {
    mostrarEditorComercioBase.value = false
  }
}

function toggleEditorComercioBase() {
  mostrarEditorComercioBase.value = !mostrarEditorComercioBase.value
}

async function eliminarComercioBase() {
  await listaJustaStore.actualizarConfiguracionInteligente(listaActual.value.id, {
    comercioBase: null,
    heredarComercioActual: false,
  })
  mostrarEditorComercioBase.value = false
}

function agregarFilaComparacion() {
  if (!esComercioValido(comercioBase.value)) {
    mostrarEditorComercioBase.value = true
    return
  }

  filasComparacion.value.push(crearFilaComparacion(null))
}

async function actualizarFilaComparacion(filaId, valor) {
  const fila = filasComparacion.value.find((actual) => actual.id === filaId)
  if (!fila) return

  fila.comercio = valor
  fila.mostrarEditor = !debeColapsarSelectorPorSeleccion(valor)
  await persistirComerciosComparacion()
}

async function eliminarFilaComparacion(filaId) {
  filasComparacion.value = filasComparacion.value.filter((fila) => fila.id !== filaId)
  await persistirComerciosComparacion()
}

async function persistirComerciosComparacion() {
  const comercios = filasComparacion.value
    .map((fila) => fila.comercio)
    .filter((comercio) => esComercioValido(comercio))

  await listaJustaStore.actualizarConfiguracionInteligente(listaActual.value.id, {
    comerciosComparacion: comercios,
  })
}

function toggleEditorComercioComparacion(filaId) {
  const fila = filasComparacion.value.find((actual) => actual.id === filaId)
  if (!fila) return
  fila.mostrarEditor = !fila.mostrarEditor
}

function obtenerNombreComercio(comercio) {
  return String(comercio?.nombre || '').trim() || 'Elegí un comercio'
}

function obtenerDireccionComercio(comercio) {
  return String(comercio?.direccionNombre || '').trim()
}

function debeColapsarSelectorPorSeleccion(valor) {
  if (!esComercioValido(valor) || !valor?.direccionId) return false
  if (!valor?.tieneMultiplesDirecciones) return true
  return Boolean(valor?.direccionSeleccionadaManual)
}

function toggleDescripcionComparacion() {
  if (!puedeColapsarDescripcionComparacion.value) return
  descripcionComparacionExpandida.value = !descripcionComparacionExpandida.value
}

function construirEtiquetaComercioDetalle(comercio, conteoPorNombreComercio) {
  const nombreComercio = String(comercio?.nombre || '').trim() || 'Comercio sin nombre'
  const direccionComercio = String(comercio?.direccionNombre || '').trim()
  const claveNombre = nombreComercio.toLowerCase()
  const mostrarDireccion =
    Boolean(direccionComercio) && (conteoPorNombreComercio.get(claveNombre) || 0) > 1

  return {
    nombreComercio,
    direccionComercio,
    mostrarDireccion,
    etiqueta: mostrarDireccion ? `${nombreComercio} - ${direccionComercio}` : nombreComercio,
  }
}

function ordenarPreciosPorComercio(precios) {
  return [...precios].sort((a, b) => {
    if (a.disponible !== b.disponible) return a.disponible ? -1 : 1
    if (a.disponible && b.disponible) {
      const totalA = Number(a.valorTotal)
      const totalB = Number(b.valorTotal)
      if (totalA !== totalB) return totalA - totalB
    }
    const ordenNombre = a.nombreComercio.localeCompare(b.nombreComercio, 'es')
    if (ordenNombre !== 0) return ordenNombre
    return a.direccionComercio.localeCompare(b.direccionComercio, 'es')
  })
}

function obtenerPrioridadEstadoDetalle(item) {
  if (item.estado === 'completo') return 4
  if (item.estado === 'parcial') return 3
  if (item.estado === 'unicoPrecio') return 2
  if (item.estado === 'sinDatos') return 1
  return 0
}

function ordenarItemsDetalle(items) {
  return [...items].sort((a, b) => {
    if (a.cantidadPreciosDisponibles !== b.cantidadPreciosDisponibles) {
      return b.cantidadPreciosDisponibles - a.cantidadPreciosDisponibles
    }
    const prioridadA = obtenerPrioridadEstadoDetalle(a)
    const prioridadB = obtenerPrioridadEstadoDetalle(b)
    if (prioridadA !== prioridadB) return prioridadB - prioridadA
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

function construirAnalisisItem(item, comercios, conteoPorNombreComercio) {
  const itemBase = {
    id: item.id,
    nombre: item.nombre || 'Producto sin nombre',
    cantidad: item.cantidad || 1,
    estado: 'sinDatos',
    estadoTexto: 'Sin precios',
    mensaje: 'Sin precios para comparar.',
    recomendacion: null,
    cantidadPreciosDisponibles: 0,
    preciosPorComercio: comercios.map((comercio) => ({
      clave: obtenerClaveComercioSeleccionado(comercio),
      ...construirEtiquetaComercioDetalle(comercio, conteoPorNombreComercio),
      totalTexto: 'Sin precio',
      disponible: false,
      valorTotal: null,
      moneda: preferenciasStore.monedaDefaultEfectiva,
    })),
    mapaPreciosPorComercio: new Map(),
  }

  if (!item.productoId || item.usaPreciosLocales) {
    return {
      ...itemBase,
      estado: 'sinProducto',
      estadoTexto: 'Sin referencia',
      mensaje: 'Este producto no tiene precios comparables por comercio en Mis Productos.',
    }
  }

  const producto = productosStore.obtenerProductoPorId(item.productoId)
  if (!producto) {
    return {
      ...itemBase,
      estado: 'sinProducto',
      estadoTexto: 'Sin referencia',
      mensaje: 'No se encontró el producto base para comparar precios.',
    }
  }

  const resultadosPorComercio = comercios.map((comercio) => {
    const precio = resolverPrecioProductoPorComercio(
      producto,
      item.cantidad,
      comercio,
      preferenciasStore.monedaDefaultEfectiva,
    )
    const etiquetaComercio = construirEtiquetaComercioDetalle(comercio, conteoPorNombreComercio)

    return {
      clave: obtenerClaveComercioSeleccionado(comercio),
      ...etiquetaComercio,
      comercio,
      ...precio,
      totalTexto: precio.disponible
        ? formatearPrecioConCodigo(precio.valorTotal, precio.moneda)
        : 'Sin precio',
    }
  })

  const resultadosPorComercioOrdenados = ordenarPreciosPorComercio(resultadosPorComercio)
  const mapaPreciosPorComercio = new Map(
    resultadosPorComercio.filter((precio) => precio.disponible).map((precio) => [precio.clave, precio]),
  )
  const disponibles = resultadosPorComercio.filter((precio) => precio.disponible)
  const cantidadComercios = comercios.length

  if (disponibles.length === 0) {
    return {
      ...itemBase,
      cantidadPreciosDisponibles: 0,
      preciosPorComercio: resultadosPorComercioOrdenados,
      mapaPreciosPorComercio,
      mensaje: 'Sin precios para comparar en los comercios elegidos.',
    }
  }

  const recomendacion = [...disponibles].sort((a, b) => Number(a.valorTotal) - Number(b.valorTotal))[0]

  if (disponibles.length === 1) {
    return {
      ...itemBase,
      estado: 'unicoPrecio',
      estadoTexto: 'Comparación parcial',
      mensaje: 'Comparación parcial con un solo precio disponible.',
      recomendacion: {
        ...recomendacion,
        etiqueta: recomendacion.etiqueta,
        totalTexto: recomendacion.totalTexto,
      },
      cantidadPreciosDisponibles: disponibles.length,
      preciosPorComercio: resultadosPorComercioOrdenados,
      mapaPreciosPorComercio,
    }
  }

  if (disponibles.length < cantidadComercios) {
    return {
      ...itemBase,
      estado: 'parcial',
      estadoTexto: 'Comparación parcial',
      mensaje: 'Comparación parcial con precios disponibles.',
      recomendacion: {
        ...recomendacion,
        etiqueta: recomendacion.etiqueta,
        totalTexto: recomendacion.totalTexto,
      },
      cantidadPreciosDisponibles: disponibles.length,
      preciosPorComercio: resultadosPorComercioOrdenados,
      mapaPreciosPorComercio,
    }
  }

  return {
    ...itemBase,
    estado: 'completo',
    estadoTexto: 'Comparación completa',
    mensaje: '',
    recomendacion: {
      ...recomendacion,
      etiqueta: recomendacion.etiqueta,
      totalTexto: recomendacion.totalTexto,
    },
    cantidadPreciosDisponibles: disponibles.length,
    preciosPorComercio: resultadosPorComercioOrdenados,
    mapaPreciosPorComercio,
  }
}

function claseTarjetaDetalle(estado) {
  if (estado === 'completo') return 'tarjeta-detalle-producto-completo'
  if (estado === 'parcial' || estado === 'unicoPrecio') return 'tarjeta-detalle-producto-parcial'
  if (estado === 'sinDatos' || estado === 'sinProducto') return 'tarjeta-detalle-producto-sin-datos'
  return ''
}

function obtenerTextoMayorista(item) {
  const recomendacion = item?.recomendacion
  if (!recomendacion?.usaMayorista) return ''

  const cantidad = Number(item?.cantidad)
  const escalas = Array.isArray(recomendacion?.escalas) ? recomendacion.escalas : []
  const escalasAplicables = escalas
    .filter((escala) => Number.isFinite(Number(escala?.cantidadMinima)))
    .filter((escala) => Number.isFinite(cantidad) && cantidad >= Number(escala.cantidadMinima))
    .sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima))
  const escalaActiva = escalasAplicables[0]

  if (!escalaActiva) return 'Precio mayorista aplicado por cantidad.'
  return `Precio mayorista aplicado desde ${escalaActiva.cantidadMinima} unidades.`
}

function estaTarjetaColapsada(itemId) {
  return estadoTarjetasDetalle.value[itemId] !== false
}

function toggleTarjetaDetalle(itemId) {
  estadoTarjetasDetalle.value[itemId] = !estaTarjetaColapsada(itemId)
}

watch(comerciosComparacionGuardados, sincronizarFilasComparacion, { immediate: true })

watch(
  puedeColapsarDescripcionComparacion,
  (puedeColapsar) => {
    if (!puedeColapsar) {
      descripcionComparacionExpandida.value = true
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await Promise.all([
    listaJustaStore.cargarListas(),
    productosStore.cargarProductos(),
    preferenciasStore.inicializar(),
  ])

  if (route.params.id) {
    await listaJustaStore.registrarUsoLista(route.params.id)
    await listaJustaStore.sincronizarComercioBaseInteligente(route.params.id)
  }
})
</script>

<style scoped>
.pagina-lista-justa-inteligente {
  padding-bottom: calc(84px + var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px));
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
.bloque-inteligente {
  border-radius: 14px;
  border-color: var(--borde-color);
  background: var(--fondo-tarjeta);
}
.bloque-titulo {
  font-size: 15px;
  font-weight: 700;
  color: var(--texto-primario);
}
.descripcion-bloque-inteligente {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--texto-secundario);
}
.fila-encabezado-ayuda {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.boton-toggle-ayuda-seccion {
  align-self: center;
}
.resumen-ahorro-optimizacion {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--color-secundario) 30%, var(--borde-color));
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-secundario-claro) 25%, var(--fondo-app-secundario));
}
.resumen-ahorro-optimizacion-etiqueta {
  font-size: 12px;
  color: var(--texto-secundario);
}
.resumen-ahorro-optimizacion-valor {
  font-size: 16px;
  color: var(--color-secundario);
}
.encabezado-comercio-base {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bloque-subtitulo {
  font-size: 12px;
  color: var(--texto-secundario);
  line-height: 1.2;
}
.boton-cambiar-comercio-base {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--color-secundario) 24%, var(--borde-color));
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-secundario) 8%, var(--fondo-app-secundario));
  font-weight: 700;
}
.contenedor-editor-comercio-base {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--borde-color) 82%, transparent);
}
.fila-encabezado-bloque {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.acciones-encabezado-comparacion {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.descripcion-comparacion-inteligente {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--texto-secundario);
}
.boton-toggle-descripcion-comparacion {
  align-self: center;
}
.fila-encabezado-bloque > div > .text-caption.text-grey-7 {
  display: none;
}
.estado-vacio-comparacion {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  border: 1px dashed var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-app-secundario);
  color: var(--texto-secundario);
}
.columna-comparacion {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}
.boton-agregar-comercio-inferior {
  align-self: flex-start;
}
.boton-agregar-comercio-inicial {
  align-self: flex-start;
}
.tarjeta-comercio-comparacion {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-app-secundario);
}
.fila-acciones-comercio-comparacion {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fila-acciones-comercio-comparacion-editor {
  justify-content: space-between;
}
.columna-ranking {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fila-ranking {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-app-secundario);
}
.fila-ranking-texto {
  min-width: 0;
}
.fila-ranking-nombre {
  font-weight: 700;
  color: var(--texto-primario);
}
.fila-ranking-direccion {
  margin-top: 2px;
  font-size: 12px;
  color: var(--texto-secundario);
}
.fila-ranking-detalle {
  margin-top: 2px;
  font-size: 12px;
  color: var(--texto-secundario);
}
.fila-ranking-total {
  flex-shrink: 0;
  color: var(--color-secundario);
}
.columna-recomendaciones {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.grupo-recomendacion {
  padding: 12px;
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-app-secundario);
}
.grupo-recomendacion-titulo {
  font-weight: 700;
  color: var(--texto-primario);
}
.grupo-recomendacion-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.chip-producto {
  max-width: 100%;
}
.columna-detalle-productos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tarjeta-detalle-producto {
  padding: 12px;
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-app-secundario);
}
.tarjeta-detalle-producto-completo {
  background: color-mix(in srgb, var(--color-secundario-claro) 32%, var(--fondo-app-secundario));
  border-color: color-mix(in srgb, var(--color-secundario) 36%, var(--borde-color));
}
.tarjeta-detalle-producto-parcial {
  background: color-mix(in srgb, var(--color-acento-fondo-suave) 45%, var(--fondo-app-secundario));
  border-color: color-mix(in srgb, var(--color-advertencia) 38%, var(--borde-color));
}
.tarjeta-detalle-producto-sin-datos {
  background: color-mix(in srgb, var(--color-error-fondo-suave) 42%, var(--fondo-app-secundario));
  border-color: color-mix(in srgb, var(--color-error) 35%, var(--borde-color));
}
.fila-detalle-superior {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.boton-toggle-detalle-producto {
  align-self: flex-start;
}
.detalle-producto-nombre {
  font-weight: 700;
  color: var(--texto-primario);
}
.resumen-tarjeta-colapsada {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detalle-recomendacion-cerrada {
  font-size: 16px;
  font-weight: 700;
  color: var(--texto-primario);
  line-height: 1.3;
}
.detalle-producto-mensaje {
  font-size: 13px;
  color: var(--texto-secundario);
}
.detalle-recomendacion {
  color: var(--texto-primario);
}
.detalle-mayorista {
  font-size: 12px;
  color: var(--texto-secundario);
}
.detalle-precios-comercio {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fila-precio-comercio {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--borde-color) 85%, transparent);
  border-radius: 8px;
  color: var(--texto-secundario);
}
.fila-precio-comercio-con-precio {
  background: color-mix(in srgb, var(--fondo-tarjeta) 20%, transparent);
}
.fila-precio-comercio-sin-precio {
  background: color-mix(in srgb, var(--color-error-fondo-suave) 38%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-error-borde) 78%, var(--borde-color));
}
.fila-precio-comercio-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fila-precio-comercio-nombre {
  font-size: 13px;
  color: var(--texto-primario);
}
.fila-precio-comercio-direccion {
  font-size: 11px;
  color: var(--texto-secundario);
  line-height: 1.25;
}
.boton-volver-lista-inteligente {
  margin-top: 10px;
}
@media (max-width: 760px) {
  .fila-ranking {
    flex-direction: column;
    align-items: flex-start;
  }
  .fila-ranking-total {
    text-align: left;
  }
  .fila-detalle-superior {
    flex-direction: column;
  }
}
</style>
