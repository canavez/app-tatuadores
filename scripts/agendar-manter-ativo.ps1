# Cria (ou recria) a tarefa diária do Windows que roda manter-supabase-ativo.ps1.
# Rodar uma vez: powershell -ExecutionPolicy Bypass -File scripts\agendar-manter-ativo.ps1
# Para remover: Unregister-ScheduledTask -TaskName "Ravenn - manter Supabase ativo"

$script = Join-Path $PSScriptRoot "manter-supabase-ativo.ps1"
$acao = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$gatilho = New-ScheduledTaskTrigger -Daily -At 12:00
# Se o PC estiver desligado ao meio-dia, roda assim que for ligado.
$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "Ravenn - manter Supabase ativo" -Force `
  -Action $acao -Trigger $gatilho -Settings $config `
  -Description "Acessa o Supabase do Ravenn uma vez por dia para o projeto gratis nao ser pausado." |
  Select-Object TaskName, State
