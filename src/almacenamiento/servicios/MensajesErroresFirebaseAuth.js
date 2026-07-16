const MENSAJE_GENERICO_AUTENTICACION =
  'No se pudo completar la autenticación. Revisá los datos e intentá de nuevo.'

const MENSAJES_POR_CODIGO = {
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con este correo. Ingresá tu contraseña para vincular Google.',
  'auth/popup-closed-by-user': 'Cancelaste el ingreso con Google.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permitila e intentá de nuevo.',
  'auth/cancelled-popup-request': 'El ingreso con Google fue cancelado.',
  'auth/unauthorized-domain':
    'El ingreso con Google no está disponible desde esta página por el momento. Probá de nuevo más tarde.',
  'auth/credential-already-in-use': 'Esta cuenta de Google ya está vinculada a otra cuenta.',
  'auth/requires-recent-login': 'Volvé a ingresar antes de vincular Google.',
  'auth/google-credential-unavailable':
    'No pudimos obtener la credencial de Google. Revisá la configuración de la app e intentá de nuevo.',
  'auth/email-already-in-use':
    'Ya existe una cuenta con ese correo. Iniciá sesión o recuperá tu contraseña.',
  'auth/invalid-email': 'Revisá el correo. Parece incompleto.',
  'auth/missing-email': 'Ingresá tu correo.',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/weak-password': 'La contraseña no cumple los requisitos.',
  'auth/invalid-credential': 'El correo o la contraseña no coinciden.',
  'auth/wrong-password': 'El correo o la contraseña no coinciden.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo. Podés crear una cuenta nueva.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Esperá un momento y probá de nuevo.',
  'auth/network-request-failed':
    'No hay conexión. Necesitás internet para ingresar o crear una cuenta.',
  'auth/operation-not-allowed': 'Este método de ingreso no está disponible en este momento.',
}

export function obtenerMensajeErrorFirebaseAuth(error) {
  return MENSAJES_POR_CODIGO[error?.code] || MENSAJE_GENERICO_AUTENTICACION
}

export function esCorreoValido(correo) {
  const correoNormalizado = String(correo || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)
}

export const MENSAJES_VALIDACION_AUTH = {
  correoVacio: 'Ingresá tu correo.',
  correoInvalido: 'Revisá el correo. Parece incompleto.',
  contrasenaVacia: 'Ingresá tu contraseña.',
  contrasenaNoValida: 'La contraseña no cumple los requisitos.',
  confirmacionVacia: 'Confirmá tu contraseña.',
  contrasenasDistintas: 'Las contraseñas no coinciden.',
  recuperacionEnviada: 'Te enviamos un correo para recuperar el acceso. Revisá tu bandeja de entrada.',
}
