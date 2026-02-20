## Comprehensive QA API Test Suite
## Tests ALL backend endpoints for correctness, security, and edge cases.

$BASE = "http://localhost:8080/api"
$pass = 0; $fail = 0; $warn = 0
$results = @()

function Test-API {
    param($Name, $Method, $Url, $Body, $Token, $ExpectedStatus, $Check)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        $params = @{ Uri = $Url; Method = $Method; Headers = $headers; ErrorAction = "Stop" }
        if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
        $response = Invoke-WebRequest @params
        $code = $response.StatusCode
        $data = $null
        try { $data = $response.Content | ConvertFrom-Json } catch {}
        
        if ($ExpectedStatus -and $code -ne $ExpectedStatus) {
            $script:fail++
            $script:results += "FAIL: $Name - Expected $ExpectedStatus got $code"
            Write-Host "  FAIL: $Name - Expected $ExpectedStatus got $code" -ForegroundColor Red
            return $null
        }
        
        if ($Check) {
            $checkResult = & $Check $data $code
            if ($checkResult -eq $false) {
                $script:fail++
                $script:results += "FAIL: $Name - Check failed"
                Write-Host "  FAIL: $Name - Check failed" -ForegroundColor Red
                return $data
            }
        }
        
        $script:pass++
        Write-Host "  PASS: $Name ($code)" -ForegroundColor Green
        return $data
    } catch {
        $code = 0
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        if ($ExpectedStatus -and $code -eq $ExpectedStatus) {
            $script:pass++
            Write-Host "  PASS: $Name ($code expected)" -ForegroundColor Green
            try {
                $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $sr.ReadToEnd() | ConvertFrom-Json
                return $body
            } catch { return $null }
        }
        $script:fail++
        $errMsg = $_.Exception.Message
        $script:results += "FAIL: $Name - $errMsg (got $code)"
        Write-Host "  FAIL: $Name - $errMsg (got $code)" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n========== KASOTI QA API TEST SUITE ==========" -ForegroundColor Cyan
Write-Host "Base URL: $BASE`n"

# ── 1. HEALTH ──
Write-Host "`n-- Health Endpoints --" -ForegroundColor Yellow
Test-API "Health check" GET "$BASE/health" $null $null 200
$detailed = Test-API "Health detailed" GET "$BASE/health/detailed" $null $null 200
if ($detailed -and $detailed.database -and $detailed.database.status -eq "UP" -and -not $detailed.database.connectionTest) {
    $script:warn++
    Write-Host "  WARN: Health detailed returns hardcoded DB status (no real check)" -ForegroundColor DarkYellow
}

# ── 2. AUTH ──
Write-Host "`n-- Auth Endpoints --" -ForegroundColor Yellow
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# Register student
$studentReg = Test-API "Register student" POST "$BASE/auth/register" @{
    username="qastudent$ts"; password="Test@1234"; email="qas$ts@test.com"; name="QA Student"; role="STUDENT"
} $null 201

$studentToken = $studentReg.token

# Register another student for edge cases
$student2Reg = Test-API "Register student2" POST "$BASE/auth/register" @{
    username="qastudent2_$ts"; password="Test@1234"; email="qas2_$ts@test.com"; name="QA Student 2"; role="STUDENT"
} $null 201
$student2Token = $student2Reg.token

# Register teacher
$teacherReg = Test-API "Register teacher (should fail)" POST "$BASE/auth/register" @{
    username="qateacher$ts"; password="Test@1234"; email="qat$ts@test.com"; name="QA Teacher"; role="TEACHER"
} $null 400

# Login admin
$adminLogin = Test-API "Login admin" POST "$BASE/auth/login" @{
    username="admin"; password="Admin@123"
} $null 200
$adminToken = $adminLogin.token

if (-not $adminToken) {
    Write-Host "FATAL: Admin login failed, cannot continue" -ForegroundColor Red
    exit 1
}

# Duplicate registration
Test-API "Duplicate username" POST "$BASE/auth/register" @{
    username="qastudent$ts"; password="Test@1234"; email="different@test.com"; name="Dup"
} $null 400

# Invalid login
Test-API "Invalid login" POST "$BASE/auth/login" @{
    username="nonexistent"; password="wrong"
} $null 401

# Missing fields
Test-API "Register missing password" POST "$BASE/auth/register" @{
    username="nopass$ts"; email="np@test.com"; name="No Pass"
} $null 400

# Forgot password (unknown email - should return 200, no leak)
Test-API "Forgot password unknown email" POST "$BASE/auth/forgot-password" @{
    email="unknown@nope.com"
} $null 200

# Reset password with invalid token
Test-API "Reset with invalid token" POST "$BASE/auth/reset-password" @{
    token="invalid-token-123"; newPassword="NewPass@1234"
} $null 400

# ── 3. ADMIN - Create teacher user ──
Write-Host "`n-- Admin User Management --" -ForegroundColor Yellow

# Get all users
$users = Test-API "Get all users" GET "$BASE/admin/users?page=0&size=5" $null $adminToken 200

# Get student user ID
$studentId = $null
$student2Id = $null
if ($users.content) {
    $studentUser = $users.content | Where-Object { $_.username -eq "qastudent$ts" }
    $studentId = $studentUser.id
    $student2User = $users.content | Where-Object { $_.username -eq "qastudent2_$ts" }
    $student2Id = $student2User.id
}

# If not found in first page, search more
if (-not $studentId) {
    try {
        $allUsers = Invoke-RestMethod "$BASE/admin/users?page=0&size=100" -Headers @{ Authorization = "Bearer $adminToken" }
        $studentUser = $allUsers.content | Where-Object { $_.username -eq "qastudent$ts" }
        $studentId = $studentUser.id
        $student2User = $allUsers.content | Where-Object { $_.username -eq "qastudent2_$ts" }
        $student2Id = $student2User.id
    } catch {}
}

# Promote student to teacher
if ($studentId) {
    Test-API "Promote to TEACHER" PUT "$BASE/admin/users/$studentId/role?role=TEACHER" $null $adminToken 200
    
    # Re-login as promoted teacher
    $teacherLogin = Test-API "Login promoted teacher" POST "$BASE/auth/login" @{
        username="qastudent$ts"; password="Test@1234"
    } $null 200
    $teacherToken = $teacherLogin.token
} else {
    Write-Host "  WARN: Could not find student ID for promotion" -ForegroundColor DarkYellow
    $teacherToken = $null
}

# Admin stats
$adminStats = Test-API "Admin system stats" GET "$BASE/admin/stats" $null $adminToken 200

# Filter users by role
Test-API "Users by role STUDENT" GET "$BASE/admin/users/role/STUDENT?page=0&size=5" $null $adminToken 200
Test-API "Users by role TEACHER" GET "$BASE/admin/users/role/TEACHER?page=0&size=5" $null $adminToken 200

# Non-admin tries admin endpoint
Test-API "Student access admin (403)" GET "$BASE/admin/stats" $null $student2Token 403

# ── 4. QUIZ CRUD (Teacher) ──
Write-Host "`n-- Quiz CRUD --" -ForegroundColor Yellow

if ($teacherToken) {
    # Create quiz with multiple question types
    $quizData = @{
        title = "QA Test Quiz $ts"
        description = "Comprehensive test quiz"
        category = "Science"
        difficulty = "MEDIUM"
        tags = "qa,testing,automated"
        timeLimitMinutes = 30
        negativeMarking = $true
        shuffleQuestions = $false
        shuffleOptions = $false
        passPercentage = 60
        questions = @(
            @{
                text = "What is 2+2?"
                questionType = "MCQ"
                options = @("3", "4", "5", "6")
                correctOption = "4"
                marks = 10
            },
            @{
                text = "The earth is flat."
                questionType = "TRUE_FALSE"
                options = @("True", "False")
                correctOption = "False"
                marks = 5
            },
            @{
                text = "Select all prime numbers"
                questionType = "MSQ"
                options = @("2", "4", "7", "9")
                correctOptions = @("2", "7")
                marks = 10
            },
            @{
                text = "Explain photosynthesis"
                questionType = "DESCRIPTIVE"
                modelAnswer = "Process by which plants convert light energy to chemical energy"
                keywords = "light,chlorophyll,glucose,oxygen"
                marks = 15
            }
        )
    }
    $createdQuiz = Test-API "Create quiz" POST "$BASE/quizzes" $quizData $teacherToken 201

    $quizId = $createdQuiz.id

    if ($quizId) {
        # Get quiz
        $fetchedQuiz = Test-API "Get quiz by ID" GET "$BASE/quizzes/$quizId" $null $teacherToken 200
        
        # Verify question types preserved
        if ($fetchedQuiz.questions) {
            $types = $fetchedQuiz.questions | ForEach-Object { $_.questionType } | Sort-Object -Unique
            if ($types.Count -ge 3) {
                $script:pass++
                Write-Host "  PASS: All question types preserved ($($types -join ', '))" -ForegroundColor Green
            } else {
                $script:fail++
                Write-Host "  FAIL: Missing question types, got: $($types -join ', ')" -ForegroundColor Red
            }
        }
        
        # Update quiz
        $quizData.title = "Updated QA Quiz $ts"
        $quizData.description = "Updated description"
        Test-API "Update quiz" PUT "$BASE/quizzes/$quizId" $quizData $teacherToken 200
        
        # Student can't access DRAFT quiz
        Test-API "Student access DRAFT quiz (403)" GET "$BASE/quizzes/$quizId" $null $student2Token 403
        
        # Publish quiz
        Test-API "Publish quiz" POST "$BASE/quizzes/$quizId/publish" $null $teacherToken 200
        
        # Verify share code generated
        $publishedQuiz = Test-API "Get published quiz" GET "$BASE/quizzes/$quizId" $null $teacherToken 200
        if ($publishedQuiz.shareCode) {
            $script:pass++
            Write-Host "  PASS: Share code generated: $($publishedQuiz.shareCode)" -ForegroundColor Green
            $shareCode = $publishedQuiz.shareCode
        } else {
            $script:fail++
            Write-Host "  FAIL: Share code not generated after publish" -ForegroundColor Red
        }
        
        # Can't publish again
        Test-API "Publish already published (400)" POST "$BASE/quizzes/$quizId/publish" $null $teacherToken 400
        
        # Can't edit published quiz
        Test-API "Edit published quiz (400)" PUT "$BASE/quizzes/$quizId" $quizData $teacherToken 400
        
        # Public share code access
        if ($shareCode) {
            Test-API "Public share code" GET "$BASE/public/quizzes/share/$shareCode" $null $null 200
            Test-API "Invalid share code" GET "$BASE/public/quizzes/share/INVALID1" $null $null 404
        }
        
        # Student access published quiz
        Test-API "Student access published quiz" GET "$BASE/quizzes/$quizId" $null $student2Token 200
        
        # Has attempted (should be false)
        $attemptCheck = Test-API "Has attempted (false)" GET "$BASE/quizzes/$quizId/attempted" $null $student2Token 200
        if ($attemptCheck.attempted -eq $false) {
            $script:pass++
            Write-Host "  PASS: Not attempted yet" -ForegroundColor Green
        }
        
        # Submit quiz
        $submitData = @{
            answers = @{ }
            multiAnswers = @{ }
            textAnswers = @{ }
            timeTakenSeconds = 120
        }
        
        # We need question IDs from the fetched quiz
        if ($publishedQuiz.questions) {
            foreach ($q in $publishedQuiz.questions) {
                switch ($q.questionType) {
                    "MCQ" { $submitData.answers[$q.id.ToString()] = "4" }
                    "TRUE_FALSE" { $submitData.answers[$q.id.ToString()] = "False" }
                    "MSQ" { $submitData.multiAnswers[$q.id.ToString()] = @("2", "7") }
                    "DESCRIPTIVE" { $submitData.textAnswers[$q.id.ToString()] = "Plants use light, chlorophyll to make glucose and oxygen" }
                }
            }
        }
        
        $submitResult = Test-API "Submit quiz" POST "$BASE/quizzes/$quizId/submit" $submitData $student2Token 200
        
        if ($submitResult) {
            if ($submitResult.score -ne $null) {
                $script:pass++
                Write-Host "  PASS: Score received: $($submitResult.score)%" -ForegroundColor Green
            }
            if ($submitResult.answers) {
                # Check DESCRIPTIVE answer is pending
                $descAnswer = $submitResult.answers | Where-Object { $_.questionType -eq "DESCRIPTIVE" }
                if ($descAnswer -and $descAnswer.isCorrect -eq $null) {
                    $script:pass++
                    Write-Host "  PASS: DESCRIPTIVE answer correctly pending" -ForegroundColor Green
                }
            }
        }
        
        # Has attempted (should be true now)
        $attemptCheck2 = Test-API "Has attempted (true)" GET "$BASE/quizzes/$quizId/attempted" $null $student2Token 200
        if ($attemptCheck2.attempted -eq $true) {
            $script:pass++
            Write-Host "  PASS: Correctly shows attempted" -ForegroundColor Green
        }
        
        # Can't submit again
        Test-API "Submit again (400)" POST "$BASE/quizzes/$quizId/submit" $submitData $student2Token 400
        
        # Leaderboard
        $leaderboard = Test-API "Leaderboard" GET "$BASE/quizzes/$quizId/leaderboard" $null $student2Token 200
        if ($leaderboard -and $leaderboard.Count -ge 1) {
            $script:pass++
            Write-Host "  PASS: Leaderboard has entries" -ForegroundColor Green
        }
        
        # Teacher: quiz students
        $students = Test-API "Get quiz students" GET "$BASE/quizzes/$quizId/students?sortBy=score_desc" $null $teacherToken 200
        if ($students -and $students.Count -ge 1) {
            $script:pass++
            Write-Host "  PASS: Students list has entries" -ForegroundColor Green
        }
        
        # Teacher: pending evaluations
        $pending = Test-API "Pending evaluations" GET "$BASE/quizzes/$quizId/pending-evaluations" $null $teacherToken 200
        if ($pending -and $pending.Count -ge 1) {
            $script:pass++
            Write-Host "  PASS: Has pending evaluations" -ForegroundColor Green
            
            # Evaluate the answer
            $evalAnswer = $pending[0]
            $evalId = $evalAnswer.id
            if ($evalId) {
                Test-API "Evaluate answer" POST "$BASE/quizzes/evaluate/$evalId" @{
                    marks = 12; comment = "Good explanation"
                } $teacherToken 200
                
                # Invalid marks (over max)
                # Try evaluating already-evaluated (should still work as re-evaluation)
            }
        }
        
        # Export quiz JSON  
        Test-API "Export quiz JSON" GET "$BASE/quizzes/$quizId/export" $null $teacherToken 200
        
        # Export attempts CSV
        Test-API "Export attempts CSV" GET "$BASE/quizzes/$quizId/export/attempts" $null $teacherToken 200
        
        # Close quiz
        Test-API "Close quiz" POST "$BASE/quizzes/$quizId/close" $null $teacherToken 200
        
        # Can't close again
        Test-API "Close already closed (400)" POST "$BASE/quizzes/$quizId/close" $null $teacherToken 400
        
        # Student can't access closed quiz
        # Actually they should still see it I think... let me check
        
        # Student tries to submit on closed quiz
        # (already attempted, so 400 anyway)
        
        # Teacher: my quizzes
        Test-API "My quizzes" GET "$BASE/quizzes/my" $null $teacherToken 200
    }
    
    # Create second quiz for delete test
    $quiz2Data = @{
        title = "Delete Test Quiz $ts"
        description = "Will be deleted"
        category = "General"
        questions = @(@{
            text = "Test question"
            questionType = "MCQ"
            options = @("A", "B", "C", "D")
            correctOption = "A"
            marks = 5
        })
    }
    $quiz2 = Test-API "Create quiz for delete" POST "$BASE/quizzes" $quiz2Data $teacherToken 201
    if ($quiz2.id) {
        Test-API "Delete quiz" DELETE "$BASE/quizzes/$($quiz2.id)" $null $teacherToken 204
        Test-API "Get deleted quiz (404)" GET "$BASE/quizzes/$($quiz2.id)" $null $teacherToken 404
    }
}

# ── 5. CATEGORIES & TAGS ──
Write-Host "`n-- Categories & Tags --" -ForegroundColor Yellow
$cats = Test-API "Get categories" GET "$BASE/categories" $null $null 200
$tags = Test-API "Get tags" GET "$BASE/categories/tags" $null $null 200

# ── 6. PROFILE ──
Write-Host "`n-- Profile Endpoints --" -ForegroundColor Yellow
if ($student2Token) {
    $profile = Test-API "Get profile" GET "$BASE/profile" $null $student2Token 200
    
    Test-API "Update profile" PUT "$BASE/profile" @{
        name = "Updated QA Student"
        email = "updated_$ts@test.com"
    } $student2Token 200
    
    Test-API "Change password" POST "$BASE/profile/change-password" @{
        currentPassword = "Test@1234"
        newPassword = "NewTest@1234"
    } $student2Token 200
    
    # Login with new password
    Test-API "Login with new password" POST "$BASE/auth/login" @{
        username = "qastudent2_$ts"
        password = "NewTest@1234"
    } $null 200
    
    # Attempt history
    Test-API "Attempt history" GET "$BASE/profile/attempts" $null $student2Token 200
    Test-API "Paginated attempts" GET "$BASE/profile/attempts/paginated?page=0&size=10" $null $student2Token 200
}

# ── 7. DASHBOARD ──
Write-Host "`n-- Dashboard Endpoints --" -ForegroundColor Yellow
if ($teacherToken) {
    Test-API "Dashboard stats" GET "$BASE/dashboard/stats" $null $teacherToken 200
    Test-API "Dashboard quizzes" GET "$BASE/dashboard/quizzes?page=0&size=5" $null $teacherToken 200
    Test-API "Dashboard recent attempts" GET "$BASE/dashboard/recent-attempts?limit=5" $null $teacherToken 200
    
    if ($quizId) {
        Test-API "Dashboard quiz stats" GET "$BASE/dashboard/quizzes/$quizId/stats" $null $teacherToken 200
    }
    
    # Student can't access teacher dashboard
    Test-API "Student dashboard (403)" GET "$BASE/dashboard/stats" $null $student2Token 403
}

# ── 8. ADMIN OPERATIONS ──
Write-Host "`n-- Admin Quiz & Attempt Management --" -ForegroundColor Yellow
Test-API "Admin get quizzes" GET "$BASE/admin/quizzes?page=0&size=5" $null $adminToken 200
Test-API "Admin get attempts" GET "$BASE/admin/attempts?page=0&size=5" $null $adminToken 200

# ── 9. SECURITY EDGE CASES ──
Write-Host "`n-- Security Tests --" -ForegroundColor Yellow
Test-API "No token (401)" GET "$BASE/quizzes/my" $null $null 401
Test-API "Invalid token (401)" GET "$BASE/quizzes/my" $null "invalid.jwt.token" 401

# IDOR: Student tries to access another teacher's quiz management 
if ($quizId) {
    Test-API "Student view quiz students (403)" GET "$BASE/quizzes/$quizId/students" $null $student2Token 403
    Test-API "Student export quiz (403)" GET "$BASE/quizzes/$quizId/export" $null $student2Token 403
    Test-API "Student pending evals (403)" GET "$BASE/quizzes/$quizId/pending-evaluations" $null $student2Token 403
}

# Admin can access quiz by ID (admin access)
if ($quizId) {
    Test-API "Admin access quiz" GET "$BASE/quizzes/$quizId" $null $adminToken 200
}

# ── 10. EDGE CASES ──
Write-Host "`n-- Edge Cases --" -ForegroundColor Yellow
Test-API "Get nonexistent quiz" GET "$BASE/quizzes/99999" $null $adminToken 404
Test-API "Submit to nonexistent quiz" POST "$BASE/quizzes/99999/submit" @{ answers=@{}; timeTakenSeconds=10 } $student2Token 404

# Create quiz with no questions
if ($teacherToken) {
    Test-API "Quiz with no questions" POST "$BASE/quizzes" @{
        title="Empty Quiz"; category="General"; questions=@()
    } $teacherToken 400
    
    # Quiz with empty title
    Test-API "Quiz with empty title" POST "$BASE/quizzes" @{
        title=""; category="General"; questions=@(@{
            text="Q1"; questionType="MCQ"; options=@("A","B"); correctOption="A"; marks=5
        })
    } $teacherToken 400
}

# ── 11. CLEANUP ──
Write-Host "`n-- Cleanup --" -ForegroundColor Yellow
if ($student2Id) {
    Test-API "Delete test student2" DELETE "$BASE/admin/users/$student2Id" $null $adminToken 204
}
if ($studentId) {
    Test-API "Delete test teacher/student" DELETE "$BASE/admin/users/$studentId" $null $adminToken 204
}

# ── RESULTS ──
Write-Host "`n========== TEST RESULTS ==========" -ForegroundColor Cyan
Write-Host "PASSED: $pass" -ForegroundColor Green
Write-Host "FAILED: $fail" -ForegroundColor Red
Write-Host "WARNINGS: $warn" -ForegroundColor DarkYellow
Write-Host "TOTAL: $($pass + $fail)" -ForegroundColor White

if ($results.Count -gt 0) {
    Write-Host "`n-- Failures --" -ForegroundColor Red
    foreach ($r in $results) {
        Write-Host "  $r" -ForegroundColor Red
    }
}
