# Redimensionne une photo en conservant ses proportions, en JPEG de qualite
# choisie. Utilise System.Drawing : rien a installer.
param(
    [Parameter(Mandatory=$true)][string]$Source,
    [Parameter(Mandatory=$true)][string]$Destination,
    [int]$MaxWidth = 1000,
    [int]$Quality = 84
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile($Source)
try {
    $ratio = $src.Height / $src.Width
    $w = [Math]::Min($MaxWidth, $src.Width)
    $h = [int][Math]::Round($w * $ratio)

    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($src, 0, 0, $w, $h)
    } finally {
        $g.Dispose()
    }

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [int]$Quality)

    $bmp.Save($Destination, $codec, $params)
    $bmp.Dispose()

    $out = Get-Item $Destination
    "{0}  ->  {1} x {2} px, {3:N0} Ko" -f $out.Name, $w, $h, ($out.Length/1KB)
} finally {
    $src.Dispose()
}
