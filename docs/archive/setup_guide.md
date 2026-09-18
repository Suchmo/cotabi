# 環境構築手順書

## STEP 1: Git for Windows のインストール

1. https://git-scm.com/download/win にアクセス
2. 「64-bit Git for Windows Setup」をダウンロード
3. ダウンロードした `.exe` を実行し、基本的にすべて「Next」でデフォルト設定のままインストール
4. インストール後、PowerShellを開いて以下を実行し、バージョンが表示されればOK

```powershell
git --version
```

## STEP 2: Node.js のインストール

1. https://nodejs.org にアクセス
2. 「LTS」版(推奨版)をダウンロード
3. インストーラーを実行し、デフォルト設定のままインストール
4. PowerShellを開き直して以下を実行し、v18以上が表示されればOK

```powershell
node -v
```

## STEP 3: Claude Code のインストール

1. PowerShellで以下を実行

```powershell
npm install -g @anthropic-ai/claude-code
```

2. インストール後、以下を実行して状態を確認

```powershell
claude doctor
```

3. 問題がなければ、プロジェクト用のフォルダを作って移動し、初回起動する

```powershell
mkdir cotabi
cd cotabi
claude
```

4. 初回はブラウザでのログイン画面が開くので、Claude.aiのアカウントでサインインする

## STEP 4: GitHubリポジトリの作成

(GitHubアカウントは登録済みなので、リポジトリ作成のみ)

1. https://github.com/new にアクセス
2. 以下を入力
   - Repository name: `cotabi`
   - Description: 任意
   - **Public** を選択(GitHub Actionsの無料枠確保のため)
   - 「Add a README file」にチェック
3. 「Create repository」をクリック
4. 作成後、STEP3で作ったローカルフォルダで以下を実行してリモートと接続する

```powershell
git init
git remote add origin https://github.com/<あなたのユーザー名>/cotabi.git
git pull origin main --allow-unrelated-histories
```

## STEP 5: CLAUDE.md の作成

プロジェクトフォルダ直下に `CLAUDE.md` というファイルを作成し、以下の内容を貼り付ける(Claude Codeに「CLAUDE.mdを作って」と頼んでもOK)。

```markdown
# プロジェクト概要
アプリ名: COTABI
カップル(本人・彼女)2人だけで使うiOS旅行記録アプリ。
世界地図/日本地図で訪問済みの国・都道府県を可視化し、
スポット単位で写真・日記・位置情報を記録する。

# 開発方針
- 開発端末: Windows(Macは使用しない)
- ビルド: GitHub ActionsのmacOSランナーでXcodeビルド・署名を実行
- コストは完全永続無料であること(Claude Code利用料を除く)

# 技術スタック
- UI: SwiftUI
- データ: Firebase(Firestore / Authentication / Storage、無料枠)
- 地図: MapKit + 独自ポリゴン描画(国・都道府県の色分け用)

# 現在のフェーズ
Phase1(コア体験)の実装中。詳細は requirements_v4.md, screen_design_v3.md を参照。

# コーディングルール
(必要に応じて追記していく)
```

5. 作成できたら、以下でGitHubに反映する

```powershell
git add .
git commit -m "Add CLAUDE.md"
git push origin main
```

## STEP 6: Firebaseプロジェクトの作成

1. https://console.firebase.google.com にアクセスし、Googleアカウントでログイン
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力(例: `cotabi`)し、「続行」
4. Google Analyticsの設定画面が出たら、不要であればオフにして「プロジェクトを作成」
5. 作成後、左メニューから以下を有効化する
   - **Firestore Database**:「データベースを作成」→ ロケーションは `asia-northeast1`(東京)を推奨 → 「テストモード」で開始(後で本番用ルールに変更)
   - **Authentication**:「始める」→ Sign-in methodで「メール/パスワード」を有効化(二人だけのログインなのでシンプルな方式でOK)
   - **Storage**:「始める」→ ロケーションは同じく `asia-northeast1`
6. 左上の歯車アイコン→「プロジェクトの設定」→「アプリを追加」→ iOSアイコンを選択
7. Bundle ID(例: `com.<あなたの名前>.cotabi`)を入力してアプリを登録
8. `GoogleService-Info.plist` をダウンロードし、プロジェクトフォルダ内に保存しておく(後でXcodeプロジェクトに組み込む)

## 次にやること(STEP 7以降)

- Xcodeプロジェクトの雛形作成(Windows上ではXcodeが使えないため、XcodeGenのようなテキストベースの構成管理ツールを使う想定)
- GitHub Actionsのビルドパイプライン(macOSランナーでのビルド・署名)の設定

この2つは、実際のプロジェクト構造ができてから中身が具体的に決まる部分なので、STEP1〜6が終わった時点で、Claude Codeと一緒に進めるのがおすすめです。ここまで終わったら教えてください。
