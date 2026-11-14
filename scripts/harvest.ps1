$ErrorActionPreference = 'Stop'
$records = @{}
$queries = @('water','thermal','energy','sensor','agriculture','manufacturing','filtration','battery')
foreach ($query in $queries) {
  $response = Invoke-RestMethod "https://technology.nasa.gov/api/api/patent/$query"
  foreach ($row in $response.results) {
    $id = [string]$row[1]
    $records[$id] = [ordered]@{ id=$id; title=[System.Net.WebUtility]::HtmlDecode(($row[2] -replace '<[^>]+>','')); description=[System.Net.WebUtility]::HtmlDecode(($row[3] -replace '<[^>]+>','')); category=$row[5]; center=$row[9]; url="https://technology.nasa.gov/patent/$id"; source='NASA Technology Transfer'; retrievedAt='2026-11-14'; rights='Licensing and patent status require verification with NASA' }
  }
}
$catalog = [ordered]@{version='2026-11-14'; source='https://technology.nasa.gov/api/'; queries=$queries; coverage='Curated keyword snapshot; not the complete NASA portfolio'; records=@($records.Values | Sort-Object { $_.id })}
$catalog | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $PSScriptRoot '../dist/catalog.json')
Write-Output "Saved $($records.Count) records"
