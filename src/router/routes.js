const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Página principal - Lista de productos del usuario
      { path: '', component: () => import('pages/MisProductosPage.vue') },

      // Página de detalle - Historial completo de un producto específico
      { path: 'producto/:id', component: () => import('pages/DetalleProductoPage.vue') },

      // Página de comercios - Gestión de comercios
      { path: 'comercios', component: () => import('pages/ComerciosPage.vue') },
    ],
  },

  // Página 404 - Siempre debe ir al final
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
