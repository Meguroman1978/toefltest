# 🗺️ 実装ロードマップ

## 現在の実装状況（2024年12月14日）

### ✅ 完了済み機能

#### コア機能
- [x] Reading Test（TPO形式）
- [x] Listening Test（TTS音声、複数スピーカー対応）
- [x] Speaking Test（5つの問題タイプ、AI採点）
- [x] Writing Test（Integrated/Academic Discussion、AI採点）
- [x] Vocabulary Lesson（語彙特訓）

#### 学習支援機能
- [x] 単語・熟語帳（間違えた単語の自動保存）
- [x] 単語帳ランキング（間違い回数×最近度スコア）
- [x] Performance History（セクション別正解率）
- [x] AI Performance Coach（弱点分析）

#### 問題生成・管理
- [x] YouTube動画解析（Gemini API）
- [x] Knowledge Base構築・統合
- [x] 問題重複防止システム
- [x] トピックバラエティ管理
- [x] Diversity Score計算

#### UI/UX
- [x] HomeScreenツール順序変更
- [x] INSERT_TEXT問題のボタン化（実装済み）
- [x] 複数スピーカーTTS（Professor/Student）
- [x] Speaking問題タイプ別分析

---

## 🚧 実装予定機能

### Phase 1: ResultScreen改善（優先度: 🔴 高）

#### 目標
解答・解説画面を大幅に改善し、学習効果を最大化する。

#### 実装内容

##### 1. レイアウト変更
```
┌──────────────────┬──────────────────┐
│                  │                  │
│  左: 問題内容     │  右: 解答・解説   │
│                  │                  │
│  - パッセージ     │  - 正誤判定      │
│  - スクリプト     │  - 解説          │
│  - 音声再生       │  - Tips          │
│                  │  - 参考情報      │
│                  │                  │
└──────────────────┴──────────────────┘
```

##### 2. ハイライト機能
- 解説部分にマウスカーソルを合わせる
- 対応する問題内容の部分が自動ハイライト
- スクロール位置も自動調整

##### 3. セクション別実装

**Reading Result Screen**:
- 左: パッセージ全文（スクロール可能）
- 右: 各質問の解答・解説
- ハイライト: 問題の`relevantContext`を基にハイライト

**Listening Result Screen**:
- 左: スクリプト全文 + 音声再生ボタン
- 右: 各質問の解答・解説
- ハイライト: 解説に対応するスクリプト部分

**Speaking Result Screen**:
- 左: プロンプト + Reading/Listening内容
- 右: スコア、フィードバック、改善提案

**Writing Result Screen**:
- 左: Reading + Listening内容
- 右: 提出した Essay、スコア、フィードバック

#### 技術仕様
```typescript
interface EnhancedResultProps {
  passage: Passage | ListeningSet | SpeakingTask | WritingTask;
  answers: Record<string, string[]>;
  highlightedSegment?: string; // ハイライトするセグメント
  onSegmentHover?: (segment: string) => void; // ホバーイベント
}
```

#### ファイル構成
- `screens/EnhancedResultScreen.tsx` - 新規作成（統合版）
- `components/ContentPanel.tsx` - 左側パネル
- `components/AnswerPanel.tsx` - 右側パネル
- `hooks/useHighlight.ts` - ハイライトロジック

---

### Phase 2: [■]問題の確実な表示（優先度: 🔴 高）

#### 問題
現在、Gemini APIが[■]マーカーを生成しないケースがある。

#### 解決策

##### 1. システムプロンプトの強化
```typescript
const systemInstruction = `
  **CRITICAL: INSERT TEXT MARKER REQUIREMENT**
  
  For INSERT_TEXT questions, you MUST:
  1. Select ONE paragraph (recommend paragraph 2 or 3)
  2. Insert the marker [■] EXACTLY 4 times within that paragraph
  3. Place markers at logical positions (after topic sentence, before conclusion, etc.)
  4. Example:
     "The ancient city was built on a hill. [■] The strategic location provided...
      [■] Archaeological evidence suggests... [■] Moreover, recent excavations...
      [■] Thus, historians now believe..."
  
  **VERIFICATION**: Ensure your generated passage contains exactly 4 occurrences of [■]
`;
```

##### 2. ポストプロセッシング検証
```typescript
const validateInsertMarkers = (content: GeneratedContent): boolean => {
  const markerCount = content.paragraphs.join('').match(/■/g)?.length || 0;
  if (markerCount !== 4) {
    console.error(`Invalid marker count: ${markerCount}, expected 4`);
    return false;
  }
  return true;
};
```

##### 3. フォールバック生成
```typescript
if (!validateInsertMarkers(content)) {
  // 自動的に3段落目に[■]を挿入
  content.paragraphs[2] = autoInsertMarkers(content.paragraphs[2]);
}
```

---

### Phase 3: Full Test機能（優先度: 🟡 中）

#### 目標
4セクションを連続で実施し、総合スコアレポートを生成する。

#### 実装内容

##### 1. Full Test Mode
- `mode: 'FULL_TEST'`を追加
- Reading → Listening → Speaking → Writing の順で実施
- セクション間に休憩時間（オプション）

##### 2. スコアレポート生成
```typescript
interface ScoreReport {
  id: string;
  date: string;
  readingScore: number;      // 0-30
  listeningScore: number;    // 0-30
  speakingScore: number;     // 0-30
  writingScore: number;      // 0-30
  totalScore: number;        // 0-120
  
  sectionDetails: {
    reading: SectionDetail;
    listening: SectionDetail;
    speaking: SectionDetail;
    writing: SectionDetail;
  };
  
  aiAdvice: string;          // Gemini生成の総合アドバイス
  strengths: string[];       // 強み
  weaknesses: string[];      // 弱点
  nextSteps: string[];       // 次のステップ
}

interface SectionDetail {
  score: number;
  accuracy: number;          // 正答率
  categoryBreakdown: Record<string, number>; // カテゴリ別スコア
  timeManagement: string;    // 時間管理の評価
}
```

##### 3. スコアレポートUI
```
┌────────────────────────────────────────┐
│         TOEFL Score Report             │
│                                        │
│  Total Score: 95 / 120                 │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Reading    ████████░░  24/30     │ │
│  │ Listening  ███████░░░  22/30     │ │
│  │ Speaking   ██████████  27/30     │ │
│  │ Writing    ███████░░░  22/30     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  📊 Strengths:                         │
│  • Excellent speaking fluency          │
│  • Strong vocabulary usage             │
│                                        │
│  ⚠️ Areas for Improvement:             │
│  • Listening: Note-taking skills       │
│  • Writing: Essay organization         │
│                                        │
│  💡 Next Steps:                        │
│  • Practice Listening signal words     │
│  • Study essay templates               │
└────────────────────────────────────────┘
```

---

### Phase 4: 過去のスコアレポート管理（優先度: 🟡 中）

#### 実装内容

##### 1. スコアレポート履歴保存
```typescript
// localStorage: 'toefl_score_reports'
interface ScoreReportHistory {
  reports: ScoreReport[];
  lastUpdated: string;
}
```

##### 2. 推移グラフ
```typescript
// Chart.js または Recharts を使用
<LineChart data={reports}>
  <Line dataKey="readingScore" stroke="#4F46E5" />
  <Line dataKey="listeningScore" stroke="#06B6D4" />
  <Line dataKey="speakingScore" stroke="#F97316" />
  <Line dataKey="writingScore" stroke="#A855F7" />
</LineChart>
```

##### 3. AI推移分析
```typescript
const analyzeTrend = async (reports: ScoreReport[]): Promise<string> => {
  const prompt = `
    Analyze the following score progression and provide insights:
    ${JSON.stringify(reports, null, 2)}
    
    Identify:
    1. Which sections are improving/declining
    2. Possible reasons for changes
    3. Specific recommendations for continued improvement
  `;
  
  return await geminiAnalyze(prompt);
};
```

---

### Phase 5: Knowledge Baseバックエンド保存（優先度: 🟢 低）

#### 現状の課題
- localStorageのみ（ブラウザ依存）
- バージョン更新時にデータが消える可能性

#### 解決策

##### Option 1: Cloudflare KV（推奨）
```typescript
// Cloudflare Workers KVを使用
const KV_NAMESPACE = 'TOEFL_KB';

export const saveKnowledgeBase = async (kb: KnowledgeBase): Promise<void> => {
  await fetch('/api/kb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kb)
  });
};

export const loadKnowledgeBase = async (): Promise<KnowledgeBase | null> => {
  const response = await fetch('/api/kb');
  if (!response.ok) return null;
  return await response.json();
};
```

##### Option 2: Firebase/Supabase
- リアルタイムデータベース
- 認証機能（将来的にユーザーアカウント対応）

---

## 🎯 次回作業の優先順位

### 今すぐ実装すべき（本日中）
1. ✅ HomeScreen ツール順序変更（完了）
2. ⏳ [■]問題の確実な生成（システムプロンプト強化）
3. ⏳ ResultScreen改善（Reading用のプロトタイプ）

### 今週中に実装
4. Enhanced ResultScreen for Listening
5. Enhanced ResultScreen for Speaking/Writing
6. Full Test Mode（基本実装）

### 今月中に実装
7. スコアレポート生成
8. スコアレポート履歴管理
9. 2026年新形式の問題タイプ追加

---

## 📊 工数見積もり

| タスク | 見積もり時間 | 優先度 |
|-------|-------------|--------|
| [■]問題修正 | 30分 | 🔴 高 |
| ResultScreen改善（Reading） | 2時間 | 🔴 高 |
| ResultScreen改善（Listening） | 1.5時間 | 🔴 高 |
| ResultScreen改善（Speaking/Writing） | 2時間 | 🔴 高 |
| Full Test Mode | 3時間 | 🟡 中 |
| スコアレポート生成 | 2時間 | 🟡 中 |
| スコアレポート履歴 | 2時間 | 🟡 中 |
| KBバックエンド保存 | 4時間 | 🟢 低 |

**合計**: 約17時間

---

## 🔗 関連ドキュメント

- [TOEFL_2026_NEW_FORMAT.md](./TOEFL_2026_NEW_FORMAT.md) - 2026年新形式仕様
- [YOUTUBE_ANALYSIS_IMPLEMENTATION.md](./YOUTUBE_ANALYSIS_IMPLEMENTATION.md) - YouTube解析機能
- [DEPLOY_DECEMBER_2024.md](./DEPLOY_DECEMBER_2024.md) - デプロイガイド

---

**このロードマップは継続的に更新されます。**
