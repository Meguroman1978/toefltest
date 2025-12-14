# TOEFL iBT 2026年1月新形式対応

## 📋 新形式の概要

### 主な変更点
1. **アダプティブ方式**: Reading と Listening が2段階のアダプティブ方式に
2. **問題形式の変更**: 各セクションで新しいタスクタイプが導入
3. **試験時間の短縮**: 合計約90分（従来の約半分）
4. **問題数の変化**: より効率的な測定

---

## 📖 Reading Section（最大30分）

### 問題形式（3種類）
1. **Complete the Words** 🆕
   - 単語を完成させる問題
   - 文脈から適切な単語を推測

2. **Read in Daily Life** 🆕
   - 日常生活の文章読解
   - メール、お知らせ、広告など

3. **Read an Academic Passage**
   - 学術的な文章読解（従来型）
   - 選択肢から選ぶ問題

### 仕様
- **問題数**: 最大50問
- **アダプティブ方式**: 
  - Module 1の正答率に応じてModule 2の難易度が変化
  - Upper（難しめ）/ Lower（易しめ）
- **採点されない問題**: 含まれる可能性あり

---

## 🎧 Listening Section（最大29分）

### 問題形式（4種類）
1. **Listen to a Conversation**
   - キャンパスでの会話
   
2. **Listen to a Lecture**
   - 大学の授業

3. **Listen in Daily Life** 🆕
   - 日常会話のリスニング

4. **その他のタスク**
   - 詳細は公式サイト参照

### 仕様
- **問題数**: 最大47問
- **アダプティブ方式**: Reading同様
- **音声**: 1度のみ再生
- **スクリプト**: 画面に表示されない（問題文を除く）
- **アクセント**: 北米、イギリス、オーストラリア、ニュージーランド

---

## ✍️ Writing Section（最大23分）

### 問題形式（3種類）
1. **Build a Sentence** 🆕
   - 単語を並び替えて文を作成
   - 文法力を測定

2. **Write an Email** 🆕
   - メール形式の文章作成
   - 実用的なライティング

3. **Write for an Academic Discussion**
   - 学術的な議論への参加（従来型）

### 仕様
- **問題数**: 最大12問
- **採点基準**: [Writing Scoring Guides](https://www.ets.org/pdfs/toefl/writing-rubrics.pdf)

---

## 🗣️ Speaking Section（最大8分）

### 問題形式（2種類）
1. **Listen and Repeat** 🆕
   - 聞いた内容を再現
   - 基礎的スキル測定（流暢性、明瞭性）

2. **Take an Interview** 🆕
   - 模擬インタビュー
   - 意見や経験について話す
   - コミュニケーション能力測定

### 仕様
- **問題数**: 最大11問
- **採点基準**: [Speaking Scoring Guides](https://www.ets.org/pdfs/toefl/speaking-rubrics.pdf)

---

## 📊 スコアレポート

### スコア範囲
- **各セクション**: 0-30点
- **総合スコア**: 0-120点

### レポート内容
1. **セクション別スコア**: Reading, Listening, Writing, Speaking
2. **詳細分析**: 各タスクタイプごとの評価
3. **強み・弱点**: セクション別の傾向
4. **改善提案**: 次回に向けたアドバイス

---

## 🔄 アダプティブ方式の仕組み

### Module構成
```
┌─────────────┐
│  Module 1   │ → 全タスク出題
│  (基準)     │    正答率を測定
└─────────────┘
      ↓
   正答率判定
      ↓
┌─────────────┐
│  Module 2   │
│ Upper/Lower │ → 難易度調整
└─────────────┘
```

### 難易度分岐
- **Upper（難しめ）**: Module 1で高得点の場合
- **Lower（易しめ）**: Module 1で低得点の場合

---

## 🎯 実装計画

### Phase 1: 新問題形式の実装
- [ ] Reading: Complete the Words
- [ ] Reading: Read in Daily Life
- [ ] Listening: Listen in Daily Life
- [ ] Writing: Build a Sentence
- [ ] Writing: Write an Email
- [ ] Speaking: Listen and Repeat
- [ ] Speaking: Take an Interview

### Phase 2: アダプティブ方式
- [ ] Module 1/2の分離
- [ ] 正答率ベースの難易度調整
- [ ] Upper/Lowerコンテンツ生成

### Phase 3: スコアレポート
- [ ] 新形式スコア計算
- [ ] 詳細分析レポート生成
- [ ] 履歴管理と推移表示
- [ ] AIアドバイス機能

### Phase 4: Full Test機能
- [ ] 4セクション連続実施
- [ ] 自動スコアレポート生成
- [ ] 休憩時間管理

---

## 📅 リリース予定
- **2026年1月21日**: 新形式TOEFL開始
- **それ以前**: 現行形式と新形式の選択可能

---

## 🔗 参考リンク
- [TOEFL iBT 2026年1月変更点](https://www.toefl-ibt.jp/test_takers/toefl_ibt/202601/)
- [Writing Scoring Guides](https://www.ets.org/pdfs/toefl/writing-rubrics.pdf)
- [Speaking Scoring Guides](https://www.ets.org/pdfs/toefl/speaking-rubrics.pdf)
