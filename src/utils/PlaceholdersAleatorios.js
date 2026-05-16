export const PLACEHOLDERS_LISTA_JUSTA = [
  'Compra semanal',
  'Lista del mes',
  'Reposición de alacena',
  'Compras para la oficina',
  'Feria y supermercado',
  'Viandas de la semana',
  'Limpieza del hogar',
  'Merienda escolar',
  'Despensa familiar',
  'Compras rápidas',
  'Productos para comparar',
]

export const PRODUCTOS_PLACEHOLDER_API = [
  { nombre: 'Leche entera Conaprole', marca: 'Conaprole', codigoBarras: '7730123450011' },
  { nombre: 'Yogur frutilla Claldy', marca: 'Claldy', codigoBarras: '7730123450028' },
  { nombre: 'Arroz blanco Saman', marca: 'Saman', codigoBarras: '7730123450035' },
  { nombre: 'Fideos secos Adria', marca: 'Adria', codigoBarras: '7730123450042' },
  { nombre: 'Aceite de girasol Uruguay', marca: 'Uruguay', codigoBarras: '7730123450059' },
  { nombre: 'Harina 0000 Cañuelas', marca: 'Cañuelas', codigoBarras: '7730123450066' },
  { nombre: 'Azúcar Bella Unión', marca: 'Bella Unión', codigoBarras: '7730123450073' },
  { nombre: 'Café instantáneo Bracafé', marca: 'Bracafé', codigoBarras: '7730123450080' },
  { nombre: 'Yerba mate Canarias', marca: 'Canarias', codigoBarras: '7730123450097' },
  { nombre: 'Galletitas María Famosa', marca: 'Famosa', codigoBarras: '7730123450103' },
  { nombre: 'Dulce de leche Conaprole', marca: 'Conaprole', codigoBarras: '7730123450110' },
  { nombre: 'Manteca Calcar', marca: 'Calcar', codigoBarras: '7730123450127' },
  { nombre: 'Queso rallado Farming', marca: 'Farming', codigoBarras: '7730123450134' },
  { nombre: 'Agua mineral Salus', marca: 'Salus', codigoBarras: '7730123450141' },
  { nombre: 'Refresco cola Coca-Cola', marca: 'Coca-Cola', codigoBarras: '7730123450158' },
  { nombre: 'Jabón en polvo Nevex', marca: 'Nevex', codigoBarras: '7730123450165' },
  { nombre: 'Detergente Magistral', marca: 'Magistral', codigoBarras: '7730123450172' },
  { nombre: 'Papel higiénico Higienol', marca: 'Higienol', codigoBarras: '7730123450189' },
  { nombre: 'Shampoo Sedal', marca: 'Sedal', codigoBarras: '7730123450196' },
  { nombre: 'Atún al natural Nixe', marca: 'Nixe', codigoBarras: '7730123450202' },
]

export const COMERCIOS_PLACEHOLDER = [
  'TATA',
  'DISCO',
  'Almacén Don Pedro',
  'Devoto',
  'El Dorado',
  'Farmashop',
  'San Roque',
  'Kinko',
  'Macromercado',
  'Tienda Inglesa',
  'Red Expres',
  'Autoservice La Esquina',
  'Verdulería Central',
]

export const DIRECCIONES_PLACEHOLDER = [
  'Av. Brasil 2550',
  'Av. Italia 1234',
  'Av. 18 de Julio 1234',
  'Bulevar Artigas 1820',
  'Luis Alberto de Herrera 1290',
  '8 de Octubre 2450',
  'José Ellauri 950',
  'Camino Maldonado 5600',
  'Av. Rivera 3100',
  'Agraciada 4100',
  'San José 1120',
  'Rambla República del Perú 1500',
  'Avenida Roosevelt 780',
]

export const BARRIOS_PLACEHOLDER = [
  'Centro',
  'Pocitos',
  'Cordón',
  'Tres Cruces',
  'Malvín',
  'Unión',
  'Parque Batlle',
  'Aguada',
  'Prado',
  'Buceo',
  'Carrasco',
  'La Blanqueada',
  'Punta Carretas',
]

export const CIUDADES_PLACEHOLDER = [
  'Montevideo',
  'Punta del Este',
  'Canelones',
  'Las Piedras',
  'Ciudad de la Costa',
  'Maldonado',
  'Salto',
  'Paysandú',
  'Colonia del Sacramento',
  'Rivera',
  'Durazno',
  'San José de Mayo',
  'Rocha',
]

export function obtenerPlaceholderAleatorio(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return ''
  const indice = Math.floor(Math.random() * lista.length)
  return lista[indice]
}
