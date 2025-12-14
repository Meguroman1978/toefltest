# 🚀 デプロイメントガイド

## ⚠️ 重要: API Key管理について

このプロジェクトでは、API Keyは`services/geminiService.ts`に直接記載されています。

---

## 📝 デプロイ手順

### ステップ1: リポジトリを取得

```bash
cd /path/to/toefltest
git pull origin main
```

### ステップ2: API Keyを更新（必要に応じて）

`services/geminiService.ts`の17-19行目を編集：

```typescript
const ai = new GoogleGenAI({ apiKey: "YOUR_NEW_API_KEY_HERE" });
```

### ステップ3: ローカルでビルドテスト

```bash
npm run build
```

### ステップ4: Fly.ioにデプロイ

```bash
flyctl deploy
```

---

## 🔐 セキュリティベストプラクティス

### デプロイ後の作業

1. **API Keyを元に戻す（オプション）**
   ```bash
   git checkout services/geminiService.ts
   ```

2. **変更を確認**
   ```bash
   git status
   ```

3. **必要に応じてコミット**
   - API Keyを含む変更は**絶対にコミットしない**
   - コミット前に必ず`git diff`で確認

---

## 🛡️ Gitからの除外設定

API Keyを含むファイルをGitの追跡から一時的に除外：

```bash
# 変更を無視
git update-index --assume-unchanged services/geminiService.ts

# 元に戻す場合
git update-index --no-assume-unchanged services/geminiService.ts
```

---

## ✅ デプロイ確認

```bash
# ステータス確認
flyctl status

# ログ確認
flyctl logs

# ブラウザで確認
flyctl open
```

または直接アクセス: https://toefltest.fly.dev/

---

## 🆘 トラブルシューティング

### 白い画面が表示される

1. **ブラウザのキャッシュクリア**
   - Chrome: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E

2. **Fly.ioのログ確認**
   ```bash
   flyctl logs
   ```

3. **強制再ビルド**
   ```bash
   flyctl deploy --no-cache
   ```

### API Key関連のエラー

1. **API Keyが正しいか確認**
   - Google AI Studioで新しいキーを生成
   - `services/geminiService.ts`を更新

2. **ビルドファイルを確認**
   ```bash
   npm run build
   grep -o "AIzaSy" dist/assets/index-*.js
   ```

---

## 📚 関連ドキュメント

- [Fly.io Documentation](https://fly.io/docs/)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

## 🔄 更新履歴

- 2024-12-14: 初版作成
- API Key管理方法を文書化
