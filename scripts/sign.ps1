param (
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [Parameter(Mandatory = $false)]
    [string]$CertBase64 = $env:CERT_BASE64,

    [Parameter(Mandatory = $false)]
    [string]$CertPassword = $env:CERT_PASSWORD,

    [Parameter(Mandatory = $false)]
    [string]$TimestampServer = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $FilePath)) {
    Write-Error "Fayl topilmadi: $FilePath"
    exit 1
}

Write-Host "=========================================="
Write-Host " Code Signing: $FilePath"
Write-Host "=========================================="

$tempPfx = $null

try {
    if ($CertBase64 -and $CertPassword) {
        Write-Host "-> Haqiqiy sertifikat (GitHub Secrets / Environment) orqali imzolash..."
        $bytes = [Convert]::FromBase64String($CertBase64)
        $tempPfx = [System.IO.Path]::GetTempFileName() + ".pfx"
        [System.IO.File]::WriteAllBytes($tempPfx, $bytes)
        
        $pfxCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($tempPfx, $CertPassword)
        $result = Set-AuthenticodeSignature -FilePath $FilePath -Certificate $pfxCert -TimestampServer $TimestampServer -HashAlgorithm SHA256
    }
    else {
        Write-Host "-> Maxsus Code Signing sertifikati qidirilmoqda yoki yaratilmoqda..."
        $cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -like "*Mitti*" } | Select-Object -First 1

        if (-not $cert) {
            Write-Host "-> Yangi self-signed Code Signing sertifikati yaratilmoqda..."
            $cert = New-SelfSignedCertificate -Type CodeSigningCert `
                -Subject "CN=Mitti Programming Language, O=otabekoff" `
                -CertStoreLocation "Cert:\CurrentUser\My" `
                -NotAfter (Get-Date).AddYears(5) `
                -FriendlyName "Mitti Open Source Code Signing"
        }

        Write-Host "-> Sertifikat: $($cert.Subject)"
        $result = Set-AuthenticodeSignature -FilePath $FilePath -Certificate $cert -TimestampServer $TimestampServer -HashAlgorithm SHA256
    }

    Write-Host "-> Imzo holati: $($result.Status)"
    Write-Host "-> Status Message: $($result.StatusMessage)"

    # Verify
    $verify = Get-AuthenticodeSignature -FilePath $FilePath
    Write-Host "-> Yakuniy tekshiruv: $($verify.SignerCertificate.Subject) [Status: $($verify.Status)]"
    Write-Host "=========================================="
    Write-Host " Muvaffaqiyatli imzolandi!"
    Write-Host "=========================================="
}
finally {
    if ($tempPfx -and (Test-Path $tempPfx)) {
        Remove-Item $tempPfx -Force -ErrorAction SilentlyContinue
    }
}

