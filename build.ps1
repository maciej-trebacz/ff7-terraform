$dir = Get-Location
$env:TAURI_SIGNING_PRIVATE_KEY="$dir\~\.tauri\ff7-terraform.key"
npm run tauri build