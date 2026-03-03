import { ref } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

/**
 * Composable reutilizable para captura de fotos.
 * - abrirCamara(): solo en nativo (Android/iOS), abre la cámara directamente
 * - abrirGaleria(): todas las plataformas, abre el selector de archivos del sistema
 *
 * Uso en template:
 *   <input ref="inputArchivoRef" type="file" accept="image/*" class="input-archivo-oculto" @change="alSeleccionarArchivo">
 *
 * @returns {{ inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo }}
 */
export function useCamaraFoto() {
  const inputArchivoRef = ref(null)
  const esNativo = Capacitor.isNativePlatform()

  /**
   * Abre la cámara nativa (solo Android/iOS).
   * @returns {Promise<string|null>} base64 con prefijo data URI, o null si cancela
   */
  async function abrirCamara() {
    try {
      const foto = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      })
      return `data:image/jpeg;base64,${foto.base64String}`
    } catch (error) {
      // Cancelación silenciosa — no es un error real
      if (!error.message?.toLowerCase().includes('cancel')) {
        console.error('Error al abrir cámara:', error)
      }
      return null
    }
  }

  /**
   * Abre el selector de archivos del sistema.
   * El resultado llega via leerArchivo (@change del input).
   */
  function abrirGaleria() {
    inputArchivoRef.value?.click()
  }

  /**
   * Lee el archivo seleccionado desde el input file.
   * Usar como handler del evento @change del input oculto.
   * @param {Event} event - Evento change del input file
   * @returns {Promise<string|null>} base64 con prefijo data URI, o null si no hay archivo
   */
  function leerArchivo(event) {
    const archivo = event.target.files?.[0]
    // Limpiar input para permitir reselección del mismo archivo
    event.target.value = ''
    if (!archivo) return Promise.resolve(null)

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(archivo)
    })
  }

  return { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo }
}
