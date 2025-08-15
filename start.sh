#!/bin/bash

echo "🎮 雲嶼令 (Cloud Isles Tactics) - 啟動腳本"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ 請在項目根目錄執行此腳本"
    exit 1
fi

# Navigate to web app directory
cd apps/web

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴中..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依賴安裝失敗"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件"
    echo "📋 正在複製 .env.example 到 .env"
    cp .env.example .env
    echo ""
    echo "🔧 請編輯 .env 文件並設置您的 Supabase 配置："
    echo "   VITE_SUPABASE_URL=your_supabase_project_url"
    echo "   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key"
    echo ""
    echo "⏸️  請設置完成後重新運行此腳本"
    exit 0
fi

echo "🚀 啟動開發服務器..."
echo "🌐 應用將在 http://localhost:5173 運行"
echo "⭐ 按 Ctrl+C 停止服務器"
echo ""

npm run dev