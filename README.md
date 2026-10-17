# ChunkFlow — 英文語塊切分與時態語態直覺訓練場

> **ChunkFlow (project-en)** 是一個專為建立英文時態、語態與句構直覺設計的高強度、鍵盤優先（Keyboard-First）互動訓練 Web 應用程式。
> 透過將句子切分為語法語塊（Syntactic Chunks），搭配兩階段主動詞鎖定（S-V Lock）、聽音辨識盲聽模式（Blind Listening Recognition）、約束交替出題（Constrained Alternation Shuffle）、漸進式視覺聚焦壓力（Focus Fade）與沉浸式語音朗讀，幫助學習者在極短時間內建立對句子主謂骨幹、時態（Tense）與語態（Voice）的瞬間直覺反應。

---

## 📖 核心語法速查矩陣 (Tense & Voice Matrix)

ChunkFlow 訓練的核心在於將英文句子的動詞形態迅速拆解為**時間（現在 / 過去 / 未來）**與**狀態 / 語態（簡單 / 完成 / 進行 / 被動）**：

| 狀態 (Aspect / Voice)             | 現在 (Present)             | 過去 (Past)                 | 未來 (Future)                          |
| --------------------------------- | -------------------------- | --------------------------- | -------------------------------------- |
| **簡單式 (Simple)**               | I work on this project     | I worked on this project    | I will work on this project            |
| **完成式 (Perfect)**              | I have finished my work    | I had finished my work      | I will have finished my work           |
| **進行式 (Continuous)**           | I am working               | I was working               | I will be working                      |
| **完成進行式 (Perfect Cont.)**    | I have been working        | I had been working          | I will have been working               |
| **簡單被動 (Simple Passive)**     | I am interviewed           | I was interviewed           | I will be interviewed                  |
| **完成被動 (Perfect Passive)**    | I have been interviewed    | I had been interviewed      | I will have been interviewed           |
| **進行被動 (Continuous Passive)** | I am **being** interviewed | I was **being** interviewed | _(極罕用，實務以 Simple Passive 取代)_ |

> [!TIP]
> **高階時態拓展：情態完成式 (Modal Perfect) 與假設語氣 (Unreal Past)**
>
> - **情態完成式 (`Modal + have + p.p.`)**：如 `should have / could have / would have / must have submitted`，語義錨定在**過去事實**的推測、歸責或遺憾，在 ChunkFlow 時間軸上一律歸類為 **過去 (Past)**，破除見到 `would` 誤判為未來的直覺盲點。
> - **條件假設語氣與倒裝 (Conditionals & Inversions)**：涵蓋真實條件句與非真實條件句（`If S had p.p., S would have p.p.`），以及省略 `If` 的高階商務倒裝（`Had the audit been completed...` / `Should you have questions...`），鎖定主句與從句各自的真動詞骨幹。

---

## 📚 豐富題庫矩陣 (Question Banks)

ChunkFlow 內建分類多層次的題庫系統，支援即時切換與獨立訓練單元鎖定：

### 1. TOEIC Part 5 文法句型題庫

專門針對新制多益 Part 5 短文填空與核心句構設計，總題數達 **330 題**：

- **Level 1 基礎句型 (S-V 緊鄰)**：共 **5 個訓練單元（150 題）**。短主詞與主要動詞緊鄰，精確平衡主被動與現在/過去/未來 6 種基本時態組合。
- **Level 2 中階句型 (介系詞隔離)**：共 **3 個訓練單元（90 題）**。主詞與動詞間穿插介系詞片語隔離修飾，解鎖完成式與進行式複雜結構。
- **Level 3 高階句型 (真假動詞、情態完成式與倒裝語氣)**：共 **3 個訓練單元（90 題）**：
  - **Unit 1 (真假動詞陷阱)**：強化分詞後位修飾（`-ing` / `-ed`）、關係子句與真假動詞（Finite vs. Non-finite Verbs）干擾陷阱判斷。
  - **Unit 2 (情態助動詞與 Modal Perfect)**：涵蓋 `should/could/would/must have + p.p.`（過去推測與未竟之憾）、情態被動式（`can/must be + p.p.`、`could have been + p.p.`）與推測語態。
  - **Unit 3 (條件假設語氣與倒裝句型)**：涵蓋真實條件句、非真實條件句（Counterfactual / Unreal Past）以及省略 `If` 的高階倒裝結構（`Had S p.p.`、`Should S V`、`Were S to V`）。

### 2. 核心精選與自訂題庫匯入 (Custom Import)

- **核心多益題庫 (Starter)**：ChunkFlow 精選 12 題經典句型。
- **自訂 JSON 題庫匯入**：支援學習者依規範格式自訂與匯入題目，資料全端本機儲存保護隱私。

---

## ✨ 核心特色 (Features)

### 1. 🧩 語法語塊切分與 S-V 階梯鎖定 (Syntactic Chunks & S-V Drill)

- 將句子結構拆解為主詞（Subject）、動詞核心槽位（Verb Target Slot）、受詞（Object）與介系詞/修飾片語。
- **兩階段作答機制**：
  1. 優先辨識並點選主詞語塊（S-V 緊鄰或分離鎖定）。
  2. 解鎖進入時態與語態分類階梯，徹底根治「主謂不分」與「憑感覺作答」的盲點。

### 2. 🔀 約束交替洗牌演算法 (Constrained Alternation Shuffle)

- 解決傳統題庫連續出現相同句型導致大腦產生「定勢效應（Pattern Anticipation）」的問題。
- **水線平衡出題 (Leveling Strategy)**：演算法動態監控各語法類別桶位，相鄰兩題保證語法分類互不碰撞（例如絕不連續兩題主動現在式）。
- **100% 單元覆蓋**：單元內 30 道題目在未全部輪過前絕不重複，確保知識點無死角。

### 3. ▦ 左側壓克力訓練矩陣抽屜 (Training Matrix Drawer)

- 點擊頂部漢堡選單即可滑出優雅半透明的訓練單元矩陣。
- **極簡二元完成狀態**：
  - 未完成一輪：暗色按鈕搭配 `text-zinc-500`。
  - 已完成一輪：高亮亮藍 `bg-cyan-400`。
- **無干擾靠左排版**：固定 36px × 36px 尺寸方塊，靠左自然對齊 (`justify-start`)，無外框雜訊。
- **智慧展開防護 Tooltip**：短題庫與頂部叢集自動向下展開 (`top-full mt-2`)，絕不遮擋頂部選擇器；長題庫底部智慧向上翻展。
- **單元鎖定 (Target Lock)**：點選任一單元即可鎖定該課專注練習，點擊解鎖即可恢復題庫循環。

### 4. 🔊 沉浸式語音朗讀、多國口音與聽音辨識模式 (Speech Narration & Blind Listening Mode)

- 整合 Web Speech API 原生語音合成引擎，題目出現時自動/點擊播放原生發音。
- **👁️ 聽音辨識盲聽模式 (Blind Listening Recognition Mode)**：
  - 點擊訓練場右上角靜音按鈕左側的**眼睛切換按鈕（聽音辨識）**，即可將作答中的句子語塊文字變為全透明（`text-transparent`）並隱藏色框提示，訓練純靠聽覺辨識文法結構。
  - **直入語態與時態分類**：開啟聽音辨識時，自動跳過點選主詞與動詞的步驟，讓學習者聽完句子後直接判斷並選擇**語態（Active / Passive）**與**時態（Present / Past / Future）**。
  - **自動解除靜音與作答後對照**：若在靜音狀態下開啟聽音辨識，系統會自動開啟語音朗誦並立即播放當前題目；完成作答進入解析（Feedback）畫面時自動恢復顯示完整句子文字與主謂標示以便對照檢討，進入下一題時再自動變回透明（開關狀態自動記憶於 `localStorage`）。
- **四國口音國旗切換**：支援澳洲 (🇦🇺 en-AU)、加拿大 (🇨🇦 en-CA)、英國 (🇬🇧 en-GB)、美國 (🇺🇸 en-US) 快速切換，切換時自動撥放各國口音特色金句試聽。
- **高相容性語音優選與防斷機制**：內建智慧評分排序、排除已知異常線上語音（如 Edge 多語串流合成器）、冷卻延遲防抖與自動離線/本機語音降級（Fallback）。
- **作答後語塊點擊朗讀 (Click-to-Pronounce)**：題目完成作答後，點擊任一語法語塊（Chunk）即可單獨朗讀該片語，方便強化弱點發音與斷句感。

### 5. ⌨️ 鍵盤優先極速操作 (Keyboard-First Flow)

- 雙手無需離開鍵盤，支援極致靈敏的快捷鍵操作，同時完美支援手機觸控：
  - **語態 (Voice)**：`A` 或 `J`（Active 主動） / `P` 或 `K`（Passive 被動）
  - **時態 (Tense)**：`1`（Present 現在） / `2`（Past 過去） / `3`（Future 未來）
  - **換題 (Advance)**：`Space` 或 `Enter` 進入下一題

### 6. 📊 即時 HUD 與弱點分析儀表板 (HUD & Analytics Dashboard)

- 頂部導覽列即時計算與顯示：
  - **Accuracy**（準確率 %）
  - **Avg Latency**（平均反應延遲 ms）
  - **Streak**（連續答對次數）
- 點擊「Analytics」開啟詳細分析面板，檢視各語態時態組合的答題歷程、答題總數與弱點分佈。
- 所有進度、設定與答題歷史均自動持久化儲存於瀏覽器 `localStorage`。

---

## ⌨️ 快捷鍵速查表 (Keyboard Shortcuts)

| 動作 / 選擇          | 快捷鍵                               | 說明                     |
| -------------------- | ------------------------------------ | ------------------------ |
| **主動 (Active)**    | <kbd>A</kbd> 或 <kbd>J</kbd>         | 設定答案為 Active        |
| **被動 (Passive)**   | <kbd>P</kbd> 或 <kbd>K</kbd>         | 設定答案為 Passive       |
| **現在式 (Present)** | <kbd>1</kbd>                         | 設定答案為 Present       |
| **過去式 (Past)**    | <kbd>2</kbd>                         | 設定答案為 Past          |
| **未來式 (Future)**  | <kbd>3</kbd>                         | 設定答案為 Future        |
| **下一題 (Next)**    | <kbd>Space</kbd> 或 <kbd>Enter</kbd> | 查看解析反饋後切換下一題 |

---

## 🛠️ 技術架構 (Tech Stack)

- **框架 (Framework)**: [React Router v7](https://reactrouter.com/) (SSR / SPA 雙模式支援)
- **核心庫 (Core)**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **樣式 (Styling)**: [Tailwind CSS v4](https://tailwindcss.com/)
- **構建工具 (Build Tool)**: [Vite 8](https://vite.dev/)
- **測試工具 (Testing)**: [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/)
- **方法論 (Methodology)**: [Spectra](https://github.com/kaochenlong/spectra-app) 規格驅動開發 (Spec-Driven Development)
- **資料儲存 (Data Storage)**: Browser `localStorage` (免後端、離線即練)

---

## 🚀 快速開始 (Getting Started)

### 安裝依賴

使用 `pnpm` 安裝相依套件：

```bash
pnpm install
```

### 啟動開發伺服器

```bash
pnpm run dev
```

開啟瀏覽器前往 `http://localhost:5173` 即可開始練習！

### 執行測試套件

```bash
# 執行所有 Vitest 單元測試與整合測試
pnpm test

# 檢查 TypeScript 型別編譯
pnpm run typecheck
```

### 生產環境打包與部署

```bash
# 建立生產環境打包版本
pnpm run build

# 啟動生產環境預覽伺服器
pnpm run start
```

---

## 📂 專案結構 (Project Structure)

```text
app/
├── components/chunkflow/         # 訓練場核心 UI 元件
│   ├── ChunkFlowArena.tsx        # 核心語塊展示與暗化聚焦區 (S-V 兩階段鎖定)
│   ├── ActionBar.tsx             # 語態與時態按鈕控制列
│   ├── HeaderHUD.tsx             # 頂部即時數據、設定與題庫/抽屜切換 HUD
│   ├── TrainingMatrixDrawer.tsx  # 左側壓克力抽屜 (題庫選擇器與 36px 訓練矩陣)
│   ├── TrainingMatrix.tsx        # 獨立矩陣展示元件
│   ├── AnalyticsDashboard.tsx    # 弱點分析與答題統計儀表板
│   ├── SettingsModal.tsx         # 語音朗讀與口音偏好設定視窗
│   └── ImportQuestionsModal.tsx  # 自訂 JSON 題庫匯入模態窗
├── data/
│   ├── toeic-part5/              # TOEIC Part 5 文法題庫
│   │   ├── level1/               # Level 1 (5 課訓練, 150 題)
│   │   ├── level2/               # Level 2 (3 課訓練, 90 題)
│   │   ├── level3/               # Level 3 (3 課訓練, 90 題)
│   │   └── index.ts              # 題庫整合與單元字典對照
│   ├── starterQuestions.ts       # 核心精選 12 題商務句型
│   └── banks.ts                  # 全域題庫登錄中心 (Bank Registry)
├── hooks/
│   ├── useChunkFlowGame.ts       # 遊戲循環、課綱推進、作答評估狀態邏輯
│   ├── useFocusFadeTimer.ts      # 1s 延遲 + 4s 漸變背景聚焦計時器
│   ├── useKeyboardShortcuts.ts   # 全域鍵盤快捷鍵監聽
│   └── useSpeechNarration.ts     # Web Speech API 語音朗讀控制
├── types/
│   └── chunkflow.ts              # 語塊、題目、題庫元數據、單元數據型別定義
├── utils/
│   ├── sampling.ts               # 約束交替洗牌 (Constrained Shuffle) 與抽題演算法
│   ├── curriculum.ts             # 漸進式課綱推薦邏輯 (Progressive Curriculum)
│   └── storage.ts                # LocalStorage 持久化與單元遙測統計運算
├── routes/
│   └── home.tsx                  # 主訓練場首頁路由
└── app.css                       # 全域 Tailwind CSS 樣式
```

---

## 📄 License

MIT License. Built with ❤️ for rapid English mastery.
