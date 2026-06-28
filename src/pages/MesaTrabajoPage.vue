<template>
  <q-page class="mesa-trabajo-pagina">
    <div
      v-if="mesaCargando"
      class="col flex flex-center column q-pa-xl"
    >
      <q-spinner color="primary" size="42px" />
      <div class="text-body2 text-grey-6 q-mt-md text-center">Cargando mesa de trabajo...</div>
    </div>

    <!-- Contenido normal -->
    <template v-else>
      <!-- Cabecera -->
      <div class="mesa-trabajo-barra">
        <div class="contenedor-pagina mesa-trabajo-header q-px-md">
          <div class="mesa-trabajo-titulos">
            <div class="mesa-trabajo-titulo">Mesa de trabajo</div>
            <div class="mesa-trabajo-subtitulo">Productos pendientes</div>
          </div>
          <div class="mesa-trabajo-contador-chip">
            <span>{{ cantidadListos }} / {{ sesionStore.items.length }}</span>
            <span class="mesa-trabajo-contador-texto">artículos</span>
          </div>
        </div>
      </div>

      <!-- Buscador sticky -->
      <div class="buscador-mesa-sticky">
        <div class="contenedor-pagina buscador-mesa-contenido q-px-md q-pb-xs">
          <InputBusqueda
            v-model="textoBusqueda"
            placeholder="Buscar por nombre, marca o código..."
          />
        </div>
      </div>

      <!-- Lista de borradores -->
      <div
        class="mesa-lista-scroll"
        :class="{
          'mesa-lista-con-barra': seleccion.modoSeleccion.value,
          'mesa-lista-con-barra-expandida': seleccion.modoSeleccion.value && menuEliminacionAbierto,
        }"
      >
        <div class="contenedor-pagina q-px-md q-pt-sm q-pb-md">
          <!-- Sin resultados de búsqueda -->
          <div v-if="textoBusqueda && itemsFiltrados.length === 0" class="text-center q-pa-xl">
            <q-icon name="search_off" size="64px" color="grey-5" />
            <p class="text-h6 text-grey-7 q-mt-md">Sin resultados</p>
            <p class="text-grey-6">No hay ítems para "{{ textoBusqueda }}"</p>
          </div>

          <div class="row q-col-gutter-md">
            <div
              v-for="item in itemsFiltrados"
              :key="item.id"
              class="col-12 col-sm-6 col-md-4 col-xl-3"
            >
              <TarjetaProductoBorrador
                :item="item"
                :modo-seleccion="seleccion.modoSeleccion.value"
                :seleccionado="seleccion.estaSeleccionado(item.id)"
                @long-press="seleccion.activarModoSeleccion(item.id)"
                @toggle-seleccion="seleccion.toggleSeleccion(item.id)"
                @update:item="(v) => sesionStore.actualizarItem(item.id, v)"
                @eliminar="sesionStore.eliminarItem(item.id)"
                @enviar="enviarItem(item)"
                @abrir-nuevo-comercio="abrirDialogoNuevoComercioDesdeTarjeta(item.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer: se oculta en modo selección -->
      <Transition name="deslizar-abajo">
        <div v-if="!seleccion.modoSeleccion.value" class="footer-contenedor">
          <q-separator />
          <div class="mesa-trabajo-footer">
            <div class="contenedor-pagina row items-center no-wrap">
              <q-btn
                flat
                no-caps
                color="negative"
                size="sm"
                :disable="sesionStore.items.length === 0"
                @click="confirmarLimpiar"
              >
                Limpiar todo
              </q-btn>
              <q-space />
              <q-btn
                unelevated
                no-caps
                color="primary"
                :disable="cantidadListos === 0 || guardando"
                :loading="guardando"
                @click="guardarCompletos"
              >
                <IconSend :size="16" class="q-mr-xs" />
                Enviar listos ({{ cantidadListos }})
              </q-btn>
            </div>
          </div>
        </div>
      </Transition>
    </template>

    <!-- Barra de selección flotante con animación -->
    <Transition name="deslizar-abajo">
      <div v-if="seleccion.modoSeleccion.value" class="seleccion-barra-flotante">
        <div class="contenedor-pagina q-px-md q-py-xs">
          <div class="row items-center no-wrap seleccion-barra-principal">
            <q-btn
              outline
              round
              dense
              color="grey-8"
              icon="close"
              aria-label="Cerrar selección"
              class="boton-cerrar-seleccion"
              @click="cerrarSeleccion()"
            />
            <div class="q-ml-sm seleccion-barra-textos">
              <div class="text-caption text-grey-7">
                {{ seleccion.cantidadSeleccionados.value }} seleccionados
              </div>
            </div>
            <q-space />
            <q-btn
              flat
              round
              dense
              color="grey-7"
              class="q-mr-sm boton-toggle-eliminacion"
              :aria-label="
                menuEliminacionAbierto ? 'Ocultar opción de borrado' : 'Mostrar opción de borrado'
              "
              @click="toggleMenuEliminacion"
            >
              <q-icon
                name="keyboard_arrow_up"
                size="24px"
                :class="{ 'icono-toggle-eliminacion-abierto': menuEliminacionAbierto }"
              />
            </q-btn>
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="boton-asignar-comercio boton-accion-seleccion"
              :disable="!seleccion.haySeleccionados.value"
              @click="abrirAsignarComercio"
            >
              Asignar comercio
            </q-btn>
          </div>
          <Transition name="desplegar-eliminacion">
            <div v-if="menuEliminacionAbierto" class="seleccion-barra-expandida">
              <div class="seleccion-barra-accion-eliminar">
                <q-btn
                  v-if="!confirmacionEliminarActiva"
                  unelevated
                  no-caps
                  color="negative"
                  icon="delete"
                  class="full-width boton-accion-seleccion"
                  :disable="!seleccion.haySeleccionados.value"
                  @click="abrirConfirmacionEliminar"
                >
                  Borrar lo seleccionado
                </q-btn>
                <div v-else class="seleccion-barra-confirmacion-eliminar">
                  <q-btn
                    unelevated
                    no-caps
                    color="negative"
                    class="boton-confirmacion-eliminar"
                    :disable="!seleccion.haySeleccionados.value"
                    @click="borrarSeleccionados"
                  >
                    Confirmar
                  </q-btn>
                  <q-btn
                    flat
                    no-caps
                    color="grey-8"
                    class="boton-cancelar-eliminar"
                    @click="cancelarConfirmacionEliminar"
                  >
                    Cancelar
                  </q-btn>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Bottom sheet: asignar comercio en bloque -->
    <q-dialog v-model="dialogoAsignarComercio" position="bottom">
      <q-card
        style="
          border-radius: 16px 16px 0 0;
          width: 100%;
          max-width: 100vw;
          padding-bottom: calc(var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px));
        "
      >
        <q-card-section class="q-pb-sm">
          <div class="text-subtitle2">
            Asignar comercio a {{ seleccion.cantidadSeleccionados.value }} ítem(s)
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none q-pb-sm">
          <SelectorComercioDireccion v-model="comercioParaAsignar" />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="add_circle"
            label="Agregar comercio rápido"
            size="md"
            class="full-width q-mt-md boton-agregar-masivo"
            @click="abrirDialogoNuevoComercioDesdeAsignacionMasiva"
          />
        </q-card-section>
        <q-card-section class="q-pt-xs">
          <div class="row justify-end q-gutter-xs">
            <q-btn flat no-caps color="grey-7" v-close-popup>Cancelar</q-btn>
            <q-btn
              unelevated
              no-caps
              color="primary"
              :disable="!comercioParaAsignar"
              @click="confirmarAsignarComercio"
            >
              Asignar
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo: Agregar Nuevo Comercio Rápido desde tarjeta -->
    <DialogoAgregarComercioRapido
      v-model="dialogoNuevoComercioAbierto"
      :nombre-inicial="datosInicialesNuevoComercio.nombre"
      :direccion-inicial="datosInicialesNuevoComercio.direccion"
      @comercio-creado="alCrearComercio"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import TarjetaProductoBorrador from '../components/Scanner/TarjetaProductoBorrador.vue'
import SelectorComercioDireccion from '../components/Compartidos/SelectorComercioDireccion.vue'
import DialogoAgregarComercioRapido from '../components/Formularios/Dialogos/DialogoAgregarComercioRapido.vue'
import InputBusqueda from '../components/Compartidos/InputBusqueda.vue'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'
import { useListaJustaStore } from '../almacenamiento/stores/ListaJustaStore.js'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import { useComerciStore } from '../almacenamiento/stores/comerciosStore.js'
import usuarioActualService from '../almacenamiento/servicios/UsuarioActualService.js'
import { useSeleccionMultiple } from '../composables/useSeleccionMultiple.js'
import { IconSend } from '@tabler/icons-vue'

const router = useRouter()
const $q = useQuasar()
const sesionStore = useSesionEscaneoStore()
const listaJustaStore = useListaJustaStore()
const productosStore = useProductosStore()
const comerciosStore = useComerciStore()
const seleccion = useSeleccionMultiple()

const textoBusqueda = ref('')
const guardando = ref(false)
const dialogoAsignarComercio = ref(false)
const comercioParaAsignar = ref(null)
const menuEliminacionAbierto = ref(false)
const confirmacionEliminarActiva = ref(false)
const ordenItemsEstable = ref([])
const ordenEstableInicializado = ref(false)

const dialogoNuevoComercioAbierto = ref(false)
const itemIdParaNuevoComercio = ref(null)
const datosInicialesNuevoComercio = ref({ nombre: '', direccion: '' })

const mesaCargando = computed(() => sesionStore.cargando || !sesionStore.sesionCargada)

onMounted(async () => {
  await comerciosStore.cargarComercios()
  seleccion.actualizarItems(sesionStore.items)
})

// Si la mesa se vacía durante la sesión → navega a inicio
watch(
  () => sesionStore.tieneItemsPendientes,
  (tieneItems) => {
    if (!mesaCargando.value && !tieneItems) router.push('/')
  },
)

// Mantiene itemsDisponibles del composable sincronizado
watch(
  () => sesionStore.items,
  (v) => seleccion.actualizarItems(v),
  { immediate: true, deep: true },
)

watch(
  () => sesionStore.items.map((item) => item.id),
  () => sincronizarOrdenItemsEstable(sesionStore.items),
  { immediate: true },
)

// Auto-cancela selección si el usuario deselecciona el último ítem
watch(seleccion.cantidadSeleccionados, (cantidad) => {
  if (cantidad === 0 && seleccion.modoSeleccion.value) {
    menuEliminacionAbierto.value = false
    confirmacionEliminarActiva.value = false
    seleccion.desactivarModoSeleccion()
  }
})

function esItemCompleto(item) {
  return !!item.nombre?.trim() && item.precio > 0 && !!item.comercio
}

const cantidadListos = computed(() => sesionStore.items.filter((i) => esItemCompleto(i)).length)

function ordenarIdsParaEntrada(items) {
  const incompletos = items.filter((item) => !esItemCompleto(item))
  const completos = items.filter((item) => esItemCompleto(item))
  return [...incompletos, ...completos].map((item) => item.id)
}

function sincronizarOrdenItemsEstable(items) {
  if (!ordenEstableInicializado.value && items.length === 0) return
  if (!ordenEstableInicializado.value) {
    ordenItemsEstable.value = ordenarIdsParaEntrada(items)
    ordenEstableInicializado.value = true
    return
  }

  const idsActuales = items.map((item) => item.id)
  const idsActualesSet = new Set(idsActuales)
  const idsOrdenadosExistentes = ordenItemsEstable.value.filter((id) => idsActualesSet.has(id))
  const idsOrdenadosSet = new Set(idsOrdenadosExistentes)
  const idsNuevos = idsActuales.filter((id) => !idsOrdenadosSet.has(id))
  ordenItemsEstable.value = [...idsOrdenadosExistentes, ...idsNuevos]
}

// Normaliza texto: minúsculas + sin tildes
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const itemsOrdenados = computed(() => {
  const itemsPorId = new Map(sesionStore.items.map((item) => [item.id, item]))
  return ordenItemsEstable.value.map((id) => itemsPorId.get(id)).filter(Boolean)
})

// Items filtrados por buscador (sobre la lista ya ordenada)
const itemsFiltrados = computed(() => {
  const texto = textoBusqueda.value?.trim() || ''
  if (!texto) return itemsOrdenados.value
  const textoNorm = normalizarTexto(texto)
  const palabras = textoNorm.split(/\s+/).filter(Boolean)
  const esNumerico = /^\d+$/.test(texto)
  return itemsOrdenados.value.filter((i) => {
    if (esNumerico && i.codigoBarras?.includes(texto)) return true
    const nombreNorm = normalizarTexto(i.nombre || '')
    if (palabras.every((p) => nombreNorm.includes(p))) return true
    const marcaNorm = normalizarTexto(i.marca || '')
    if (marcaNorm && marcaNorm.includes(textoNorm)) return true
    return false
  })
})

async function _guardarItem(item) {
  const comercio = item.comercio
  let productoDestinoId = item.productoExistenteId || null
  const datoPrecio = {
    comercioId: comercio?.id || null,
    direccionId: comercio?.direccionId || null,
    comercio: comercio?.nombre || 'Sin comercio',
    nombreCompleto: comercio?.direccionNombre
      ? `${comercio.nombre} — ${comercio.direccionNombre}`
      : comercio?.nombre,
    direccion: comercio?.direccionNombre || '',
    valor: item.precio,
    moneda: item.moneda,
    activarPreciosMayoristas: Boolean(item.activarPreciosMayoristas),
    escalasPorCantidad: Array.isArray(item.escalasPorCantidad) ? item.escalasPorCantidad : [],
    fecha: new Date().toISOString(),
    confirmaciones: 0,
    usuarioId: usuarioActualService.obtenerUsuarioIdActual(),
  }
  if (item.productoExistenteId) {
    await productosStore.agregarPrecioAProducto(item.productoExistenteId, datoPrecio)
    await productosStore.actualizarProducto(item.productoExistenteId, {
      nombre: item.nombre,
      imagen: item.imagen,
      fotoFuente: item.fotoFuente || (item.imagen ? 'usuario' : null),
      marca: item.marca,
      cantidad: item.cantidad,
      unidad: item.unidad,
    })
  } else {
    const productoGuardado = await productosStore.agregarProducto({
      codigoBarras: item.codigoBarras,
      nombre: item.nombre,
      imagen: item.imagen,
      fotoFuente: item.fotoFuente || (item.imagen ? 'usuario' : null),
      marca: item.marca,
      cantidad: item.cantidad,
      unidad: item.unidad,
      precios: [datoPrecio],
    })
    productoDestinoId = productoGuardado?.id || null
  }

  if (item.origenListaJusta?.listaId && item.origenListaJusta?.itemId) {
    await listaJustaStore.marcarItemComoEnMisProductos(
      item.origenListaJusta.listaId,
      item.origenListaJusta.itemId,
      productoDestinoId,
    )
  }

  if (comercio?.id) comerciosStore.registrarUso(comercio.id, comercio.direccionId)
  sesionStore.eliminarItem(item.id)
}

async function guardarCompletos() {
  const completos = sesionStore.items.filter(
    (i) => !!i.nombre?.trim() && i.precio > 0 && !!i.comercio,
  )
  if (!completos.length) return
  guardando.value = true
  try {
    for (const item of completos) await _guardarItem(item)
    $q.notify({ type: 'positive', message: `${completos.length} artículo(s) guardado(s)` })
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar' })
  } finally {
    guardando.value = false
  }
}

async function enviarItem(item) {
  guardando.value = true
  try {
    await _guardarItem(item)
    $q.notify({ type: 'positive', message: 'Artículo guardado' })
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar' })
  } finally {
    guardando.value = false
  }
}

function confirmarLimpiar() {
  $q.dialog({
    title: 'Limpiar mesa',
    message: '¿Eliminar todos los ítems de la mesa de trabajo?',
    cancel: true,
    persistent: true,
  }).onOk(() => sesionStore.limpiarTodo())
}

function abrirAsignarComercio() {
  comercioParaAsignar.value = null
  dialogoAsignarComercio.value = true
}

function toggleMenuEliminacion() {
  menuEliminacionAbierto.value = !menuEliminacionAbierto.value
  if (!menuEliminacionAbierto.value) confirmacionEliminarActiva.value = false
}

function cerrarSeleccion() {
  menuEliminacionAbierto.value = false
  confirmacionEliminarActiva.value = false
  seleccion.desactivarModoSeleccion()
}

function abrirConfirmacionEliminar() {
  if (!seleccion.haySeleccionados.value) return
  confirmacionEliminarActiva.value = true
}

function cancelarConfirmacionEliminar() {
  confirmacionEliminarActiva.value = false
}

function borrarSeleccionados() {
  const idsSeleccionados = seleccion.arraySeleccionados.value
  if (!idsSeleccionados.length) return

  idsSeleccionados.forEach((id) => {
    sesionStore.eliminarItem(id)
  })

  menuEliminacionAbierto.value = false
  confirmacionEliminarActiva.value = false
  seleccion.limpiarDespuesDeEliminar()
}

function confirmarAsignarComercio() {
  if (!comercioParaAsignar.value) return
  sesionStore.asignarComercio(seleccion.arraySeleccionados.value, comercioParaAsignar.value)
  dialogoAsignarComercio.value = false
  cerrarSeleccion()
}

function abrirDialogoNuevoComercioDesdeTarjeta(itemId) {
  itemIdParaNuevoComercio.value = itemId

  // Buscar el ítem para pre-llenar datos si el usuario escribió algo en los inputs
  const item = sesionStore.items.find((i) => i.id === itemId)
  if (item?.comercio) {
    datosInicialesNuevoComercio.value = {
      nombre: item.comercio.nombre || '',
      direccion: item.comercio.direccionNombre || '',
    }
  } else {
    datosInicialesNuevoComercio.value = { nombre: '', direccion: '' }
  }

  dialogoNuevoComercioAbierto.value = true
}

function abrirDialogoNuevoComercioDesdeAsignacionMasiva() {
  itemIdParaNuevoComercio.value = null // Indica que es masivo
  datosInicialesNuevoComercio.value = { nombre: '', direccion: '' }
  dialogoNuevoComercioAbierto.value = true
}

function alCrearComercio(comercioCreado) {
  const datosComercio = {
    id: comercioCreado.id,
    nombre: comercioCreado.nombre,
    direccionId: comercioCreado.direcciones?.[0]?.id || null,
    direccionNombre:
      comercioCreado.direcciones?.[0]?.nombreCompleto ||
      comercioCreado.direcciones?.[0]?.calle ||
      '',
  }

  if (itemIdParaNuevoComercio.value) {
    // Caso: Desde una sola tarjeta
    sesionStore.actualizarItem(itemIdParaNuevoComercio.value, { comercio: datosComercio })
  } else {
    // Caso: Asignación masiva (desde el diálogo)
    sesionStore.asignarComercio(seleccion.arraySeleccionados.value, datosComercio)
    dialogoAsignarComercio.value = false
    cerrarSeleccion()
  }

  dialogoNuevoComercioAbierto.value = false
  itemIdParaNuevoComercio.value = null
}
</script>

<style scoped>
.mesa-trabajo-pagina {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.mesa-lista-scroll {
  flex: 1;
  overflow-y: auto;
}
.mesa-trabajo-barra {
  border-bottom: 1px solid var(--borde-color);
  background: var(--fondo-tarjeta);
  position: sticky;
  top: 0;
  z-index: 10;
}
.mesa-trabajo-header {
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.mesa-trabajo-titulos {
  min-width: 0;
}
.mesa-trabajo-titulo {
  color: var(--texto-primario);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}
.mesa-trabajo-subtitulo {
  margin-top: 3px;
  color: var(--texto-secundario);
  font-size: 12px;
  line-height: 1.2;
}
.mesa-trabajo-contador-chip {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--texto-sobre-primario);
  background: var(--color-primario);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
.buscador-mesa-sticky {
  position: sticky;
  top: 66px;
  z-index: 11;
  background: var(--fondo-app);
}
.buscador-mesa-contenido {
  padding-top: 10px;
}
.seleccion-barra-flotante {
  position: fixed;
  bottom: calc(var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px));
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--fondo-tarjeta);
  box-shadow: var(--sombra-media);
}
.seleccion-barra-flotante .contenedor-pagina {
  min-height: 52px;
}
.seleccion-barra-principal {
  min-height: 52px;
  gap: 6px;
}
.boton-cerrar-seleccion {
  flex-shrink: 0;
}
.seleccion-barra-textos {
  min-width: 0;
  flex-shrink: 1;
}
.boton-asignar-comercio {
  flex: 0 0 auto;
  min-width: 0;
}
.boton-accion-seleccion {
  min-height: 40px;
}
.seleccion-barra-expandida {
  padding: 0 0 8px;
}
.seleccion-barra-accion-eliminar {
  min-height: 40px;
}
.seleccion-barra-confirmacion-eliminar {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-error-borde);
  border-radius: 8px;
  background: var(--color-error-fondo-suave);
  display: flex;
  align-items: center;
  padding: 4px;
  gap: 6px;
}
.boton-confirmacion-eliminar,
.boton-cancelar-eliminar {
  min-height: 32px;
}
.boton-confirmacion-eliminar {
  flex: 1;
}
.boton-cancelar-eliminar {
  flex: 1;
}
.boton-toggle-eliminacion {
  flex-shrink: 0;
}
.icono-toggle-eliminacion-abierto {
  transform: rotate(180deg);
}
.mesa-lista-con-barra {
  padding-bottom: 68px;
}
.mesa-lista-con-barra-expandida {
  padding-bottom: 128px;
}
.footer-contenedor {
  background: var(--fondo-tarjeta);
  position: sticky;
  bottom: var(--espacio-publicidad, 0px);
}
.mesa-trabajo-footer .contenedor-pagina {
  padding: 10px 16px;
  padding-bottom: calc(10px + var(--safe-area-bottom, 0px));
}
.deslizar-abajo-enter-active,
.deslizar-abajo-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.deslizar-abajo-enter-from,
.deslizar-abajo-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
.desplegar-eliminacion-enter-active,
.desplegar-eliminacion-leave-active {
  transition:
    max-height 0.22s ease,
    opacity 0.22s ease,
    transform 0.22s ease;
  overflow: hidden;
}
.desplegar-eliminacion-enter-from,
.desplegar-eliminacion-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(8px);
}
.desplegar-eliminacion-enter-to,
.desplegar-eliminacion-leave-from {
  max-height: 72px;
  opacity: 1;
  transform: translateY(0);
}
.boton-agregar-masivo {
  border-radius: 12px;
  transition: all 0.2s ease;
  font-weight: 600;
}
.boton-agregar-masivo:hover {
  background: color-mix(in srgb, var(--color-primario) 8%, transparent) !important;
}
@media (max-width: 360px) {
  .mesa-trabajo-header {
    min-height: 62px;
    gap: 8px;
  }
  .mesa-trabajo-titulo {
    font-size: 14px;
  }
  .mesa-trabajo-subtitulo {
    font-size: 11px;
  }
  .mesa-trabajo-contador-chip {
    min-height: 26px;
    padding: 0 8px;
    font-size: 11px;
  }
  .mesa-trabajo-contador-texto {
    display: none;
  }
  .buscador-mesa-sticky {
    top: 62px;
  }
}
</style>
