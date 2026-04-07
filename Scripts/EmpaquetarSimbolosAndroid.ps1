$ErrorActionPreference = 'Stop'

$rutaRaiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$rutaOrigen = Join-Path $rutaRaiz 'android\app\build\intermediates\merged_native_libs\release\mergeReleaseNativeLibs\out\lib'
$rutaDestinoCarpeta = Join-Path $rutaRaiz 'android\app\build\outputs\native-debug-symbols\release'
$rutaDestinoZip = Join-Path $rutaDestinoCarpeta 'native-debug-symbols.zip'

if (-not (Test-Path -LiteralPath $rutaOrigen)) {
  Write-Error "No existe la carpeta de librerias nativas: $rutaOrigen"
}

$archivosSo = Get-ChildItem -LiteralPath $rutaOrigen -Recurse -File -Filter '*.so'
if ($archivosSo.Count -eq 0) {
  Write-Error "No se encontraron archivos .so para empaquetar en: $rutaOrigen"
}

New-Item -ItemType Directory -Path $rutaDestinoCarpeta -Force | Out-Null

if (Test-Path -LiteralPath $rutaDestinoZip) {
  Remove-Item -LiteralPath $rutaDestinoZip -Force
}

Compress-Archive -Path (Join-Path $rutaOrigen '*') -DestinationPath $rutaDestinoZip -Force

Write-Output "ZIP generado: $rutaDestinoZip ($($archivosSo.Count) archivos .so)"
