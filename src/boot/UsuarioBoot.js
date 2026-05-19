import { defineBoot } from '#q-app/wrappers'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'

export default defineBoot(() => {
  const usuarioStore = useUsuarioStore()
  usuarioStore.inicializarSesion()
})
