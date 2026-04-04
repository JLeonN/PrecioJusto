import { defineBoot } from '#q-app/wrappers'
import { Dark } from 'quasar'
import preferenciasService from '../almacenamiento/servicios/PreferenciasService.js'

export default defineBoot(async () => {
  try {
    const preferencias = await preferenciasService.obtenerPreferencias()
    const modoTema = preferencias.modoTema || 'sistema'

    if (modoTema === 'claro') {
      Dark.set(false)
      return
    }

    if (modoTema === 'oscuro') {
      Dark.set(true)
      return
    }

    Dark.set('auto')
  } catch {
    // Si falla la lectura de preferencias, se usa el tema del sistema.
    Dark.set('auto')
  }
})
