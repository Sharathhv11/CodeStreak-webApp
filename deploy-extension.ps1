$source = "D:\projects\codeStreak\extention"
$dest = "D:\projects\codeStreak\client\public\extension.zip"
$backup = "D:\projects\codeStreak\client\public\extension.zip.bak"

Write-Host "Starting deployment of extension..."

# 1. Back up existing version
if (Test-Path $dest) {
    Write-Host "Backing up currently running version..."
    Copy-Item -Path $dest -Destination $backup -Force
    Write-Host "Backup created at $backup"
} else {
    Write-Host "No currently running version to back up."
}

# 2. Package the extension
Write-Host "Packaging extension from $source to $dest..."
if (Test-Path $dest) {
    Remove-Item -Path $dest -Force
}

# Compress the contents of the extension folder
Compress-Archive -Path "$source\*" -DestinationPath $dest -Force

Write-Host "Deployment completed successfully! Extension package is served at $dest."
