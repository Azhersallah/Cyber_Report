Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

[Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime] | Out-Null
$connectionProfile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()

if ($connectionProfile -eq $null) {
    $profiles = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
    foreach ($p in $profiles) {
        if ($p.IsWlanConnectionProfile) {
            $connectionProfile = $p
            break
        }
    }
}

$tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($connectionProfile)

Write-Host "Initial State: " $tetheringManager.TetheringOperationalState

$config = $tetheringManager.GetCurrentAccessPointConfiguration()
Write-Host "SSID: " $config.Ssid
Write-Host "Password: " $config.Passphrase

# Try to start
Write-Host "Attempting to start hotspot..."
$startResult = Await $tetheringManager.StartTetheringAsync() ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
Write-Host "Start Result Status: " $startResult.Status

Write-Host "State after start: " $tetheringManager.TetheringOperationalState

# Wait a bit
Start-Sleep -Seconds 5

# Get IP address of the hotspot interface
$hotspotIP = "Unknown"
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Local Area Connection*" -or $_.InterfaceAlias -like "*Hotspot*" -or $_.InterfaceAlias -match "Direct" }
foreach ($adapter in $adapters) {
    if ($adapter.IPAddress -like "192.168.137.*") {
        $hotspotIP = $adapter.IPAddress
    }
}
Write-Host "Hotspot IP: " $hotspotIP

# Stop
Write-Host "Attempting to stop hotspot..."
$stopResult = Await $tetheringManager.StopTetheringAsync() ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
Write-Host "Stop Result Status: " $stopResult.Status
Write-Host "Final State: " $tetheringManager.TetheringOperationalState
