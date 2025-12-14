# 🚀 最終デプロイ手順（API Key問題を完全修正）

## ✅ 修正完了

以下の問題を修正しました：

1. ✅ **importmap削除** - 白い画面の問題を解決
2. ✅ **vite.config.ts修正** - システム環境変数からGEMINI_API_KEYを読み込むように変更

## 🎯 今すぐデプロイする（3つのコマンド）

### 前提条件

- Fly.ioにログイン済み（`flyctl auth login`）
- Google AI StudioからAPIキーを取得済み（https://aistudio.google.com/）

---

### ステップ1: 最新コードを取得

```bash
cd /path/to/toefltest
git pull origin main
```

---

### ステップ2: APIキーを環境変数として設定

**重要**: このターミナルセッションでのみ有効です。

```bash
export GEMINI_API_KEY="AIzaSy..."  # ← あなたのAPIキーに置き換え
```

**確認**:
```bash
echo $GEMINI_API_KEY  # キーが表示されることを確認
```

---

### ステップ3: ビルド引数を渡してデプロイ

```bash
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY
```

**所要時間**: 約2-3分

---

## ✅ デプロイ完了後の確認

### 1. ブラウザのキャッシュをクリア

**重要**: 古いJSファイルがキャッシュされている可能性があります

- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) / `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

または、**シークレットモード/プライベートブラウジング**で開く

---

### 2. https://toefltest.fly.dev/ にアクセス

以下を確認：

✅ **ホーム画面が表示される**
✅ **左サイドバー**: Reading, Listening, Speaking, Writing, 単語・熟語特訓
✅ **右側**: トピック選択ボタン

---

### 3. 動作テスト

1. **トピックを選択**（例：Biology）
2. **「Start Test」をクリック**
3. **ローディングアニメーションが表示される**
4. **問題が正しく生成される** ✅

---

## 🔍 技術的な説明

### 何を修正したか？

**Before（問題あり）**:
```typescript
const env = loadEnv(mode, '.', '');
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```
- `loadEnv`は`.env`ファイルからのみ読み込む
- Dockerビルド時には`.env`ファイルが存在しない
- `env.GEMINI_API_KEY`は常に`undefined`になる

**After（修正済み）**:
```typescript
const env = loadEnv(mode, '.', '');
const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
define: {
  'process.env.API_KEY': JSON.stringify(apiKey)
}
```
- `process.env.GEMINI_API_KEY`を優先的に読み込む
- Dockerfileの`ENV GEMINI_API_KEY=${GEMINI_API_KEY}`が有効になる
- ローカル開発では`.env.local`も引き続き使用可能

---

### Dockerビルドのフロー

```
1. Dockerfile: ARG GEMINI_API_KEY
2. Dockerfile: ENV GEMINI_API_KEY=${GEMINI_API_KEY}
3. npm run build
4. Vite: process.env.GEMINI_API_KEY を読み込む ✅
5. Vite: 'process.env.API_KEY' を apiKey の値に置き換え
6. Bundle: JavaScriptファイルにAPIキーが埋め込まれる
```

---

## 🔧 トラブルシューティング

### エラー: まだ「Failed to generate test」が出る

#### 1. デプロイが正しく完了したか確認

```bash
flyctl status
```

出力例：
```
Machines
ID        STATE   HEALTH  REGION  SIZE
xxxxx     started         nrt     shared-cpu-1x:1GB
```

#### 2. デプロイログを確認

```bash
flyctl logs --no-tail
```

エラーメッセージがないか確認してください。

#### 3. ブラウザの開発者ツールで確認

1. F12キーを押して開発者ツールを開く
2. **Consoleタブ**でエラーメッセージを確認
3. **Networkタブ**でAPI呼び出しが失敗していないか確認

#### 4. APIキーが有効か確認

Google AI Studioでクォータが残っているか確認：
https://aistudio.google.com/

#### 5. 新しいAPIキーで再デプロイ

```bash
# 新しいAPIキーを生成
# https://aistudio.google.com/ で取得

# 環境変数を更新
export GEMINI_API_KEY="新しいAPIキー"

# 再デプロイ
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY --no-cache
```

---

## 🔒 セキュリティ推奨事項

### ⚠️ 重要

静的サイトにAPIキーを埋め込むと、**ブラウザの開発者ツールでAPIキーが見えてしまいます**。

### 🛡️ 必須対策

**Google Cloud ConsoleでHTTPリファラー制限を設定**:

1. https://console.cloud.google.com/ にアクセス
2. 左メニュー→「APIとサービス」→「認証情報」
3. APIキーを選択
4. 「アプリケーションの制限」→「HTTPリファラー（ウェブサイト）」を選択
5. 「項目を追加」をクリック
6. `https://toefltest.fly.dev/*` を入力
7. 「保存」をクリック

**これで、他のサイトからはあなたのAPIキーを使用できなくなります。**

---

## 📋 完全チェックリスト

### デプロイ前
- [ ] Fly.ioにログイン済み（`flyctl auth whoami`で確認）
- [ ] Google AI StudioからAPIキーを取得
- [ ] `git pull origin main`で最新コードを取得
- [ ] `export GEMINI_API_KEY="..."`で環境変数を設定
- [ ] `echo $GEMINI_API_KEY`でキーが設定されていることを確認

### デプロイ
- [ ] `flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY`を実行
- [ ] デプロイが成功（"deployed successfully"が表示）
- [ ] `flyctl status`でマシンが`started`状態

### 確認
- [ ] ブラウザのキャッシュをクリア（Ctrl+Shift+R）
- [ ] https://toefltest.fly.dev/ にアクセス
- [ ] ホーム画面が正しく表示される
- [ ] トピックを選択して「Start Test」をクリック
- [ ] 問題が正しく生成される ✅

### セキュリティ
- [ ] Google Cloud ConsoleでHTTPリファラー制限を設定
- [ ] クォータを監視（不正使用を検出）

---

## 🎉 成功！

すべてのチェックが完了したら、あなたのTOEFL AI Simulatorが完全に動作しています！

**URL**: https://toefltest.fly.dev/

---

## 📞 サポート

問題が解決しない場合：

1. **ログを確認**: `flyctl logs --no-tail`
2. **開発者ツール**: ブラウザのConsoleタブでエラーを確認
3. **GitHubでIssue作成**: 問題の詳細とログを共有

---

## 📚 関連ドキュメント

- [FIX_API_KEY.md](./FIX_API_KEY.md) - API Key問題の詳細
- [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md) - 白い画面の修正
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完全なデプロイドキュメント

---

**Good luck with your TOEFL preparation! 📚🎓**
