# TOEFL Test App - Fly.io デプロイガイド

このガイドでは、TOEFL AI SimulatorアプリケーションをFly.ioにデプロイする手順を説明します。

## 前提条件

1. **Fly.ioアカウント**: https://fly.io/ でアカウントを作成
2. **Fly CLI**: 既にインストール済みの場合はスキップ
3. **Gemini API Key**: Google AI Studioから取得

## デプロイ手順

### 1. Fly.ioにログイン

```bash
flyctl auth login
```

ブラウザが開き、認証を求められます。

### 2. Gemini API Keyをシークレットとして設定

```bash
cd /path/to/toefltest
flyctl secrets set GEMINI_API_KEY="your-actual-api-key-here"
```

**重要**: `your-actual-api-key-here`を実際のGemini API Keyに置き換えてください。

### 3. アプリケーションをデプロイ

```bash
flyctl deploy
```

このコマンドは以下を実行します：
- Dockerイメージをビルド
- GEMINI_API_KEYをビルド時の引数として渡す
- Fly.ioにイメージをプッシュ
- アプリケーションを起動

### 4. デプロイの確認

```bash
flyctl status
```

### 5. ブラウザでアクセス

```bash
flyctl open
```

または、直接 https://toefltest.fly.dev/ にアクセスします。

## トラブルシューティング

### 白い画面が表示される場合

1. **ログを確認**:
   ```bash
   flyctl logs
   ```

2. **環境変数を確認**:
   ```bash
   flyctl secrets list
   ```
   `GEMINI_API_KEY`が設定されていることを確認してください。

3. **再デプロイ**:
   ```bash
   flyctl deploy --no-cache
   ```

### API Keyが無効な場合

```bash
flyctl secrets set GEMINI_API_KEY="new-valid-key"
flyctl deploy
```

### アプリケーションが起動しない場合

```bash
flyctl status
flyctl logs --no-tail
```

## 設定ファイルの説明

### `fly.toml`
- アプリケーション名: `toefltest`
- リージョン: `nrt` (東京)
- ポート: `8080`
- 自動スケーリング: 有効

### `Dockerfile`
- マルチステージビルド
- Stage 1: Node.js 20でビルド
- Stage 2: nginxで静的ファイルを配信

### `nginx.conf`
- SPAルーティング対応
- Gzip圧縮有効
- 静的アセットのキャッシュ設定
- セキュリティヘッダー追加

## コマンドリファレンス

```bash
# アプリ情報を表示
flyctl info

# スケールアップ/ダウン
flyctl scale count 2

# シークレット管理
flyctl secrets list
flyctl secrets set KEY=VALUE
flyctl secrets unset KEY

# ログをリアルタイムで表示
flyctl logs

# SSH接続
flyctl ssh console

# アプリ削除（注意！）
flyctl apps destroy toefltest
```

## 環境変数

アプリケーションは以下の環境変数を使用します：

- `GEMINI_API_KEY`: Google Gemini APIキー（必須）
- `PORT`: nginxがリッスンするポート（デフォルト: 8080）

## セキュリティに関する注意

1. **API Key**: 絶対にGitにコミットしないでください
2. **HTTPS**: Fly.ioは自動的にHTTPSを有効にします
3. **シークレット**: `flyctl secrets set`を使用して安全に設定してください

## サポート

問題が発生した場合：
1. Fly.ioのドキュメント: https://fly.io/docs/
2. Fly.ioコミュニティ: https://community.fly.io/
3. このリポジトリのIssues

---

デプロイが完了したら、https://toefltest.fly.dev/ でアプリケーションにアクセスできます！
