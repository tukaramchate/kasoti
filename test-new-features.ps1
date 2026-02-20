$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"
$results = @()
$uid = (Get-Random -Minimum 10000 -Maximum 99999)

function Api {
  param([string]$label, [string]$method, [string]$path, $body, [string]$token)
  $headers = @{}
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $uri = "$baseUrl$path"
  try {
    $params = @{ Uri=$uri; Method=$method; UseBasicParsing=$true; Headers=$headers }
    if ($body) {
      $params["ContentType"] = "application/json; charset=utf-8"
      if ($body -isnot [string]) { $body = $body | ConvertTo-Json -Depth 10 -Compress }
      $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($body)
    }
    $r = Invoke-WebRequest @params
    $status = [int]$r.StatusCode
    $content = $r.Content
  } catch {
    $status = [int]$_.Exception.Response.StatusCode.value__
    try {
      $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
      $content = $sr.ReadToEnd(); $sr.Close()
    } catch { $content = "" }
  }
  $json = $null; try { $json = $content | ConvertFrom-Json } catch {}
  $color = if ($status -lt 400) {"Green"} elseif ($status -lt 500) {"Yellow"} else {"Red"}
  $short = if ($content.Length -gt 200) { $content.Substring(0,200) + "..." } else { $content }
  Write-Host "  $label => $status $short" -ForegroundColor $color
  $script:results += [PSCustomObject]@{API=$label; Status=$status}
  return @{Status=$status; Body=$content; JSON=$json}
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  NEW FEATURES TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ===== SETUP: Get tokens =====
Write-Host "`n--- SETUP ---" -ForegroundColor Magenta
$adm = (Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body '{"username":"admin","password":"Admin@123"}' -ContentType "application/json").token

# Register student
$stuReg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body "{`"username`":`"stu$uid`",`"email`":`"stu$uid@t.com`",`"password`":`"Test@1234`",`"role`":`"STUDENT`"}" -ContentType "application/json"
$stu = $stuReg.token
Write-Host "  Student registered: stu$uid (token $($stu.Length) chars)" -ForegroundColor Green

# Register future teacher
$tchReg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body "{`"username`":`"tch$uid`",`"email`":`"tch$uid@t.com`",`"password`":`"Test@1234`",`"role`":`"STUDENT`"}" -ContentType "application/json"
# Promote to teacher
$tchId = ($tchReg.user.id)
Invoke-RestMethod -Uri "$baseUrl/admin/users/$tchId/role" -Method PUT -Body '{"role":"TEACHER"}' -ContentType "application/json" -Headers @{Authorization="Bearer $adm"} | Out-Null
$tch = (Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body "{`"username`":`"tch$uid`",`"password`":`"Test@1234`"}" -ContentType "application/json").token
Write-Host "  Teacher promoted: tch$uid (token $($tch.Length) chars)" -ForegroundColor Green

# ===== 1. CATEGORIES & TAGS =====
Write-Host "`n--- 1. CATEGORIES & TAGS ---" -ForegroundColor Magenta
$r = Api "GET /categories" "GET" "/categories" $null $stu
$r = Api "GET /categories/tags" "GET" "/categories/tags" $null $stu

# ===== 2. CREATE QUIZ WITH ALL QUESTION TYPES =====
Write-Host "`n--- 2. CREATE MULTI-TYPE QUIZ ---" -ForegroundColor Magenta
$quizBody = @{
  title = "Multi-Type Quiz $uid"
  description = "Testing all 4 question types"
  category = "Science"
  difficulty = "MEDIUM"
  tags = "test,multi-type,science"
  timeLimitMinutes = 30
  passPercentage = 50
  negativeMarking = $false
  shuffleQuestions = $false
  shuffleOptions = $false
  questions = @(
    @{
      text = "MCQ: What is 2+2?"
      questionType = "MCQ"
      options = @("3", "4", "5", "6")
      correctOption = "4"
      marks = 2
    },
    @{
      text = "MSQ: Select all prime numbers"
      questionType = "MSQ"
      options = @("2", "3", "4", "5", "6")
      correctOptions = @("2", "3", "5")
      marks = 3
    },
    @{
      text = "TRUE_FALSE: The Earth is flat"
      questionType = "TRUE_FALSE"
      options = @("True", "False")
      correctOption = "False"
      marks = 1
    },
    @{
      text = "DESCRIPTIVE: Explain photosynthesis"
      questionType = "DESCRIPTIVE"
      modelAnswer = "Photosynthesis is the process by which plants convert sunlight into energy"
      marks = 5
    }
  )
}
$r = Api "POST create multi-type quiz" "POST" "/quizzes" $quizBody $tch
$quizId = $r.JSON.id
Write-Host "  -> Quiz ID: $quizId" -ForegroundColor DarkGray

# ===== 3. VALIDATE QUIZ CREATION =====
Write-Host "`n--- 3. VALIDATE QUIZ DETAILS ---" -ForegroundColor Magenta

# Get quiz as teacher (should see full details)
$r = Api "GET quiz (teacher view)" "GET" "/quizzes/my" $null $tch
$myQ = $r.JSON | Where-Object { $_.id -eq $quizId }
if ($myQ) {
  Write-Host "  -> Found in /my list. Questions: $($myQ.questions.Count)" -ForegroundColor DarkGray
}

# ===== 4. PUBLISH QUIZ =====
Write-Host "`n--- 4. PUBLISH QUIZ ---" -ForegroundColor Magenta
$r = Api "POST publish quiz" "POST" "/quizzes/$quizId/publish" $null $tch
$shareCode = $r.JSON.shareCode
Write-Host "  -> Share code: $shareCode" -ForegroundColor DarkGray

# ===== 5. GET QUIZ AS STUDENT =====
Write-Host "`n--- 5. STUDENT QUIZ VIEW ---" -ForegroundColor Magenta
$r = Api "GET quiz (student DTO)" "GET" "/quizzes/$quizId" $null $stu
$studentQuiz = $r.JSON
if ($studentQuiz.questions) {
  foreach ($q in $studentQuiz.questions) {
    $hasCorrect = if ($q.correctOption) { "LEAK!" } else { "OK-hidden" }
    Write-Host "    Q: $($q.text) | type=$($q.questionType) | opts=$($q.options.Count) | correct=$hasCorrect" -ForegroundColor DarkGray
  }
}

# ===== 6. QUESTION VALIDATION TESTS =====
Write-Host "`n--- 6. QUESTION VALIDATION ---" -ForegroundColor Magenta

# MCQ with wrong correctOption
$badMCQ = @{
  title="Bad MCQ $uid"; description="test"; category="General"
  questions=@(@{text="Q1"; questionType="MCQ"; options=@("A","B","C"); correctOption="D"; marks=1})
}
$r = Api "MCQ: correctOption not in options" "POST" "/quizzes" $badMCQ $tch

# MSQ with no correctOptions
$badMSQ = @{
  title="Bad MSQ $uid"; description="test"; category="General"
  questions=@(@{text="Q1"; questionType="MSQ"; options=@("A","B","C"); marks=1})
}
$r = Api "MSQ: missing correctOptions" "POST" "/quizzes" $badMSQ $tch

# MSQ with all options correct
$badMSQ2 = @{
  title="Bad MSQ2 $uid"; description="test"; category="General"
  questions=@(@{text="Q1"; questionType="MSQ"; options=@("A","B"); correctOptions=@("A","B"); marks=1})
}
$r = Api "MSQ: all options correct" "POST" "/quizzes" $badMSQ2 $tch

# TRUE_FALSE with wrong options
$badTF = @{
  title="Bad TF $uid"; description="test"; category="General"
  questions=@(@{text="Q1"; questionType="TRUE_FALSE"; options=@("Yes","No"); correctOption="Yes"; marks=1})
}
$r = Api "TRUE_FALSE: options not True/False" "POST" "/quizzes" $badTF $tch

# DESCRIPTIVE with options (should fail)
$badDesc = @{
  title="Bad DESC $uid"; description="test"; category="General"
  questions=@(@{text="Q1"; questionType="DESCRIPTIVE"; options=@("A","B"); marks=1})
}
$r = Api "DESCRIPTIVE: has options (should fail)" "POST" "/quizzes" $badDesc $tch

# DESCRIPTIVE valid
$goodDesc = @{
  title="Good DESC $uid"; description="test"; category="General"
  questions=@(@{text="Explain gravity"; questionType="DESCRIPTIVE"; modelAnswer="Force of attraction"; marks=5})
}
$r = Api "DESCRIPTIVE: valid (no options)" "POST" "/quizzes" $goodDesc $tch
if ($r.Status -eq 201) {
  # Clean up
  $descQid = $r.JSON.id
  try { Invoke-WebRequest -Uri "$baseUrl/quizzes/$descQid" -Method DELETE -Headers @{Authorization="Bearer $tch"} -UseBasicParsing | Out-Null }
  catch { Write-Host "  WARN: Delete draft quiz $descQid => 500" -ForegroundColor Red }
}

# ===== 7. SUBMIT QUIZ WITH ALL TYPES =====
Write-Host "`n--- 7. SUBMIT MULTI-TYPE QUIZ ---" -ForegroundColor Magenta

# Get question IDs from student view
$questions = $studentQuiz.questions
$mcqQ = $questions | Where-Object { $_.questionType -eq "MCQ" }
$msqQ = $questions | Where-Object { $_.questionType -eq "MSQ" }
$tfQ = $questions | Where-Object { $_.questionType -eq "TRUE_FALSE" }
$descQ = $questions | Where-Object { $_.questionType -eq "DESCRIPTIVE" }

Write-Host "  Questions: MCQ=$($mcqQ.id) MSQ=$($msqQ.id) TF=$($tfQ.id) DESC=$($descQ.id)" -ForegroundColor DarkGray

$submitBody = @{
  answers = @{}
  multiAnswers = @{}
  textAnswers = @{}
  timeTakenSeconds = 120
}

# MCQ answer (correct)
if ($mcqQ) { $submitBody.answers[$mcqQ.id.ToString()] = "4" }
# TRUE_FALSE answer (correct)
if ($tfQ) { $submitBody.answers[$tfQ.id.ToString()] = "False" }
# MSQ answer (partially correct - 2 out of 3)
if ($msqQ) { $submitBody.multiAnswers[$msqQ.id.ToString()] = @("2", "3") }
# DESCRIPTIVE answer
if ($descQ) { $submitBody.textAnswers[$descQ.id.ToString()] = "Photosynthesis is the biological process where plants use sunlight to produce glucose from carbon dioxide and water." }

$submitJson = $submitBody | ConvertTo-Json -Depth 5 -Compress
Write-Host "  Submit body: $submitJson" -ForegroundColor DarkGray
$r = Api "POST submit multi-type quiz" "POST" "/quizzes/$quizId/submit" $submitJson $stu

if ($r.JSON) {
  Write-Host "  -> Score: $($r.JSON.score)% | Correct: $($r.JSON.correctAnswers)/$($r.JSON.totalQuestions)" -ForegroundColor DarkGray
  Write-Host "  -> Marks: $($r.JSON.marksObtained)/$($r.JSON.totalMarks) | Passed: $($r.JSON.passed)" -ForegroundColor DarkGray
  if ($r.JSON.answers) {
    foreach ($a in $r.JSON.answers) {
      $evalSt = if ($a.evaluationStatus) { $a.evaluationStatus } else { "?" }
      Write-Host "    -> Q:$($a.questionId) type=$($a.questionType) correct=$($a.isCorrect) marks=$($a.marksObtained)/$($a.maxMarks) eval=$evalSt" -ForegroundColor DarkGray
    }
  }
}

# ===== 8. PENDING EVALUATIONS =====
Write-Host "`n--- 8. PENDING EVALUATIONS ---" -ForegroundColor Magenta
$r = Api "GET pending-evaluations" "GET" "/quizzes/$quizId/pending-evaluations" $null $tch

if ($r.JSON -and $r.JSON.Count -gt 0) {
  $pendingId = $r.JSON[0].id
  $maxMarks = $r.JSON[0].maxMarks
  Write-Host "  -> Pending answer ID: $pendingId, maxMarks: $maxMarks" -ForegroundColor DarkGray
  Write-Host "  -> Student answer: $($r.JSON[0].textAnswer)" -ForegroundColor DarkGray
  Write-Host "  -> Model answer: $($r.JSON[0].modelAnswer)" -ForegroundColor DarkGray

  # ===== 9. EVALUATE ANSWER =====
  Write-Host "`n--- 9. EVALUATE DESCRIPTIVE ANSWER ---" -ForegroundColor Magenta
  $evalBody = @{ marks = 4; comment = "Good explanation, but missing the role of chlorophyll" }
  $r = Api "PUT evaluate answer" "PUT" "/quizzes/answers/$pendingId/evaluate" $evalBody $tch

  if ($r.JSON) {
    Write-Host "  -> Evaluated: marks=$($r.JSON.marksObtained)/$($r.JSON.maxMarks) status=$($r.JSON.evaluationStatus)" -ForegroundColor DarkGray
  }

  # Verify no more pending
  $r = Api "GET pending (after eval)" "GET" "/quizzes/$quizId/pending-evaluations" $null $tch
  Write-Host "  -> Remaining pending: $($r.JSON.Count)" -ForegroundColor DarkGray

  # ===== 10. VERIFY SCORE UPDATE =====
  Write-Host "`n--- 10. VERIFY SCORE AFTER EVALUATION ---" -ForegroundColor Magenta
  $r = Api "GET leaderboard (after eval)" "GET" "/quizzes/$quizId/leaderboard" $null $stu
  if ($r.JSON -and $r.JSON.Count -gt 0) {
    Write-Host "  -> Updated score: $($r.JSON[0].score)% marks: $($r.JSON[0].marksObtained)/$($r.JSON[0].totalMarks)" -ForegroundColor DarkGray
  }

  # ===== 11. EVALUATION EDGE CASES =====
  Write-Host "`n--- 11. EVALUATION EDGE CASES ---" -ForegroundColor Magenta
  $r = Api "PUT eval: marks > max" "PUT" "/quizzes/answers/$pendingId/evaluate" @{marks=999;comment="too much"} $tch
  $r = Api "PUT eval: marks < 0" "PUT" "/quizzes/answers/$pendingId/evaluate" @{marks=-1;comment="negative"} $tch
  $r = Api "PUT eval: non-existent answer" "PUT" "/quizzes/answers/999999/evaluate" @{marks=1;comment=""} $tch

  # Student cannot evaluate
  $r = Api "PUT eval: student forbidden" "PUT" "/quizzes/answers/$pendingId/evaluate" @{marks=1;comment=""} $stu

} else {
  Write-Host "  WARN: No pending evaluations found from submit" -ForegroundColor Yellow
}

# ===== 12. FORGOT PASSWORD =====
Write-Host "`n--- 12. FORGOT PASSWORD ---" -ForegroundColor Magenta
$r = Api "POST forgot-password (valid email)" "POST" "/auth/forgot-password" @{email="stu$uid@t.com"} $null
$r = Api "POST forgot-password (unknown email)" "POST" "/auth/forgot-password" @{email="nobody@x.com"} $null
$r = Api "POST forgot-password (empty)" "POST" "/auth/forgot-password" @{email=""} $null

# Reset with bad token
$r = Api "POST reset-password (bad token)" "POST" "/auth/reset-password" @{token="badtoken123";newPassword="NewPass@1234"} $null

# ===== 13. TAGS FILTERING =====
Write-Host "`n--- 13. TAGS FILTERING ---" -ForegroundColor Magenta
$r = Api "GET quizzes with tag filter" "GET" "/quizzes?tags=test" $null $stu
Write-Host "  -> Results: $($r.JSON.content.Count) quizzes with tag 'test'" -ForegroundColor DarkGray
$r = Api "GET quizzes with nonexistent tag" "GET" "/quizzes?tags=nonexistent$uid" $null $stu
Write-Host "  -> Results: $($r.JSON.content.Count) quizzes with nonexistent tag" -ForegroundColor DarkGray

# ===== 14. QUIZ DETAIL - QUESTION TYPES IN QuestionDTO =====
Write-Host "`n--- 14. QuestionDTO FIELD VALIDATION ---" -ForegroundColor Magenta
$r = Api "GET quiz DTO fields" "GET" "/quizzes/$quizId" $null $stu
if ($r.JSON.questions) {
  $q1 = $r.JSON.questions[0]
  $hasType = $null -ne $q1.questionType
  $hasMarks = $null -ne $q1.marks
  Write-Host "  -> questionType present: $hasType" -ForegroundColor $(if($hasType){"Green"}else{"Red"})
  Write-Host "  -> marks present: $hasMarks" -ForegroundColor $(if($hasMarks){"Green"}else{"Red"})
  $hasCorrect = $null -ne $q1.correctOption
  Write-Host "  -> correctOption hidden: $(!$hasCorrect)" -ForegroundColor $(if(!$hasCorrect){"Green"}else{"Red"})
}

# ===== 15. QuizDTO EXTENDED FIELDS =====
Write-Host "`n--- 15. QuizDTO EXTENDED FIELDS ---" -ForegroundColor Magenta
$quiz = $r.JSON
$fields = @("id","title","description","difficulty","tags","shareCode","timeLimitMinutes","passPercentage","totalMarks")
foreach ($f in $fields) {
  $val = $quiz.$f
  $present = $null -ne $val
  Write-Host "  -> $f : $(if($present){$val}else{'MISSING'})" -ForegroundColor $(if($present){"Green"}else{"Yellow"})
}

# ===== 16. REGISTER AUTO-LOGIN =====
Write-Host "`n--- 16. REGISTER AUTO-LOGIN ---" -ForegroundColor Magenta
$uid2 = Get-Random -Minimum 10000 -Maximum 99999
$regBody = @{name="Auto Test"; username="auto$uid2"; email="auto$uid2@t.com"; password="Test@1234"; role="STUDENT"}
$r = Api "POST register (auto-login)" "POST" "/auth/register" $regBody $null
if ($r.JSON.token) {
  Write-Host "  -> Token returned: YES (auto-login works)" -ForegroundColor Green
  Write-Host "  -> User: $($r.JSON.user.username) role=$($r.JSON.user.role)" -ForegroundColor DarkGray
} else {
  Write-Host "  -> Token returned: NO (no auto-login)" -ForegroundColor Yellow
}

# ===== 17. LOGIN REDIRECT =====
Write-Host "`n--- 17. LOGIN REDIRECT (frontend feature, API unaffected) ---" -ForegroundColor Magenta
Write-Host "  -> Login now supports ?redirect= param (frontend-only)" -ForegroundColor DarkGray

# ===== 18. SHARE QUIZ REDIRECT =====
Write-Host "`n--- 18. SHARE QUIZ ---" -ForegroundColor Magenta
$r = Api "GET share code" "GET" "/quizzes/share/$shareCode" $null $null
Write-Host "  -> Quiz title: $($r.JSON.title)" -ForegroundColor DarkGray

# ===== CLEANUP =====
Write-Host "`n--- CLEANUP ---" -ForegroundColor Magenta
Api "POST close quiz" "POST" "/quizzes/$quizId/close" $null $tch | Out-Null
Api "DELETE quiz" "DELETE" "/quizzes/$quizId" $null $tch | Out-Null

# ===== RESULTS =====
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$total = $results.Count
$ok = ($results | Where-Object { $_.Status -lt 400 }).Count
$clientErr = ($results | Where-Object { $_.Status -ge 400 -and $_.Status -lt 500 }).Count
$serverErr = ($results | Where-Object { $_.Status -ge 500 }).Count

Write-Host "  Total: $total | 2xx: $ok | 4xx: $clientErr | 5xx: $serverErr" -ForegroundColor $(if($serverErr -gt 0){"Red"}else{"Green"})

if ($serverErr -gt 0) {
  Write-Host "`n  SERVER ERRORS:" -ForegroundColor Red
  $results | Where-Object { $_.Status -ge 500 } | ForEach-Object { Write-Host "    $($_.API) => $($_.Status)" -ForegroundColor Red }
}

# Expected 4xx results
$expected4xx = @(
  "MCQ: correctOption not in options",
  "MSQ: missing correctOptions",
  "MSQ: all options correct",
  "TRUE_FALSE: options not True/False",
  "DESCRIPTIVE: has options (should fail)",
  "PUT eval: marks > max",
  "PUT eval: marks < 0",
  "PUT eval: non-existent answer",
  "PUT eval: student forbidden",
  "POST forgot-password (empty)",
  "POST reset-password (bad token)"
)
$unexpected4xx = $results | Where-Object { $_.Status -ge 400 -and $_.Status -lt 500 -and $_.API -notin $expected4xx }
if ($unexpected4xx.Count -gt 0) {
  Write-Host "`n  UNEXPECTED CLIENT ERRORS:" -ForegroundColor Yellow
  $unexpected4xx | ForEach-Object { Write-Host "    $($_.API) => $($_.Status)" -ForegroundColor Yellow }
}

Write-Host ""
