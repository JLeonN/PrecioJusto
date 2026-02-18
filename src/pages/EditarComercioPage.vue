<template>
  <q-page class="q-pa-md">
    <div class="contenedor-editar">
      <!-- INDICADOR DE CARGA -->
      <div v-if="cargando" class="text-center q-pa-xl">
        <q-spinner color="primary" size="50px" />
        <p class="text-grey-7 q-mt-md">Cargando comercio...</p>
      </div>

      <!-- MENSAJE DE ERROR -->
      <q-banner v-else-if="error" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat label="Volver" @click="$router.back()" />
        </template>
      </q-banner>

      <!-- CONTENIDO DEL COMERCIO -->
      <template v-else-if="comercioActual">
        <!-- Botón volver -->
        <q-btn
          flat
          dense
          color="primary"
          label="Volver"
          class="q-mb-md"
          @click="$router.back()"
        >
          <IconArrowLeft :size="20" class="q-mr-xs" />
        </q-btn>

        <!-- Header con nombre y tipo -->
        <div class="header-comercio q-mb-md">
          <div class="header-comercio__nombre">
            <IconBuilding :size="28" class="text-orange" />
            <h5 class="q-ma-none">{{ comercioActual.nombre }}</h5>
          </div>
          <q-chip
            v-if="comercioActual.tipo"
            dense
            size="sm"
            color="orange"
            text-color="white"
          >
            {{ comercioActual.tipo }}
          </q-chip>
        </div>

        <!-- SELECTOR DE SUCURSALES -->
        <SelectorSucursales
          :direcciones="comercioActual.direcciones"
          :direccion-seleccionada="direccionSeleccionada"
          :es-cadena="comercioActual.esCadena"
          class="q-mb-lg"
          @seleccionar="seleccionarDireccion"
        />

        <!-- SECCIÓN: FOTO (placeholder futuro) -->
        <div class="seccion-foto q-mb-lg">
          <div class="foto-placeholder">
            <IconCamera :size="48" class="text-grey-4" />
            <span class="text-grey-5 text-caption">Foto próximamente</span>
          </div>
        </div>

        <!-- SECCIÓN: DATOS EDITABLES -->
        <div class="seccion-campos q-mb-lg">
          <div class="seccion-titulo q-mb-sm">
            <IconEdit :size="18" class="text-orange" />
            <span>Datos del comercio</span>
          </div>

          <!-- Nombre -->
          <CampoEditable
            etiqueta="Nombre"
            :valor="comercioActual.nombre"
            :icono="IconBuilding"
            requerido
            @guardar="(v) => guardarCampo('nombre', v)"
          />

          <!-- Categoría -->
          <CampoEditable
            etiqueta="Categoría"
            :valor="comercioActual.tipo"
            :icono="IconTag"
            tipo="select"
            :opciones="opcionesTipo"
            sin-valor-texto="Sin categoría"
            @guardar="(v) => guardarCampo('tipo', v)"
          />

          <!-- Dirección (de la sucursal seleccionada) -->
          <CampoEditable
            etiqueta="Dirección"
            :valor="direccionSeleccionada?.calle"
            :icono="IconMapPin"
            requerido
            @guardar="(v) => guardarCampoDireccion('calle', v)"
          />

          <!-- Barrio -->
          <CampoEditable
            etiqueta="Barrio"
            :valor="direccionSeleccionada?.barrio"
            :icono="IconMap"
            sin-valor-texto="Sin barrio"
            @guardar="(v) => guardarCampoDireccion('barrio', v)"
          />

          <!-- Ciudad -->
          <CampoEditable
            etiqueta="Ciudad"
            :valor="direccionSeleccionada?.ciudad"
            :icono="IconMapPin"
            sin-valor-texto="Sin ciudad"
            @guardar="(v) => guardarCampoDireccion('ciudad', v)"
          />
        </div>

        <!-- SECCIÓN: ACCIONES DE SUCURSALES -->
        <div class="seccion-acciones q-mb-lg">
          <!-- Botón agregar sucursal -->
          <q-btn
            outline
            color="orange"
            icon="add_location"
            label="Agregar sucursal"
            class="full-width q-mb-sm"
            @click="dialogoSucursalAbierto = true"
          />

          <!-- Botón eliminar sucursal (solo si hay más de 1) -->
          <q-btn
            v-if="comercioActual.direcciones.length > 1 && direccionSeleccionada"
            flat
            color="negative"
            size="sm"
            class="full-width"
            @click="confirmarEliminarSucursal"
          >
            <IconTrash :size="16" class="q-mr-xs" />
            Eliminar sucursal: {{ direccionSeleccionada.calle }}
          </q-btn>
        </div>

        <!-- SECCIÓN: PRODUCTOS ASOCIADOS -->
        <div class="seccion-campos q-mb-lg">
          <div class="seccion-titulo q-mb-sm">
            <IconShoppingBag :size="18" class="text-orange" />
            <span>Productos ({{ productosAsociados.length }})</span>
          </div>
          <ListaProductosComercio
            :productos="productosConPrecio"
            @ver-producto="(id) => router.push(`/producto/${id}`)"
          />
        </div>

        <!-- SECCIÓN: FUSIONAR SUCURSALES -->
        <div
          v-if="comercioActual.esCadena && comercioActual.direcciones.length >= 2"
          class="seccion-campos q-mb-lg"
        >
          <div class="seccion-titulo q-mb-sm">
            <IconGitMerge :size="18" class="text-orange" />
            <span>Fusionar sucursales</span>
          </div>

          <template v-if="!modoFusion">
            <p class="text-caption text-grey-6 q-mb-sm">
              Selecciona 2 sucursales para fusionar (mover precios y eliminar una)
            </p>
            <q-btn
              outline
              color="orange"
              label="Iniciar fusión"
              size="sm"
              class="full-width"
              @click="modoFusion = true"
            />
          </template>

          <template v-else>
            <p class="text-caption text-grey-7 q-mb-sm">
              Selecciona 2 sucursales. La primera será el destino, la segunda será eliminada.
            </p>

            <!-- Lista de sucursales seleccionables -->
            <q-list dense class="q-mb-sm">
              <q-item
                v-for="dir in comercioActual.direcciones"
                :key="dir.id"
                clickable
                v-ripple
                :class="{ 'bg-orange-1': fusionSeleccionadas.includes(dir.id) }"
                @click="toggleFusionSeleccion(dir.id)"
              >
                <q-item-section avatar>
                  <q-checkbox
                    :model-value="fusionSeleccionadas.includes(dir.id)"
                    color="orange"
                    @update:model-value="toggleFusionSeleccion(dir.id)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ dir.calle }}</q-item-label>
                  <q-item-label v-if="dir.barrio" caption>{{ dir.barrio }}</q-item-label>
                </q-item-section>
                <q-item-section v-if="fusionSeleccionadas[0] === dir.id" side>
                  <q-badge color="positive" label="Destino" />
                </q-item-section>
                <q-item-section v-else-if="fusionSeleccionadas[1] === dir.id" side>
                  <q-badge color="negative" label="Eliminar" />
                </q-item-section>
              </q-item>
            </q-list>

            <div class="row q-gutter-sm">
              <q-btn
                flat
                label="Cancelar"
                color="grey"
                size="sm"
                class="col"
                @click="cancelarFusion"
              />
              <q-btn
                :disable="fusionSeleccionadas.length !== 2"
                label="Fusionar"
                color="orange"
                size="sm"
                class="col"
                :loading="fusionando"
                @click="confirmarFusion"
              />
            </div>
          </template>
        </div>

        <!-- SECCIÓN: ESTADÍSTICAS -->
        <div class="seccion-campos q-mb-lg">
          <div class="seccion-titulo q-mb-sm">
            <IconChartBar :size="18" class="text-orange" />
            <span>Estadísticas</span>
          </div>
          <EstadisticasComercio
            :comercio="comercioActual"
            :total-productos="productosAsociados.length"
            :ultimo-precio-fecha="ultimoPrecioFecha"
          />
        </div>
      </template>
    </div>

    <!-- DIÁLOGO AGREGAR SUCURSAL -->
    <DialogoAgregarSucursal
      v-if="comercioActual"
      v-model="dialogoSucursalAbierto"
      :comercio-nombre="comercioActual.nombre"
      :comercio-tipo="comercioActual.tipo"
      @sucursal-guardada="onSucursalGuardada"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  IconArrowLeft,
  IconBuilding,
  IconCamera,
  IconEdit,
  IconTag,
  IconMapPin,
  IconMap,
  IconTrash,
  IconShoppingBag,
  IconGitMerge,
  IconChartBar,
} from '@tabler/icons-vue'
import { useComerciStore } from '../almacenamiento/stores/comerciosStore.js'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import ComerciosService from '../almacenamiento/servicios/ComerciosService.js'
import SelectorSucursales from '../components/EditarComercio/SelectorSucursales.vue'
import CampoEditable from '../components/EditarComercio/CampoEditable.vue'
import DialogoAgregarSucursal from '../components/Formularios/Dialogos/DialogoAgregarSucursal.vue'
import ListaProductosComercio from '../components/EditarComercio/ListaProductosComercio.vue'
import EstadisticasComercio from '../components/EditarComercio/EstadisticasComercio.vue'
import { formatearFechaRelativa } from '../composables/useFechaRelativa.js'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const comerciosStore = useComerciStore()
const productosStore = useProductosStore()

// Opciones de tipo (mismas que FormularioComercio)
const opcionesTipo = [
  'Supermercado', 'Hipermercado', 'Minimercado', 'Almacén',
  'Verdulería', 'Carnicería', 'Panadería', 'Farmacia',
  'Ferretería', 'Tienda de ropa', 'Librería', 'Perfumería',
  'Juguetería', 'Electrónica', 'Mercado', 'Mayorista', 'Otro',
]

// Estado de carga
const cargando = computed(() => comerciosStore.cargando)
const error = computed(() => {
  if (comerciosStore.error) return comerciosStore.error
  if (!comerciosStore.cargando && !comercioActual.value) return 'Comercio no encontrado'
  return null
})

// Comercio actual derivado reactivamente del store
const comercioActual = computed(() => {
  const nombreParam = decodeURIComponent(route.params.nombre || '')
  return comerciosStore.comerciosAgrupados.find(
    (c) => ComerciosService.normalizar(c.nombre) === nombreParam,
  ) || null
})

// IDs de comercios originales del grupo
const idsComerciosOriginales = computed(() =>
  comercioActual.value?.comerciosOriginales?.map((c) => c.id) || [],
)

// Productos que tienen precios en este comercio
const productosAsociados = computed(() => {
  return productosStore.productos.filter((producto) =>
    producto.precios?.some((precio) =>
      idsComerciosOriginales.value.includes(precio.comercioId),
    ),
  )
})

// Productos con info de último precio para el listado
const productosConPrecio = computed(() => {
  return productosAsociados.value.map((producto) => {
    // Buscar el precio más reciente en este comercio
    const preciosComercio = producto.precios
      .filter((p) => idsComerciosOriginales.value.includes(p.comercioId))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    const ultimoPrecio = preciosComercio[0]
    const textoUltimoPrecio = ultimoPrecio
      ? `$${ultimoPrecio.valor} - ${formatearFechaRelativa(ultimoPrecio.fecha)}`
      : 'Sin precio'

    return {
      id: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen || null,
      ultimoPrecioTexto: textoUltimoPrecio,
    }
  })
})

// Fecha del último precio registrado en este comercio
const ultimoPrecioFecha = computed(() => {
  let fechaMasReciente = null
  for (const producto of productosAsociados.value) {
    const precios = producto.precios
      ?.filter((p) => idsComerciosOriginales.value.includes(p.comercioId))
    for (const precio of (precios || [])) {
      if (precio.fecha && (!fechaMasReciente || new Date(precio.fecha) > new Date(fechaMasReciente))) {
        fechaMasReciente = precio.fecha
      }
    }
  }
  return fechaMasReciente
})

// Estado de diálogos
const dialogoSucursalAbierto = ref(false)

// Estado de fusión
const modoFusion = ref(false)
const fusionSeleccionadas = ref([])
const fusionando = ref(false)

// Dirección seleccionada
const direccionSeleccionada = ref(null)

// Comercio original que contiene la dirección seleccionada
const comercioOriginalActual = computed(() => {
  if (!comercioActual.value || !direccionSeleccionada.value) return null
  return comercioActual.value.comerciosOriginales?.find((c) =>
    c.direcciones.some((d) => d.id === direccionSeleccionada.value.id),
  ) || null
})

// Seleccionar dirección
function seleccionarDireccion(direccion) {
  direccionSeleccionada.value = direccion
}

// Guardar campo del comercio (nombre, tipo) - afecta todos los originales si es cadena
async function guardarCampo(campo, valor) {
  if (!comercioActual.value) return

  try {
    const originales = comercioActual.value.comerciosOriginales || []
    for (const comercioOriginal of originales) {
      await comerciosStore.editarComercio(comercioOriginal.id, { [campo]: valor })
    }

    $q.notify({ type: 'positive', message: 'Campo actualizado', position: 'top' })

    // Si se editó el nombre, redirigir a la nueva URL
    if (campo === 'nombre') {
      const nuevoNombre = ComerciosService.normalizar(valor)
      router.replace(`/comercios/${encodeURIComponent(nuevoNombre)}`)
    }
  } catch (err) {
    console.error('Error al guardar campo:', err)
    $q.notify({ type: 'negative', message: 'Error al guardar', position: 'top' })
  }
}

// Guardar campo de dirección (calle, barrio, ciudad) - solo la dirección seleccionada
async function guardarCampoDireccion(campo, valor) {
  if (!comercioOriginalActual.value || !direccionSeleccionada.value) return

  try {
    await comerciosStore.editarDireccion(
      comercioOriginalActual.value.id,
      direccionSeleccionada.value.id,
      { [campo]: valor },
    )

    // Actualizar referencia local de la dirección seleccionada
    direccionSeleccionada.value = {
      ...direccionSeleccionada.value,
      [campo]: valor,
    }

    $q.notify({ type: 'positive', message: 'Dirección actualizada', position: 'top' })
  } catch (err) {
    console.error('Error al guardar dirección:', err)
    $q.notify({ type: 'negative', message: 'Error al guardar', position: 'top' })
  }
}

// Callback cuando se guarda una nueva sucursal
function onSucursalGuardada() {
  // Resetear dirección seleccionada para que se reinicialice
  direccionSeleccionada.value = null
  $q.notify({ type: 'positive', message: 'Sucursal agregada', position: 'top' })
}

// Confirmar eliminación de sucursal
function confirmarEliminarSucursal() {
  if (!direccionSeleccionada.value || !comercioOriginalActual.value) return

  $q.dialog({
    title: 'Eliminar sucursal',
    message: `¿Eliminar la sucursal en "${direccionSeleccionada.value.calle}"?`,
    cancel: { flat: true, label: 'Cancelar', color: 'grey' },
    ok: { label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      const comercioOrig = comercioOriginalActual.value

      if (comercioOrig.direcciones.length === 1) {
        // Es la única dirección del comercio original → eliminar comercio completo
        await comerciosStore.eliminarComercio(comercioOrig.id)
      } else {
        // Tiene más direcciones → eliminar solo la dirección
        await comerciosStore.eliminarDireccion(comercioOrig.id, direccionSeleccionada.value.id)
      }

      // Resetear dirección seleccionada
      direccionSeleccionada.value = null

      // Si no quedan direcciones en el grupo, volver atrás
      if (comercioActual.value && comercioActual.value.direcciones.length === 0) {
        router.back()
        return
      }

      $q.notify({ type: 'positive', message: 'Sucursal eliminada', position: 'top' })
    } catch (err) {
      console.error('Error al eliminar sucursal:', err)
      $q.notify({ type: 'negative', message: 'Error al eliminar', position: 'top' })
    }
  })
}

// Busca el comercio original que contiene una dirección por su id
function encontrarComercioOriginalPorDireccion(direccionId) {
  if (!comercioActual.value) return null
  return comercioActual.value.comerciosOriginales?.find((c) =>
    c.direcciones.some((d) => d.id === direccionId),
  ) || null
}

// Toggle selección de sucursal para fusión (max 2)
function toggleFusionSeleccion(direccionId) {
  const idx = fusionSeleccionadas.value.indexOf(direccionId)
  if (idx >= 0) {
    fusionSeleccionadas.value.splice(idx, 1)
  } else if (fusionSeleccionadas.value.length < 2) {
    fusionSeleccionadas.value.push(direccionId)
  }
}

function cancelarFusion() {
  modoFusion.value = false
  fusionSeleccionadas.value = []
}

// Confirmar y ejecutar fusión
function confirmarFusion() {
  if (fusionSeleccionadas.value.length !== 2) return

  const destinoDir = comercioActual.value.direcciones.find(
    (d) => d.id === fusionSeleccionadas.value[0],
  )
  const origenDir = comercioActual.value.direcciones.find(
    (d) => d.id === fusionSeleccionadas.value[1],
  )

  // Contar precios que se moverán
  const preciosAMover = productosStore.productos.reduce((total, producto) => {
    return total + (producto.precios?.filter((p) => {
      const comercioOrigen = encontrarComercioOriginalPorDireccion(origenDir.id)
      return p.comercioId === comercioOrigen?.id && p.direccionId === origenDir.id
    }).length || 0)
  }, 0)

  $q.dialog({
    title: 'Confirmar fusión',
    message: `Mover ${preciosAMover} precios de "${origenDir.calle}" a "${destinoDir.calle}" y eliminar la sucursal origen.`,
    cancel: { flat: true, label: 'Cancelar', color: 'grey' },
    ok: { label: 'Fusionar', color: 'orange' },
    persistent: true,
  }).onOk(() => ejecutarFusion(fusionSeleccionadas.value[0], fusionSeleccionadas.value[1]))
}

// Ejecutar fusión de sucursales
async function ejecutarFusion(destinoId, origenId) {
  fusionando.value = true

  try {
    const comercioDestino = encontrarComercioOriginalPorDireccion(destinoId)
    const comercioOrigen = encontrarComercioOriginalPorDireccion(origenId)

    if (!comercioDestino || !comercioOrigen) {
      throw new Error('No se encontraron los comercios originales')
    }

    const destinoDir = comercioDestino.direcciones.find((d) => d.id === destinoId)

    // Actualizar precios en todos los productos
    for (const producto of productosStore.productos) {
      let modificado = false
      const preciosActualizados = producto.precios?.map((precio) => {
        if (precio.comercioId === comercioOrigen.id && precio.direccionId === origenId) {
          modificado = true
          return {
            ...precio,
            comercioId: comercioDestino.id,
            direccionId: destinoId,
            nombreCompleto: `${comercioDestino.nombre} - ${destinoDir.calle}`,
            comercio: comercioDestino.nombre,
            direccion: destinoDir.calle,
          }
        }
        return precio
      }) || []

      if (modificado) {
        await productosStore.actualizarProducto(producto.id, { precios: preciosActualizados })
      }
    }

    // Eliminar sucursal origen
    if (comercioOrigen.direcciones.length === 1) {
      await comerciosStore.eliminarComercio(comercioOrigen.id)
    } else {
      await comerciosStore.eliminarDireccion(comercioOrigen.id, origenId)
    }

    cancelarFusion()
    direccionSeleccionada.value = null

    $q.notify({ type: 'positive', message: 'Sucursales fusionadas', position: 'top' })
  } catch (err) {
    console.error('Error al fusionar:', err)
    $q.notify({ type: 'negative', message: 'Error al fusionar sucursales', position: 'top' })
  } finally {
    fusionando.value = false
  }
}

// Inicializar dirección seleccionada cuando cambia el comercio
watch(comercioActual, (nuevo) => {
  if (nuevo && nuevo.direcciones.length > 0 && !direccionSeleccionada.value) {
    direccionSeleccionada.value = nuevo.direcciones[0]
  }
}, { immediate: true })

// Cargar datos al montar
onMounted(async () => {
  if (comerciosStore.comercios.length === 0) {
    await comerciosStore.cargarComercios()
  }
  if (productosStore.productos.length === 0) {
    await productosStore.cargarProductos()
  }
})
</script>

<style scoped>
.contenedor-editar {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}
.header-comercio {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.header-comercio__nombre {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.header-comercio__nombre h5 {
  font-size: 22px;
  font-weight: 700;
  color: var(--texto-primario);
  line-height: 1.3;
}
.seccion-foto {
  display: flex;
  justify-content: center;
}
.foto-placeholder {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16/9;
  background: var(--color-primario-claro, #f5f5f5);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed var(--color-carta-borde, #ddd);
}
.seccion-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--texto-primario);
}
.seccion-campos {
  background: var(--fondo-tarjeta, white);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
