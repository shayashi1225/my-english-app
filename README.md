# My English App

外資系IT企業で働く人のためのビジネス英語練習アプリ。AIとの音声会話を通じて、ITシーンで使えるビジネス英語のリスニング・スピーキング・文法を実践的に鍛えます。

## 機能

- **6つのビジネスシチュエーション** — スタンドアップ・コードレビュー・クライアントプレゼン・インシデント対応・スプリント計画・1on1
- **音声会話** — AIが英語で話しかけ（gTTS）、ユーザーはマイクで英語回答（Web Speech API）
- **リアルタイムフィードバック** — ターンごとに文法スコア・修正案・発音アドバイスを表示
- **セッションサマリー（日本語）** — 終了後に総括・良かった点・改善点・語彙解説をレポート
- **ダッシュボード** — スコア推移グラフ・ストリーク・シチュエーション別成績・過去セッションの詳細参照

## 必要環境

- Podman（DBコンテナ起動用）
- Python 3.9+
- Node.js 18+
- Chrome（音声入力に対応）
- [Anthropic API キー](https://console.anthropic.com/settings/api-keys)

## セットアップ・起動

### 1. APIキーの設定

```bash
cp secrets/.env.example secrets/.env
# secrets/.env を編集して ANTHROPIC_API_KEY を設定
```

### 2. DBを起動（podmanコンテナ）

```bash
podman run -d \
  --name english-db \
  -e POSTGRES_DB=english_app \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=apppassword \
  -p 5432:5432 \
  -v "$(pwd)/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  docker.io/library/postgres:16-alpine
```

### 3. バックエンドを起動

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
export $(cat ../secrets/.env | xargs)
DATABASE_URL=postgresql://appuser:apppassword@localhost:5432/english_app \
  .venv/bin/uvicorn main:app --reload
```

### 4. フロントエンドを起動

```bash
cd frontend
npm install
npm run dev
```

ブラウザ（Chrome）で <http://localhost:5173> を開く

---

### コンテナ環境（podman-compose）

```bash
podman-compose up --build
# http://localhost:3000
```

> `podman-compose` は `pip install podman-compose` でインストールできます。

## 使い方

1. **Practice** タブでシチュエーションを選択
2. 「🔊 Start Session」を押してAIの音声を再生
3. 🎤 ボタンを押して英語で回答 → ⏹ボタンで送信
4. AIがフィードバックとともに会話を継続（約6ターン）
5. セッション終了後、日本語で総括レポートを表示
6. **Dashboard** タブで成績推移を確認、過去のセッション行をクリックで詳細を参照

## アーキテクチャ

| レイヤー | 技術 |
| --- | --- |
| フロントエンド | React 18 + TypeScript + Vite + Tailwind CSS + Recharts |
| バックエンド | Python FastAPI + SQLAlchemy |
| データベース | PostgreSQL 16 |
| AI | Claude claude-sonnet-4-6 (Anthropic API) |
| 音声出力 | gTTS（Google Text-to-Speech）→ ブラウザ Audio API |
| 音声入力 | Web Speech API（Chrome） |
| コンテナ | Podman + Red Hat UBI（ubi9/python-311, ubi9/nodejs-20, ubi8/nginx-120） |

## ディレクトリ構成

```text
my-english-app/
├── backend/
│   ├── main.py                  # FastAPI エントリポイント
│   ├── models.py                # DB モデル
│   ├── routers/                 # sessions / situations / dashboard / tts
│   └── services/
│       └── claude_service.py    # Claude API 統合・プロンプト定義
├── frontend/
│   └── src/
│       ├── pages/               # Home / Conversation / Dashboard
│       ├── components/          # VoiceRecorder / FeedbackPanel / SessionSummary / SessionDetailModal
│       └── services/api.ts      # バックエンド API クライアント
├── db/
│   └── init.sql                 # テーブル定義
├── nginx/nginx.conf
├── docker-compose.yml
└── secrets/
    └── .env.example             # APIキー設定テンプレート（.env は gitignore）
```

## コスト目安

Anthropic API の利用料金は1セッション（約6ターン）あたり **$0.01〜0.03** 程度です。
