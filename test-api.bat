@echo off
echo Testing Module 11 Backend...
echo.
echo Health Check:
curl http://localhost:5000/health
echo.
echo.
echo Leaderboard:
curl http://localhost:5000/api/leaderboard?period=all
echo.
echo.
echo Trust Score for u001:
curl http://localhost:5000/api/user/u001/trust-score
echo.
echo Done!
pause