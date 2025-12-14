# 🚀 完全デプロイガイド（2024年12月版）

## 📋 実装済み機能まとめ

### ✅ 修正済みバグ
1. **INSERT_TEXT マーカー表示バグ** - 逆転していた表示ロジックを修正
2. **語彙・熟語特訓モードのReference Text** - 不要なセクションを非表示
3. **Listeningテスト結果** - 詳細な解説表示機能を追加
4. **Writingテストの音声ボタン** - 音声が存在しない時は非表示に

### 🆕 新機能
1. **単語・熟語帳システム** - 間違えた語彙を自動保存
2. **間違い回数カウント** - 同じ単語を複数回間違えた場合の追跡
3. **スコアリングシステム** - 間違い回数×最近度で重要度を計算
4. **ランキング表示** - 最も重要な単語が上位に自動ソート
5. **ビジュアルプログレスバー** - 間違い回数をグラデーションで表示

---

## 🔐 API Key設定（重要）

### セキュリティ警告
⚠️ **API Keyはブラウザから見える状態で埋め込まれます**

### 必須対策: Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. **APIs & Services** > **Credentials** に移動
3. 使用しているAPI Keyをクリック
4. **Application restrictions** で **HTTP referrers** を選択
5. 以下を追加:
   ```
   https://toefltest.fly.dev/*
   ```
6. **Save**をクリック

これにより、指定したドメイン以外からのAPI呼び出しがブロックされます。

---

## 📦 デプロイ手順（完全版）

### 前提条件
- Fly.ioアカウント（[https://fly.io/](https://fly.io/)）
- Fly CLI インストール済み
- Git インストール済み

### Step 1: 最新コードを取得
```bash
cd ~/toefltest  # プロジェクトディレクトリに移動
git pull origin main
```

### Step 2: 環境変数を設定
```bash
export GEMINI_API_KEY="あなたのAPIキー"
```

**確認**:
```bash
echo $GEMINI_API_KEY  # キーが表示されることを確認
```

### Step 3: Fly.ioにログイン
```bash
flyctl auth login
```

ブラウザが開き、認証ページが表示されます。

### Step 4: デプロイ実行
```bash
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY
```

**予想される出力**:
```
==> Building image
--> Building Dockerfile
...
--> Pushing image done
==> Deploying
--> Deployment successful
```

デプロイには**2-3分**かかります。

### Step 5: デプロイ確認
```bash
flyctl status
```

**期待される出力**:
```
App
  Name     = toefltest
  Owner    = personal
  Hostname = toefltest.fly.dev
  Image    = registry.fly.io/toefltest:deployment-XXXXX
  Platform = machines

Machines
NAME    STATE   REGION  ...
xxxxx   started nrt     ...
```

---

## 🌐 動作確認

### 1. ブラウザでアクセス
```
https://toefltest.fly.dev/
```

### 2. キャッシュクリア
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- または**シークレットモード**でアクセス

### 3. 動作チェックリスト

#### ホーム画面
- [ ] サイドバーが表示される
- [ ] 「Reading Test」「Listening Test」「Speaking Test」「Writing Test」「語彙・熟語特訓」ボタンが表示
- [ ] 「単語・熟語帳」ボタンが表示（新機能）
- [ ] トピック選択ドロップダウンが機能

#### Reading Test
- [ ] トピック選択後、「Start Test」でテストが開始
- [ ] パッセージと質問が表示
- [ ] **INSERT_TEXT問題**で[■]マーカーが**正しく**表示（問題文が「Look at the four squares」で始まる場合のみ）
- [ ] 解答後、結果画面で詳細な解説が表示

#### Vocabulary Lesson（語彙・熟語特訓）
- [ ] テストが生成される
- [ ] 結果画面で**Reference Text セクションが表示されない**（修正済み）
- [ ] 間違えた単語が自動的に単語帳に保存

#### Listening Test
- [ ] 音声が再生される（TTS）
- [ ] 日本語字幕が表示される
- [ ] 結果画面で**詳細な解説**が表示される（新機能）

#### Writing Test
- [ ] Integrated Taskで音声ボタンが表示（音声がある場合のみ）
- [ ] 音声がない場合、**音声ボタンが表示されない**（修正済み）
- [ ] AI採点とフィードバックが表示

#### 単語・熟語帳
- [ ] ホーム画面の「単語・熟語帳」ボタンをクリック
- [ ] 間違えた単語のリストが表示
- [ ] **ランキングバッジ**（#1, #2, #3...）が表示（新機能）
- [ ] **間違い回数バー**がグラデーションで表示（新機能）
- [ ] **重要度スコア**が表示（新機能）
- [ ] 個別削除ボタン（×）が機能
- [ ] 「すべて削除」ボタンが機能

---

## 🐛 トラブルシューティング

### 問題1: 白い画面が表示される
**原因**: ブラウザキャッシュ

**解決策**:
```bash
# ハードリフレッシュ
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# または
シークレートモードでアクセス
```

### 問題2: "Failed to generate test. Please check your API Key"
**原因**: API Keyがビルド時に埋め込まれていない

**解決策**:
```bash
# 1. API Keyが正しく設定されているか確認
echo $GEMINI_API_KEY

# 2. ビルド引数を明示的に渡して再デプロイ
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY

# 3. ローカルでテスト
GEMINI_API_KEY="your-key" npm run build
grep -o "your-key" dist/assets/*.js  # キーが埋め込まれているか確認
```

### 問題3: API Keyクォータエラー
**原因**: Google Gemini APIの無料枠を超過

**解決策**:
1. [Google AI Studio](https://aistudio.google.com/) でクォータを確認
2. 新しいAPI Keyを生成
3. 再デプロイ

### 問題4: デプロイが失敗する
**原因**: Docker ビルドエラー

**解決策**:
```bash
# ログを確認
flyctl logs --no-tail

# クリーンビルドで再デプロイ
flyctl deploy --no-cache --build-arg GEMINI_API_KEY=$GEMINI_API_KEY
```

### 問題5: 単語帳にデータが表示されない
**原因**: localStorageにデータがない

**解決策**:
1. Vocabulary Lessonを実行
2. 意図的に間違えて、単語を保存
3. 単語帳を開いて確認

---

## 📊 変更履歴

### 2024-12-14: 単語帳ランキング機能追加
- スコアリングシステム実装
- ランキング表示追加
- 間違い回数カウント機能
- ビジュアルプログレスバー追加

### 2024-12-14: UI/UXバグ修正
- INSERT_TEXT マーカー表示ロジック修正
- 語彙特訓モードでReference Text非表示
- Listening結果画面の詳細化
- Writing音声ボタンの条件表示

### 2024-12-13: 単語帳機能初版
- 間違えた語彙の自動保存
- 単語帳画面の実装
- 削除機能の追加

### 2024-12-12: API Key修正
- vite.config.tsでprocess.env優先読み込み
- Docker build時のAPIキー埋め込み修正

### 2024-12-11: 白い画面バグ修正
- importmap削除
- Viteバンドル最適化

---

## 🔗 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [README.md](./README.md) | プロジェクト概要 |
| [FINAL_DEPLOY.md](./FINAL_DEPLOY.md) | API Key修正の詳細 |
| [FIX_API_KEY.md](./FIX_API_KEY.md) | API Key問題の技術的解説 |
| [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md) | 白い画面問題の解決 |
| [FIXES_2025_12_14.md](./FIXES_2025_12_14.md) | 最新のUI/UX修正 |
| [VOCAB_BOOK_RANKING.md](./VOCAB_BOOK_RANKING.md) | ランキング機能の詳細 |

---

## 🎯 次のステップ

### 開発者向け
1. YouTube動画解析機能の実装（進行中）
2. システムプロンプト強化（TST Prep等のノウハウ反映）
3. パフォーマンス最適化（チャンク分割）

### ユーザー向け
1. 毎日テストを実施
2. 単語帳のランキングを毎日確認
3. 上位3単語を優先復習
4. 週次でAI Performance Coachをチェック

---

**Happy Deploying! 🚀**
