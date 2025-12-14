# 🚀 TOEFL Test App - クイックスタートガイド

## ❗ 現在の問題

https://toefltest.fly.dev/ にアクセスすると白い画面が表示されるだけで、アプリケーションが動作していません。

## 🔍 原因

以前のデプロイでは、単純な静的ファイルサーバー（`gostatic`）を使用していましたが、Vite + Reactアプリケーションは正しくビルドされていませんでした。

## ✅ 解決策

新しいデプロイ設定を作成し、正しくビルドできるようにしました。以下の手順でデプロイしてください。

---

## 📝 デプロイ手順（3ステップ）

### ステップ 1: Fly.ioにログイン

ターミナルで以下を実行：

```bash
flyctl auth login
```

ブラウザが開きます。Fly.ioアカウントでログインしてください。

---

### ステップ 2: Gemini API Keyを設定

```bash
cd /path/to/toefltest
flyctl secrets set GEMINI_API_KEY="あなたのAPIキー"
```

**APIキーの取得方法**:
1. https://aistudio.google.com/ にアクセス
2. 「Get API Key」をクリック
3. キーをコピー

---

### ステップ 3: デプロイ

```bash
flyctl deploy
```

**所要時間**: 約2-3分

デプロイが完了したら：

```bash
flyctl open
```

または、直接 https://toefltest.fly.dev/ にアクセス！

---

## ✅ 確認事項

デプロイ後、以下を確認してください：

1. ✅ ホーム画面が表示される
2. ✅ 左サイドバーに「Reading」「Listening」「Speaking」「Writing」「単語・熟語特訓」が表示される
3. ✅ トピックを選択できる
4. ✅ 「Start Test」ボタンをクリックすると問題が生成される

---

## 🔧 トラブルシューティング

### まだ白い画面が表示される場合

```bash
# ログを確認
flyctl logs

# キャッシュをクリアして再デプロイ
flyctl deploy --no-cache
```

### API Keyエラーが出る場合

```bash
# API Keyを再設定
flyctl secrets set GEMINI_API_KEY="新しいAPIキー"
flyctl deploy
```

---

## 📚 詳細ドキュメント

より詳しい情報は [DEPLOYMENT.md](./DEPLOYMENT.md) をご覧ください。

---

## 🆘 サポート

問題が発生した場合は、以下のコマンドでログを確認してください：

```bash
flyctl logs --no-tail
```

それでも解決しない場合は、このリポジトリのIssuesで報告してください。

---

**Good luck with your TOEFL preparation! 📚🎓**
