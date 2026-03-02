import { ref } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

/**
 * Composable reutilizable para captura de fotos con cámara
 * Soporta cámara nativa (Android) y selector de archivo (web/desktop)
 * No persiste — solo captura y retorna el base64
 *
 * Uso en template:
 *   <input ref="inputArchivoRef" type="file" accept="image/*" class="input-archivo-oculto" @change="leerArchivo">
 *
 * @returns {{ inputArchivoRef, tomarFoto, leerArchivo }}
 */
export function useCamaraFoto() {
  // Ref para el input oculto (fallback web)
  const inputArchivoRef = ref(null)

  /**
   * Captura una foto.
   * - Nativo: abre la cámara y retorna base64
   * - Web: dispara el selector de archivo y retorna null (el resultado llega via leerArchivo)
   * @returns {Promise<string|null>} base64 con prefijo data URI, o null si cancela/web
   */
  async function tomarFoto() {
    try {
      if (Capacitor.isNativePlatform()) {
        const foto = await Camera.getPhoto({
          quality: 70,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        })
        return `data:image/jpeg;base64,${foto.base64String}`
      } else {
        // Fallback web: abre el selector de archivos
        inputArchivoRef.value?.click()
        return null
      }
    } catch (error) {
      // Cancelación silenciosa — no es un error real
      if (!error.message?.toLowerCase().includes('cancel')) {
        console.error('Error al tomar foto:', error)
      }
      return null
    }
  }

  /**
   * Lee el archivo seleccionado desde el input file (fallback web)
   * Usar como handler del evento @change del input oculto
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

  return { inputArchivoRef, tomarFoto, leerArchivo }
}
