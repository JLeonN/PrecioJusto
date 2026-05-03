import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import { useUsuarioStore } from 'src/almacenamiento/stores/UsuarioStore.js'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to) => {
    const usuarioStore = useUsuarioStore()
    await usuarioStore.inicializarSesion()

    if (to.path === '/acceso') {
      if (usuarioStore.tieneSesionRealActiva) {
        return { path: '/' }
      }
      return true
    }

    if (!to.matched.some((registro) => registro.meta?.requiereSesion)) {
      return true
    }

    if (!usuarioStore.tieneSesionActiva) {
      return { path: '/configuracion' }
    }

    if (!usuarioStore.accesoInicialCompletado && !usuarioStore.tieneSesionRealActiva) {
      return { path: '/acceso' }
    }

    return true
  })

  return Router
})
