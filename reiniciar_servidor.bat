@echo off
echo ==========================================
echo    REINICIANDO SERVIDOR SMART CARTAO
echo ==========================================
echo.
echo [1/3] Limpando processos antigos (Node, TSX, Vite)...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM tsx.exe /T >nul 2>&1
echo Portas liberadas.
echo.
echo [2/3] Limpando cache do Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache limpo com sucesso.
)
echo.
echo [3/3] Iniciando o servidor...
echo.
npm run dev
pause
