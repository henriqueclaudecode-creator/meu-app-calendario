# Gera o AAB assinado do Orbi para a Play Store.
#
# Por que existe: o projeto fica no OneDrive, num caminho COM ESPAÇOS
# ("Meus apps\meu app calendario"). O build do Android (R8/recursos) quebra
# nesse caminho com o erro "Invalid file path". A solução é copiar o projeto
# para uma pasta SEM espaços e fora do OneDrive, e buildar lá.
#
# COMO RODAR (no PowerShell):
#   cd "C:\Users\danie\OneDrive\Meus apps\meu app calendario"
#   powershell -ExecutionPolicy Bypass -File scripts\build-aab.ps1
#
# No fim, o AAB é copiado para a sua Área de Trabalho como "orbi-release.aab".

$src = "C:\Users\danie\OneDrive\Meus apps\meu app calendario"
$dst = Join-Path $env:USERPROFILE "orbi-build"
$jbr = "C:\Program Files\Android\Android Studio\jbr"

function Passo($n, $txt) { Write-Host "`n[$n] $txt" -ForegroundColor Cyan }

Passo "1/5" "Copiando o projeto para uma pasta sem espacos ($dst)..."
robocopy $src $dst /E /XD node_modules build .gradle dist .git /XF "*.log" /NFL /NDL /NJH /NJS /NP | Out-Null
Write-Host "   copia concluida."

# Garante o caminho do Android SDK no local.properties, com barras normais
# (barra invertida e' escape em .properties e quebra o build com "Invalid file path").
$sdk = (Join-Path $env:LOCALAPPDATA 'Android\Sdk') -replace '\\','/'
Set-Content -Path (Join-Path $dst 'android\local.properties') -Value "sdk.dir=$sdk" -Encoding ascii
Write-Host "   SDK: $sdk"

Passo "2/5" "Instalando dependencias (npm install)... pode demorar alguns minutos"
Set-Location $dst
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Falhou no npm install." -ForegroundColor Red; exit 1 }

Passo "3/5" "Gerando o build web (npm run build)..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Falhou no npm run build." -ForegroundColor Red; exit 1 }

Passo "4/5" "Sincronizando o Android (npx cap sync)..."
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "Falhou no cap sync." -ForegroundColor Red; exit 1 }

Passo "5/5" "Gerando o AAB assinado (gradlew bundleRelease)... a 1a vez demora mais"
if (Test-Path $jbr) { $env:JAVA_HOME = $jbr }
Set-Location "$dst\android"
.\gradlew.bat bundleRelease
if ($LASTEXITCODE -ne 0) { Write-Host "Falhou no gradlew bundleRelease." -ForegroundColor Red; exit 1 }

$aab = "$dst\android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
  $out = Join-Path ([Environment]::GetFolderPath('Desktop')) "orbi-release.aab"
  Copy-Item $aab $out -Force
  Write-Host "`nPRONTO! AAB gerado com sucesso." -ForegroundColor Green
  Write-Host "Arquivo na Area de Trabalho: $out" -ForegroundColor Green
  Write-Host "Faca upload desse arquivo no campo 'pacotes de apps' da Play Store." -ForegroundColor Green
} else {
  Write-Host "`nO build terminou mas nao encontrei o AAB em:`n$aab" -ForegroundColor Yellow
}
