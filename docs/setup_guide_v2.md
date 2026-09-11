# 環境構築手順書 v2(PWA方針)

> v1〜v2でのMac/Xcode/GitHub Actions macOSランナー関連の手順はすべて不要になりました。以下がPWA方針での最新手順です。

## 進捗状況
- [x] Git for Windows のインストール
- [x] Node.js のインストール
- [x] Claude Desktop版のインストール
- [x] VS Code のインストール + Claude Code拡張機能の導入
- [x] GitHubリポジトリ(`cotabi`)の作成・接続
- [x] CLAUDE.md の作成(要更新: PWA方針の反映)
- [x] Firebaseプロジェクトの作成(Firestore / Authentication / Storage有効化、Blazeプラン登録)
- [ ] React + Viteプロジェクトの作成
- [ ] Firebase JS SDKの導入・接続確認
- [ ] Firebase Hostingへのデプロイ確認

---

## STEP 8: React + Viteプロジェクトの作成

これ以降はMac・Xcodeが一切不要です。すべてWindows上のVS Code + Claude Codeで完結します。

VS Codeのターミナル(`cotabi`フォルダ直下)で、Claude Codeにこう依頼してください。

```
このプロジェクトに、React + Viteのフロントエンドプロジェクトを
セットアップしてください。PWA対応(vite-plugin-pwa等)も含めてください。
requirements_v5.mdの技術スタックに従ってください。
```

Claude Codeが `npm create vite@latest` 相当のセットアップを代行してくれます。実行後、以下で動作確認します。

```powershell
npm install
npm run dev
```

ブラウザで `http://localhost:5173` のような表示が出れば成功です。

## STEP 9: Firebase JS SDKの導入

Claude Codeにこう依頼してください。

```
Firebase JS SDK(Firestore, Authentication, Storage)をこのプロジェクトに導入し、
GoogleService-Info.plist相当の設定値(Firebase設定オブジェクト)を
環境変数(.env)で管理できるようにしてください。
```

Firebaseコンソールの「プロジェクトの設定」→「マイアプリ」から、**Web用の設定値(firebaseConfig)** を追加で取得する必要があります(iOS用とは別に、Webアプリとしての登録が必要です)。

1. Firebaseコンソールの「プロジェクトの設定」を開く
2. 「マイアプリ」→「アプリを追加」→ 今度は **</> (ウェブ)** のアイコンを選択
3. アプリのニックネームを入力(例: `cotabi-web`)して登録
4. 表示された `firebaseConfig` の値をコピーし、Claude Codeに伝えて `.env` に設定してもらう

## STEP 10: ローカルでの動作確認

```powershell
npm run dev
```

ブラウザで開き、Firebaseへの接続やログインが動作するか確認します。うまくいかない場合はエラーメッセージをそのままClaude Codeに伝えてください。

## STEP 11: Firebase Hostingへのデプロイ

Claude Codeにこう依頼してください。

```
このプロジェクトをFirebase Hostingにデプロイできるように設定してください。
firebase-tools のインストールから、firebase init、
GitHub Actionsでのデプロイ自動化(Ubuntu ランナー)まで含めてください。
```

初回のみ、以下のログインが必要です。

```powershell
npm install -g firebase-tools
firebase login
```

ブラウザが開くので、Firebaseで使っているGoogleアカウントでログインしてください。

## STEP 12: iPhoneでホーム画面に追加して確認

1. デプロイ後に発行されるURL(例: `https://cotabi-xxxx.web.app`)にiPhoneのSafariでアクセス
2. 共有ボタン →「ホーム画面に追加」
3. ホーム画面のアイコンから起動し、アプリのように動作するか確認

---

## 参考: 今後CLAUDE.mdに反映してほしい内容

VS CodeのClaude Codeパネルで、以下を依頼してCLAUDE.mdを更新してください。

```
docs/requirements_v5.mdの内容を踏まえて、CLAUDE.mdを更新してください。
アプリ形態がネイティブiOS(SwiftUI)からPWA(React)に変更されたことを反映してください。
```
