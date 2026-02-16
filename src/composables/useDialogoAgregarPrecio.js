import { ref } from 'vue'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'

/* Composable para reutilizar la lógica del diálogo agregar precio */
export function useDialogoAgregarPrecio() {
  const productosStore = useProductosStore()

  /* Estado del modal */
  const dialogoPrecioAbierto = ref(false)
  const productoParaPrecioId = ref(null)

  /* Abrir modal con el productoId recibido */
  function abrirModalPrecio(productoId) {
    productoParaPrecioId.value = productoId
    dialogoPrecioAbierto.value = true
  }

  /* Callback después de guardar precio - recarga productos */
  async function alGuardarPrecio() {
    await productosStore.cargarProductos()
  }

  return {
    dialogoPrecioAbierto,
    productoParaPrecioId,
    abrirModalPrecio,
    alGuardarPrecio,
  }
}
