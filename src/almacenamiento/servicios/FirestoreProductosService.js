import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  CAMPOS_MODELO_FIRESTORE,
  ESTADOS_SINCRONIZACION,
  LIMITES_MODELO_FIRESTORE,
  TIPOS_USUARIO,
} from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import firestorePreciosService from './FirestorePreciosService.js'
import usuarioActualService from './UsuarioActualService.js'

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()

  if (!usuario.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) {
    return null
  }

  return usuario.id
}

function normalizarIdDocumento(valor) {
  return String(valor || '')
    .trim()
    .replace(/\//g, '-')
}

function obtenerDb() {
  return firebaseBaseService.obtenerFirestoreDb()
}

function obtenerColeccionProductos(usuarioId) {
  return collection(obtenerDb(), 'usuarios', usuarioId, 'productos')
}

function obtenerReferenciaProducto(usuarioId, productoId) {
  return doc(obtenerColeccionProductos(usuarioId), normalizarIdDocumento(productoId))
}

function normalizarTextoBusqueda(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function seleccionarCamposPermitidos(datos, camposPermitidos) {
  return camposPermitidos.reduce((resultado, campo) => {
    if (datos[campo] !== undefined) {
      resultado[campo] = datos[campo]
    }

    return resultado
  }, {})
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function resolverImagenFirestore(producto) {
  const imagen = String(producto?.imagen || '').trim()

  if (!imagen) {
    return {
      imagenUrl: producto?.imagenUrl || null,
      imagenRutaStorage: producto?.imagenRutaStorage || null,
    }
  }

  if (imagen.startsWith('data:')) {
    return {
      imagenUrl: null,
      imagenRutaStorage: producto?.imagenRutaStorage || null,
    }
  }

  if (/^https?:\/\//.test(imagen)) {
    return {
      imagenUrl: imagen,
      imagenRutaStorage: producto?.imagenRutaStorage || null,
    }
  }

  return {
    imagenUrl: producto?.imagenUrl || null,
    imagenRutaStorage: producto?.imagenRutaStorage || imagen,
  }
}

function normalizarProductoParaFirestore(producto, usuarioId) {
  const ahora = new Date().toISOString()
  const productoId = normalizarIdDocumento(producto?.id) || `producto-${Date.now()}`
  const imagenFirestore = resolverImagenFirestore(producto)

  const productoNormalizado = {
    ...producto,
    ...imagenFirestore,
    id: productoId,
    usuarioId,
    nombre: String(producto?.nombre || '').trim(),
    nombreNormalizado: normalizarTextoBusqueda(producto?.nombre),
    marca: producto?.marca || null,
    marcaNormalizada: normalizarTextoBusqueda(producto?.marca),
    categoria: producto?.categoria || null,
    categoriaNormalizada: normalizarTextoBusqueda(producto?.categoria),
    codigoBarras: producto?.codigoBarras || null,
    cantidad: Number.isFinite(Number(producto?.cantidad)) ? Number(producto.cantidad) : null,
    unidad: producto?.unidad || 'unidad',
    fotoFuente: producto?.fotoFuente || null,
    fuenteDato: producto?.fuenteDato || null,
    precioMejor: Number(producto?.precioMejor || 0),
    comercioMejor: producto?.comercioMejor || 'Sin datos',
    monedaReferencia: producto?.monedaReferencia || 'UYU',
    diferenciaPrecio: Number(producto?.diferenciaPrecio || 0),
    tendenciaGeneral: producto?.tendenciaGeneral || 'estable',
    porcentajeTendencia: Number(producto?.porcentajeTendencia || 0),
    tieneVentajaPorCantidad: Boolean(producto?.tieneVentajaPorCantidad),
    tieneEscalasSospechosas: Boolean(producto?.tieneEscalasSospechosas),
    fechaCreacion: normalizarFechaIso(producto?.fechaCreacion || ahora),
    fechaActualizacion: normalizarFechaIso(producto?.fechaActualizacion || ahora),
    ultimaInteraccion: producto?.ultimaInteraccion || null,
    eliminado: Boolean(producto?.eliminado),
  }

  return seleccionarCamposPermitidos(productoNormalizado, CAMPOS_MODELO_FIRESTORE.producto)
}

function crearResultadoOmitido() {
  return {
    exito: false,
    omitido: true,
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    mensaje: 'No hay usuario Firebase autenticado.',
  }
}

function obtenerEstadoEscrituraAceptada() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
    ? ESTADOS_SINCRONIZACION.PENDIENTE
    : ESTADOS_SINCRONIZACION.SINCRONIZADO
}

async function guardarProducto(producto) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const productoFirestore = normalizarProductoParaFirestore(producto, usuarioId)
  await setDoc(obtenerReferenciaProducto(usuarioId, productoFirestore.id), productoFirestore, {
    merge: true,
  })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    producto: productoFirestore,
  }
}

async function guardarProductoConPrecios(producto) {
  const resultadoProducto = await guardarProducto(producto)

  if (!resultadoProducto.exito) {
    return resultadoProducto
  }

  const resultadosPrecios = await firestorePreciosService.guardarPreciosProducto(
    producto.id,
    Array.isArray(producto.precios) ? producto.precios : [],
  )

  const errorPrecio = resultadosPrecios.find(
    (resultado) => !resultado.exito && !resultado.omitido,
  )

  if (errorPrecio) {
    return {
      exito: false,
      estado: ESTADOS_SINCRONIZACION.ERROR,
      mensaje: errorPrecio.mensaje || 'No se pudieron sincronizar todos los precios.',
      producto: resultadoProducto.producto,
      resultadosPrecios,
    }
  }

  return {
    ...resultadoProducto,
    resultadosPrecios,
  }
}

async function obtenerProductoPorId(productoId, opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return null

  const snapshot = await getDoc(obtenerReferenciaProducto(usuarioId, productoId))
  if (!snapshot.exists()) return null

  const producto = {
    id: snapshot.id,
    ...snapshot.data(),
  }

  if (opciones.incluirPrecios) {
    producto.precios = await firestorePreciosService.obtenerPreciosProducto(producto.id)
  }

  return producto
}

async function obtenerProductosUsuario(opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return []

  const cantidad = Number(opciones.limite || LIMITES_MODELO_FIRESTORE.productosPorPagina)
  const consulta = query(
    obtenerColeccionProductos(usuarioId),
    orderBy('fechaActualizacion', 'desc'),
    limit(cantidad),
  )
  const snapshot = await getDocs(consulta)
  const productos = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }))

  if (!opciones.incluirPrecios) {
    return productos
  }

  const productosConPrecios = []
  for (const producto of productos) {
    productosConPrecios.push({
      ...producto,
      precios: await firestorePreciosService.obtenerPreciosProducto(producto.id),
    })
  }

  return productosConPrecios
}

async function actualizarProducto(productoId, cambios) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const cambiosNormalizados = seleccionarCamposPermitidos(
    {
      ...cambios,
      fechaActualizacion: new Date().toISOString(),
    },
    CAMPOS_MODELO_FIRESTORE.producto,
  )
  await updateDoc(obtenerReferenciaProducto(usuarioId, productoId), cambiosNormalizados)

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

async function eliminarProducto(productoId) {
  return actualizarProducto(productoId, {
    eliminado: true,
  })
}

export default {
  obtenerColeccionProductos,
  obtenerReferenciaProducto,
  normalizarProductoParaFirestore,
  guardarProducto,
  guardarProductoConPrecios,
  obtenerProductoPorId,
  obtenerProductosUsuario,
  actualizarProducto,
  eliminarProducto,
}
