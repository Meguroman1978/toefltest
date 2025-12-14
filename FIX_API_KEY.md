# 🔑 API Key エラーの修正

## 🐛 問題

画面は表示されるが、「Failed to generate test. Please check your API Key or try again.」というエラーが出る。

## 🔍 原因

**Viteの静的ビルドでは、環境変数がビルド時に埋め込まれる必要があります。**

現在の問題：
1. ❌ Fly.ioのシークレット（`GEMINI_API_KEY`）は実行時の環境変数
2. ❌ ビルド時には利用できない
3. ❌ 静的ファイル（nginx配信）では実行時の環境変数は使えない

## ✅ 解決策

Fly.ioのデプロイ時に、シークレットをビルド引数として渡します。

### 方法1: デプロイコマンドでビルドシークレットを渡す（推奨）

```bash
# Fly.ioのシークレットからAPIキーを取得してビルド引数として渡す
flyctl deploy --build-secret GEMINI_API_KEY=$(flyctl secrets list | grep GEMINI_API_KEY | awk '{print $2}')
```

**注意**: この方法では、シークレットの値が直接渡されません。Fly.ioのシークレットリストからは暗号化されたダイジェストしか見えません。

### 方法2: 環境変数をローカルに設定してデプロイ

```bash
# 1. 環境変数を設定
export GEMINI_API_KEY="あなたのAPIキー"

# 2. デプロイ（ビルド引数として渡す）
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY
```

### 方法3: .env.productionファイルを作成（一時的）

**警告**: この方法は、APIキーをGitにコミットしないように注意が必要です。

```bash
# 1. ローカルに.env.productionファイルを作成
echo "GEMINI_API_KEY=あなたのAPIキー" > .env.production

# 2. .gitignoreに追加（重要！）
echo ".env.production" >> .gitignore

# 3. デプロイ
flyctl deploy

# 4. デプロイ後、削除（オプション）
rm .env.production
```

---

## 🚀 推奨手順（最も簡単）

### ステップ1: APIキーを取得

Google AI Studioから APIキーを取得:
https://aistudio.google.com/

### ステップ2: デプロイ

```bash
# APIキーを環境変数として設定
export GEMINI_API_KEY="AIzaSy..."  # ← あなたのキーに置き換え

# デプロイ（ビルド引数として渡す）
cd /path/to/toefltest
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY
```

**所要時間**: 約2-3分

### ステップ3: 確認

1. ブラウザのキャッシュをクリア（Ctrl+Shift+R）
2. https://toefltest.fly.dev/ にアクセス
3. トピックを選択して「Start Test」をクリック
4. 問題が生成されることを確認

---

## 🔍 トラブルシューティング

### まだ「Failed to generate test」エラーが出る場合

#### 1. APIキーが正しく埋め込まれたか確認

ブラウザの開発者ツール（F12）→ Consoleタブで以下を確認：

- エラーメッセージの詳細を確認
- ネットワークタブでAPI呼び出しが失敗していないか確認

#### 2. APIキーが有効か確認

```bash
# ローカルでテスト
cd /path/to/toefltest

# .env.localを作成
echo "GEMINI_API_KEY=あなたのAPIキー" > .env.local

# ビルドしてテスト
npm run build
npm run preview
```

http://localhost:4173/ で動作確認できれば、APIキーは有効です。

#### 3. Google AI Studioでクォータを確認

- https://aistudio.google.com/ にアクセス
- APIキーの使用状況を確認
- クォータが残っているか確認

#### 4. 新しいAPIキーを生成

古いAPIキーが無効になっている可能性があります：

1. https://aistudio.google.com/ にアクセス
2. 新しいAPIキーを生成
3. 新しいキーでデプロイ

---

## 🔒 セキュリティに関する注意

### ⚠️ 重要

静的サイトにAPIキーを埋め込むと、**JavaScriptファイルに平文で含まれます**。これは、誰でもブラウザの開発者ツールでAPIキーを見ることができることを意味します。

### 本番環境での推奨事項

本格的な本番環境では、以下の対策を推奨します：

1. **バックエンドプロキシを作成**
   - Node.js/Python等でAPIプロキシサーバーを作成
   - クライアントはプロキシ経由でGemini APIを呼び出す
   - APIキーはサーバー側で管理

2. **レート制限を設定**
   - Gemini APIのクォータ制限を設定
   - 不正使用を防ぐ

3. **APIキーの制限を設定**
   - Google Cloud Consoleで、APIキーにHTTPリファラー制限を追加
   - 例: `https://toefltest.fly.dev/*` からのみアクセス可能

### Google Cloud Consoleでの設定方法

1. https://console.cloud.google.com/ にアクセス
2. 「認証情報」→ APIキーを選択
3. 「Application restrictions」→ 「HTTP referrers」を選択
4. `https://toefltest.fly.dev/*` を追加
5. 保存

これで、他のサイトからはあなたのAPIキーを使用できなくなります。

---

## 📋 チェックリスト

デプロイ前：
- [ ] Google AI StudioからAPIキーを取得
- [ ] APIキーが有効であることをローカルで確認
- [ ] Google Cloud ConsoleでHTTPリファラー制限を設定（推奨）

デプロイ：
- [ ] `export GEMINI_API_KEY="..."` で環境変数を設定
- [ ] `flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY` を実行
- [ ] デプロイが成功

確認：
- [ ] ブラウザのキャッシュをクリア
- [ ] https://toefltest.fly.dev/ にアクセス
- [ ] トピックを選択して「Start Test」をクリック
- [ ] 問題が正しく生成される

---

## 💡 代替案：バックエンドプロキシ（将来の改善）

より安全な構成：

```
クライアント → Fly.ioアプリ（Node.js Express） → Gemini API
                    ↓
              静的ファイル配信（React）
```

この構成では：
- APIキーはサーバー側のみに存在
- クライアントは`/api/generate`等のエンドポイントを呼び出す
- レート制限、認証、ロギング等を追加可能

**メリット**:
- ✅ APIキーが公開されない
- ✅ レート制限を実装可能
- ✅ 使用状況をログ記録可能

**デメリット**:
- ❌ サーバー側のコードが必要
- ❌ 少し複雑になる

---

## 🎉 デプロイ成功！

すべてのチェックが完了したら、TOEFL AI Simulatorが正常に動作します！

**URL**: https://toefltest.fly.dev/

問題が解決しない場合は、開発者ツールのConsoleタブでエラーメッセージを確認してください。

---

**Good luck! 🚀**
