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
            <div class="bloque-titulo">Comercio base</div>
            <div class="text-caption text-grey-7 q-mb-sm">
              Se hereda desde la lista normal si ya había un comercio actual, pero lo podés cambiar.
            </div>
            <SelectorComercioDireccion
              :model-value="comercioBase"
              label-comercio="Comercio base"
              label-direccion="Sucursal base"
              @update:model-value="actualizarComercioBase"
            />
          </q-card-section>
        </q-card>

        <q-card flat bordered class="bloque-inteligente q-mb-md">
          <q-card-section>
            <div class="fila-encabezado-bloque">
              <div>
                <div class="bloque-titulo">Comercios a comparar</div>
                <div class="text-caption text-grey-7">
                  Elegí los otros comercios que querés poner frente al comercio base.
                </div>
              </div>
              <q-btn
                flat
                no-caps
                color="secondary"
                label="Agregar comercio"
                icon="add"
                @click="agregarFilaComparacion"
              />
            </div>

            <div v-if="filasComparacion.length === 0" class="estado-vacio-comparacion">
              <q-icon name="storefront" size="26px" color="secondary" />
              <span>Agregá al menos un comercio más para comparar precios.</span>
            </div>

            <div v-else class="columna-comparacion">
              <div
                v-for="fila in filasComparacion"
                :key="fila.id"
                class="fila-comercio-comparacion"
              >
                <SelectorComercioDireccion
                  :model-value="fila.comercio"
                  label-comercio="Comercio a comparar"
                  label-direccion="Sucursal a comparar"
                  @update:model-value="(valor) => actualizarFilaComparacion(fila.id, valor)"
                />
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  aria-label="Eliminar comercio"
                  @click="eliminarFilaComparacion(fila.id)"
                />
              </div>
            </div>

            <q-banner
              v-if="mensajeComparacionIncompleta"
              rounded
              class="q-mt-md bg-warning text-black"
            >
              {{ mensajeComparacionIncompleta }}
            </q-banner>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="bloque-inteligente q-mb-md">
          <q-card-section>
            <div class="bloque-titulo">Resumen general</div>

            <div v-if="resultadoInteligente.resumen.mezclaMonedas" class="text-caption text-warning q-mb-sm">
              Hay monedas mezcladas en la comparación. Los totales se muestran, pero no se calcula ahorro global.
            </div>

            <div class="grid-resumen">
              <div class="tarjeta-resumen">
                <span class="tarjeta-resumen-etiqueta">Comercio base</span>
                <strong class="tarjeta-resumen-valor">
                  {{ resultadoInteligente.resumen.textoComercioBase }}
                </strong>
              </div>
              <div class="tarjeta-resumen">
                <span class="tarjeta-resumen-etiqueta">Total en comercio base</span>
                <strong class="tarjeta-resumen-valor">
                  {{ resultadoInteligente.resumen.totalBaseTexto }}
                </strong>
              </div>
              <div class="tarjeta-resumen">
                <span class="tarjeta-resumen-etiqueta">Total optimizado</span>
                <strong class="tarjeta-resumen-valor">
                  {{ resultadoInteligente.resumen.totalOptimizadoTexto }}
                </strong>
              </div>
              <div class="tarjeta-resumen">
                <span class="tarjeta-resumen-etiqueta">Ahorro estimado</span>
                <strong class="tarjeta-resumen-valor">
                  {{ resultadoInteligente.resumen.ahorroTexto }}
                </strong>
              </div>
            </div>

            <div class="fila-metricas-secundarias">
              <q-chip dense color="secondary" text-color="white">
                {{ resultadoInteligente.resumen.productosComparables }} productos comparables
              </q-chip>
              <q-chip
                dense
                :color="resultadoInteligente.resumen.productosConFaltantes > 0 ? 'warning' : 'positive'"
                :text-color="resultadoInteligente.resumen.productosConFaltantes > 0 ? 'black' : 'white'"
              >
                {{ resultadoInteligente.resumen.productosConFaltantes }} con faltantes
              </q-chip>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="bloque-inteligente q-mb-md">
          <q-card-section>
            <div class="bloque-titulo">Comprar todo en un solo comercio</div>
            <div class="columna-ranking">
              <div
                v-for="resultado in resultadoInteligente.rankingTodoEnUno"
                :key="resultado.clave"
                class="fila-ranking"
              >
                <div class="fila-ranking-texto">
                  <div class="fila-ranking-nombre">{{ resultado.etiqueta }}</div>
                  <div class="fila-ranking-detalle">
                    {{
                      resultado.faltantes > 0
                        ? `Total parcial. Faltan ${resultado.faltantes} productos.`
                        : 'Tiene precio para toda la lista comparable.'
                    }}
                  </div>
                </div>
                <strong class="fila-ranking-total">{{ resultado.totalTexto }}</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="bloque-inteligente q-mb-md">
          <q-card-section>
            <div class="bloque-titulo">Compra optimizada por producto</div>
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

        <q-card flat bordered class="bloque-inteligente">
          <q-card-section>
            <div class="bloque-titulo">Detalle por producto</div>
            <div class="columna-detalle-productos">
              <div
                v-for="item in resultadoInteligente.items"
                :key="item.id"
                class="tarjeta-detalle-producto"
              >
                <div class="fila-detalle-superior">
                  <div>
                    <div class="detalle-producto-nombre">{{ item.nombre }}</div>
                    <div class="detalle-producto-meta">Cantidad: {{ item.cantidad }}</div>
                  </div>
                  <q-chip
                    dense
                    :color="colorEstadoItem(item.estado)"
                    :text-color="textoEstadoItem(item.estado)"
                  >
                    {{ item.estadoTexto }}
                  </q-chip>
                </div>

                <div class="detalle-producto-mensaje q-mt-xs">{{ item.mensaje }}</div>

                <div v-if="item.recomendacion" class="detalle-recomendacion q-mt-sm">
                  <strong>Recomendación:</strong>
                  {{ item.recomendacion.etiqueta }} · {{ item.recomendacion.totalTexto }}
                </div>

                <div
                  v-if="item.ahorroVsBaseTexto"
                  class="detalle-ahorro q-mt-xs"
                >
                  {{ item.ahorroVsBaseTexto }}
                </div>

                <div class="detalle-precios-comercio q-mt-sm">
                  <div
                    v-for="precio in item.preciosPorComercio"
                    :key="precio.clave"
                    class="fila-precio-comercio"
                  >
                    <span>{{ precio.etiqueta }}</span>
                    <strong>{{ precio.totalTexto }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </div>

    <BotonAccionSticky
      v-if="listaActual"
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
let contadorFilaComparacion = 0

const listaActual = computed(() => listaJustaStore.obtenerListaPorId(route.params.id))
const comercioBase = computed(() => listaActual.value?.configuracionInteligente?.comercioBase || null)
const comerciosComparacionGuardados = computed(
  () => listaActual.value?.configuracionInteligente?.comerciosComparacion || [],
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
  const itemsAnalizados = listaActual.value.items.map((item) =>
    construirAnalisisItem(item, comercios, base),
  )

  const rankingTodoEnUno = comercios.map((comercio) => {
    const clave = obtenerClaveComercioSeleccionado(comercio)
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
    items: itemsAnalizados,
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
  }
}

function sincronizarFilasComparacion() {
  const filasGuardadas = comerciosComparacionGuardados.value.map((comercio) => crearFilaComparacion(comercio))
  filasComparacion.value = filasGuardadas
}

async function actualizarComercioBase(valor) {
  await listaJustaStore.actualizarConfiguracionInteligente(listaActual.value.id, {
    comercioBase: valor,
  })
}

function agregarFilaComparacion() {
  filasComparacion.value.push(crearFilaComparacion(null))
}

async function actualizarFilaComparacion(filaId, valor) {
  const fila = filasComparacion.value.find((actual) => actual.id === filaId)
  if (!fila) return

  fila.comercio = valor
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

function construirAnalisisItem(item, comercios, comercioBaseActual) {
  const itemBase = {
    id: item.id,
    nombre: item.nombre || 'Producto sin nombre',
    cantidad: item.cantidad || 1,
    estado: 'sinDatos',
    estadoTexto: 'Sin precios',
    mensaje: 'Sin precios para comparar.',
    recomendacion: null,
    ahorroVsBaseTexto: '',
    preciosPorComercio: comercios.map((comercio) => ({
      clave: obtenerClaveComercioSeleccionado(comercio),
      etiqueta: obtenerEtiquetaComercio(comercio),
      totalTexto: 'Sin precio',
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

    return {
      clave: obtenerClaveComercioSeleccionado(comercio),
      etiqueta: obtenerEtiquetaComercio(comercio),
      comercio,
      ...precio,
      totalTexto: precio.disponible
        ? formatearPrecioConCodigo(precio.valorTotal, precio.moneda)
        : 'Sin precio',
    }
  })

  const mapaPreciosPorComercio = new Map(
    resultadosPorComercio.filter((precio) => precio.disponible).map((precio) => [precio.clave, precio]),
  )
  const disponibles = resultadosPorComercio.filter((precio) => precio.disponible)
  const cantidadComercios = comercios.length

  if (disponibles.length === 0) {
    return {
      ...itemBase,
      preciosPorComercio: resultadosPorComercio,
      mapaPreciosPorComercio,
      mensaje: 'Sin precios para comparar en los comercios elegidos.',
    }
  }

  const recomendacion = [...disponibles].sort((a, b) => Number(a.valorTotal) - Number(b.valorTotal))[0]
  const claveBase = obtenerClaveComercioSeleccionado(comercioBaseActual)
  const precioBase = mapaPreciosPorComercio.get(claveBase)
  const ahorroVsBase =
    precioBase && recomendacion && recomendacion.clave !== claveBase
      ? Number(precioBase.valorTotal) - Number(recomendacion.valorTotal)
      : 0

  if (disponibles.length === 1) {
    return {
      ...itemBase,
      estado: 'unicoPrecio',
      estadoTexto: 'Comparación parcial',
      mensaje: `Solo hay precio en ${disponibles[0].etiqueta}.`,
      recomendacion: {
        ...recomendacion,
        etiqueta: recomendacion.etiqueta,
        totalTexto: recomendacion.totalTexto,
      },
      ahorroVsBaseTexto:
        ahorroVsBase > 0
          ? `Ahorro frente al comercio base: ${formatearPrecioConCodigo(ahorroVsBase, recomendacion.moneda)}`
          : '',
      preciosPorComercio: resultadosPorComercio,
      mapaPreciosPorComercio,
    }
  }

  if (disponibles.length < cantidadComercios) {
    return {
      ...itemBase,
      estado: 'parcial',
      estadoTexto: 'Comparación parcial',
      mensaje: `Faltan precios en ${cantidadComercios - disponibles.length} comercio${cantidadComercios - disponibles.length === 1 ? '' : 's'}. Recomendación provisoria: ${recomendacion.etiqueta}.`,
      recomendacion: {
        ...recomendacion,
        etiqueta: recomendacion.etiqueta,
        totalTexto: recomendacion.totalTexto,
      },
      ahorroVsBaseTexto:
        ahorroVsBase > 0
          ? `Ahorro frente al comercio base: ${formatearPrecioConCodigo(ahorroVsBase, recomendacion.moneda)}`
          : '',
      preciosPorComercio: resultadosPorComercio,
      mapaPreciosPorComercio,
    }
  }

  return {
    ...itemBase,
    estado: 'completo',
    estadoTexto: 'Comparación completa',
    mensaje: `Mejor opción actual: ${recomendacion.etiqueta}.`,
    recomendacion: {
      ...recomendacion,
      etiqueta: recomendacion.etiqueta,
      totalTexto: recomendacion.totalTexto,
    },
    ahorroVsBaseTexto:
      ahorroVsBase > 0
        ? `Ahorro frente al comercio base: ${formatearPrecioConCodigo(ahorroVsBase, recomendacion.moneda)}`
        : '',
    preciosPorComercio: resultadosPorComercio,
    mapaPreciosPorComercio,
  }
}

function colorEstadoItem(estado) {
  if (estado === 'completo') return 'positive'
  if (estado === 'parcial' || estado === 'unicoPrecio') return 'warning'
  return 'grey-6'
}

function textoEstadoItem(estado) {
  return estado === 'parcial' || estado === 'unicoPrecio' ? 'black' : 'white'
}

watch(comerciosComparacionGuardados, sincronizarFilasComparacion, { immediate: true })

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
.fila-encabezado-bloque {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
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
.fila-comercio-comparacion {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}
.grid-resumen {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.tarjeta-resumen {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--borde-color);
  border-radius: 12px;
  background: var(--fondo-app-secundario);
}
.tarjeta-resumen-etiqueta {
  font-size: 11px;
  font-weight: 700;
  color: var(--texto-secundario);
  text-transform: uppercase;
}
.tarjeta-resumen-valor {
  font-size: 16px;
  color: var(--texto-primario);
  line-height: 1.25;
}
.fila-metricas-secundarias {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
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
.fila-detalle-superior {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.detalle-producto-nombre {
  font-weight: 700;
  color: var(--texto-primario);
}
.detalle-producto-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--texto-secundario);
}
.detalle-producto-mensaje {
  font-size: 13px;
  color: var(--texto-secundario);
}
.detalle-recomendacion {
  color: var(--texto-primario);
}
.detalle-ahorro {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-secundario);
}
.detalle-precios-comercio {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fila-precio-comercio {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--texto-secundario);
}
@media (max-width: 760px) {
  .fila-comercio-comparacion {
    grid-template-columns: 1fr;
  }
  .grid-resumen {
    grid-template-columns: 1fr;
  }
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
