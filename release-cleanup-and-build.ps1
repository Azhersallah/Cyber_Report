# Read package.json version
$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
$version = $packageJson.version
$tagName = "v$version"

Write-Host "=== Photo Printer Pro Release Management ===" -ForegroundColor Cyan
Write-Host "Version: $version" -ForegroundColor Green
Write-Host ""

$repo = "Azhersallah/Photo-Printer-Free"

# Step 1: Delete all existing releases
Write-Host "Step 1: Deleting all existing releases..." -ForegroundColor Yellow
try {
    $releases = gh release list --repo $repo --limit 1000 --json tagName --jq '.[].tagName'
    if ($releases) {
        $releaseArray = $releases -split "`n" | Where-Object { $_ -ne "" }
        foreach ($tag in $releaseArray) {
            Write-Host "  Deleting release: $tag" -ForegroundColor Gray
            gh release delete $tag --repo $repo --yes 2>$null
        }
        Write-Host "  All releases deleted" -ForegroundColor Green
    } else {
        Write-Host "  No releases found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Warning: Could not delete releases" -ForegroundColor Red
}

Write-Host ""

# Step 2: Delete all tags using GitHub API
Write-Host "Step 2: Deleting all tags..." -ForegroundColor Yellow
try {
    $tags = gh api repos/$repo/tags --jq '.[].name'
    if ($tags) {
        $tagArray = $tags -split "`n" | Where-Object { $_ -ne "" }
        foreach ($tag in $tagArray) {
            Write-Host "  Deleting tag: $tag" -ForegroundColor Gray
            gh api -X DELETE "repos/$repo/git/refs/tags/$tag" 2>$null
        }
        Write-Host "  All tags deleted" -ForegroundColor Green
    } else {
        Write-Host "  No tags found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Warning: Could not delete tags" -ForegroundColor Red
}

Write-Host ""

# Step 3: Build the project
Write-Host "Step 3: Building the project..." -ForegroundColor Yellow
Write-Host "  Running: npm run build" -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Build completed" -ForegroundColor Green

Write-Host ""

# Step 4: Build Electron app
Write-Host "Step 4: Building Electron application..." -ForegroundColor Yellow
Write-Host "  Running: npm run electron:build" -ForegroundColor Gray
npm run electron:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Electron build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Electron build completed" -ForegroundColor Green

Write-Host ""

# Step 5: Create new release with tag
Write-Host "Step 5: Creating new release $tagName..." -ForegroundColor Yellow

# Find the built installer
$installerPath = Get-ChildItem -Path "release" -Filter "*.exe" -Recurse | Select-Object -First 1

if ($installerPath) {
    Write-Host "  Found installer: $($installerPath.Name)" -ForegroundColor Gray
    
    # Create the release with the installer
    Write-Host "  Creating release on GitHub..." -ForegroundColor Gray
    gh release create $tagName $installerPath.FullName --repo $repo --title "Photo Printer Pro v$version" --notes "Release v$version"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Release created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== Release Complete ===" -ForegroundColor Cyan
        Write-Host "Tag: $tagName" -ForegroundColor White
        Write-Host "Release URL: https://github.com/$repo/releases/tag/$tagName" -ForegroundColor White
    } else {
        Write-Host "  Failed to create release" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  No installer found in release directory!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
