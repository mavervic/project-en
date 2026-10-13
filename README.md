# ChunkFlow — 英文語塊切分與時態語態直覺訓練場

> **ChunkFlow (project-en)** 是一個專為建立英文時態、語態與句構直覺設計的高強度、鍵盤優先（Keyboard-First）互動訓練 Web 應用程式。
> 透過將句子切分為語法語塊（Syntactic Chunks），搭配漸進式視覺聚焦壓力（Focus Fade）與弱點加權推題演算法，幫助學習者在高壓極短時間內建立對句子核心動詞「時態（Tense）」與「語態（Voice）」的即時直覺反應。

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

---

## ✨ 核心特色 (Features)

### 1. 🧩 語法語塊切分 (Syntactic Chunk Parsing)

- 每道題目將句子精準切分為主詞（Subject）、動詞核心槽位（Verb Target Slot）、受詞（Object）與修飾子句/介系詞片語（Clause / Modifier）。
- 讓學習者跳脫逐字翻譯的思考慣性，一眼抓住英文句子的骨幹與主被動關係。

### 2. ⏳ 漸進式視覺聚焦壓力 (Progressive Focus Fade)

- 題目載入後維持 1 秒清晰視野，隨後展開 4 秒的背景漸暗轉場。
- 強迫大腦在視覺對比度完全消退為深黑前，快速辨識出目標槽位的動詞時態與語態，模擬考試與實戰對話中的瞬間語感反應。

### 3. ⌨️ 鍵盤優先極速操作 (Keyboard-First Flow)

- 雙手無需離開鍵盤，支援靈敏的快捷鍵操作，同時也支援滑鼠與觸控點擊：
  - **語態 (Voice)**：`A` 或 `J`（Active 主動） / `P` 或 `K`（Passive 被動）
  - **時態 (Tense)**：`1`（Present 現在） / `2`（Past 過去） / `3`（Future 未來）
  - **換題 (Advance)**：`Space` 或 `Enter` 進入下一題

### 4. 🧠 弱點加權智能推題 (Adaptive Weakness Sampling)

- 提供 **Smart Mode（智能弱點優先）** 與 **Random Mode（隨機推題）**：
  - 智能模式會動態追蹤使用者在各類別（例如 `past-passive`、`present-active` 等）的答對率與平均延遲時間（ms）。
  - 對答錯率高或猶豫時間長的弱點語法類型自動提高抽題權重，進行針對性的刻意練習。

### 5. 📊 即時 HUD 與數據分析儀表板 (Real-time HUD & Analytics Dashboard)

- 頂部導覽列即時計算與顯示：
  - **Accuracy**（準確率 %）
  - **Avg Latency**（平均反應延遲 ms）
  - **Streak**（連續答對次數）
- 點擊「Analytics」可開啟詳細分析面板，檢視各語態時態組合的答題歷程、答題總數與表現分佈。
- 所有進度與答題記錄均自動持久化儲存於瀏覽器 `localStorage`。

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
- **資料儲存 (Data Storage)**: Browser `localStorage` (免後端、即開即練)

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

### 型別檢查與編譯

```bash
# 檢查 TypeScript 型別
pnpm run typecheck

# 建立生產環境打包版本
pnpm run build

# 啟動生產環境預覽伺服器
pnpm run start
```

---

## 📂 專案結構 (Project Structure)

```text
app/
├── components/chunkflow/       # 訓練場核心 UI 元件
│   ├── ChunkFlowArena.tsx      # 核心語塊展示與暗化聚焦區
│   ├── ActionBar.tsx           # 語態與時態按鈕控制列
│   ├── HeaderHUD.tsx           # 頂部即時數據與狀態 HUD
│   └── AnalyticsDashboard.tsx  # 弱點分析與答題統計儀表板
├── data/
│   └── starterQuestions.ts     # 精選商務/TOEIC 情境語塊題庫
├── hooks/
│   ├── useChunkFlowGame.ts     # 遊戲循環、作答評估與弱點更新狀態邏輯
│   ├── useFocusFadeTimer.ts    # 1s 延遲 + 4s 漸變背景聚焦計時器
│   └── useKeyboardShortcuts.ts # 全域鍵盤快捷鍵監聽
├── types/
│   └── chunkflow.ts            # 語塊、題目、統計數據之型別定義
├── utils/
│   ├── sampling.ts             # 弱點加權與隨機推題演算法
│   └── storage.ts              # LocalStorage 持久化輔助函式
├── routes/
│   └── home.tsx                # 主訓練場頁面路由
└── app.css                     # 全域 Tailwind CSS 樣式
```

---

## 📄 License

MIT License. Built with ❤️ for rapid English mastery.
