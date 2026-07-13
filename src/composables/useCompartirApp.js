import { Share } from '@capacitor/share'
import { urlPlayStoreDefecto } from '../almacenamiento/constantes/ActualizacionApp.js'

function normalizarNombre(nombreUsuario) {
  return String(nombreUsuario || '').trim()
}

function construirMensajeCompartir(nombreUsuario) {
  const nombre = normalizarNombre(nombreUsuario)
  return nombre
    ? `${nombre} te recomienda Precio Justo para comparar precios y ahorrar en tus compras.`
    : 'Te recomiendo Precio Justo para comparar precios y ahorrar en tus compras.'
}

function construirTextoCompartir(nombreUsuario) {
  return `${construirMensajeCompartir(nombreUsuario)}\n${urlPlayStoreDefecto}`
}

function esCancelacion(error) {
  return error?.name === 'AbortError' || /cancel/i.test(String(error?.message || ''))
}

async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto)
    return
  }

  const campoTemporal = document.createElement('textarea')
  campoTemporal.value = texto
  campoTemporal.style.position = 'fixed'
  campoTemporal.style.opacity = '0'
  document.body.appendChild(campoTemporal)
  campoTemporal.select()
  const copiado = document.execCommand('copy')
  document.body.removeChild(campoTemporal)

  if (!copiado) throw new Error('No se pudo copiar el enlace.')
}

export function useCompartirApp() {
  async function puedeCompartir() {
    try {
      const disponibilidad = await Share.canShare()
      return Boolean(disponibilidad.value)
    } catch {
      return false
    }
  }

  async function compartirApp(nombreUsuario) {
    const texto = construirTextoCompartir(nombreUsuario)

    if (!(await puedeCompartir())) {
      await copiarTexto(texto)
      return { exito: true, contabilizar: true, tipo: 'copiado' }
    }

    try {
      await Share.share({
        title: 'Precio Justo',
        text: construirMensajeCompartir(nombreUsuario),
        url: urlPlayStoreDefecto,
        dialogTitle: 'Compartir Precio Justo',
      })
      return { exito: true, contabilizar: true, tipo: 'compartido' }
    } catch (error) {
      if (esCancelacion(error)) {
        return { exito: false, cancelado: true, tipo: 'cancelado' }
      }

      try {
        await copiarTexto(texto)
        return { exito: true, contabilizar: true, tipo: 'copiado' }
      } catch {
        return { exito: false, cancelado: false, tipo: 'error' }
      }
    }
  }

  return {
    compartirApp,
    construirMensajeCompartir,
    construirTextoCompartir,
    puedeCompartir,
  }
}
