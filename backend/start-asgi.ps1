# Start Django ASGI server from backend folder
# Usage: .\start-asgi.ps1

Set-Location -Path $PSScriptRoot
$python = Join-Path $PSScriptRoot "venv\Scripts\python.exe"
if (-Not (Test-Path $python)) {
    Write-Error "Python executable not found: $python"
    exit 1
}

& $python -m uvicorn core.asgi:application --host 127.0.0.1 --port 8000 --reload
