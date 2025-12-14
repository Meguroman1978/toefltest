# 📺 YouTube TOEFLチャンネル解析計画

## 🎯 目的

指定されたTOEFLトップインストラクターのYouTubeチャンネルから、問題作成・解答・攻略法のノウハウを抽出し、AIが生成するTOEFL問題のクオリティを向上させる。

---

## 📋 対象チャンネル

| # | チャンネル名 | URL | 特徴 |
|---|-------------|-----|------|
| 1 | TST Prep | https://www.youtube.com/@TSTPrep/videos | TOEFL特化、戦略的アプローチ |
| 2 | LinguaTrip | https://www.youtube.com/@TOEFL_test_with_LinguaTrip/videos | ロシア語圏の人気チャンネル |
| 3 | English Proficiency Test Prep | https://www.youtube.com/@EnglishProficiencyTestprep/videos | 包括的なテスト対策 |
| 4 | TOEFL-IELTS-DET | https://www.youtube.com/@TOEFL-IELTS-DET/videos | 複数試験対応 |
| 5 | Andrian Permadi | https://www.youtube.com/@AndrianPermadi/videos | インドネシア語圏で人気 |
| 6 | Test Succeed | https://www.youtube.com/@testsucceed/videos | 実践的なテクニック |
| 7 | Walker Higher Education | https://www.youtube.com/@walkerhighereducation/videos | アカデミックアプローチ |
| 8 | 個別動画 | https://www.youtube.com/watch?v=q15K9ByEchw | 特定のトピック |

---

## 🔍 抽出する情報

### 1. Reading Section
- **Vocabulary問題の作り方**
  - 効果的な語彙選定（学術的、TPOレベル）
  - Distractorの作成方法（類義語、反義語、関連語）
  - 文脈の重要性（前後の文との関連）

- **Inference問題のパターン**
  - "suggest", "imply", "infer"の使い分け
  - 推論レベルの調整（直接的 vs 間接的）
  - 典型的な誤答選択肢の特徴

- **Insert Text問題**
  - 4つの■マーカーの配置位置（段落の論理的なポイント）
  - 正解位置の決定（接続詞、代名詞、論理的流れ）
  - 挿入文の特徴（接続詞、指示語、トピックセンテンス）

- **Prose Summary問題**
  - 6つの選択肢の作成方法（3正解、3誤答）
  - Main Ideaの抽出テクニック
  - 典型的な誤答パターン（細部情報、誤った因果関係、未言及事項）

### 2. Listening Section
- **自然な会話/講義の作成**
  - Fillers（"um", "well", "let me see"）の適切な配置
  - 話者の感情表現（驚き、疑問、確信）
  - Signal Words（"First", "However", "In other words"）の使用

- **質問タイプ別のポイント**
  - Main Idea: 冒頭と結論の重要性
  - Detail: 具体例とデータの扱い
  - Attitude: 話者の口調とニュアンス
  - Function: "Why does the professor say..."の作り方

### 3. Speaking Section
- **Independentタスク**
  - 効果的なプロンプト作成（意見、経験、選択）
  - 準備時間と回答時間の最適化
  - 評価基準（Delivery, Language Use, Topic Development）

- **Integratedタスク**
  - Reading + Listeningの組み合わせ方
  - Note-takingのポイント
  - パラフレーズの重要性

### 4. Writing Section
- **Integrated Task**
  - Reading-Listeningの対比構造
  - 効果的な要約テクニック
  - Word Count管理（150-225語）

- **Academic Discussion Task**
  - 学生の発言の作成（賛成vs反対）
  - 効果的な議論の展開方法
  - 評価基準（Development, Organization, Language Use）

### 5. 試験戦略・Tips
- **Time Management**
  - セクションごとの時間配分
  - 難問のスキップ戦略
  - 見直し時間の確保

- **Answer Elimination**
  - Extreme Words（always, never）の扱い
  - Out-of-Scope Answersの見分け方
  - Trap Answersの特徴

- **Note-taking**
  - 効果的な略記法
  - 構造的なメモの取り方
  - キーワード vs 文の書き取り

---

## 🛠️ 実装アプローチ

### Phase 1: 手動キュレーション（現在）
1. 各チャンネルから5-10本の代表的な動画を選定
2. 字幕（英語/自動生成）を取得
3. 主要なTips/戦略を手動で抽出
4. カテゴリ別に整理（Reading, Listening, Speaking, Writing）

### Phase 2: システムプロンプト統合
```typescript
const TOEFL_EXPERT_KNOWLEDGE = `
## Expert Strategies (Based on Top Instructors)

### Reading Section
**TST Prep - Vocabulary Questions**:
- Target word should be academic (Tier 2/3)
- Distractors: Use synonyms with wrong context fit
- Context clue should be within ±1 sentence

**LinguaTrip - Inference Questions**:
- Correct answer is never directly stated
- Look for "suggests", "implies", "indicates"
- Wrong answers: too extreme or out-of-scope

### Listening Section
**Test Succeed - Natural Speech Patterns**:
- Use fillers: "um", "well", "you know"
- Self-corrections: "I mean...", "or rather..."
- Emphasis words: "actually", "really", "definitely"

### Speaking Section
**Andrian Permadi - Response Structure**:
- 15 sec: State opinion + reason 1
- 30 sec: Develop reason 1 with example
- 45 sec: Add reason 2 (brief)

### Writing Section
**Walker Higher Education - Academic Discussion**:
- Start with clear stance: "I agree with [Student A] because..."
- Provide 2 supporting points with examples
- End with counterargument acknowledgment
`;
```

### Phase 3: 動的学習（将来）
- ユーザーの誤答パターンを分析
- 特定の弱点に特化した問題生成
- YouTubeから最新の動画を定期的に取り込み

---

## 📊 期待される効果

### 問題クオリティの向上
- ✅ より本番に近い語彙選定
- ✅ 効果的なDistractorの配置
- ✅ 自然な会話/講義の生成
- ✅ 実践的な戦略Tips

### ユーザー体験の向上
- ✅ 本番で使える具体的なテクニック
- ✅ 段階的な難易度調整
- ✅ 弱点に特化したトレーニング
- ✅ スコアアップの実感

---

## 🚀 次のステップ

### 短期（1-2週間）
1. [ ] 各チャンネルから5本ずつ代表動画を選定
2. [ ] 字幕データを取得・整理
3. [ ] カテゴリ別Tipsを手動でまとめる
4. [ ] System Promptに統合

### 中期（1-2ヶ月）
1. [ ] 動画の自動解析ツールを構築
2. [ ] Tips DBを作成（カテゴリ別、難易度別）
3. [ ] 問題生成時に動的にTipsを参照

### 長期（3-6ヶ月）
1. [ ] ユーザーフィードバックを収集
2. [ ] 機械学習モデルで問題クオリティを評価
3. [ ] 最新のTOEFLトレンドを自動追跡

---

## 📌 注意事項

### 著作権
- YouTubeの字幕データは**学習目的**のみ使用
- 動画内容を直接コピーせず、**戦略・テクニック**を抽出
- システムプロンプトに「Based on Top Instructors」と明記

### データ品質
- 自動生成字幕は誤りが多いため、主要部分は手動確認
- 複数のチャンネルから情報を統合し、バランスを取る
- 古い情報（TOEFL iBT 2019年以前）は除外

### プライバシー
- APIキーやユーザーデータとYouTubeデータを分離
- ログにYouTube URLやチャンネル名を記録しない

---

## 🔗 参考リンク

- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Google Gemini API - Video Understanding](https://ai.google.dev/gemini-api/docs/video-understanding)
- [ETS TOEFL iBT Official Guide](https://www.ets.org/toefl.html)

---

**This analysis will significantly improve the quality and authenticity of generated TOEFL content! 🎓✨**
