$ErrorActionPreference = 'Stop'

$rutaRaiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$rutaZip = Join-Path $rutaRaiz 'android\app\build\outputs\native-debug-symbols\release\native-debug-symbols.zip'

if (-not (Test-Path -LiteralPath $rutaZip)) {
  Write-Error "Falta native-debug-symbols.zip en: $rutaZip"
}

$archivo = Get-Item -LiteralPath $rutaZip
if ($archivo.Length -le 100) {
  Write-Error "El ZIP existe pero parece vacio o invalido: $rutaZip (tamano: $($archivo.Length) bytes)"
}

Write-Output "Simbolos OK: $rutaZip (tamano: $($archivo.Length) bytes)"
