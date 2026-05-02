@echo off
echo ========================================
echo Testing Module 11 - Gamification API
echo ========================================
echo.

echo [1] Testing Health Check...
curl -X GET http://localhost:5000/health
echo.
echo.

echo [2] Testing Leaderboard (All Time)...
curl -X GET "http://localhost:5000/api/leaderboard?period=all"
echo.
echo.

echo [3] Testing Leaderboard (Weekly)...
curl -X GET "http://localhost:5000/api/leaderboard?period=weekly"
echo.
echo.

echo [4] Testing Trust Score for user u001...
curl -X GET http://localhost:5000/api/user/1/trust-score
echo.
echo.

echo [5] Testing Notifications for user u001...
curl -X GET http://localhost:5000/api/notifications/1
echo.
echo.

echo ========================================
echo Testing NEW Onboarding Endpoints
echo ========================================
echo.

echo [6] Testing Onboarding Step Completion (ABOUT)...
curl -X POST http://localhost:5000/api/gamification/onboarding/complete-step -H "Content-Type: application/json" -H "x-user-id: 1" -d "{\"stepCode\":\"ABOUT\",\"stepData\":{\"viewed\":true}}"
echo.
echo.

echo [7] Testing Role Selection (Freelancer)...
curl -X POST http://localhost:5000/api/gamification/onboarding/select-role -H "Content-Type: application/json" -H "x-user-id: 1" -d "{\"role\":\"freelancer\"}"
echo.
echo.

echo [8] Testing Get Onboarding Progress...
curl -X GET http://localhost:5000/api/gamification/onboarding/1/progress -H "x-user-id: 1"
echo.
echo.

echo [9] Testing Points Award (for testing)...
curl -X POST http://localhost:5000/api/gamification/points/award -H "Content-Type: application/json" -H "x-user-id: 1" -d "{\"user_id\":1,\"action_type\":\"test_action\",\"points\":50}"
echo.
echo.

echo ========================================
echo Tests Completed!
echo ========================================
pause