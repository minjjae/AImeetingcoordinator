[CmdletBinding()]
param(
  [switch]$RequireComplete
)

$ErrorActionPreference = 'Stop'

$expectedPages = [ordered]@{
  'index.html' = 'login'
  'personal.html' = 'personal'
  'group.html' = 'group'
}

$problems = [System.Collections.Generic.List[string]]::new()
$missing = [System.Collections.Generic.List[string]]::new()
$secretPattern = '(?i)(sk-[a-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|SUPABASE_SERVICE_ROLE_KEY\s*=|OPENAI_API_KEY\s*=)'

foreach ($entry in $expectedPages.GetEnumerator()) {
  $path = Join-Path $PSScriptRoot "..\$($entry.Key)"

  if (-not (Test-Path -LiteralPath $path)) {
    $missing.Add($entry.Key)
    continue
  }

  $content = Get-Content -LiteralPath $path -Raw -Encoding utf8

  if ($content -notmatch '(?is)<html\b') {
    $problems.Add("$($entry.Key): missing <html> root element")
  }

  if ($content -notmatch '(?is)</html>') {
    $problems.Add("$($entry.Key): missing closing </html> tag")
  }

  if ($content -notmatch '(?is)<title>\s*[^<]+\s*</title>') {
    $problems.Add("$($entry.Key): add a non-empty <title> for the browser tab")
  }

  $expectedMarker = 'data-page\s*=\s*["'']' + [regex]::Escape($entry.Value) + '["'']'
  if ($content -notmatch $expectedMarker) {
    $problems.Add(('{0}: add data-page="{1}" to the <html> element' -f $entry.Key, $entry.Value))
  }

  if ($content -match $secretPattern) {
    $problems.Add("$($entry.Key): possible API key or service-role secret detected")
  }
}

if ($missing.Count -gt 0) {
  $message = "Static pages not yet present: $($missing -join ', ')."
  if ($RequireComplete) {
    $problems.Add($message)
  } else {
    Write-Warning "$message This is allowed while page branches are being developed in parallel."
  }
}

if ($problems.Count -gt 0) {
  Write-Host 'Static page validation failed:' -ForegroundColor Red
  $problems | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Static page validation passed. Present pages: $($expectedPages.Count - $missing.Count)/$($expectedPages.Count)." -ForegroundColor Green
if ($missing.Count -gt 0) {
  Write-Host 'Run again with -RequireComplete immediately before the final demo merge.' -ForegroundColor Yellow
}
