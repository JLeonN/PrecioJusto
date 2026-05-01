const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiereSesion: true },
    children: [
      // Página principal
      { path: '', component: () => import('pages/ListaJusta/ListaJustaPage.vue') },

      // Mis Productos
      { path: 'mis-productos', component: () => import('pages/MisProductosPage.vue') },

      // Detalle de producto
      { path: 'producto/:id', component: () => import('pages/DetalleProductoPage.vue') },

      // Comercios
      { path: 'comercios', component: () => import('pages/ComerciosPage.vue') },

      // Edición de comercio
      { path: 'comercios/:nombre', component: () => import('pages/EditarComercioPage.vue') },

      // Mesa de trabajo
      { path: 'mesa-trabajo', component: () => import('pages/MesaTrabajoPage.vue') },

      // Lista Justa
      { path: 'lista-justa/:id', component: () => import('pages/ListaJusta/DetalleListaJustaPage.vue') },
      {
        path: 'lista-justa/:id/inteligente',
        component: () => import('pages/ListaJusta/DetalleListaJustaInteligentePage.vue'),
      },

      // Configuración
      { path: 'configuracion', component: () => import('pages/ConfiguracionPage.vue') },

      // Gracias
      { path: 'gracias', component: () => import('pages/GraciasPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
