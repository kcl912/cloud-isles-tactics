# 雲嶼令 (Cloud Isles Tactics)

一款基於 Vue 3 的回合制卡牌遊戲，玩家需要運用策略與技巧，在雲端浮島上進行戰鬥。

## 技術架構

### 前端
- **Vue 3** - 響應式前端框架
- **TypeScript** - 類型安全的 JavaScript
- **Vite** - 現代化構建工具
- **Pinia** - 狀態管理
- **Vue Router** - 路由管理
- **Tailwind CSS** - 原子化 CSS 框架

### 後端
- **Supabase** - 後端即服務平台
- **PostgreSQL** - 關聯式資料庫
- **Edge Functions** - 無伺服器函數
- **Row Level Security** - 資料安全策略

## 快速開始

### 環境需求
- Node.js 18+ 
- npm 或 yarn
- Supabase 帳戶

### 一鍵啟動
```bash
./start.sh
```

### 手動設置

#### 1. 環境設置
```bash
cp apps/web/.env.example apps/web/.env
```

編輯 `.env` 文件：
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### 2. 資料庫設置
1. 在 Supabase 控制台執行 `supabase/sql/init.sql`
2. 部署 Edge Functions：
```bash
supabase functions deploy submit_run
```

#### 3. 本地開發
```bash
cd apps/web
npm install
npm run dev
```

瀏覽器訪問：http://localhost:5173

## 遊戲特色

### 🎮 核心玩法
- **策略性回合制戰鬥** - 運用卡牌組合制定戰術
- **多樣化角色系統** - 5 種職業，各具特殊能力
- **豐富的卡牌系統** - 攻擊、防禦、輔助、法術四大類型
- **智能 AI 敵人** - 4 種 AI 個性，提供不同挑戰

### 🏆 競技系統  
- **即時排行榜** - 每日更新的玩家排名
- **分數計算系統** - 基於表現的綜合評分
- **個人紀錄追蹤** - 完整的遊戲歷史記錄
- **安全分數驗證** - HMAC 簽名防止作弊

### 🎨 視覺體驗
- **現代化 UI 設計** - 半透明卡片與漸層背景
- **流暢動畫效果** - 卡牌懸停、出牌、戰鬥動畫
- **響應式佈局** - 完美適配桌面與行動裝置
- **直觀狀態顯示** - 清晰的生命值、能量、狀態效果

### 🔧 技術特色
- **Type-safe 開發** - 完整的 TypeScript 類型定義
- **狀態管理** - Pinia 驅動的響應式遊戲狀態
- **離線優先** - 客戶端遊戲邏輯，減少網路延遲
- **安全架構** - RLS 政策保護資料安全

## 專案結構

```
├── apps/web/                  # Vue 3 前端應用
│   ├── src/
│   │   ├── components/        # Vue 組件
│   │   ├── pages/            # 頁面組件
│   │   ├── stores/           # Pinia 狀態管理
│   │   ├── lib/              # 工具函數與客戶端程式庫
│   │   └── types/            # TypeScript 類型定義
├── supabase/
│   ├── sql/                  # 資料庫結構與初始資料
│   └── functions/            # Edge Functions
```

## 開發指令

```bash
# 開發模式
npm run dev

# 構建生產版本
npm run build

# 預覽生產版本
npm run preview

# 執行測試
npm run test

# 程式碼檢查
npm run lint

# 格式化程式碼
npm run format
```

## 授權條款

MIT License