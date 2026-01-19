/**
 * 🌱 SCRIPT DE SEED
 * Puebla el almacenamiento con productos de prueba
 */

import productosService from './servicios/ProductosService.js'

const productosEjemplo = [
  {
    nombre: 'Leche La Serenísima 1L',
    imagen: null,
    precios: [
      {
        comercio: 'TATA',
        nombreCompleto: 'TATA - Av. Brasil 2550',
        direccion: 'Av. Brasil 2550',
        valor: 850,
        fecha: '2026-01-13T10:00:00',
        confirmaciones: 75,
        usuarioId: 'user123',
      },
      {
        comercio: 'TATA',
        nombreCompleto: 'TATA - Bv. Artigas 1234',
        direccion: 'Bv. Artigas 1234, Tres Cruces',
        valor: 870,
        fecha: '2026-01-14T12:30:00',
        confirmaciones: 12,
        usuarioId: 'user999',
      },
      {
        comercio: 'DISCO',
        nombreCompleto: 'DISCO - Av. Sarmiento 2456',
        direccion: 'Av. Sarmiento 2456, Punta Carretas',
        valor: 920,
        fecha: '2026-01-08T15:30:00',
        confirmaciones: 8,
        usuarioId: 'user456',
      },
      {
        comercio: 'DEVOTO',
        nombreCompleto: 'DEVOTO - Av. 18 de Julio 1234',
        direccion: 'Av. 18 de Julio 1234',
        valor: 980,
        fecha: '2026-01-15T09:00:00',
        confirmaciones: 0,
        usuarioId: 'user789',
      },
      {
        comercio: 'DON JOSE',
        nombreCompleto: 'DON JOSE - Luis Alberto de Herrera 1420',
        direccion: 'Luis Alberto de Herrera 1420, Pocitos',
        valor: 1100,
        fecha: '2025-12-10T14:00:00',
        confirmaciones: 3,
        usuarioId: 'user321',
      },
    ],
  },
  {
    nombre: 'Coca Cola 2.25L',
    imagen: null,
    precios: [
      {
        comercio: 'Kiosco Pepe',
        nombreCompleto: 'Kiosco Pepe - Centro',
        direccion: 'Centro',
        valor: 1250,
        fecha: '2026-01-18T14:00:00',
        confirmaciones: 15,
        usuarioId: 'user555',
      },
      {
        comercio: 'DISCO',
        nombreCompleto: 'DISCO - Av. Sarmiento 2456',
        direccion: 'Av. Sarmiento 2456, Punta Carretas',
        valor: 1400,
        fecha: '2026-01-19T10:00:00',
        confirmaciones: 5,
        usuarioId: 'user666',
      },
      {
        comercio: 'DEVOTO',
        nombreCompleto: 'DEVOTO - Av. 18 de Julio 1234',
        direccion: 'Av. 18 de Julio 1234',
        valor: 1600,
        fecha: '2026-01-17T16:20:00',
        confirmaciones: 2,
        usuarioId: 'user777',
      },
    ],
  },
  {
    nombre: 'Pan Lactal Bimbo Grande',
    imagen: null,
    precios: [
      {
        comercio: 'Panaderia Maria',
        nombreCompleto: 'Panaderia Maria - Pocitos',
        direccion: 'Pocitos',
        valor: 920,
        fecha: '2026-01-19T08:00:00',
        confirmaciones: 8,
        usuarioId: 'user111',
      },
      {
        comercio: 'TATA',
        nombreCompleto: 'TATA - Av. Brasil 2550',
        direccion: 'Av. Brasil 2550',
        valor: 1050,
        fecha: '2026-01-18T11:00:00',
        confirmaciones: 12,
        usuarioId: 'user222',
      },
      {
        comercio: 'DISCO',
        nombreCompleto: 'DISCO - Av. Sarmiento 2456',
        direccion: 'Av. Sarmiento 2456, Punta Carretas',
        valor: 1100,
        fecha: '2026-01-17T14:00:00',
        confirmaciones: 4,
        usuarioId: 'user333',
      },
    ],
  },
  {
    nombre: 'Aceite Cocinero 900ml',
    imagen: null,
    precios: [
      {
        comercio: 'Gafi',
        nombreCompleto: 'Gafi - Ciudad Vieja',
        direccion: 'Ciudad Vieja',
        valor: 1580,
        fecha: '2026-01-16T10:00:00',
        confirmaciones: 22,
        usuarioId: 'user444',
      },
      {
        comercio: 'DEVOTO',
        nombreCompleto: 'DEVOTO - Av. 18 de Julio 1234',
        direccion: 'Av. 18 de Julio 1234',
        valor: 1850,
        fecha: '2026-01-18T15:00:00',
        confirmaciones: 6,
        usuarioId: 'user555',
      },
      {
        comercio: 'cyber 3.com',
        nombreCompleto: 'cyber 3.com - Online',
        direccion: 'Tienda online',
        valor: 1920,
        fecha: '2026-01-19T09:00:00',
        confirmaciones: 3,
        usuarioId: 'user666',
      },
      {
        comercio: 'DON JOSE',
        nombreCompleto: 'DON JOSE - Luis Alberto de Herrera 1420',
        direccion: 'Luis Alberto de Herrera 1420, Pocitos',
        valor: 2000,
        fecha: '2026-01-17T12:00:00',
        confirmaciones: 1,
        usuarioId: 'user777',
      },
    ],
  },
]

/**
 * 🌱 EJECUTAR SEED
 */
export async function ejecutarSeed() {
  console.log('🌱 Iniciando seed de productos...')

  let contadorExitosos = 0
  let contadorFallidos = 0

  for (const producto of productosEjemplo) {
    const resultado = await productosService.guardarProducto(producto)

    if (resultado) {
      contadorExitosos++
      console.log(`✅ ${producto.nombre}`)
    } else {
      contadorFallidos++
      console.log(`❌ Error con ${producto.nombre}`)
    }
  }

  console.log(`\n🎉 Seed completado: ${contadorExitosos} exitosos, ${contadorFallidos} fallidos`)

  return {
    exitosos: contadorExitosos,
    fallidos: contadorFallidos,
    total: productosEjemplo.length,
  }
}

/**
 * 🧹 LIMPIAR DATOS
 */
export async function limpiarDatos() {
  console.log('🧹 Limpiando productos...')

  const productos = await productosService.obtenerTodos()

  for (const producto of productos) {
    await productosService.eliminarProducto(producto.id)
  }

  console.log(`✅ ${productos.length} productos eliminados`)
}
