$ErrorActionPreference = 'Stop'
$records = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scripts/portrait-manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$directory = Join-Path $PSScriptRoot 'assets/portraits'
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$portraits = @{}
$cachePath = Join-Path $PSScriptRoot 'portraits.js'
if (Test-Path -LiteralPath $cachePath) {
  $json = (Get-Content -LiteralPath $cachePath -Raw -Encoding UTF8) -replace '^\s*window\.IOUTLIVE_PORTRAITS\s*=\s*','' -replace ';\s*$',''
  $old = $json | ConvertFrom-Json
  foreach ($entry in $old.PSObject.Properties) { $portraits[$entry.Name] = $entry.Value }
}
$pending = @($records | Where-Object { !$portraits.ContainsKey($_.id) -or !(Test-Path -LiteralPath (Join-Path $PSScriptRoot $portraits[$_.id].url)) })
# Fetch metadata in batches, not one API request per portrait.
for ($offset=0; $offset -lt $pending.Count; $offset+=40) {
  $batch = @($pending | Select-Object -Skip $offset -First 40)
  $titles = [Uri]::EscapeDataString(($batch.article -join '|'))
  try {
    $uri = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=$titles&piprop=thumbnail%7Cname%7Coriginal&pithumbsize=240&pilicense=any&redirects=1&format=json&formatversion=2"
    $response = Invoke-RestMethod -Uri $uri -Headers @{'User-Agent'='IOutlivePrototype/0.3'} -TimeoutSec 30
  } catch { Write-Warning "Metadata request failed; stopping: $_"; break }
  foreach ($record in $batch) {
    try {
      $title = $record.article.Replace('_',' ')
      foreach ($normal in $response.query.normalized) { if ($normal.from -eq $title) { $title = $normal.to } }
      foreach ($redirect in $response.query.redirects) { if ($redirect.from -eq $title) { $title = $redirect.to } }
      $page = @($response.query.pages | Where-Object { $_.title -eq $title })[0]
      if (!$page.thumbnail.source) { Write-Warning "No thumbnail for $($record.id)"; continue }
      $url = $page.thumbnail.source
      $filename = $page.pageimage
      $wiki = if ($page.original.source -match '/wikipedia/commons/') {'commons.wikimedia.org'} else {'en.wikipedia.org'}
      $extension = [IO.Path]::GetExtension(([Uri]$url).AbsolutePath)
      $local = "assets/portraits/$($record.id)$extension"
      Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile (Join-Path $PSScriptRoot $local) -Headers @{'User-Agent'='IOutlivePrototype/0.3'} -TimeoutSec 30
      $portraits[$record.id] = @{url=$local; credits="https://$wiki/wiki/File:$([Uri]::EscapeDataString($filename))"}
      Write-Host "Cached $($record.id)"
    } catch {
      Write-Warning "Could not cache $($record.id): $_"
      if ($_.Exception.Response.StatusCode -eq 429) { Write-Warning 'Stopping on service rate limit.'; break }
    } finally { Start-Sleep -Milliseconds 350 }
  }
  'window.IOUTLIVE_PORTRAITS = ' + (ConvertTo-Json -InputObject $portraits -Depth 5) + ';' | Set-Content -LiteralPath $cachePath -Encoding UTF8
  Start-Sleep -Seconds 3
}
Write-Host "Cached portraits: $($portraits.Count)"
