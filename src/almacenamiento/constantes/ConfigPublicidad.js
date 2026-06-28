// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODO PRUEBA: cambiar a false antes de publicar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MODO_PRUEBA = false

const IDS_PRUEBA = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  recompensado: 'ca-app-pub-3940256099942544/5224354917',
}

const IDS_PRODUCCION = {
  appId: 'ca-app-pub-7620083100302566~1638876761',
  banner: 'ca-app-pub-7620083100302566/2960754181',
  interstitial: 'ca-app-pub-7620083100302566/9278750524',
  recompensado: 'ca-app-pub-7620083100302566/6160595185',
}

export const CONFIG_PUBLICIDAD = MODO_PRUEBA ? IDS_PRUEBA : IDS_PRODUCCION
