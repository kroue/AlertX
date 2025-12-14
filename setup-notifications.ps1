# AlertX Emergency Notification System - Quick Setup Script
# Run this script to set up and deploy the notification system

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "AlertX Emergency Notification System Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Cloud Functions dependencies
Write-Host "Step 1: Installing Cloud Functions dependencies..." -ForegroundColor Yellow
Set-Location functions
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing functions dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Functions dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Cloud Functions
Write-Host "Step 2: Deploying Cloud Functions to Firebase..." -ForegroundColor Yellow
Write-Host "This will deploy push notification handlers for alerts and warnings" -ForegroundColor Gray
Set-Location ..
firebase deploy --only functions
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error deploying functions! Make sure you're logged in with 'firebase login'" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Cloud Functions deployed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Install Mobile App dependencies
Write-Host "Step 3: Installing Mobile App dependencies..." -ForegroundColor Yellow
Set-Location alertx-mobile
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing mobile app dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Mobile app dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Instructions for rebuilding app
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Rebuild the mobile app (REQUIRED):" -ForegroundColor White
Write-Host "   npx expo run:android" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the notification system:" -ForegroundColor White
Write-Host "   - Send an alert from the web control center" -ForegroundColor Gray
Write-Host "   - Verify notification arrives on mobile device" -ForegroundColor Gray
Write-Host "   - Check that sound/vibration works" -ForegroundColor Gray
Write-Host ""
Write-Host "3. View function logs (if issues occur):" -ForegroundColor White
Write-Host "   firebase functions:log" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed setup info, see NOTIFICATION_SETUP.md" -ForegroundColor Cyan
Write-Host ""
