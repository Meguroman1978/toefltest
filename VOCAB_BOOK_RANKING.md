# 単語・熟語帳ランキング機能 📊

## 概要

単語・熟語帳に**スコアリングシステム**と**ランキング表示**が追加されました。間違えた回数と頻度に基づいて、最も注意すべき単語が自動的に上位に表示されます。

---

## 🎯 新機能

### 1. **間違い回数カウント**
- 同じ単語を複数回間違えると、カウントが自動的に増加
- `mistakes`フィールドで管理
- 最後に間違えた日時も記録（`lastMistake`）

### 2. **重要度スコア計算**
```typescript
スコア = 間違い回数 × (1 + 最近度係数 × 2)

最近度係数 = max(1, 30 - 経過日数) / 30
```

**例**:
- 5回間違え、3日前に最後の間違い: スコア ≈ **14.0**
- 2回間違え、20日前に最後の間違い: スコア ≈ **2.7**

**ポイント**:
- 間違い回数が多いほど高スコア
- 最近間違えたものほど高スコア（30日以内が影響大）

### 3. **ビジュアルランキング表示**
- **ランキングバッジ**: 右上に`#1`, `#2`, `#3`...と表示
- **プログレスバー**: 
  - 幅 = (間違い回数 ÷ 最大間違い回数) × 100%
  - グラデーション: 赤 → オレンジ → 黄色
- **スコア表示**: 「重要度スコア: 14.0」のように数値表示

---

## 📸 UI イメージ

```
┌─────────────────────────────────────────┐
│ 単語・熟語帳 📚                    × │
│ 間違えた単語・熟語の一覧               │
├─────────────────────────────────────────┤
│ 42 単語    [すべて] [最近20件] [削除]  │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────  #1   │
│  │ ambiguous                      ×    │
│  │ 曖昧な、不明確な                     │
│  │                                      │
│  │ 間違い回数: 5回  重要度スコア: 14.0  │
│  │ [████████████░░░░░░░░░░░]           │
│  │                                      │
│  │ 📝 例文: The instructions were...   │
│  │ 📅 2024-12-14                        │
│  └──────────────────────────────────────│
│                                          │
│  ┌──────────────────────────────  #2   │
│  │ plausible                      ×    │
│  │ もっともらしい、信じられる             │
│  │ 間違い回数: 3回  重要度スコア: 9.2   │
│  │ [████████░░░░░░░░░░░░░░░]           │
│  └──────────────────────────────────────│
└─────────────────────────────────────────┘
```

---

## 🔧 技術仕様

### データ構造 (`VocabItem`)
```typescript
interface VocabItem {
  word: string;           // 単語
  definition: string;     // 定義（正解の意味）
  example: string;        // 例文
  question: string;       // 出題された問題
  date: string;           // 最初に追加された日時
  mistakes: number;       // 間違えた回数（NEW）
  lastMistake: string;    // 最後に間違えた日時（NEW）
}
```

### 保存ロジック (`ResultScreen.tsx`)
```typescript
// 既存の単語を再度間違えた場合
if (existingIndex >= 0) {
  vocabBook[existingIndex].mistakes = (vocabBook[existingIndex].mistakes || 1) + 1;
  vocabBook[existingIndex].lastMistake = new Date().toISOString();
} else {
  // 新規の単語
  vocabBook.push({
    word: targetWord,
    definition: correctOption.text,
    example: q.relevantContext || '',
    question: q.prompt,
    date: new Date().toISOString(),
    mistakes: 1,
    lastMistake: new Date().toISOString()
  });
}
```

### ランキングソート (`VocabBookScreen.tsx`)
```typescript
const calculateScore = (item: VocabItem): number => {
  const daysSinceLastMistake = Math.max(
    1,
    Math.floor((Date.now() - new Date(item.lastMistake).getTime()) / (1000 * 60 * 60 * 24))
  );
  const recencyFactor = Math.max(1, 30 - daysSinceLastMistake) / 30;
  return item.mistakes * (1 + recencyFactor * 2);
};

const sortedList = [...vocabList].sort((a, b) => calculateScore(b) - calculateScore(a));
```

---

## 📚 使い方

### 1. **単語を間違える**
- Reading Test または Vocabulary Lesson で語彙問題を間違える
- 自動的に単語帳に保存される
- 既に保存されている単語なら、`mistakes`が+1される

### 2. **ランキング確認**
- ホーム画面の「単語・熟語帳」ボタンをクリック
- 重要度スコアの高い順に自動ソート
- バーの長さとスコアで視覚的に確認

### 3. **復習と管理**
- 上位の単語から優先的に復習
- 覚えた単語は個別に削除可能（×ボタン）
- すべて削除も可能（赤いボタン）

---

## 💡 学習効果

### メリット
1. **優先順位が明確**: 本当に苦手な単語が一目で分かる
2. **モチベーション向上**: スコアが下がることで成長を実感
3. **効率的な復習**: 頻出・苦手単語に集中できる

### 学習戦略
- **毎日チェック**: テスト後に必ずランキングを確認
- **上位3単語**: 毎日必ず復習する
- **例文暗記**: 例文と一緒に覚えると定着率UP
- **週次レビュー**: 週末にすべて削除してリセット、新鮮な気持ちで再開

---

## 🎨 デザイン特徴

- **グラデーションバー**: 赤→オレンジ→黄色（危険度を視覚化）
- **ゴールドバッジ**: ランキング番号を目立たせる
- **アニメーション**: バーの伸び縮みにトランジション効果
- **レスポンシブ**: モバイルでも快適に表示

---

## 🚀 今後の拡張案

- [ ] 週次/月次の統計グラフ
- [ ] CSV/JSONエクスポート機能
- [ ] Anki連携（フラッシュカード）
- [ ] 音声発音機能（TTS）
- [ ] 類義語・対義語の自動提案
- [ ] AIによる個別学習プラン生成

---

## 🔗 関連ドキュメント

- [FIXES_2025_12_14.md](./FIXES_2025_12_14.md) - 全体の修正内容
- [FINAL_DEPLOY.md](./FINAL_DEPLOY.md) - デプロイ手順
- [README.md](./README.md) - プロジェクト概要

---

**Enjoy your vocabulary ranking journey! 📖✨**
