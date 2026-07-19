import { defineBoot } from '#q-app/wrappers'
import { App } from '@capacitor/app'
import recuperacionCamaraService from '../servicios/RecuperacionCamaraService.js'

export default defineBoot(({ router }) => {
  App.addListener('appRestoredResult', async (resultado) => {
    if (
      resultado.pluginId !== 'Camera' ||
      resultado.methodName !== 'getPhoto' ||
      !resultado.success ||
      !resultado.data?.base64String
    ) {
      return
    }

    const contexto = recuperacionCamaraService.obtenerCapturaPendiente()
    if (!contexto) return

    const formato = resultado.data.format || 'jpeg'
    const imagen = `data:image/${formato};base64,${resultado.data.base64String}`
    const fueRegistrada = recuperacionCamaraService.registrarFotoRestaurada(contexto, imagen)

    if (fueRegistrada) {
      await router.replace(contexto.rutaRetorno)
    }
  })
})
