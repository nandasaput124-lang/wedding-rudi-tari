@echo off
title Membuka Undangan Online Rudi & Tari
echo ========================================================
echo   MEMBUKA UNDANGAN ONLINE 3D KARTUN - RUDI & TARI
echo ========================================================
echo.
echo Sedang menyiapkan server lokal...
start "" "http://localhost:8000?to=Budi+Santoso"
python -m http.server 8000
pause
