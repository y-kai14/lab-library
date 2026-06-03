# Labrary

研究室の蔵書を一元管理するWebアプリです。ISBNバーコードのスキャンによる書籍登録、貸出・返却管理、リアルタイム検索に対応しています。

## 機能

- ISBNバーコードをカメラでスキャンして書籍情報を自動取得
- Google Books API による概要取得の補完
- 概要・所蔵冊数の登録
- タイトル・著者・出版社の手動入力による登録
- 貸出・返却の記録と在庫状況の管理
- タイトル・著者・出版社でのリアルタイム検索
- AI（Gemini）による蔵書推薦（「どんな本が欲しいか」「何をしたいか」などの自然言語入力から、適した書籍をAIが自動推薦する機能）
- メールアドレスとパスワードによるログイン

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Firebase プロジェクトを設定して開始

まずプロジェクトに名前を付けましょう（Lab-library）

**左タブのセキュリティ**
- Authentication
  - ログイン方法
  - 「メール/パスワード」を有効化
- ユーザー
  - ユーザーを追加

**左タブのDatabaseとStorage**
- Firestore
  - データベースを作成
  - standardエディション
  - asia-northeast1 (Tokyo)
  - テストモードで開始する
  - ルールを以下に書き換えて公開

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**左タブの設定の全般**

「マイアプリ」セクション → `</>`（ウェブ）を選択
ニックネームをlab-libraryにしてチェックマークを入れずにアプリを登録

### 3. Firebase SDKのインストールと環境変数の設定

```bash
npm install firebase
```

表示される `firebaseConfig` と `.env.example` を参考に `.env.local` を作成し、各自のものにする。また、AI推薦機能を利用するため、Google AI Studio等で取得したGemini APIキーを `VITE_GEMINI_API_KEY` として追加してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:5173` をブラウザで開いてください。

## 使い方

### ログイン

Firebase Authentication で作成したメールアドレスとパスワードでログインします。

### 蔵書の登録

1. 一覧画面右上の「＋ 登録」ボタンをタップ
2. **バーコードスキャンの場合:** 「ISBNバーコードをスキャン」をタップし、カメラにバーコードを向ける。書誌情報が自動入力されます
3. **手動入力の場合:** タイトル・著者・出版社を直接入力
4. 「登録する」をタップ

### 蔵書の貸出

1. 一覧画面で借りたい本を探す
2. カードの「借りる」ボタンをタップ
3. 自分の名前が貸出者として記録されます

### 蔵書の返却

1. 一覧画面で貸出中の本を探す（赤いバッジで表示）
2. 自分が借りた本のカードに「返却する」ボタンが表示されます
3. タップすると在庫ありに戻ります

### 蔵書の検索

一覧画面の検索バーにキーワードを入力すると、タイトル・著者・出版社・概要でリアルタイムに絞り込まれます。

### 蔵書の削除

カード右下の「削除」をタップすると確認ダイアログが表示され、削除できます。

### AIによる蔵書推薦・検索

1. 画面上部のタブを「通常検索」から「AIに相談」に切り替えます。
2. 「どのような本をお探しですか？」の入力欄に、読みたい本の特徴や実現したいこと（例: 「Reactの初心者向けの本」「機械学習の概要がわかる本」など）を自由に入力します。
3. 「AIにおすすめを聞く」ボタンをタップすると、現在登録されている蔵書の中から適した書籍をAIが選定し、おすすめする理由を添えて提示します。

## デプロイ

```bash
sudo npm install -g firebase-tools
firebase login
firebase init hosting
```

| 質問 | 回答 |
|------|------|
| Please select an option | Use an existing project |
| Select a default Firebase project for this directory | lab-library |
| What do you want to use as your public directory? | dist |
| Configure as a single-page app (rewrite all urls to /index.html)? | Yes |
| Set up automatic builds and deploys with GitHub? | No |
| Would you like to install agent skills for Firebase? | No |

```bash
npm run build
firebase deploy
```

`https://lab-library-xxxx.web.app` のURLが発行され、誰のPCからでもアクセスできます。

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | React + TypeScript + Vite |
| スタイリング | Tailwind CSS |
| 認証・DB | Firebase Authentication + Firestore |
| バーコードスキャン | html5-qrcode |
| 書誌情報取得 | OpenBD API |
| 書籍推薦AI | Gemini 2.5 Flash API (`@google/generative-ai`) |
