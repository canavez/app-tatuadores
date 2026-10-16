# Faz uma consulta simples ao Supabase para o projeto (plano grátis) não ser
# pausado por falta de uso. Roda todo dia pela tarefa agendada
# "Ravenn - manter Supabase ativo" no Agendador de Tarefas do Windows.

$pasta = Split-Path -Parent $PSScriptRoot
$env_ = @{}
Get-Content (Join-Path $pasta ".env.local") | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.+?)\s*$') { $env_[$Matches[1]] = $Matches[2].Trim('"') }
}

$url = $env_["NEXT_PUBLIC_SUPABASE_URL"]
$chave = $env_["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
$log = Join-Path $PSScriptRoot "manter-supabase-ativo.log"

try {
  $resposta = Invoke-WebRequest -UseBasicParsing -TimeoutSec 30 `
    -Uri "$url/rest/v1/clientes?select=id&limit=1" `
    -Headers @{ apikey = $chave; Authorization = "Bearer $chave" }
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm') ok ($($resposta.StatusCode))" | Add-Content $log
} catch {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm') falhou: $($_.Exception.Message)" | Add-Content $log
}
