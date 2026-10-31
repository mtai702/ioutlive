$ErrorActionPreference = 'Stop'
$records = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'candidates.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$target = Join-Path $PSScriptRoot 'imported-people.json'
$output = @()
if (Test-Path -LiteralPath $target) { $output = Get-Content -LiteralPath $target -Raw -Encoding UTF8 | ConvertFrom-Json }
$pending = @($records | Where-Object { $output.id -notcontains $_.id })
# Batch requests and leave room after a prior rate limit. Never retry a rejected batch in a loop.
Start-Sleep -Seconds 3
for ($offset=0; $offset -lt $pending.Count; $offset+=15) {
  $batch = @($pending | Select-Object -Skip $offset -First 15)
  $titles = [Uri]::EscapeDataString(($batch.article -join '|'))
  try {
    $response = Invoke-RestMethod -Uri "https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=$titles&props=claims%7Csitelinks&format=json&redirects=yes" -Headers @{'User-Agent'='IOutlivePrototype/0.3'} -TimeoutSec 30
  } catch { Write-Warning "Batch request failed; stopping to respect service limits: $_"; break }
  foreach ($record in $batch) {
    try {
      $entity = @($response.entities.PSObject.Properties.Value | Where-Object { $_.sitelinks.enwiki.title -eq $record.article.Replace('_',' ') })[0]
      if (!$entity) { throw 'Article redirected or was not found; review title' }
      $dates = @{}
      foreach ($property in @('P569','P570')) {
        $claims = @($entity.claims.$property | Where-Object { $_.rank -ne 'deprecated' -and $_.mainsnak.datavalue.value.precision -eq 11 })
        $preferred = @($claims | Where-Object { $_.rank -eq 'preferred' })
        if ($preferred.Count -gt 0) { $claims = $preferred }
        $gregorian = @($claims | Where-Object { $_.mainsnak.datavalue.value.calendarmodel -match 'Q1985727$' })
        if ($gregorian.Count -gt 0) { $claims = $gregorian }
        if ($claims.Count -eq 0) { throw "No exact date for $property" }
        $times = @($claims | ForEach-Object { $_.mainsnak.datavalue.value.time.Substring(1,10) } | Select-Object -Unique)
        if ($times.Count -gt 1) { throw "Conflicting dates for $property : $times" }
        $dates[$property] = $times[0]
      }
      $title = [Uri]::EscapeDataString($record.article)
      $output += [ordered]@{id=$record.id;name=$record.name;article=$record.article;born=$dates.P569;died=$dates.P570;description=$record.description;source="https://en.wikipedia.org/wiki/$title";dateSource="https://www.wikidata.org/wiki/$($entity.id)";retrieved='2026-10-31'}
      Write-Host "$($record.id): $($dates.P569) - $($dates.P570)"
    } catch { Write-Warning "$($record.id): $_" }
  }
  ConvertTo-Json -InputObject $output -Depth 5 | Set-Content -LiteralPath $target -Encoding UTF8
  Start-Sleep -Seconds 3
}
Write-Host "Imported $($output.Count) of $($records.Count) records"
