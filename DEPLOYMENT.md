# TOEFL Test App - Fly.io デプロイガイド

このガイドでは、TOEFL AI SimulatorアプリケーションをFly.ioにデプロイする手順を説明します。

## 🎯 問題の原因

以前のデプロイでは、単純な静的ファイルサーバー（`gostatic`）を使用していましたが、これではVite + Reactアプリケーションが正しく動作しませんでした。主な問題点：

1. ❌ **ビルドプロセスがない**: ソースコードがそのまま配信されていた
2. ❌ **SPAルーティング未対応**: クライアントサイドルーティングが機能しない
3. ❌ **依存関係の欠如**: node_modulesがビルドされていない

## ✅ 解決策

新しいデプロイ設定では：

1. ✅ **マルチステージビルド**: Node.jsでビルド → nginxで配信
2. ✅ **適切なSPA設定**: nginxがクライアントサイドルーティングをサポート
3. ✅ **最適化**: 静的ファイルのキャッシュとgzip圧縮
4. ✅ **環境変数対応**: GEMINI_API_KEYをビルド時に埋め込み

## 前提条件

1. **Fly.ioアカウント**: https://fly.io/ でアカウントを作成
2. **Fly CLI**: インストールされていない場合は以下を実行
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
3. **Gemini API Key**: Google AI Studio (https://aistudio.google.com/) から取得

## 📝 デプロイ手順

### ステップ 1: リポジトリをクローン

```bash
git clone https://github.com/Meguroman1978/toefltest.git
cd toefltest
```

### ステップ 2: Fly.ioにログイン

```bash
flyctl auth login
```

ブラウザが開き、認証を求められます。ログインして認証を完了してください。

### ステップ 3: Gemini API Keyをシークレットとして設定

```bash
flyctl secrets set GEMINI_API_KEY="your-actual-api-key-here"
```

**重要**: 
- `your-actual-api-key-here`を実際のGemini API Keyに置き換えてください
- API Keyは Google AI Studio の「Get API Key」から取得できます
- シークレットとして設定することで、環境変数が安全に管理されます

### ステップ 4: アプリケーションをデプロイ

```bash
flyctl deploy --build-arg GEMINI_API_KEY=$(flyctl secrets list | grep GEMINI_API_KEY | awk '{print $2}')
```

または、シンプルに：

```bash
flyctl deploy
```

このコマンドは以下を自動的に実行します：
1. 📦 Node.js 20環境でViteアプリケーションをビルド
2. 🔧 GEMINI_API_KEYをビルド時の環境変数として渡す
3. 🚀 nginxベースのDockerイメージを作成
4. ☁️ Fly.ioクラウドにデプロイ
5. 🌐 HTTPSを自動的に有効化

**ビルド時間**: 初回は約2-3分かかります（依存関係のインストールとビルド）

### ステップ 5: デプロイの確認

```bash
flyctl status
```

出力例：
```
App
  Name     = toefltest
  Owner    = personal
  Hostname = toefltest.fly.dev
  ...
  
Machines
ID        STATE   HEALTH  REGION  SIZE
xxxxx     started         nrt     shared-cpu-1x:512MB
```

### ステップ 6: ブラウザでアクセス

```bash
flyctl open
```

または、直接 **https://toefltest.fly.dev/** にアクセスします。

### ステップ 7: 動作確認

アプリケーションが正しく動作していることを確認：
1. ✅ ホーム画面が表示される
2. ✅ Reading/Listening/Speaking/Writingのモードが選択できる
3. ✅ トピックを選択して「Start Test」ボタンをクリック
4. ✅ AIが問題を生成する（GEMINI_API_KEYが正しく設定されている場合）

## 🔧 トラブルシューティング

### 問題1: 白い画面が表示される

**症状**: https://toefltest.fly.dev/ にアクセスしても白い画面だけが表示される

**原因と解決策**:

1. **ログを確認**:
   ```bash
   flyctl logs
   ```
   エラーメッセージを確認してください。

2. **ビルドが失敗している場合**:
   ```bash
   # キャッシュをクリアして再デプロイ
   flyctl deploy --no-cache
   ```

3. **環境変数を確認**:
   ```bash
   flyctl secrets list
   ```
   `GEMINI_API_KEY`が設定されていることを確認してください。

4. **ブラウザのコンソールを確認**:
   - F12キーを押して開発者ツールを開く
   - Consoleタブでエラーメッセージを確認
   - Networkタブでファイルが正しく読み込まれているか確認

5. **デプロイログを確認**:
   ```bash
   flyctl logs --no-tail
   ```

### 問題2: API Keyエラー

**症状**: アプリは表示されるが、「Start Test」をクリックすると失敗する

**解決策**:
```bash
# API Keyを再設定
flyctl secrets set GEMINI_API_KEY="your-new-valid-api-key"

# 再デプロイ（必須）
flyctl deploy
```

**注意**: シークレットを変更した後は、必ず再デプロイが必要です。

### 問題3: デプロイが失敗する

**症状**: `flyctl deploy`がエラーで終了する

**解決策**:

1. **Dockerビルドエラーの場合**:
   ```bash
   # ビルドログを詳細表示
   flyctl deploy --verbose
   ```

2. **メモリ不足の場合**:
   ```bash
   # VMのメモリを増やす（fly.tomlで既に1GBに設定済み）
   flyctl scale memory 1024
   ```

3. **ネットワークエラーの場合**:
   ```bash
   # しばらく待ってから再試行
   flyctl deploy --remote-only
   ```

### 問題4: 古いバージョンが表示される

**症状**: コードを更新してデプロイしたが、古いバージョンが表示される

**解決策**:
```bash
# 強制的にキャッシュをクリアして再デプロイ
flyctl deploy --no-cache

# ブラウザのキャッシュもクリア
# Chrome/Edge: Ctrl+Shift+R (ハードリロード)
# Firefox: Ctrl+F5
```

## 📁 設定ファイルの説明

### `fly.toml`
Fly.ioアプリケーションの設定ファイル

```toml
app = 'toefltest'              # アプリケーション名
primary_region = 'nrt'          # 東京リージョン（低レイテンシ）

[build]
  dockerfile = "Dockerfile"     # カスタムDockerfileを使用

[env]
  PORT = "8080"                 # nginxがリッスンするポート

[http_service]
  internal_port = 8080          # コンテナ内部ポート
  force_https = true            # HTTPS強制リダイレクト
  auto_stop_machines = 'stop'   # 非アクティブ時に自動停止
  auto_start_machines = true    # リクエスト時に自動起動
  min_machines_running = 0      # 最小0台（コスト削減）

[[vm]]
  memory = '1gb'                # 1GBメモリ（ビルドに必要）
  cpu_kind = 'shared'           # 共有CPU
  cpus = 1                      # 1 vCPU
```

### `Dockerfile`
マルチステージビルドで効率的なイメージを作成

**Stage 1: Builder**
```dockerfile
FROM node:20-alpine AS builder
# - npm ciで依存関係をインストール
# - npm run buildでViteアプリをビルド
# - distフォルダに静的ファイルを生成
```

**Stage 2: Production**
```dockerfile
FROM nginx:alpine
# - ビルド済みファイルをコピー
# - カスタムnginx設定を適用
# - ポート8080でnginxを起動
```

### `nginx.conf`
SPAに最適化されたnginx設定

**主な機能**:
- ✅ **SPAルーティング**: `try_files $uri $uri/ /index.html` でクライアントサイドルーティングをサポート
- ✅ **Gzip圧縮**: テキストファイルを圧縮して転送量を削減
- ✅ **キャッシュ制御**: 
  - 静的アセット（JS/CSS/画像）: 1年間キャッシュ
  - index.html: キャッシュなし（常に最新版を取得）
- ✅ **セキュリティヘッダー**: XSS対策、クリックジャッキング対策
- ✅ **ヘルスチェックエンドポイント**: `/health` で監視可能

## 📋 コマンドリファレンス

### 基本コマンド

```bash
# アプリ情報を表示
flyctl info

# アプリの状態を確認
flyctl status

# リアルタイムログを表示
flyctl logs

# 過去のログを表示
flyctl logs --no-tail

# ブラウザでアプリを開く
flyctl open
```

### デプロイ関連

```bash
# 通常のデプロイ
flyctl deploy

# キャッシュなしでデプロイ
flyctl deploy --no-cache

# 詳細ログ付きでデプロイ
flyctl deploy --verbose

# リモートでビルド（ローカルDockerが不要）
flyctl deploy --remote-only
```

### シークレット管理

```bash
# シークレット一覧を表示
flyctl secrets list

# シークレットを設定
flyctl secrets set GEMINI_API_KEY="your-api-key"

# 複数のシークレットを同時設定
flyctl secrets set KEY1=value1 KEY2=value2

# シークレットを削除
flyctl secrets unset KEY_NAME
```

### スケーリング

```bash
# マシン台数を変更
flyctl scale count 2

# メモリを変更
flyctl scale memory 1024

# VMサイズを変更
flyctl scale vm shared-cpu-2x
```

### デバッグ

```bash
# SSH接続（コンテナ内に入る）
flyctl ssh console

# ファイルシステムを確認
flyctl ssh console -C "ls -la /usr/share/nginx/html"

# nginxの設定を確認
flyctl ssh console -C "cat /etc/nginx/conf.d/default.conf"
```

### アプリ管理

```bash
# アプリを停止
flyctl apps pause

# アプリを再開
flyctl apps resume

# アプリを削除（注意！）
flyctl apps destroy toefltest
```

## 🔐 環境変数

アプリケーションは以下の環境変数を使用します：

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|--------------|
| `GEMINI_API_KEY` | Google Gemini APIキー | ✅ 必須 | なし |
| `PORT` | nginxがリッスンするポート | ❌ 任意 | 8080 |

### GEMINI_API_KEYの取得方法

1. Google AI Studio にアクセス: https://aistudio.google.com/
2. 「Get API Key」をクリック
3. 新しいプロジェクトを作成または既存のプロジェクトを選択
4. APIキーをコピー
5. Fly.ioにシークレットとして設定:
   ```bash
   flyctl secrets set GEMINI_API_KEY="your-copied-api-key"
   ```

## 🔒 セキュリティに関する注意

### ✅ やるべきこと

1. **API Keyの安全な管理**:
   - `flyctl secrets set`を使用してシークレットとして設定
   - 環境変数ファイル（.env）は絶対にGitにコミットしない

2. **HTTPS通信**:
   - Fly.ioは自動的にHTTPSを有効にします
   - `force_https = true`でHTTPからHTTPSへ自動リダイレクト

3. **セキュリティヘッダー**:
   - nginx.confでXSS対策、クリックジャッキング対策を設定済み

4. **定期的な更新**:
   - 依存関係を定期的に更新（`npm update`）
   - セキュリティパッチを適用

### ❌ やってはいけないこと

1. **API Keyをコードに直接埋め込む**
2. **環境変数ファイルをGitにコミット**
3. **本番環境でデバッグモードを有効にする**
4. **不要なポートを公開する**

## 💰 コスト最適化

Fly.ioの無料枠を活用：

- **無料枠**: 月間2,340時間のマシン稼働時間
- **auto_stop_machines**: 非アクティブ時に自動停止してコスト削減
- **auto_start_machines**: リクエスト時に自動起動（初回は少し遅い）
- **min_machines_running = 0**: アクセスがない時はマシンを0台に

**推定コスト**:
- 低トラフィック（1日数回のアクセス）: 無料枠内
- 中トラフィック（1日数十回のアクセス）: 無料枠内
- 高トラフィック（常時アクセス）: 月$5〜10程度

## 📚 参考リソース

- **Fly.io公式ドキュメント**: https://fly.io/docs/
- **Fly.ioコミュニティ**: https://community.fly.io/
- **Viteデプロイガイド**: https://vitejs.dev/guide/static-deploy.html
- **nginx設定リファレンス**: https://nginx.org/en/docs/

## 🆘 サポート

問題が発生した場合：

1. **デプロイログを確認**: `flyctl logs --no-tail`
2. **ステータスを確認**: `flyctl status`
3. **このリポジトリのIssues**: 問題を報告
4. **Fly.ioサポート**: https://fly.io/docs/about/support/

---

## ✅ デプロイ完了チェックリスト

デプロイが成功したか確認：

- [ ] `flyctl status`でマシンが`started`状態
- [ ] https://toefltest.fly.dev/ にアクセスできる
- [ ] ホーム画面が表示される
- [ ] Reading/Listening/Speaking/Writingのモードが選択できる
- [ ] トピックを選択して「Start Test」が動作する
- [ ] AIが問題を生成できる（API Keyが正しい場合）

**おめでとうございます！🎉**

デプロイが完了しました。https://toefltest.fly.dev/ でTOEFL AI Simulatorをお楽しみください！
