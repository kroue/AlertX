# Push Notification Diagnostic Script

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Push Notification Diagnostic Tool" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get username
$username = Read-Host "Enter your mobile app username"

Write-Host ""
Write-Host "Checking Firestore for user: $username" -ForegroundColor Yellow

# Fetch user data
$url = "https://firestore.googleapis.com/v1/projects/alertx-32a7a/databases/(default)/documents/mobileUsers/$username`?key=AIzaSyCtaTOBvrONNeMcFkcT8UfvXQTdNhnAfpg"

try {
    $response = Invoke-RestMethod -Uri $url -Method GET
    
    Write-Host "Success: User found!" -ForegroundColor Green
    Write-Host ""
    
    # Check for push token
    if ($response.fields.pushToken) {
        $pushToken = $response.fields.pushToken.stringValue
        Write-Host "Success: Push token found!" -ForegroundColor Green
        Write-Host "Token: $pushToken" -ForegroundColor White
        Write-Host ""
        
        # Offer to send test notification
        $sendTest = Read-Host "Send test notification to this device? (y/n)"
        
        if ($sendTest -eq "y") {
            Write-Host ""
            Write-Host "Sending test notification..." -ForegroundColor Yellow
            
            $notificationBody = @{
                to = $pushToken
                title = "TEST NOTIFICATION"
                body = "If you see this, push notifications are working!"
                sound = "default"
                priority = "high"
                channelId = "alert-channel"
                data = @{
                    test = $true
                }
            } | ConvertTo-Json
            
            $pushResponse = Invoke-RestMethod -Uri "https://exp.host/--/api/v2/push/send" -Method POST -Headers @{"Content-Type"="application/json"} -Body $notificationBody
            
            Write-Host "Success: Notification sent!" -ForegroundColor Green
            Write-Host "Response:" -ForegroundColor White
            $pushResponse | ConvertTo-Json
            Write-Host ""
            Write-Host "Check your phone! (Make sure app is closed)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "ERROR: No push token found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "To fix this:" -ForegroundColor Yellow
        Write-Host "1. Open the mobile app" -ForegroundColor White
        Write-Host "2. Make sure you are logged in" -ForegroundColor White
        Write-Host "3. Go to the Home screen" -ForegroundColor White
        Write-Host "4. Look at Metro Bundler logs for push token message" -ForegroundColor White
        Write-Host "5. Run this script again" -ForegroundColor White
    }
    
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "- Username does not exist" -ForegroundColor White
    Write-Host "- Network connection problem" -ForegroundColor White
    Write-Host "- Firestore access issue" -ForegroundColor White
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
