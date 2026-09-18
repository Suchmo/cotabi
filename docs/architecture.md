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
    end

    subgraph Firebase["Firebase(Google)"]
        Hosting["Hosting(アプリの公開)"]
        Auth["Authentication(ログイン管理)"]
        Firestore["Firestore(データ保存)"]
        Storage["Storage(写真保存・Blazeプラン)"]
    end

    subgraph External["外部API"]
        Nominatim["OpenStreetMap Nominatim(地名検索)"]
        CartoDB["CartoDB(地図タイル配信)"]
    end

    subgraph Client["利用時(二人のiPhone)"]
        Safari["Safari → ホーム画面に追加"]
        App["COTABI(PWA)"]
        Safari --> App
    end

    LocalRepo -- "git push(履歴管理のみ)" --> Repo
    LocalRepo -- "npm run deploy:hosting(手動デプロイ)" --> Hosting
    Hosting -- "アプリ本体を配信" --> App
    App -- "ログイン" --> Auth
    App -- "記録の読み書き" --> Firestore
    App -- "写真のアップロード・取得(フル+サムネイル)" --> Storage
    App -- "場所検索" --> Nominatim
    App -- "地図タイル取得" --> CartoDB
```

> **注記(重要)**: 過去の構成案ではGitHub Actionsによるpush連動の自動デプロイを想定していたが、現時点では**未構築**。デプロイは開発者のWindows端末から`npm run deploy:hosting`(ビルド+`firebase deploy --only hosting`)を手動実行して行っている。GitHubリポジトリは現状、コードの履歴管理・保管庫としてのみ機能している。

## 2. 各要素の役割

| 要素 | 役割 |
|---|---|
| VS Code + Claude Code | コードを書く場所。Windows上で完結 |
| GitHubリポジトリ | コードの保管庫。変更履歴を管理(現状、デプロイの自動化はしていない) |
| Firebase Hosting | 完成したアプリ本体を、実際のURLとして公開する場所。開発者端末からの手動デプロイで更新する |
| Firebase Authentication | 「本人か彼女か」を確認するログイン機能(メール/パスワード方式、新規登録機能なし) |
| Firebase Firestore | 旅行(TRIP)・スポット(SPOT)・写真メタデータ(PHOTO)・ウィッシュリスト(WISH)・プライバシーロック設定(users)を保存するデータベース。ブラウザの永続ローカルキャッシュを有効化し、オフラインでの閲覧・書き込みに対応 |
| Firebase Storage | 写真データ(フルサイズ+一覧表示用サムネイルの2種類)を保存する倉庫(容量が大きいためFirestoreとは別管理) |
| OpenStreetMap Nominatim | 記録作成画面・ウィッシュリスト追加画面での地名検索(ジオコーディング)に使う無料API。利用規約に沿ってデバウンス・レート制限を実装 |
| CartoDB | 地図タイル(Voyager、明るい配色・英語表記)の配信元。デザインシステム上、地図タイルのみダーク基調の例外として明るい配色を採用している |
| 二人のiPhone(Safari) | 実際にアプリを使う場所。ホーム画面に追加してアプリのように利用 |

## 3. データが流れる典型的な例

### 3.1 記録を1件保存する場合(写真あり)

```mermaid
sequenceDiagram
    participant U as 利用者(スマホ)
    participant R as COTABI(React)
    participant Auth as Firebase Authentication
    participant FS as Firestore
    participant ST as Storage

    U->>R: 旅行記録を入力(写真・日記・日付・タグ等)
    R->>Auth: ログイン状態を確認
    Auth-->>R: 本人確認OK
    R->>R: 写真をブラウザ内で圧縮(フル1600px+サムネイル300pxの2種類を生成)
    R->>FS: 旅行・スポットのドキュメントをwriteBatchで保存
    FS-->>R: ローカルキャッシュへの反映完了(オフラインでもここまでは進む)
    R->>ST: フル画像・サムネイルをアップロード
    ST-->>R: 保存先URLを返す
    R->>FS: 写真ドキュメント(2種類のURL)を保存
    R->>FS: waitForPendingWrites()で実際のサーバー同期を確認(タイムアウトあり)
    FS-->>R: 同期済み/未同期(オフライン中)を返す
    R-->>U: 「保存しました」または「保存しました(同期待ち)」を表示。写真の一部が失敗した場合は区別して案内
```

### 3.2 地図表示・地名検索

```mermaid
sequenceDiagram
    participant U as 利用者(スマホ)
    participant R as COTABI(React)
    participant FS as Firestore
    participant Carto as CartoDBタイル
    participant Nom as Nominatim

    U->>R: マップ画面を開く
    R->>FS: trips/spotsを短時間キャッシュ付きで取得(訪問済み判定・思い出フラッシュバック用)
    R->>Carto: 地図タイルを取得
    R-->>U: 訪問済みの国・都道府県を色分け表示

    U->>R: 記録作成画面で「場所を検索」に入力
    R->>R: 入力停止後にデバウンス(規約により1秒1リクエストまで)
    R->>Nom: 地名で検索
    Nom-->>R: 候補地(緯度経度・住所)を返す
    U->>R: 候補をタップ
    R-->>U: 位置情報・国/都道府県欄に反映(ユーザーが確認・修正可能)
```

## 4. なぜこの構成にしたか(経緯の要約)

- 当初はネイティブiOS(SwiftUI)+ CloudKitを想定していたが、無料方針と両立しないことが判明し撤回
- Firebase(Firestore/Auth/Storage)に変更。Storageのみリージョン制約でBlazeプラン(従量課金)登録が必要だが、無料枠内運用+予算アラートで対応
- 無料のApple Developer Personal Teamは証明書が7日で失効する制約があり、ネイティブアプリの長期無料運用が困難と判明したため、**PWA(React + Vite)方式に全面転換**
- 結果として、Mac・Xcode・Apple Developer Programが一切不要な、Windows完結の構成になった
- デプロイ自動化(GitHub Actions)は当初の構想として残していたが、実装フェーズでは優先度を下げ、開発者端末からの手動デプロイのまま運用している(必要になれば別途導入を検討)
- 写真表示のパフォーマンス改善のため、アップロード時にフルサイズとは別にサムネイル(長辺300px)を生成する2段構えに変更。一覧・タイムライン・アルバム・思い出フラッシュバックはサムネイルを、スポット詳細はフルサイズを表示する
- 主要画面がFirestoreの同一コレクションを短時間に何度も全件取得してしまう設計上の課題があり、応急処置として`src/lib/queryCache.ts`による短時間キャッシュ(書き込み時に無効化)を導入。根本的な対応(購読方式への切り替え、クエリの絞り込み)は今後の課題として残している
- オフライン時、Firestoreへの書き込みはローカルキャッシュに即時反映され見かけ上は成功するため、`waitForPendingWrites()`を使って実際にサーバーへ同期できたかを確認し、未同期の場合はUI上で案内するようにした。Firebase Storageへの写真アップロードはFirestoreのような offline queue を持たないため、記録本体の保存とは別に成否を扱っている
- プライバシーロック(WebAuthn/PIN)は、サーバーを持たない構成のため署名検証をサーバー側で行えない。プラットフォーム認証器による本人確認をブラウザ自身に保証させる簡易な使い方に留め、「同じ端末をのぞき見されない」用途の範囲でのみ利用している(Firebase Authenticationによる本来のログイン認証とは独立したレイヤー)
