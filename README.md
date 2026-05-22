# 研究室ライブラリ

研究室の蔵書を一元管理するWebアプリです。ISBNバーコードのスキャンによる書籍登録、貸出・返却管理、リアルタイム検索に対応しています。

## 機能

- ISBNバーコードをカメラでスキャンして書籍情報を自動取得
- タイトル・著者・出版社の手動入力による登録
- 貸出・返却の記録と在庫状況の管理
- タイトル・著者・出版社でのリアルタイム検索
- メールアドレスとパスワードによるログイン

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Firebase プロジェクトの準備

[Firebase Console](https://console.firebase.google.com) で以下を設定してください。

**Authentication**
1. 「構築」→「Authentication」→「始める」
2. 「Sign-in method」→「メール/パスワード」を有効化
3. 「Users」タブからメンバーのアカウントを作成

**Firestore Database**
1. 「構築」→「Firestore Database」→「データベースの作成」
2. ロケーション: `asia-northeast1`（東京）を選択
3. 「ルール」タブを以下に書き換えて公開

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

### 3. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、Firebase の設定値を入力します。

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

設定値は Firebase Console の「プロジェクトの設定」→「マイアプリ」から確認できます。

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

一覧画面の検索バーにキーワードを入力すると、タイトル・著者・出版社でリアルタイムに絞り込まれます。

### 蔵書の削除

カード右下の「削除」をタップすると確認ダイアログが表示され、削除できます。

## デプロイ

Firebase Hosting を使うと、誰のPCが起動していなくても全員がアクセスできる URL が発行されます。

```bash
# 初回のみ
sudo npm install -g firebase-tools
firebase login
firebase init hosting
# → 公開ディレクトリ: dist
# → SPA: Yes
# → GitHub 自動ビルド: No
# → dist/index.html を上書き: No

# ビルドしてデプロイ
npm run build && firebase deploy
```

デプロイ後に表示される `https://your-project.web.app` のURLをメンバーに共有してください。

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | React + TypeScript + Vite |
| スタイリング | Tailwind CSS |
| 認証・DB | Firebase Authentication + Firestore |
| バーコードスキャン | html5-qrcode |
| 書誌情報取得 | OpenBD API |
