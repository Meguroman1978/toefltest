# 🚀 TOEFL AI Simulator デプロイ手順書

## 📋 目次
1. [前提条件](#前提条件)
2. [ステップ1: 最新コードの取得](#ステップ1-最新コードの取得)
3. [ステップ2: 環境確認](#ステップ2-環境確認)
4. [ステップ3: Fly.ioへのデプロイ](#ステップ3-flyioへのデプロイ)
5. [ステップ4: デプロイの確認](#ステップ4-デプロイの確認)
6. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

以下がインストールされていることを確認してください：

- **Git**: バージョン管理ツール
- **flyctl**: Fly.ioコマンドラインツール
- **ターミナル/コマンドプロンプト**: macOS/Linux はターミナル、Windows はコマンドプロンプトまたはPowerShell

### flyctl のインストール確認

```bash
flyctl version
```

インストールされていない場合:
- macOS: `brew install flyctl`
- Windows: https://fly.io/docs/hands-on/install-flyctl/ からダウンロード

---

## ステップ1: 最新コードの取得

### 1.1 プロジェクトディレクトリへ移動

```bash
cd ~/toefltest
```

**注意**: プロジェクトの場所が異なる場合は、適切なパスに変更してください。

プロジェクトの場所がわからない場合:
```bash
find ~ -name "fly.toml" 2>/dev/null | grep toefl
```

### 1.2 最新のコードを取得

```bash
git pull origin main
```

**期待される出力例**:
```
Updating 292f500..65aa784
Fast-forward
 screens/PastScoreReportsScreen.tsx | 156 ++++++++++++---------
 screens/ScoreReportScreen.tsx      | 209 ++++++++++++++-------------
 2 files changed, 156 insertions(+), 209 deletions(-)
```

**重要**: もし以下のようなエラーが出た場合:
```
error: Your local changes to the following files would be overwritten by merge:
```

以下のコマンドで解決:
```bash
git stash
git pull origin main
```

### 1.3 最新のコミットを確認

```bash
git log --oneline -3
```

**期待される出力**:
```
65aa784 fix: スコアレポート画面を超コンパクト化 - 全体が1画面に収まるように改善
292f500 fix: 5つの重要なバグ修正と機能改善を実装
3f0287e feat: 5つの重要な修正を実装
```

最新のコミットID `65aa784` が表示されていればOKです。

---

## ステップ2: 環境確認

### 2.1 Fly.io認証の確認

```bash
flyctl auth whoami
```

**期待される出力**: あなたのメールアドレスが表示される

もしログインしていない場合:
```bash
flyctl auth login
```

### 2.2 アプリケーションの確認

```bash
flyctl apps list
```

**期待される出力**: `toefltest` アプリが表示される

---

## ステップ3: Fly.ioへのデプロイ

### 3.1 デプロイの実行

```bash
flyctl deploy
```

**所要時間**: 約3〜5分

### 3.2 デプロイ中の出力例

```
==> Building image
--> Building Dockerfile
...
==> Pushing image to fly
...
==> Deploying
...
--> v12 deployed successfully
```

**重要**: `deployed successfully` のメッセージを確認してください。

### 3.3 デプロイが完了したら

以下のコマンドでアプリの状態を確認:
```bash
flyctl status
```

**期待される出力**:
```
App
  Name     = toefltest
  Status   = running
  ...
Instances
  ID       PROCESS VERSION REGION  HEALTH CHECKS           ...
  xxxxx    app     12      nrt     1 total, 1 passing     ...
```

`HEALTH CHECKS` が `1 passing` になっていることを確認。

---

## ステップ4: デプロイの確認

### 4.1 ブラウザでアクセス

以下のURLにアクセス:
```
https://toefltest.fly.dev/
```

### 4.2 確認項目

#### ✅ 基本動作
- [ ] ページが正常に表示される
- [ ] トップページのサイドバーが表示される
- [ ] 各テストモードのボタンが表示される

#### ✅ 新機能の確認

**1. スコアレポートのコンパクト化**
- [ ] 「過去のスコアレポート」をクリック
- [ ] レポート一覧が3列で表示される（コンパクト）
- [ ] 任意のレポートの「詳細」ボタンをクリック
- [ ] 詳細レポートがスクロールなしで全体が見える
- [ ] 右上に **「← Back to Reports」** ボタンが表示される ⭐
- [ ] 「← Back to Reports」をクリックして一覧に戻れる ⭐

**2. 文法特訓**
- [ ] 「文法特訓」ボタンをクリック
- [ ] レベル選択画面が表示される（BEGINNER / INTERMEDIATE / ADVANCED）
- [ ] いずれかのレベルを選択
- [ ] 問題が正常に生成される
- [ ] 問題に回答できる

**3. Speaking Test**
- [ ] Speaking Testを開始
- [ ] マイクの許可を求められる
- [ ] 録音中にリアルタイム転写が表示される
- [ ] 転写が重複しない（「oh my god oh my god oh my god」のように繰り返されない）

---

## トラブルシューティング

### 問題1: 「Back to Reports」ボタンが表示されない

**原因**: ブラウザキャッシュに古いバージョンが残っている

**解決方法**:
1. ブラウザを開く
2. `Ctrl + Shift + R` (Windows) または `Cmd + Shift + R` (Mac) でハードリフレッシュ
3. または、シークレットモード/プライベートブラウジングで開く

### 問題2: 文法特訓が「Failed to generate grammar test」エラーになる

**原因**: API Keyの問題または一時的なAPI制限

**解決方法**:
1. ブラウザのコンソールを開く（F12キー → Consoleタブ）
2. エラーメッセージを確認
3. 数分待ってから再試行
4. それでも解決しない場合:
   ```bash
   flyctl logs
   ```
   でサーバーログを確認

### 問題3: 画面が白いまま

**原因**: デプロイが完全に完了していない、またはビルドエラー

**解決方法**:
```bash
# ログを確認
flyctl logs

# アプリを再起動
flyctl restart
```

### 問題4: `git pull` でコンフリクトが発生

**解決方法**:
```bash
# ローカルの変更を一時保存
git stash

# 最新を取得
git pull origin main

# 必要に応じて変更を戻す
git stash pop
```

### 問題5: デプロイが途中で失敗する

**解決方法**:
```bash
# 再度デプロイを試行
flyctl deploy --force

# それでもダメな場合、詳細ログを確認
flyctl deploy --verbose
```

---

## 📞 サポート情報

### デプロイ後の確認コマンド一覧

```bash
# アプリの状態確認
flyctl status

# リアルタイムログ表示
flyctl logs

# アプリの再起動
flyctl restart

# 環境変数の確認
flyctl secrets list

# アプリの詳細情報
flyctl info
```

### 最新のGitコミット情報

```bash
# 最新のコミット
git log --oneline -1

# 期待される出力
# 65aa784 fix: スコアレポート画面を超コンパクト化 - 全体が1画面に収まるように改善
```

---

## ✅ デプロイ完了チェックリスト

- [ ] `git pull origin main` でコードを最新化
- [ ] `flyctl deploy` でデプロイ実行
- [ ] `flyctl status` で `1 passing` を確認
- [ ] ブラウザで https://toefltest.fly.dev/ にアクセス
- [ ] ハードリフレッシュ（Ctrl+Shift+R）を実行
- [ ] 過去レポートから詳細を開いて「Back to Reports」ボタンを確認
- [ ] 文法特訓を試して問題が生成されることを確認
- [ ] Speaking Testで転写が正常に動作することを確認

---

## 🎉 デプロイ成功！

すべてのステップが完了したら、以下の改善が反映されています：

1. ✅ スコアレポートがコンパクトになり、スクロールなしで全体が見える
2. ✅ 「Back to Reports」ボタンで過去レポート一覧に戻れる
3. ✅ 文法特訓が正常に開始できる
4. ✅ Speaking Testの転写が重複しない
5. ✅ プロフィール写真が正しく表示される

---

**最終更新**: 2025年12月14日
**最新コミット**: 65aa784
