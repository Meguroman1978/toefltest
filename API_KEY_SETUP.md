# API Key セキュア設定ガイド

## ⚠️ 重要: API Key漏洩対策

### 新しいAPI Key
```
AIzaSyBoK-kckzwlPkmusNv3_sFL2GtBkxoQ0xA
```

**このAPI Keyは絶対にGitHubにコミットしないでください！**

---

## セキュアな設定方法

### 方法1: ビルド時の環境変数（推奨）

#### Fly.ioデプロイ時:
```bash
cd ~/toefltest
export GEMINI_API_KEY="AIzaSyBoK-kckzwlPkmusNv3_sFL2GtBkxoQ0xA"
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY
```

#### ローカル開発時:
```bash
# .env.local ファイルを作成（.gitignoreに含まれています）
echo 'VITE_GEMINI_API_KEY=AIzaSyBoK-kckzwlPkmusNv3_sFL2GtBkxoQ0xA' > .env.local

# 開発サーバー起動
npm run dev
```

---

### 方法2: Google Cloud Consoleでの制限設定

**必須**: API Keyに以下の制限を設定してください：

1. **Google Cloud Console**にアクセス:
   https://console.cloud.google.com/

2. **APIs & Services > Credentials**に移動

3. 該当のAPI Keyを選択

4. **Application restrictions**を設定:
   - **HTTP referrers (web sites)** を選択
   - 以下を追加:
     ```
     https://toefltest.fly.dev/*
     http://localhost:*
     https://localhost:*
     ```

5. **API restrictions**を設定:
   - **Restrict key** を選択
   - 以下のAPIのみ有効化:
     ```
     Generative Language API
     ```

6. **Save**をクリック

---

## コード内での使用方法

### Viteプロジェクトでの環境変数アクセス:

```typescript
// services/geminiService.ts 内で
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 
                (typeof EMBEDDED_API_KEY !== 'undefined' ? EMBEDDED_API_KEY : '');
```

### Vite設定ファイル（vite.config.ts）:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // ビルド時に環境変数から取得
    EMBEDDED_API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || ''),
  },
})
```

---

## デプロイチェックリスト

### デプロイ前:
- [ ] API Keyがハードコードされていないか確認
- [ ] .env.local が .gitignore に含まれているか確認
- [ ] Google Cloud Consoleで制限設定済みか確認

### デプロイ時:
```bash
# 1. 最新コードを取得
git pull origin main

# 2. 環境変数を設定
export GEMINI_API_KEY="AIzaSyBoK-kckzwlPkmusNv3_sFL2GtBkxoQ0xA"

# 3. デプロイ
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY

# 4. 確認
flyctl status
```

### デプロイ後:
- [ ] https://toefltest.fly.dev/ で動作確認
- [ ] テスト生成が正常に機能するか確認
- [ ] ブラウザのDevToolsでAPI Keyが露出していないか確認

---

## トラブルシューティング

### エラー: "Failed to generate test"
1. API Keyが正しく設定されているか確認
2. Google Cloud ConsoleでAPI制限を確認
3. Quota制限に達していないか確認

### API Keyが機能しない
1. Google Cloud Consoleで該当KeyのStatusが"Enabled"か確認
2. Generative Language APIが有効化されているか確認
3. HTTPリファラー制限が正しく設定されているか確認

---

## セキュリティベストプラクティス

1. **絶対にコミットしない**: API Keyをソースコードに直接書かない
2. **環境変数を使用**: ビルド時またはランタイムで注入
3. **制限を設定**: HTTPリファラーとAPI制限を必ず設定
4. **定期的に再生成**: セキュリティのため定期的にAPI Keyを更新
5. **アクセスログ監視**: Google Cloud Consoleで不審なアクセスを監視

---

## 現在の実装状態

### ✅ 完了:
- .gitignoreに.envファイルを追加
- API_KEY_SETUP.mdドキュメント作成

### ⏳ 実装予定:
- vite.config.tsでの環境変数注入
- geminiService.tsでの環境変数読み込み
- Fly.io secretsを使った管理（オプション）

---

**最終更新**: 2024年12月14日
**新API Key発行日**: 2024年12月14日
