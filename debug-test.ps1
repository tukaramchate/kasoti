$ErrorActionPreference = "Continue"
$BASE = "http://localhost:8080/api"

# 1. Admin login
$r = Invoke-RestMethod "$BASE/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"Admin@123"}'
$t = $r.token
Write-Host "1. Admin token length: $($t.Length)"

# 2. Register test student 
$ts = [long](Get-Date -UFormat %s)
$body = @{username="tpx$ts";password="Test@1234";email="tpx$ts@t.com";name="TP"} | ConvertTo-Json
$reg = Invoke-RestMethod "$BASE/auth/register" -Method POST -ContentType "application/json" -Body $body
$sid = $reg.user.id
Write-Host "2. Registered student ID: $sid, role: $($reg.user.role)"

# 3. Promote to TEACHER
Write-Host "3. PUT $BASE/admin/users/$sid/role?role=TEACHER"
try {
    $pr = Invoke-WebRequest "$BASE/admin/users/$sid/role?role=TEACHER" -Method PUT -Headers @{Authorization="Bearer $t"}
    Write-Host "   SUCCESS: $($pr.StatusCode) - $($pr.Content)"
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    try {
        $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errBody = $sr.ReadToEnd()
        Write-Host "   FAILED: $code - $errBody"
    } catch {
        Write-Host "   FAILED: $code - (no body)"
    }
}

# 4. Categories without auth
Write-Host "4. GET /api/categories (no auth)"
try {
    $cats = Invoke-RestMethod "$BASE/categories"
    Write-Host "   SUCCESS: $($cats.Count) categories"
} catch {
    Write-Host "   FAILED: $([int]$_.Exception.Response.StatusCode)"
}

# 5. Categories with auth
Write-Host "5. GET /api/categories (with auth)"
try {
    $cats2 = Invoke-RestMethod "$BASE/categories" -Headers @{Authorization="Bearer $t"}
    Write-Host "   SUCCESS: $($cats2.Count) categories: $($cats2 -join ', ')"
} catch {
    Write-Host "   FAILED: $([int]$_.Exception.Response.StatusCode)"
}

# 6. Tags without auth
Write-Host "6. GET /api/categories/tags (no auth)"
try {
    $tags = Invoke-RestMethod "$BASE/categories/tags"
    Write-Host "   SUCCESS: $($tags.Count) tags"
} catch {
    Write-Host "   FAILED: $([int]$_.Exception.Response.StatusCode)"
}

# 7. Evaluate endpoint path check
Write-Host "7. POST /api/quizzes/evaluate/999 (check path)"
try {
    $ev = Invoke-WebRequest "$BASE/quizzes/evaluate/999" -Method POST -ContentType "application/json" -Body '{"marks":5}' -Headers @{Authorization="Bearer $t"}
    Write-Host "   $($ev.StatusCode)"
} catch {
    Write-Host "   Expected error: $([int]$_.Exception.Response.StatusCode)"
}

# Cleanup
try { Invoke-RestMethod "$BASE/admin/users/$sid" -Method DELETE -Headers @{Authorization="Bearer $t"} | Out-Null } catch {}
Write-Host "`nDone."
