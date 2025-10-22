$remoteRepo = 'https://github.com/fjmeneguini/hex-for-pantone.git'
$branch = 'main'

Write-Host "Deploy iniciado para $remoteRepo (branch $branch)" -ForegroundColor Cyan

if(-not (Test-Path ".git")){
  git init
  Write-Host "Repositório git inicializado." -ForegroundColor Green
}

try{
  git remote remove origin 2>$null
}catch{}

git remote add origin $remoteRepo

git add .
$null = & git commit -m "Deploy: atualizando site HEX→Pantone" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Nada para cometer ou commit falhou (código $LASTEXITCODE)." -ForegroundColor Yellow
}

git branch -M $branch

Write-Host "Fazendo push para origin/$branch..." -ForegroundColor Cyan
$pushOutput = & git push -u origin $branch --force 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push falhou (código $LASTEXITCODE). Saída:" -ForegroundColor Red
  Write-Host $pushOutput
} else {
  Write-Host "Push concluído com sucesso." -ForegroundColor Green
}

Write-Host "Push completo. Agora habilite GitHub Pages no repositório (Settings → Pages) e selecione branch 'main' e folder '/' (root)." -ForegroundColor Green
