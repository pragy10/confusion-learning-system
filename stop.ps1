<#
.SYNOPSIS
    Stops all Confusion Learning System services running on ports 5000, 8000, and 5173.
#>

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "                 Confusion Learning System - Stopper                " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stopping services on ports 5000, 8000, and 5173..." -ForegroundColor Yellow

$ports = @(5000, 8000, 5173)

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pidToKill = $conn.OwningProcess
                Write-Host "Terminating process with PID $pidToKill on port $port..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host "No active listener on port $port." -ForegroundColor Gray
        }
    } catch {
        # Fallback using netstat
        $lines = netstat -ano | Select-String ":$port\s+.*LISTENING"
        foreach ($line in $lines) {
            $tokens = ($line -split '\s+') | Where-Object { $_ -ne '' }
            $pidToKill = $tokens[-1]
            if ($pidToKill -and $pidToKill -match '^\d+$') {
                Write-Host "Terminating process with PID $pidToKill on port $port..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host ""
Write-Host "Done! Ports 5000, 8000, and 5173 are now free." -ForegroundColor Green
