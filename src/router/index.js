import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'

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
    const requiereAuth = to.matched.some((ruta) => ruta.meta?.requiereAuth)
    const soloInvitado = to.matched.some((ruta) => ruta.meta?.soloInvitado)

    if (!usuarioStore.escuchaInicializada) {
      usuarioStore.inicializarSesion()
    }

    if (usuarioStore.cargandoSesion) {
      await usuarioStore.esperarSesionLista()
    }

    if (requiereAuth && !usuarioStore.estaAutenticado) {
      return {
        path: '/acceso',
        query: { redirigir: to.fullPath },
      }
    }

    if (requiereAuth) {
      await useSesionEscaneoStore().asegurarSesionCargada()
    }

    if (soloInvitado && usuarioStore.estaAutenticado) {
      return typeof to.query.redirigir === 'string' ? to.query.redirigir : '/'
    }
  })

  return Router
})
