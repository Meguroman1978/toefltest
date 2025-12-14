# 🔧 白い画面の修正 - 再デプロイ手順

## 🐛 問題の原因

デプロイは成功していましたが、白い画面が表示されていた原因は：

**index.htmlに不要なimportmapが残っていた**

```html
<!-- 問題のあったコード -->
<script type="importmap">
{
  "imports": {
    "react/": "https://esm.sh/react@^19.2.3/",
    "react": "https://esm.sh/react@^19.2.3",
    ...
  }
}
</script>
```

このimportmapはGoogle AI Studioでの開発用で、Viteのビルドプロセスでは不要です。
Viteは全ての依存関係を1つのバンドルファイルにまとめるため、importmapがあると逆に問題を引き起こします。

---

## ✅ 修正内容

✅ **importmapを削除**しました
✅ **GitHubにプッシュ済み**（最新のmainブランチ）

---

## 🚀 再デプロイ手順

以下のコマンドを実行するだけです：

### オプション1: ローカルから再デプロイ

```bash
# 1. 最新コードを取得
cd /path/to/toefltest
git pull origin main

# 2. 再デプロイ
flyctl deploy
```

### オプション2: リモートビルド（推奨）

```bash
# Fly.io上でビルド（ローカルのDockerが不要）
flyctl deploy --remote-only
```

### オプション3: キャッシュクリア + 再デプロイ

確実に新しいビルドを使用するため：

```bash
flyctl deploy --no-cache --remote-only
```

---

## ⏱️ デプロイ時間

- **所要時間**: 約2-3分
- **ビルドログ**: デプロイ中に進捗が表示されます

---

## ✅ 確認方法

デプロイ完了後：

### 1. ブラウザのキャッシュをクリア

**重要**: 古いHTMLがキャッシュされている可能性があります

- **Chrome/Edge**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- **Firefox**: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R

### 2. https://toefltest.fly.dev/ にアクセス

以下が表示されれば成功です：

✅ **ホーム画面**が表示される（白い画面ではない）
✅ **左サイドバー**：
   - 📖 Reading
   - 🎧 Listening
   - 🎤 Speaking
   - ✍️ Writing
   - 📚 単語・熟語特訓

✅ **右側エリア**：
   - トピック選択ボタン（Biology, History, Art History等）
   - 「Start Test」ボタン

### 3. 動作テスト

1. トピックを選択（例：Biology）
2. 「Start Test」をクリック
3. ローディングアニメーションが表示される
4. 問題が生成される

---

## 🔍 トラブルシューティング

### まだ白い画面が表示される場合

#### 方法1: 強制再読み込み

ブラウザで以下を試してください：

1. **Ctrl+Shift+Delete** (Windows) / **Cmd+Shift+Delete** (Mac)
2. 「キャッシュされた画像とファイル」を選択
3. 「データを削除」をクリック
4. ページを再読み込み

#### 方法2: シークレットモード/プライベートブラウジング

新しいシークレットウィンドウで https://toefltest.fly.dev/ を開く

#### 方法3: ログを確認

```bash
flyctl logs --no-tail
```

エラーメッセージがないか確認してください。

#### 方法4: デプロイ状態を確認

```bash
flyctl status
```

マシンが`started`状態であることを確認してください。

---

## 🧪 ローカルでの確認（オプション）

再デプロイ前に、ローカルで動作確認したい場合：

```bash
# 最新コードを取得
git pull origin main

# ビルド
npm run build

# プレビュー
npm run preview
```

ブラウザで http://localhost:4173/ を開いて動作確認できます。

---

## 📋 変更内容の詳細

**変更ファイル**: `index.html`

**Before**:
```html
  </style>
  <script type="importmap">
  {
    "imports": {
      "react/": "https://esm.sh/react@^19.2.3/",
      ...
    }
  }
  </script>
</head>
```

**After**:
```html
  </style>
  </head>
```

**コミット**: `629f6dd` - "fix: Remove importmap from index.html for proper Vite bundling"

---

## 💡 技術的な説明

### なぜimportmapが問題だったのか？

1. **Google AI Studioの開発環境**: ESM（ES Modules）形式でブラウザが直接モジュールをロード
2. **Viteのビルド**: 全ての依存関係を1つのバンドルファイルに結合
3. **競合**: importmapとバンドルされたコードが競合し、モジュールの読み込みに失敗

### 正しいワークフロー

```
開発時:
  index.html → index.tsx → React/Reactコンポーネント
              ↑ ViteがHMR(Hot Module Replacement)でリアルタイム更新

ビルド時:
  npm run build
  → Viteが全てを1つのJSファイルにバンドル
  → dist/assets/index-[hash].js に出力
  → index.htmlが自動的に更新される

本番環境:
  index.html → バンドルされたJS（全依存関係を含む）
```

---

## ✅ チェックリスト

再デプロイ前：
- [ ] `git pull origin main` で最新コードを取得
- [ ] Fly.ioにログイン済み（`flyctl auth whoami`）

再デプロイ：
- [ ] `flyctl deploy` を実行
- [ ] デプロイが成功（"deployed successfully"が表示される）

確認：
- [ ] ブラウザのキャッシュをクリア
- [ ] https://toefltest.fly.dev/ にアクセス
- [ ] ホーム画面が正しく表示される
- [ ] トピックを選択して「Start Test」が動作する

---

## 🎉 デプロイ成功！

すべてのチェックが完了したら、あなたのTOEFL AI Simulatorが正常に動作しています！

**URL**: https://toefltest.fly.dev/

問題が解決しない場合は、ログ（`flyctl logs`）を確認するか、GitHubでIssueを作成してください。

---

**Good luck with your deployment! 🚀**
