# 🚀 Cloud Isles Tactics 部署指南

## 已完成的準備工作 ✅

1. **專案建置設定**: 已驗證並可正常建置
2. **Supabase 配置**: 環境變數已設定
3. **資料庫遷移檔案**: 已創建 `supabase/migrations/20250816181230_initial_schema.sql`
4. **Vercel 配置**: 已創建 `vercel.json`

## 手動部署步驟

### 1. 部署資料庫結構

**在 Supabase 控制台執行：**

1. 前往你的專案控制台: https://supabase.com/dashboard/projects
2. 選擇專案 `ebqgjyrqtggkjlezqolh`
3. 點擊左側 **SQL Editor**
4. 點擊 **New query**
5. 複製 `supabase/migrations/20250816181230_initial_schema.sql` 內容
6. 貼上並點擊 **Run** 執行

### 2. 驗證資料庫結構

執行以下查詢驗證表格已創建：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

應該看到以下表格：
- cards
- characters  
- encounters
- runs
- leaderboard_daily

### 3. 部署前端應用

#### 選項 A: Vercel (推薦)

```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 登入 Vercel
vercel login

# 3. 在專案目錄部署
cd /mnt/c/Users/chuen/desktop/project/cardgame/apps/web
vercel

# 4. 設定環境變數
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_SERVICE_ROLE_KEY

# 5. 重新部署以使用環境變數
vercel --prod
```

#### 選項 B: Netlify

```bash
# 1. 安裝 Netlify CLI
npm i -g netlify-cli

# 2. 登入 Netlify
netlify login

# 3. 建置專案
npm run build

# 4. 部署
netlify deploy --dir=dist --prod

# 5. 在 Netlify 控制台設定環境變數
```

#### 選項 C: 手動上傳

1. 建置專案: `npm run build`
2. 上傳 `dist/` 目錄內容到任何靜態託管服務
3. 在託管服務設定環境變數
4. 確保配置 SPA 路由重寫

### 4. 測試部署

部署完成後，測試以下功能：

1. **首頁載入**: 確保應用正常載入
2. **角色選擇**: 能夠選擇角色
3. **遊戲運行**: 能夠開始遊戲
4. **排行榜**: 能夠查看排行榜
5. **分數提交**: 遊戲結束後能提交分數

### 5. 排除問題

#### 常見問題：

**1. 環境變數未生效**
- 確保變數名稱正確 (`VITE_` 前綴)
- 重新部署應用
- 檢查瀏覽器開發者工具的網路請求

**2. 資料庫連接失敗**
- 檢查 Supabase URL 是否正確
- 確認 API 金鑰有效
- 檢查 RLS 政策設定

**3. 404 錯誤**
- 確保配置了 SPA 路由重寫
- 檢查 `vercel.json` 配置

## 環境變數設定

在部署平台設定以下環境變數：

```
VITE_SUPABASE_URL=https://ebqgjyrqtggkjlezqolh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicWdqeXJxdGdna2psZXpxb2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzcyNzEsImV4cCI6MjA3MDkxMzI3MX0.gU2DdHWSvajXG902167GPCn0dbHy6lA7sl8t3ZRgl2w
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicWdqeXJxdGdna2psZXpxb2xoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMzNzI3MSwiZXhwIjoyMDcwOTEzMjcxfQ.omHKwQqKnWoLFFXODpSRmqDTMSroy1na2lRxbyL-Xsw
```

## 專案功能

- 🎮 卡牌戰術遊戲
- 👥 多角色系統
- 🏆 即時排行榜
- 📊 遊戲統計
- 📱 響應式設計

## 技術棧

- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **後端**: Supabase (PostgreSQL + Auth + Storage)
- **建置**: Vite
- **部署**: Vercel/Netlify

## 後續優化

1. **CDN 優化**: 配置 CDN 加速
2. **圖片優化**: 壓縮遊戲資源
3. **監控**: 設定錯誤監控
4. **分析**: 添加使用者分析
5. **PWA**: 轉換為漸進式 Web 應用

---

**部署完成後，你的遊戲將可以在全球訪問！** 🎉