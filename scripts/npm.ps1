# Run workspace commands with the project's portable Node 22 on Windows.
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$NpmArguments = @('run', 'dev')
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$portableRuntime = Get-ChildItem -LiteralPath (Join-Path $projectRoot '.local') -Directory -Filter 'node-v22.*-win-x64' -ErrorAction SilentlyContinue |
    Sort-Object { [version]($_.Name -replace '^node-v', '' -replace '-win-x64$', '') } -Descending |
    Select-Object -First 1
$nodeCommand = if ($portableRuntime) {
    Join-Path $portableRuntime.FullName 'node.exe'
} else {
    (Get-Command node.exe -ErrorAction Stop).Source
}
$nodeVersion = & $nodeCommand -p 'process.versions.node'
if ($LASTEXITCODE -ne 0 -or ([version]$nodeVersion).Major -ne 22 -or ([version]$nodeVersion).Minor -lt 16) {
    throw 'FlavorPilot requires Node 22.16+ in the 22.x line. See docs/DEVELOPMENT.md.'
}
$runtimeDirectory = Split-Path -Parent $nodeCommand
$npmCommand = Join-Path $runtimeDirectory 'npm.cmd'
if (-not (Test-Path -LiteralPath $npmCommand)) {
    throw 'npm.cmd was not found beside Node. Install the official Node 22 Windows distribution.'
}
$previousPath = $env:Path
$previousCache = $env:npm_config_cache
$previousTemp = $env:TEMP
$previousTmp = $env:TMP
$previousBrowsers = $env:PLAYWRIGHT_BROWSERS_PATH
$temporaryDirectory = Join-Path $projectRoot '.local/tmp'
New-Item -ItemType Directory -Path $temporaryDirectory -Force | Out-Null
Push-Location -LiteralPath $projectRoot
try {
    $env:Path = $runtimeDirectory + [IO.Path]::PathSeparator + $previousPath
    $env:npm_config_cache = Join-Path $projectRoot '.local/npm-cache'
    $env:TEMP = $temporaryDirectory
    $env:TMP = $temporaryDirectory
    $env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $projectRoot '.local/playwright'
    & $npmCommand @NpmArguments
    $commandExitCode = $LASTEXITCODE
} finally {
    $env:Path = $previousPath
    $env:npm_config_cache = $previousCache
    $env:TEMP = $previousTemp
    $env:TMP = $previousTmp
    $env:PLAYWRIGHT_BROWSERS_PATH = $previousBrowsers
    Pop-Location
}
exit $commandExitCode
