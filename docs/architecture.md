# システム構成図

COTABIの全体構成(開発・デプロイ・利用時のデータの流れ)をまとめたドキュメントです。

## 1. 全体構成図

```mermaid
flowchart TB
    subgraph Dev["開発環境(Windows)"]
        VSCode["VS Code + Claude Code"]
        LocalRepo["ローカルの cotabi フォルダ"]
        VSCode --> LocalRepo
    end

    subgraph GitHub["GitHub"]
        Repo["cotabi リポジトリ(public)"]
        Actions["GitHub Actions(Ubuntuランナー)"]
        Repo --> Actions
    end

    subgraph Firebase["Firebase(Google)"]
        Hosting["Hosting(アプリの公開)"]
        Auth["Authentication(ログイン管理)"]
        Firestore["Firestore(データ保存)"]
        Storage["Storage(写真保存・Blazeプラン)"]
    end

    subgraph Client["利用時(二人のiPhone)"]
        Safari["Safari → ホーム画面に追加"]
        App["COTABI(PWA)"]
        Safari --> App
    end

    LocalRepo -- "git push" --> Repo
    Actions -- "ビルド・デプロイ" --> Hosting
    Hosting -- "アプリ本体を配信" --> App
    App -- "ログイン" --> Auth
    App -- "記録の読み書き" --> Firestore
    App -- "写真のアップロード・取得" --> Storage
```

## 2. 各要素の役割

| 要素 | 役割 |
|---|---|
| VS Code + Claude Code | コードを書く場所。Windows上で完結 |
| GitHubリポジトリ | コードの保管庫。変更履歴を管理 |
| GitHub Actions | pushをきっかけに、自動でビルド・デプロイを実行するロボット |
| Firebase Hosting | 完成したアプリ本体を、実際のURLとして公開する場所 |
| Firebase Authentication | 「本人か彼女か」を確認するログイン機能 |
| Firebase Firestore | 旅行・スポット・日記などの文字データを保存するデータベース |
| Firebase Storage | 写真データを保存する倉庫(容量が大きいためFirestoreとは別管理) |
| 二人のiPhone(Safari) | 実際にアプリを使う場所。ホーム画面に追加してアプリのように利用 |

## 3. データが流れる典型的な例(記録を1件保存する場合)

```mermaid
sequenceDiagram
    participant U as 利用者(スマホ)
    participant R as COTABI(React)
    participant Auth as Firebase Authentication
    participant FS as Firestore
    participant ST as Storage

    U->>R: 旅行記録を入力(写真・日記・日付)
    R->>Auth: ログイン状態を確認
    Auth-->>R: 本人確認OK
    R->>ST: 写真をアップロード
    ST-->>R: 保存先URLを返す
    R->>FS: 日記・日付・写真URLを保存
    FS-->>R: 保存完了
    R-->>U: 記録が反映された画面を表示
```

## 4. なぜこの構成にしたか(経緯の要約)

- 当初はネイティブiOS(SwiftUI)+ CloudKitを想定していたが、無料方針と両立しないことが判明し撤回
- Firebase(Firestore/Auth/Storage)に変更。Storageのみリージョン制約でBlazeプラン(従量課金)登録が必要だが、無料枠内運用+予算アラートで対応
- 無料のApple Developer Personal Teamは証明書が7日で失効する制約があり、ネイティブアプリの長期無料運用が困難と判明したため、**PWA(React + Vite)方式に全面転換**
- 結果として、Mac・Xcode・Apple Developer Programが一切不要な、Windows完結の構成になった
