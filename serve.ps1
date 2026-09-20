# Petit serveur web local, sans rien a installer.
#
#   Clic droit sur ce fichier > "Executer avec PowerShell"
#   ou, dans un terminal :  powershell -ExecutionPolicy Bypass -File serve.ps1
#
# Puis ouvrir http://localhost:8080
# Ctrl+C pour arreter.
#
# Pourquoi en avoir besoin : ouvrir index.html en double-clic utilise le
# protocole file://, sans origine HTTP. YouTube refuse alors de lire les
# videos integrees (erreur 153). Sur http://localhost, tout fonctionne.

param(
    [int]$Port = 8080
)

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.avif' = 'image/avif'
    '.webp' = 'image/webp'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.png'  = 'image/png'
    '.gif'  = 'image/gif'
    '.webm' = 'video/webm'
    '.mp4'  = 'video/mp4'
    '.pdf'  = 'application/pdf'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
    '.md'   = 'text/plain; charset=utf-8'
    '.woff2' = 'font/woff2'
}

# TcpListener plutot que HttpListener : pas besoin de droits administrateur.
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
try {
    $listener.Start()
} catch {
    Write-Host ""
    Write-Host "Impossible d'ouvrir le port $Port. Il est peut-etre deja utilise." -ForegroundColor Red
    Write-Host "Essaie un autre port :  powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8081" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "  Portfolio servi depuis : $root"
Write-Host "  Ouvre ton navigateur sur : " -NoNewline
Write-Host "http://localhost:$Port" -ForegroundColor Green
Write-Host "  Ctrl+C pour arreter."
Write-Host ""

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $stream.ReadTimeout = 5000

            # --- lecture de la requete (on s'arrete a la ligne vide) ---
            $buffer = New-Object byte[] 8192
            $text = ''
            do {
                $read = $stream.Read($buffer, 0, $buffer.Length)
                if ($read -le 0) { break }
                $text += [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
            } while ($text -notmatch "`r`n`r`n" -and $text.Length -lt 65536)

            if ($text -notmatch '^(GET|HEAD)\s+(\S+)') {
                $client.Close()
                continue
            }
            $method = $matches[1]
            $target = $matches[2]

            # --- resolution du chemin ---
            $path = ($target -split '\?')[0]
            $path = ($path -split '#')[0]
            $path = [System.Uri]::UnescapeDataString($path)
            if ($path -eq '/' -or $path.EndsWith('/')) { $path += 'index.html' }
            $relative = $path.TrimStart('/') -replace '/', '\'
            # Comme GitHub Pages : /profil ou /work/pantheon (sans barre finale) servent le index.html du dossier
            if (-not [System.IO.Path]::HasExtension($relative) -and (Test-Path -LiteralPath (Join-Path $root $relative) -PathType Container)) { $relative = Join-Path $relative 'index.html' }

            $full = Join-Path $root $relative
            $resolvedRoot = [System.IO.Path]::GetFullPath($root)
            $status = '200 OK'
            $bytes = $null
            $type = 'application/octet-stream'

            try {
                $resolved = [System.IO.Path]::GetFullPath($full)
            } catch {
                $resolved = ''
            }

            # On refuse toute sortie du dossier du site
            if (-not $resolved.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                $status = '403 Forbidden'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('403 - acces refuse')
                $type = 'text/plain; charset=utf-8'
            } elseif (Test-Path -LiteralPath $resolved -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($resolved)
                $ext = [System.IO.Path]::GetExtension($resolved).ToLower()
                if ($mime.ContainsKey($ext)) { $type = $mime[$ext] }
            } else {
                $status = '404 Not Found'
                $notFound = Join-Path $root '404.html'
                if (Test-Path -LiteralPath $notFound -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($notFound)
                    $type = 'text/html; charset=utf-8'
                } else {
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 - introuvable')
                    $type = 'text/plain; charset=utf-8'
                }
            }

            $code = ($status -split ' ')[0]
            Write-Host ("  {0}  {1}" -f $code, $path)

            $header = "HTTP/1.1 $status`r`n"
            $header += "Content-Type: $type`r`n"
            $header += "Content-Length: $($bytes.Length)`r`n"
            $header += "Cache-Control: no-store`r`n"
            $header += "Connection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

            $stream.Write($headerBytes, 0, $headerBytes.Length)
            if ($method -ne 'HEAD' -and $bytes.Length -gt 0) {
                $stream.Write($bytes, 0, $bytes.Length)
            }
            $stream.Flush()
        } catch {
            # Une connexion qui casse ne doit pas arreter le serveur
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
    Write-Host ""
    Write-Host "  Serveur arrete."
}
