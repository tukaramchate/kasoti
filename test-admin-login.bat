@echo off
echo Testing Admin Login...
echo.

curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"

echo.
echo.
echo Testing SuperAdmin Login...
echo.

curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"superadmin\",\"password\":\"Admin@123\"}"

echo.
pause
